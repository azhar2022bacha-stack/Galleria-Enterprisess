import { catalogCategorySlug } from '@/data/catalogCategoryReplacements';
import { dbQuery, initDb } from '@/lib/db';
import { normalizeProductFeedKey } from '@/lib/productFeed';
import { readRetailListings, readRetailListingsFallbackFile } from '@/lib/retailListingsServer';
import { readAllSellerProductsMap } from '@/lib/sellerProductsServer';
import { readProductFeedCategoryLists } from '@/lib/productFeedSharedCategoriesServer';
import { readStorehouseFallbackProducts } from '@/lib/storehouseCatalogFallbackServer';
import { SELLER_STOREHOUSE_BATCHES } from '@/lib/storehouseCatalogServer';

type CategoryProductRecord = {
  id?: string;
  product_id?: string;
  category?: string;
  categorySlug?: string;
  category_name?: string;
  category_slug?: string;
};

function categorySlugFrom(record: CategoryProductRecord): string {
  const raw = record.categorySlug || record.category_slug || record.category || record.category_name || '';
  const slug = normalizeProductFeedKey(raw).replaceAll(' ', '-');
  return catalogCategorySlug(slug);
}

export async function readAdminProductCategoryCounts(): Promise<{
  categoryProductCounts: Record<string, number>;
  categoryProductCountsIncomplete: boolean;
}> {
  const { mainStoreCategories, storehouseCategories } = readProductFeedCategoryLists();
  const activeSlugs = new Set([...mainStoreCategories, ...storehouseCategories].map(({ slug }) => catalogCategorySlug(slug)));
  const categoryProductCounts = Object.fromEntries([...activeSlugs].map((slug) => [slug, 0]));
  const seenProducts = new Set<string>();
  let categoryProductCountsIncomplete = false;

  const addProduct = (record: CategoryProductRecord, id = record.id || record.product_id) => {
    const slug = categorySlugFrom(record);
    if (!id || !Object.hasOwn(categoryProductCounts, slug)) return;
    const key = `${slug}:${id}`;
    if (seenProducts.has(key)) return;
    seenProducts.add(key);
    categoryProductCounts[slug] += 1;
  };

  let retailListings;
  try {
    retailListings = await readRetailListings();
  } catch {
    categoryProductCountsIncomplete = true;
    retailListings = readRetailListingsFallbackFile();
  }
  for (const listing of retailListings) addProduct(listing);

  for (const products of Object.values(readAllSellerProductsMap())) {
    if (!Array.isArray(products)) continue;
    for (const product of products) addProduct(product);
  }

  for (const product of readStorehouseFallbackProducts()) {
    addProduct(product, product.product_id);
  }

  if (process.env.DATABASE_URL?.trim()) {
    try {
      if (!(await initDb())) {
        categoryProductCountsIncomplete = true;
      } else {
        const result = await dbQuery<{ id: string; category_slug: string }>(
          `SELECT product.product_id AS id, product.category_slug
           FROM storehouse_catalog_products product
           INNER JOIN storehouse_catalog_import_batches batch ON batch.id = product.import_batch_id
           WHERE product.source_batch = ANY($1::text[]) AND batch.status = 'completed'
           UNION ALL
           SELECT product_id AS id, category_slug FROM consign_feed_products`,
          [SELLER_STOREHOUSE_BATCHES],
        );
        if (!result) categoryProductCountsIncomplete = true;
        else for (const product of result.rows) addProduct(product);
      }
    } catch {
      categoryProductCountsIncomplete = true;
    }
  }

  return { categoryProductCounts, categoryProductCountsIncomplete };
}
