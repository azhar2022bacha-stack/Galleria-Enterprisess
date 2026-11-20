import type { DemoProduct } from '@/types/product';
import { dbQuery, initDb } from '@/lib/db';
import { readStorehouseProductFeedCategories } from '@/lib/storehouseProductFeedCategoriesServer';
import { readStorehouseFallbackProducts } from '@/lib/storehouseCatalogFallbackServer';

export const VERIFIED_STOREHOUSE_BATCH = 'STOREHOUSE-CATALOG-VERIFIED-V1';
export const ADMIN_PRODUCT_FEED_BATCH = 'ADMIN-PRODUCT-FEED-V1';
export const SELLER_STOREHOUSE_BATCHES = [VERIFIED_STOREHOUSE_BATCH, ADMIN_PRODUCT_FEED_BATCH];

export async function isCatalogDatabaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try { return await initDb(); } catch { return false; }
}

export async function readStorehouseCategoryCounts(): Promise<Record<string, number>> {
  const counts = Object.fromEntries(readStorehouseProductFeedCategories().map((category) => [category.slug, 0]));
  for (const product of readStorehouseFallbackProducts()) {
    if (product.category_slug in counts) counts[product.category_slug] += 1;
  }

  if (await isCatalogDatabaseAvailable()) {
    const result = await dbQuery<{ category_slug: string; count: string }>(
      `SELECT product.category_slug, COUNT(*)::text AS count
       FROM storehouse_catalog_products product
       INNER JOIN storehouse_catalog_import_batches batch ON batch.id = product.import_batch_id
       WHERE product.source_batch = ANY($1::text[]) AND batch.status = 'completed'
       GROUP BY product.category_slug`,
      [SELLER_STOREHOUSE_BATCHES]
    );
    for (const row of result?.rows || []) {
      if (row.category_slug in counts) counts[row.category_slug] += Number(row.count);
    }
  }
  return counts;
}

export async function readStorehouseCategory(categorySlug: string): Promise<DemoProduct[]> {
  const products = new Map<string, DemoProduct>();
  if (await isCatalogDatabaseAvailable()) {
    const result = await dbQuery<{ product_data: DemoProduct }>(
      `SELECT product.product_data
       FROM storehouse_catalog_products product
       INNER JOIN storehouse_catalog_import_batches batch ON batch.id = product.import_batch_id
       WHERE product.category_slug = $1
         AND product.source_batch = ANY($2::text[])
         AND batch.status = 'completed'
       ORDER BY product.product_name_key`,
      [categorySlug, SELLER_STOREHOUSE_BATCHES]
    );
    for (const row of result?.rows || []) {
      if (row.product_data?.id) products.set(row.product_data.id, row.product_data);
    }
  }
  for (const product of readStorehouseFallbackProducts()) {
    if (product.category_slug === categorySlug && !products.has(product.product_id)) {
      products.set(product.product_id, product.product_data);
    }
  }
  return Array.from(products.values()).sort((left, right) => left.title.localeCompare(right.title));
}

export function isStorehouseFeedCategory(categorySlug: string): boolean {
  return readStorehouseProductFeedCategories().some((category) => category.slug === categorySlug);
}
