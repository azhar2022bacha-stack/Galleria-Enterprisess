import type { DemoProduct } from '@/types/product';
import { dbQuery, initDb } from '@/lib/db';
import { readStorehouseProductFeedCategories, readStorehouseProductFeedCategoryDeletionState } from '@/lib/storehouseProductFeedCategoriesServer';
import { readStorehouseFallbackProducts } from '@/lib/storehouseCatalogFallbackServer';
import { catalogCategoryName, catalogCategorySlug, catalogCategorySourceSlugs } from '@/data/catalogCategoryReplacements';
import { normalizeProductFeedKey } from '@/lib/productFeed';

export const VERIFIED_STOREHOUSE_BATCH = 'STOREHOUSE-CATALOG-VERIFIED-V1';
export const ADMIN_PRODUCT_FEED_BATCH = 'ADMIN-PRODUCT-FEED-V1';
export const SELLER_STOREHOUSE_BATCHES = [VERIFIED_STOREHOUSE_BATCH, ADMIN_PRODUCT_FEED_BATCH];

export async function isCatalogDatabaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try { return await initDb(); } catch { return false; }
}

export async function readStorehouseCategoryCounts(): Promise<Record<string, number>> {
  const counts = Object.fromEntries(readStorehouseProductFeedCategories().map((category) => [category.slug, 0]));
  const { deletedSubcategories } = readStorehouseProductFeedCategoryDeletionState();
  for (const product of readStorehouseFallbackProducts()) {
    const slug = catalogCategorySlug(product.category_slug);
    if (Object.hasOwn(counts, slug) && !isRemovedSubcategory(deletedSubcategories, product.category_slug, product.subcategory_slug)) counts[slug] += 1;
  }

  if (await isCatalogDatabaseAvailable()) {
    const result = await dbQuery<{ category_slug: string; subcategory_name: string; count: string }>(
      `SELECT product.category_slug, product.subcategory_name, COUNT(*)::text AS count
       FROM storehouse_catalog_products product
       INNER JOIN storehouse_catalog_import_batches batch ON batch.id = product.import_batch_id
       WHERE product.source_batch = ANY($1::text[]) AND batch.status = 'completed'
       GROUP BY product.category_slug, product.subcategory_name`,
      [SELLER_STOREHOUSE_BATCHES]
    );
    for (const row of result?.rows || []) {
      const slug = catalogCategorySlug(row.category_slug);
      if (Object.hasOwn(counts, slug) && !isRemovedSubcategory(deletedSubcategories, row.category_slug, categoryKey(row.subcategory_name))) counts[slug] += Number(row.count);
    }
  }
  return counts;
}

export async function readStorehouseCategory(categorySlug: string): Promise<DemoProduct[]> {
  const products = new Map<string, DemoProduct>();
  const sourceSlugs = catalogCategorySourceSlugs(categorySlug);
  const { deletedSubcategories } = readStorehouseProductFeedCategoryDeletionState();
  if (await isCatalogDatabaseAvailable()) {
    const result = await dbQuery<{ product_data: DemoProduct; category_slug: string }>(
      `SELECT product.product_data, product.category_slug
       FROM storehouse_catalog_products product
       INNER JOIN storehouse_catalog_import_batches batch ON batch.id = product.import_batch_id
       WHERE product.category_slug = ANY($1::text[])
         AND product.source_batch = ANY($2::text[])
         AND batch.status = 'completed'
       ORDER BY product.product_name_key`,
      [sourceSlugs, SELLER_STOREHOUSE_BATCHES]
    );
    for (const row of result?.rows || []) {
      if (row.product_data?.id && !isRemovedSubcategory(deletedSubcategories, row.category_slug, categoryKey(row.product_data.subcategory))) {
        products.set(row.product_data.id, projectStorehouseProductCategory(row.product_data, row.category_slug));
      }
    }
  }
  for (const product of readStorehouseFallbackProducts()) {
    if (sourceSlugs.includes(product.category_slug) && !products.has(product.product_id)
      && !isRemovedSubcategory(deletedSubcategories, product.category_slug, product.subcategory_slug)) {
      products.set(product.product_id, projectStorehouseProductCategory(product.product_data, product.category_slug));
    }
  }
  return Array.from(products.values()).sort((left, right) => left.title.localeCompare(right.title));
}

function categoryKey(name: string): string {
  return normalizeProductFeedKey(name).replaceAll(' ', '-');
}

function isRemovedSubcategory(deleted: Record<string, string[]>, category: string, subcategory: string): boolean {
  return [category, catalogCategorySlug(category)].some((slug) => Object.hasOwn(deleted, slug) && deleted[slug].includes(subcategory));
}

export function projectStorehouseProductCategory(product: DemoProduct, sourceSlug = product.categorySlug): DemoProduct {
  return { ...product, categorySlug: catalogCategorySlug(sourceSlug), category: catalogCategoryName(sourceSlug, product.category) };
}

export function isStorehouseFeedCategory(categorySlug: string): boolean {
  return readStorehouseProductFeedCategories().some((category) => category.slug === categorySlug);
}

export async function findSharedCatalogImageReferences(images: Iterable<string>): Promise<string[]> {
  const candidates = new Set(images);
  if (!candidates.size) return [];
  const localReferences = readStorehouseFallbackProducts()
    .map((row) => row.product_data.mainImage)
    .filter((image) => candidates.has(image));
  if (!process.env.DATABASE_URL?.trim()) return localReferences;
  try {
    const result = await dbQuery<{ image: string }>(
      `SELECT product_data->>'mainImage' AS image
       FROM storehouse_catalog_products WHERE product_data->>'mainImage' = ANY($1::text[])
       UNION
       SELECT product_data->>'mainImage' AS image
       FROM consign_feed_products WHERE product_data->>'mainImage' = ANY($1::text[])`,
      [[...candidates]],
    );
    if (result) return [...localReferences, ...result.rows.map((row) => row.image)];
  } catch {
    // Keep shared images if the catalog's references cannot be checked.
  }
  return [...candidates];
}
