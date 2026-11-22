import fs from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient } from 'pg';
import type { RetailListing } from '@/lib/retailListings';
import { withProductFeedCategoryWrite } from '@/lib/productFeedCategoryStorage';
import { findSharedCatalogImageReferences, SELLER_STOREHOUSE_BATCHES, ADMIN_PRODUCT_FEED_BATCH } from '@/lib/storehouseCatalogServer';
import { lockConsignCatalogForWrite } from '@/lib/consignCatalogServer';
import {
  readRetailListingsFallbackFile,
  readRetailListingsForUpdate,
  writeRetailListingsInTransaction,
  writeRetailListingsFallbackFile,
} from '@/lib/retailListingsServer';
import {
  readProductUpdateHistoryFallbackFile,
  readProductUpdateHistoryForUpdate,
  writeProductUpdateHistoryInTransaction,
  type ProductUpdateBatch,
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
import { normalizeProductFeedKey } from '@/lib/productFeed';
import { catalogCategorySlug, catalogCategorySourceSlugs } from '@/data/catalogCategoryReplacements';

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

function categoryMatchesScope(category: string | undefined, categorySlug: string | undefined, scope: ProductScope): boolean {
  return catalogCategorySlug(categorySlug || slugify(category || '')) === scope.categorySlug
    || (!categorySlug && normalizeName(category || '') === normalizeName(scope.categoryName));
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

function isManagedProductImage(value: unknown): value is string {
  return typeof value === 'string' && /^\/uploads\/(?:admin-product-updates|admin-product-feed|retail-listings)\/[A-Za-z0-9._-]+$/.test(value);
}

function listingImagePaths(listing: RetailListing): string[] {
  const paths = [listing.image, ...(listing.additionalImages || []), listing.pendingChanges?.image, ...(listing.pendingChanges?.additionalImages || [])];
  return paths.filter(isManagedProductImage);
}

function removeListingsFromHistory(
  batches: ProductUpdateBatch[],
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
  const canonicalSlug = catalogCategorySlug(slug);
  return categories.find((category) => category.slug === canonicalSlug)
    ?? categories.find((category) => name && normalizeName(category.name) === normalizeName(name));
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
    const sameCategory = categoryMatchesScope(product.category, product.categorySlug, scope);
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

type RemovedStorehouseRow = {
  product_id: string;
  import_batch_id: string | null;
  sku_key: string | null;
  product_name_key: string | null;
  retail_listing_id: string | null;
  image: string | null;
  linked_to_consign: boolean;
};

function officialFeedKey(listing: RetailListing) {
  if (listing.sellerSlug !== 'official-store-catalog' || !listing.sku) return null;
  return { sku: listing.sku.trim().toUpperCase(), title: normalizeProductFeedKey(listing.title) };
}

function catalogSlugSql(column: string): string {
  return `trim(both '-' from regexp_replace(regexp_replace(lower(normalize(${column}, NFKD)), '[\u0300-\u036f]', '', 'g'), '[^a-z0-9]+', '-', 'g'))`;
}

async function deleteDatabaseProducts(
  client: PoolClient,
  kind: CategoryKind,
  scopes: ProductScope[],
  mainListingsInScope: RetailListing[],
  deleteAllProducts: boolean,
) {
  const categorySlugs = unique(scopes.flatMap((scope) => catalogCategorySourceSlugs(scope.categorySlug)));
  const categoryNames = unique(scopes.map((scope) => scope.categoryName.toLowerCase()));
  const subcategorySlugs = unique(scopes.map((scope) => scope.subcategorySlug || slugify(scope.subcategoryName || '')).filter(Boolean));
  const subcategoryNames = unique(scopes.map((scope) => scope.subcategoryName?.toLowerCase() || '').filter(Boolean));
  const keys = mainListingsInScope.map(officialFeedKey).filter((key) => key !== null);
  // Older All Three imports share the Storehouse ID with Consign but do not store the Main Store ID.
  const stock = await client.query<RemovedStorehouseRow>(
    `WITH matching AS (
        SELECT stock.product_id, stock.product_data->>'retailListingId' AS retail_listing_id,
               linked.product_id IS NOT NULL AS linked_to_consign
        FROM storehouse_catalog_products stock
        LEFT JOIN consign_catalog_products linked ON linked.product_id = stock.product_id
        WHERE stock.source_batch = ANY($1::text[])
          AND ($2::boolean OR (
            (stock.category_slug = ANY($3::text[]) OR lower(stock.category_name) = ANY($4::text[]))
            AND ($5 = 'category' OR stock.product_data->>'subcategorySlug' = ANY($6::text[])
              OR lower(stock.subcategory_name) = ANY($7::text[])
              OR ${catalogSlugSql('stock.subcategory_name')} = ANY($6::text[]))
          ) OR (stock.source_batch = $8 AND (
            stock.product_data->>'retailListingId' = ANY($9::text[])
            OR (linked.product_id IS NOT NULL AND (
              ((${catalogSlugSql('linked.category_name')} = ANY($3::text[]) OR lower(linked.category_name) = ANY($4::text[]))
                AND ($5 = 'category' OR ${catalogSlugSql('linked.subcategory_name')} = ANY($6::text[])
                  OR lower(linked.subcategory_name) = ANY($7::text[])))
              OR (stock.product_data->>'retailListingId' IS NULL AND EXISTS (
                SELECT FROM jsonb_to_recordset($10::jsonb) AS original(sku text, title text)
                WHERE original.sku = stock.sku_key AND original.title = stock.product_name_key
              ))
            ))
          )))
      )
      DELETE FROM storehouse_catalog_products stock USING matching
      WHERE stock.product_id = matching.product_id
      RETURNING stock.product_id, stock.import_batch_id, stock.sku_key, stock.product_name_key,
                stock.product_data->>'mainImage' AS image, matching.retail_listing_id, matching.linked_to_consign`,
    [SELLER_STOREHOUSE_BATCHES, deleteAllProducts, categorySlugs, categoryNames, kind, subcategorySlugs,
      subcategoryNames, ADMIN_PRODUCT_FEED_BATCH, mainListingsInScope.map(({ id }) => id), JSON.stringify(keys)],
  );

  // Matching linked Consign rows are removed by the Storehouse foreign key. Clean up any
  // remaining Consign assignments independently if their source stock is outside the feed.
  await client.query(
    `DELETE FROM consign_catalog_products
       WHERE $1::boolean OR ((${catalogSlugSql('category_name')} = ANY($2::text[]) OR lower(category_name) = ANY($3::text[]))
         AND ($4 = 'category' OR ${catalogSlugSql('subcategory_name')} = ANY($5::text[]) OR lower(subcategory_name) = ANY($6::text[])))`,
    [deleteAllProducts, categorySlugs, categoryNames, kind, subcategorySlugs, subcategoryNames],
  );
  const consign = await client.query<{ image: string | null }>(
    `DELETE FROM consign_feed_products
       WHERE $1::boolean OR ((category_slug = ANY($2::text[]) OR lower(category_name) = ANY($3::text[]))
         AND ($4 = 'category' OR subcategory_slug = ANY($5::text[]) OR lower(subcategory_name) = ANY($6::text[])))
       RETURNING product_data->>'mainImage' AS image`,
    [deleteAllProducts, categorySlugs, categoryNames, kind, subcategorySlugs, subcategoryNames],
  );
  const batchIds = unique(stock.rows.flatMap(({ import_batch_id }) => import_batch_id ? [import_batch_id] : []));
  if (batchIds.length) {
    await client.query(
      `WITH category_counts AS (
          SELECT import_batch_id, category_slug, count(*)::integer AS count
          FROM storehouse_catalog_products
          WHERE import_batch_id = ANY($1::text[])
          GROUP BY import_batch_id, category_slug
        ), totals AS (
          SELECT import_batch_id, sum(count)::integer AS total, jsonb_object_agg(category_slug, count) AS counts
          FROM category_counts GROUP BY import_batch_id
        )
        UPDATE storehouse_catalog_import_batches batch
        SET expected_products = COALESCE(totals.total, 0), uploaded_products = COALESCE(totals.total, 0),
            published_products = COALESCE(totals.total, 0), category_counts = COALESCE(totals.counts, '{}'::jsonb),
            updated_at = CURRENT_TIMESTAMP
        FROM unnest($1::text[]) AS affected(id) LEFT JOIN totals ON totals.import_batch_id = affected.id
        WHERE batch.id = affected.id`, [batchIds],
    );
  }
  return { stock: stock.rows, consign: consign.rows };
}

export function deleteProductFeedCategoryEverywhere(input: DeleteInput) {
  return withProductFeedCategoryWrite(() => deleteCategory(input));
}

export function deleteAllProductFeedCategoriesEverywhere() {
  return withProductFeedCategoryWrite(() => deleteCategory({ kind: 'all-categories' }));
}

async function deleteCategory(input: DeleteInput) {
  const deleteAllProducts = input.kind === 'all-categories';
  if (!deleteAllProducts && input.kind !== 'category' && input.kind !== 'subcategory') throw new Error('Choose a category or subcategory to delete.');
  const kind: CategoryKind = deleteAllProducts ? 'category' : input.kind as CategoryKind;
  const mainCategories = getStoreCategories() as CategoryShape[];
  const storehouseCategories = readStorehouseProductFeedCategories() as CategoryShape[];
  let scopes: ProductScope[];
  if (deleteAllProducts) {
    const categories = [...mainCategories, ...storehouseCategories];
    const scopesBySlug = new Map<string, ProductScope>();
    for (const category of categories) {
      for (const categorySlug of catalogCategorySourceSlugs(category.slug)) {
        if (!scopesBySlug.has(categorySlug)) scopesBySlug.set(categorySlug, { categorySlug, categoryName: category.name });
      }
    }
    scopes = [...scopesBySlug.values()];
  } else {
    const requestedCategorySlug = String(input.categorySlug || '').trim();
    const requestedCategoryName = String(input.categoryName || '').trim();
    if (!requestedCategorySlug && !requestedCategoryName) throw new Error('Choose a category to delete.');
    const mainCategory = findCategory(mainCategories, requestedCategorySlug, requestedCategoryName);
    const storehouseCategory = findCategory(storehouseCategories, requestedCategorySlug, requestedCategoryName);
    if (!mainCategory && !storehouseCategory) throw new Error('Category was not found. Refresh the page and try again.');

    const pairedCategories = [mainCategory, storehouseCategory].filter((category): category is CategoryShape => Boolean(category));
    let requestedSubcategorySlug = String(input.subcategorySlug || '').trim();
    let requestedSubcategoryName = String(input.subcategoryName || '').trim();
    const resolvedSubcategory = kind === 'subcategory'
      ? pairedCategories.map((category) => findSubcategory(category, requestedSubcategorySlug, requestedSubcategoryName)).find(Boolean)
      : undefined;
    if (kind === 'subcategory') {
      if (!resolvedSubcategory) throw new Error('Subcategory was not found. Refresh the page and try again.');
      requestedSubcategorySlug ||= resolvedSubcategory.slug;
      requestedSubcategoryName ||= resolvedSubcategory.name;
    }

    scopes = pairedCategories.map((category) => {
      const subcategory = kind === 'subcategory'
        ? findSubcategory(category, requestedSubcategorySlug, requestedSubcategoryName)
        : undefined;
      return {
        categorySlug: catalogCategorySlug(category.slug),
        categoryName: category.name,
        ...(kind === 'subcategory' ? {
          subcategorySlug: subcategory?.slug || requestedSubcategorySlug || slugify(requestedSubcategoryName),
          subcategoryName: subcategory?.name || requestedSubcategoryName,
        } : {}),
      };
    });
  }
  if (!scopes.length && !deleteAllProducts) throw new Error('Category was not found. Refresh the page and try again.');

  const databaseEnabled = Boolean(process.env.DATABASE_URL?.trim());
  if (databaseEnabled && !(await initDb())) {
    throw new Error('The catalog database is unavailable. No categories were deleted. Try again when it is online.');
  }
  const client = databaseEnabled ? await getPool().connect() : undefined;
  let restoreFiles: (() => void) | undefined;
  let deletedMainStoreProducts = 0;
  let deletedStorehouseProducts = 0;
  let deletedConsignProducts = 0;
  const removedSellerProductIds = new Set<string>();
  const deletedImagePaths = new Set<string>();
  const stillReferencedImages = new Set<string>();

  try {
    if (client) {
      await client.query('BEGIN');
      await lockConsignCatalogForWrite(client);
    }
    const oldListings = client ? await readRetailListingsForUpdate(client) : readRetailListingsFallbackFile();
    const oldHistory = client ? await readProductUpdateHistoryForUpdate(client) : readProductUpdateHistoryFallbackFile();
    const oldMainOverrides = readStoreCategoryOverrides();
    const oldStorehouseOverrides = readStorehouseProductFeedCategoryOverrides();
    const oldStorehouseFallback = readStorehouseFallbackProducts();
    const fallbackScopes = scopes.flatMap((scope) =>
      catalogCategorySourceSlugs(scope.categorySlug).map((slug) => ({ ...scope, categorySlug: slug })),
    );
    const fallback = deleteAllProducts
      ? { products: [], removedCount: oldStorehouseFallback.length }
      : removeStorehouseFallbackProducts(kind, fallbackScopes);

    const hasAssignedCategory = (item: { category?: string; categorySlug?: string }) => Boolean(item.categorySlug || item.category);
    const scopedListings = oldListings.filter((listing) => deleteAllProducts
      ? hasAssignedCategory(listing)
      : listingMatchesAnyScope(listing, scopes));
    const database = client
      ? await deleteDatabaseProducts(client, kind, scopes, scopedListings, deleteAllProducts)
      : { stock: [], consign: [] };

    const removedListingIds = new Set(scopedListings.map(({ id }) => id));
    const legacyLinkedKeys = new Set<string>();
    const key = (sku: string, title: string) => JSON.stringify([sku, title]);
    for (const row of database.stock) {
      if (row.retail_listing_id) removedListingIds.add(row.retail_listing_id);
      else if (row.linked_to_consign && row.sku_key && row.product_name_key) {
        legacyLinkedKeys.add(key(row.sku_key, row.product_name_key));
      }
    }
    if (!deleteAllProducts && legacyLinkedKeys.size) {
      for (const listing of oldListings) {
        const original = officialFeedKey(listing);
        if (original && legacyLinkedKeys.has(key(original.sku, original.title))) removedListingIds.add(listing.id);
      }
    }

    const nextListings = oldListings.filter((listing) => {
      if (!removedListingIds.has(listing.id)) return true;
      listingImagePaths(listing).forEach((image) => deletedImagePaths.add(image));
      return false;
    });
    deletedMainStoreProducts = oldListings.length - nextListings.length;
    const removedHistoryIds = new Set(removedListingIds);
    for (const batch of oldHistory) {
      for (const listing of batch.previousListings) {
        if (deleteAllProducts || removedListingIds.has(listing.id) || listingMatchesAnyScope(listing, scopes)) {
          removedHistoryIds.add(listing.id);
          listingImagePaths(listing).forEach((image) => deletedImagePaths.add(image));
        }
      }
    }
    const nextHistory = deleteAllProducts ? [] : removeListingsFromHistory(oldHistory, removedHistoryIds, scopes);
    const retainedFallbackIds = new Set(fallback.products.map(({ product_id }) => product_id));
    const removedFallbackRows = oldStorehouseFallback.filter(({ product_id }) => !retainedFallbackIds.has(product_id));
    const removedStockIds = [...database.stock, ...removedFallbackRows].map(({ product_id }) => product_id);
    const removedFeedProductIds = new Set([...removedStockIds, ...removedStockIds.map((id) => `p-${id}`)]);
    for (const { image } of [...database.stock, ...database.consign]) {
      if (image && isManagedProductImage(image)) deletedImagePaths.add(image);
    }
    for (const { product_data } of removedFallbackRows) {
      if (isManagedProductImage(product_data?.mainImage)) deletedImagePaths.add(product_data.mainImage);
    }
    deletedStorehouseProducts = database.stock.length + fallback.removedCount;
    deletedConsignProducts = database.consign.length;

    if (client) {
      await writeRetailListingsInTransaction(client, nextListings);
      await writeProductUpdateHistoryInTransaction(client, nextHistory);
    }

    const oldSellerProducts = readAllSellerProductsMap();
    const nextSellerProducts = Object.fromEntries(Object.entries(oldSellerProducts).map(([email, products]) => [
      email,
      Array.isArray(products) ? products.filter((product) => {
        const removed = removedFeedProductIds.has(product?.id)
          || (deleteAllProducts && hasAssignedCategory(product || {}))
          || sellerProductMatchesScope(product || {}, kind, scopes);
        if (removed) {
          if (product?.id) removedSellerProductIds.add(product.id);
          if (isManagedProductImage(product?.image)) deletedImagePaths.add(product.image);
        } else if (product?.image) {
          stillReferencedImages.add(product.image);
        }
        return !removed;
      }) : products,
    ]));
    for (const listing of [...nextListings, ...nextHistory.flatMap((batch) => batch.previousListings)]) {
      listingImagePaths(listing).forEach((image) => stillReferencedImages.add(image));
    }

    restoreFiles = () => {
      const restorations = [
        () => writeStoreCategoryOverrides(oldMainOverrides),
        () => writeStorehouseProductFeedCategoryOverrides(oldStorehouseOverrides),
        () => writeAllSellerProductsMap(oldSellerProducts),
        () => writeStorehouseFallbackProducts(oldStorehouseFallback),
      ];
      if (!client) restorations.push(
        () => writeRetailListingsFallbackFile(oldListings),
        () => writeProductUpdateHistoryFallbackFile(oldHistory),
      );
      for (const restore of restorations) {
        try { restore(); }
        catch (error) { console.error('Could not restore category deletion data.', error); }
      }
    };
    if (!client) {
      writeRetailListingsFallbackFile(nextListings);
      writeProductUpdateHistoryFallbackFile(nextHistory);
    }
    writeStoreCategoryOverrides(removeCategoryOverrides(oldMainOverrides, kind, scopes));
    writeStorehouseProductFeedCategoryOverrides(removeStorehouseOverrides(oldStorehouseOverrides, kind, scopes));
    writeAllSellerProductsMap(nextSellerProducts);
    writeStorehouseFallbackProducts(fallback.products);
    if (client) await client.query('COMMIT');
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    restoreFiles?.();
    throw error;
  } finally {
    client?.release();
  }

  for (const image of await findSharedCatalogImageReferences(deletedImagePaths)) stillReferencedImages.add(image);
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
    deletedProducts: deletedMainStoreProducts + deletedStorehouseProducts + deletedConsignProducts + removedSellerProductIds.size,
    deletedSellerProducts: removedSellerProductIds.size,
    deletedMainStoreProducts,
    deletedStorehouseProducts,
    deletedConsignProducts,
    storehouseDatabaseSkipped: !databaseEnabled,
    removedImages,
  };
}
