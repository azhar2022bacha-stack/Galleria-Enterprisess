import fs from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient } from 'pg';
import type { RetailListing } from '@/lib/retailListings';
import { findSharedCatalogImageReferences } from '@/lib/storehouseCatalogServer';
import { lockConsignCatalogForWrite } from '@/lib/consignCatalogServer';
import {
  readRetailListings,
  readRetailListingsFallbackFile,
  writeRetailListingsAtomically,
  writeRetailListingsFallbackFile,
} from '@/lib/retailListingsServer';
import {
  readProductUpdateHistory,
  readProductUpdateHistoryFallbackFile,
  writeProductUpdateHistory,
  writeProductUpdateHistoryFallbackFile,
} from '@/lib/productUpdateHistoryServer';
import {
  getStoreCategories,
  readStoreCategoryOverrides,
  writeStoreCategoryOverrides,
} from '@/lib/storeCategoriesServer';
import {
  readStorehouseProductFeedCategories,
  readStorehouseProductFeedCategoryOverrides,
  writeStorehouseProductFeedCategoryOverrides,
} from '@/lib/storehouseProductFeedCategoriesServer';
import { getPool, initDb } from '@/lib/db';
import { readAllSellerProductsMap, writeAllSellerProductsMap } from '@/lib/sellerProductsServer';
import {
  readStorehouseFallbackProducts,
  removeStorehouseFallbackProducts,
  writeStorehouseFallbackProducts,
} from '@/lib/storehouseCatalogFallbackServer';

type CategoryKind = 'category' | 'subcategory';
type CategoryShape = { name: string; slug: string; subcategories: { name: string; slug: string }[] };
type DeleteInput = {
  kind?: string;
  categorySlug?: string;
  categoryName?: string;
  subcategorySlug?: string;
  subcategoryName?: string;
};
type ProductScope = {
  categorySlug: string;
  categoryName: string;
  subcategorySlug?: string;
  subcategoryName?: string;
};

function normalizeName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-').slice(0, 80).replace(/-+$/g, '');
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = String((error as Error & { code?: string }).code || '');
  return /shared product catalog database is unavailable|unable to (?:read|initialize|load) (?:the )?(?:shared product catalog|product import history)/i.test(error.message)
    || /^(?:ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|57P01|57P03)$/.test(code)
    || code.startsWith('08');
}

function categoryMatchesScope(category: string | undefined, categorySlug: string | undefined, scope: ProductScope): boolean {
  return categorySlug === scope.categorySlug || (!categorySlug && normalizeName(category || '') === normalizeName(scope.categoryName));
}

function listingMatchesAnyScope(listing: RetailListing, scopes: ProductScope[]): boolean {
  const versions = [listing, listing.pendingChanges].filter(Boolean) as Partial<RetailListing>[];
  return versions.some((version) => scopes.some((scope) => {
    if (!categoryMatchesScope(version.category, version.categorySlug, scope)) return false;
    if (!scope.subcategorySlug && !scope.subcategoryName) return true;
    return version.subcategorySlug === scope.subcategorySlug
      || (!version.subcategorySlug && normalizeName(version.subcategory || '') === normalizeName(scope.subcategoryName || ''));
  }));
}

function listingImagePaths(listing: RetailListing): string[] {
  const paths = [listing.image, ...(listing.additionalImages || []), listing.pendingChanges?.image, ...(listing.pendingChanges?.additionalImages || [])];
  return paths.filter((value): value is string => typeof value === 'string' && /^\/uploads\/(?:admin-product-updates|admin-product-feed|retail-listings)\/[A-Za-z0-9._-]+$/.test(value));
}

function removeListingsFromHistory(
  batches: Awaited<ReturnType<typeof readProductUpdateHistory>>,
  removedIds: Set<string>,
  scopes: ProductScope[],
) {
  return batches.flatMap((batch) => {
    const productIds = batch.productIds.filter((id) => !removedIds.has(id));
    const createdProductIds = batch.createdProductIds.filter((id) => !removedIds.has(id));
    const previousListings = batch.previousListings.filter((listing) => !removedIds.has(listing.id));
    const categoryCounts = batch.categoryCounts.filter((item) => !scopes.some((scope) => {
      if (normalizeName(item.category) !== normalizeName(scope.categoryName)) return false;
      return !scope.subcategoryName || normalizeName(item.subcategory) === normalizeName(scope.subcategoryName);
    }));
    if (!productIds.length && !previousListings.length && !categoryCounts.length) return [];
    return [{
      ...batch,
      productIds,
      createdProductIds,
      previousListings,
      createdCount: createdProductIds.length,
      updatedCount: Math.max(0, productIds.length - createdProductIds.length),
      categoryCounts,
    }];
  });
}

function findCategory(categories: CategoryShape[], slug: string, name: string): CategoryShape | undefined {
  return categories.find((category) => category.slug === slug || (name && normalizeName(category.name) === normalizeName(name)));
}

function findSubcategory(category: CategoryShape, slug: string, name: string) {
  return category.subcategories.find((subcategory) => subcategory.slug === slug || (name && normalizeName(subcategory.name) === normalizeName(name)));
}

function sellerProductMatchesScope(
  product: { category?: string; categorySlug?: string; subcategory?: string; subcategorySlug?: string },
  kind: CategoryKind,
  scopes: ProductScope[],
): boolean {
  return scopes.some((scope) => {
    const sameCategory = product.categorySlug === scope.categorySlug || normalizeName(product.category || '') === normalizeName(scope.categoryName);
    if (!sameCategory) return false;
    if (kind === 'category') return true;
    return product.subcategorySlug === scope.subcategorySlug
      || normalizeName(product.subcategory || '') === normalizeName(scope.subcategoryName || '');
  });
}

function removeCategoryOverrides(
  oldOverrides: ReturnType<typeof readStoreCategoryOverrides>,
  kind: CategoryKind,
  scopes: ProductScope[],
) {
  const next = {
    ...oldOverrides,
    categories: [...oldOverrides.categories],
    subcategories: { ...oldOverrides.subcategories },
    deletedCategories: [...oldOverrides.deletedCategories],
    deletedSubcategories: { ...oldOverrides.deletedSubcategories },
  };
  for (const scope of scopes) {
    if (kind === 'category') {
      next.deletedCategories = unique([...next.deletedCategories, scope.categorySlug]);
      next.categories = next.categories.filter((category) => category.slug !== scope.categorySlug);
      delete next.subcategories[scope.categorySlug];
      delete next.deletedSubcategories[scope.categorySlug];
      continue;
    }
    const subcategorySlug = scope.subcategorySlug || slugify(scope.subcategoryName || '');
    next.deletedSubcategories[scope.categorySlug] = unique([...(next.deletedSubcategories[scope.categorySlug] || []), subcategorySlug]);
    next.subcategories[scope.categorySlug] = (next.subcategories[scope.categorySlug] || []).filter((item) => (
      item.slug !== subcategorySlug && normalizeName(item.name) !== normalizeName(scope.subcategoryName || '')
    ));
    next.categories = next.categories.map((category) => category.slug !== scope.categorySlug ? category : {
      ...category,
      subcategories: category.subcategories.filter((item) => (
        item.slug !== subcategorySlug && normalizeName(item.name) !== normalizeName(scope.subcategoryName || '')
      )),
    });
  }
  return next;
}

function removeStorehouseOverrides(
  oldOverrides: ReturnType<typeof readStorehouseProductFeedCategoryOverrides>,
  kind: CategoryKind,
  scopes: ProductScope[],
) {
  const next = {
    ...oldOverrides,
    categories: [...oldOverrides.categories],
    subcategories: { ...oldOverrides.subcategories },
    deletedCategories: [...oldOverrides.deletedCategories],
    deletedSubcategories: { ...oldOverrides.deletedSubcategories },
  };
  for (const scope of scopes) {
    if (kind === 'category') {
      next.deletedCategories = unique([...next.deletedCategories, scope.categorySlug]);
      next.categories = next.categories.filter((category) => category.slug !== scope.categorySlug);
      delete next.subcategories[scope.categorySlug];
      delete next.deletedSubcategories[scope.categorySlug];
      continue;
    }
    const subcategorySlug = scope.subcategorySlug || slugify(scope.subcategoryName || '');
    next.deletedSubcategories[scope.categorySlug] = unique([...(next.deletedSubcategories[scope.categorySlug] || []), subcategorySlug]);
    next.subcategories[scope.categorySlug] = (next.subcategories[scope.categorySlug] || []).filter((item) => (
      item.slug !== subcategorySlug && normalizeName(item.name) !== normalizeName(scope.subcategoryName || '')
    ));
  }
  return next;
}

async function deleteStorehouseRows(
  kind: CategoryKind,
  scopes: ProductScope[],
  persistCatalogs: (result: { productIds: string[]; deletedProducts: number; storehouseDatabaseSkipped?: boolean }) => Promise<void>,
): Promise<{ productIds: string[]; deletedProducts: number; storehouseDatabaseSkipped?: boolean }> {
  if (!process.env.DATABASE_URL?.trim()) {
    const deleted = { productIds: [], deletedProducts: 0, storehouseDatabaseSkipped: true };
    await persistCatalogs(deleted);
    return deleted;
  }
  if (!(await initDb())) {
    const deleted = { productIds: [], deletedProducts: 0, storehouseDatabaseSkipped: true };
    await persistCatalogs(deleted);
    return deleted;
  }
  const pool = getPool();
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    const deleted = { productIds: [], deletedProducts: 0, storehouseDatabaseSkipped: true };
    await persistCatalogs(deleted);
    return deleted;
  }
  const categorySlugs = unique(scopes.map((scope) => scope.categorySlug));
  const categoryNames = unique(scopes.map((scope) => scope.categoryName.toLowerCase()));
  const subcategorySlugs = unique(scopes.map((scope) => scope.subcategorySlug || slugify(scope.subcategoryName || '')).filter(Boolean));
  const subcategoryNames = unique(scopes.map((scope) => scope.subcategoryName?.toLowerCase() || '').filter(Boolean));
  const batches = ['STOREHOUSE-CATALOG-VERIFIED-V1', 'ADMIN-PRODUCT-FEED-V1'];

  try {
    await client.query('BEGIN');
    await lockConsignCatalogForWrite(client);
    const result = await client.query<{ product_id: string; import_batch_id: string | null }>(
      kind === 'category'
        ? `DELETE FROM storehouse_catalog_products
           WHERE source_batch = ANY($1::text[])
             AND (category_slug = ANY($2::text[]) OR lower(category_name) = ANY($3::text[]))
           RETURNING product_id, import_batch_id`
        : `DELETE FROM storehouse_catalog_products
           WHERE source_batch = ANY($1::text[])
             AND (category_slug = ANY($2::text[]) OR lower(category_name) = ANY($3::text[]))
             AND ((product_data->>'subcategorySlug') = ANY($4::text[]) OR lower(subcategory_name) = ANY($5::text[]))
           RETURNING product_id, import_batch_id`,
      kind === 'category'
        ? [batches, categorySlugs, categoryNames]
        : [batches, categorySlugs, categoryNames, subcategorySlugs, subcategoryNames],
    );
    await client.query(
      `DELETE FROM consign_catalog_products
       WHERE lower(category_name) = ANY($1::text[])
         AND ($2 = 'category' OR lower(subcategory_name) = ANY($3::text[]))`,
      [categoryNames, kind, subcategoryNames],
    );
    const consign = await client.query(
      `DELETE FROM consign_feed_products
       WHERE (category_slug = ANY($1::text[]) OR lower(category_name) = ANY($2::text[]))
         AND ($3 = 'category' OR subcategory_slug = ANY($4::text[]) OR lower(subcategory_name) = ANY($5::text[]))`,
      [categorySlugs, categoryNames, kind, subcategorySlugs, subcategoryNames],
    );
    const productIds = result.rows.map((row) => row.product_id);
    const batchIds = unique(result.rows.map((row) => row.import_batch_id).filter((value): value is string => Boolean(value)));
    for (const batchId of batchIds) {
      const counts = await client.query<{ category_slug: string; count: string }>(
        `SELECT category_slug, COUNT(*)::text AS count
         FROM storehouse_catalog_products WHERE import_batch_id = $1 GROUP BY category_slug`,
        [batchId],
      );
      const categoryCounts = Object.fromEntries(counts.rows.map((row) => [row.category_slug, Number(row.count)]));
      const total = Object.values(categoryCounts).reduce((sum, value) => sum + value, 0);
      await client.query(
        `UPDATE storehouse_catalog_import_batches
         SET expected_products = $2, uploaded_products = $2, published_products = $2,
             category_counts = $3::jsonb, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [batchId, total, JSON.stringify(categoryCounts)],
      );
    }
    const deleted = { productIds, deletedProducts: (result.rowCount || 0) + (consign.rowCount || 0) };
    await persistCatalogs(deleted);
    await client.query('COMMIT');
    return deleted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProductFeedCategoryEverywhere(input: DeleteInput) {
  if (input.kind !== 'category' && input.kind !== 'subcategory') throw new Error('Choose a category or subcategory to delete.');
  const kind = input.kind as CategoryKind;
  const requestedCategorySlug = String(input.categorySlug || '').trim();
  const requestedCategoryName = String(input.categoryName || '').trim();
  if (!requestedCategorySlug && !requestedCategoryName) throw new Error('Choose a category to delete.');

  const mainCategories = getStoreCategories() as CategoryShape[];
  const storehouseCategories = readStorehouseProductFeedCategories() as CategoryShape[];
  const mainCategory = findCategory(mainCategories, requestedCategorySlug, requestedCategoryName);
  const storehouseCategory = findCategory(storehouseCategories, requestedCategorySlug, requestedCategoryName);
  if (!mainCategory && !storehouseCategory) throw new Error('Category was not found. Refresh the page and try again.');

  const pairedCategories = [mainCategory, storehouseCategory].filter((category): category is CategoryShape => Boolean(category));
  let requestedSubcategorySlug = String(input.subcategorySlug || '').trim();
  let requestedSubcategoryName = String(input.subcategoryName || '').trim();
  let resolvedSubcategory = kind === 'subcategory'
    ? pairedCategories.map((category) => findSubcategory(category, requestedSubcategorySlug, requestedSubcategoryName)).find(Boolean)
    : undefined;
  if (kind === 'subcategory') {
    if (!resolvedSubcategory) throw new Error('Subcategory was not found. Refresh the page and try again.');
    requestedSubcategorySlug ||= resolvedSubcategory.slug;
    requestedSubcategoryName ||= resolvedSubcategory.name;
  }

  const scopes: ProductScope[] = pairedCategories.map((category) => {
    const subcategory = kind === 'subcategory'
      ? findSubcategory(category, requestedSubcategorySlug, requestedSubcategoryName)
      : undefined;
    return {
      categorySlug: category.slug,
      categoryName: category.name,
      ...(kind === 'subcategory' ? {
        subcategorySlug: subcategory?.slug || requestedSubcategorySlug || slugify(requestedSubcategoryName),
        subcategoryName: subcategory?.name || requestedSubcategoryName,
      } : {}),
    };
  });
  if (!scopes.length) throw new Error('Category was not found. Refresh the page and try again.');

  let databaseFallback = false;
  let oldListings: RetailListing[];
  let oldHistory: Awaited<ReturnType<typeof readProductUpdateHistory>>;
  try {
    oldListings = await readRetailListings();
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    databaseFallback = true;
    oldListings = readRetailListingsFallbackFile();
  }
  try {
    oldHistory = await readProductUpdateHistory();
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    databaseFallback = true;
    oldHistory = readProductUpdateHistoryFallbackFile();
  }
  const oldMainOverrides = readStoreCategoryOverrides();
  const oldStorehouseOverrides = readStorehouseProductFeedCategoryOverrides();
  const oldSellerProducts = readAllSellerProductsMap();
  const oldStorehouseFallbackProducts = readStorehouseFallbackProducts();
  const nextStorehouseFallback = removeStorehouseFallbackProducts(kind, scopes);
  const removedListings = oldListings.filter((listing) => listingMatchesAnyScope(listing, scopes));
  const removedIds = new Set(removedListings.map((listing) => listing.id));
  for (const batch of oldHistory) {
    for (const previousListing of batch.previousListings) {
      if (listingMatchesAnyScope(previousListing, scopes)) removedIds.add(previousListing.id);
    }
  }
  const removedListingIds = new Set(removedListings.map((listing) => listing.id));
  const nextListings = oldListings.filter((listing) => !removedListingIds.has(listing.id));
  const nextHistory = removeListingsFromHistory(oldHistory, removedIds, scopes);
  const nextMainOverrides = removeCategoryOverrides(oldMainOverrides, kind, scopes);
  const nextStorehouseOverrides = removeStorehouseOverrides(oldStorehouseOverrides, kind, scopes);

  let retainedSellerImages = new Set<string>();
  let removedStorehouseFallbackProducts = 0;
  const database = await deleteStorehouseRows(kind, scopes, async (deleted) => {
    const useFileFallback = databaseFallback || deleted.storehouseDatabaseSkipped === true;
    const removedSellerProductIds = new Set([
      ...deleted.productIds,
      ...deleted.productIds.map((id) => `p-${id}`),
    ]);
    const nextSellerProducts = Object.fromEntries(Object.entries(oldSellerProducts).map(([email, products]) => [
      email,
      Array.isArray(products) ? products.filter((product) => (
        !removedSellerProductIds.has(product?.id) && !sellerProductMatchesScope(product || {}, kind, scopes)
      )) : products,
    ]));
    retainedSellerImages = new Set(Object.values(nextSellerProducts).flatMap((products) => (
      Array.isArray(products) ? products.map((product) => product?.image).filter((image): image is string => typeof image === 'string') : []
    )));
    if (!useFileFallback) await writeRetailListingsAtomically(nextListings, oldListings);
    try {
      if (useFileFallback) {
        writeRetailListingsFallbackFile(nextListings);
        writeProductUpdateHistoryFallbackFile(nextHistory);
      } else {
        await writeProductUpdateHistory(nextHistory);
      }
      writeStoreCategoryOverrides(nextMainOverrides);
      writeStorehouseProductFeedCategoryOverrides(nextStorehouseOverrides);
      writeAllSellerProductsMap(nextSellerProducts);
      writeStorehouseFallbackProducts(nextStorehouseFallback.products);
      removedStorehouseFallbackProducts = nextStorehouseFallback.removedCount;
    } catch (error) {
      try {
        if (useFileFallback) {
          writeRetailListingsFallbackFile(oldListings);
          writeProductUpdateHistoryFallbackFile(oldHistory);
        } else {
          await writeRetailListingsAtomically(oldListings, nextListings);
          await writeProductUpdateHistory(oldHistory);
        }
        writeStoreCategoryOverrides(oldMainOverrides);
        writeStorehouseProductFeedCategoryOverrides(oldStorehouseOverrides);
        writeAllSellerProductsMap(oldSellerProducts);
        writeStorehouseFallbackProducts(oldStorehouseFallbackProducts);
      } catch { /* Return the original error; recovery is best effort. */ }
      throw error;
    }
  });

  const deletedImagePaths = new Set(removedListings.flatMap(listingImagePaths));
  for (const batch of oldHistory) {
    for (const previous of batch.previousListings) {
      if (removedIds.has(previous.id)) listingImagePaths(previous).forEach((image) => deletedImagePaths.add(image));
    }
  }
  const stillReferencedImages = new Set([
    ...nextListings.flatMap(listingImagePaths),
    ...nextHistory.flatMap((batch) => batch.previousListings.flatMap(listingImagePaths)),
    ...retainedSellerImages,
    ...await findSharedCatalogImageReferences(deletedImagePaths),
  ]);
  let removedImages = 0;
  for (const image of deletedImagePaths) {
    if (stillReferencedImages.has(image)) continue;
    try {
      await fs.unlink(path.join(process.cwd(), 'public', image.slice(1)));
      removedImages += 1;
    } catch { /* A missing or externally managed image does not restore a deleted product. */ }
  }

  return {
    categories: getStoreCategories(),
    storehouseCategories: readStorehouseProductFeedCategories(),
    deletedProducts: removedListings.length + database.deletedProducts + removedStorehouseFallbackProducts,
    deletedMainStoreProducts: removedListings.length,
    deletedStorehouseProducts: database.deletedProducts + removedStorehouseFallbackProducts,
    storehouseDatabaseSkipped: database.storehouseDatabaseSkipped === true,
    removedImages,
  };
}
