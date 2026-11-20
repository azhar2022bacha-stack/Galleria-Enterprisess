import type { Pool, PoolClient } from 'pg';
import { getPool } from '@/lib/db';
import { CONSIGN_CATALOG_PAGE_SIZE, normalizeProductFeedKey } from '@/lib/productFeed';
import { CATALOG_CATEGORY_ALIASES, catalogCategorySlug } from '@/data/catalogCategoryReplacements';
import { getStoreCategories, readStoreCategoryOverrides } from '@/lib/storeCategoriesServer';

const CATALOG_PRODUCTS = `
  SELECT entry.product_id, entry.category_name, entry.subcategory_name,
         stock.price, stock.sku_key, stock.product_name_key, stock.product_data
  FROM consign_catalog_products entry
  JOIN storehouse_catalog_products stock ON stock.product_id = entry.product_id
  UNION ALL
  SELECT product_id, category_name, subcategory_name, price, sku_key, product_name_key, product_data
  FROM consign_feed_products`;

export async function readConsignCatalog(category: string, search: string, page: number) {
  const active = getStoreCategories();
  const { deletedCategories, deletedSubcategories } = readStoreCategoryOverrides();
  const categoryKey = catalogCategorySlug(normalizeProductFeedKey(category).replaceAll(' ', '-'));
  const slug = (field: string) => `trim(both '-' from regexp_replace(regexp_replace(lower(normalize(${field}, NFKD)), '[\u0300-\u036f]', '', 'g'), '[^a-z0-9]+', '-', 'g'))`;
  const { rows } = await getPool().query(
    `WITH category_keys AS (
       SELECT catalog.*, ${slug('category_name')} AS source_slug, ${slug('subcategory_name')} AS subcategory_slug
       FROM (${CATALOG_PRODUCTS}) catalog
     ), canonical AS (
       SELECT category_keys.*, COALESCE($5::jsonb ->> source_slug, source_slug) AS category_slug
       FROM category_keys
     ), published AS (
       SELECT canonical.*, COALESCE($6::jsonb ->> category_slug, category_name) AS display_category
       FROM canonical
       WHERE NOT (category_slug = ANY($7::text[]))
         AND NOT (source_slug = ANY($7::text[]))
         AND NOT (COALESCE($8::jsonb -> category_slug, '[]'::jsonb) ? subcategory_slug)
         AND NOT (COALESCE($8::jsonb -> source_slug, '[]'::jsonb) ? subcategory_slug)
     ), matching AS (
       SELECT product_id AS id, display_category AS category, subcategory_name AS subcategory,
              product_data->>'title' AS name, price::float AS price,
              product_data->>'sku' AS sku, product_data->>'mainImage' AS "imageUrl",
              (product_data->>'stockQuantity')::integer AS stock
       FROM published
       WHERE ($1 = '' OR category_slug = $1)
         AND ($2 = '' OR strpos(lower(product_data->>'title'), lower($2)) > 0 OR strpos(lower(sku_key), lower($2)) > 0)
     ),
     visible AS (SELECT * FROM matching ORDER BY name, id LIMIT $3 OFFSET $4),
     categories AS (
       SELECT DISTINCT display_category AS category_name FROM published
       UNION SELECT jsonb_array_elements_text($9::jsonb)
     )
     SELECT COALESCE((SELECT jsonb_agg(visible ORDER BY name, id) FROM visible), '[]'::jsonb) AS products,
            COALESCE((SELECT jsonb_agg(category_name ORDER BY category_name) FROM categories), '[]'::jsonb) AS categories,
            (SELECT count(*)::integer FROM matching) AS "totalCount"`,
    [categoryKey, search, CONSIGN_CATALOG_PAGE_SIZE, (page - 1) * CONSIGN_CATALOG_PAGE_SIZE,
      JSON.stringify(CATALOG_CATEGORY_ALIASES), JSON.stringify(Object.fromEntries(active.map(({ slug, name }) => [slug, name]))),
      deletedCategories, JSON.stringify(deletedSubcategories), JSON.stringify(active.filter(({ isCustom }) => isCustom).map(({ name }) => name))],
  );
  return rows[0];
}

export async function findConsignDuplicateKeys(skus: string[], names: string[], db: Pool | PoolClient = getPool()) {
  const { rows } = await db.query<{ sku_key: string | null; product_name_key: string | null }>(
    `SELECT sku_key, product_name_key FROM (${CATALOG_PRODUCTS}) catalog
     WHERE sku_key = ANY($1::text[]) OR product_name_key = ANY($2::text[])`,
    [skus, names],
  );
  return rows;
}

export async function lockConsignCatalogForWrite(client: PoolClient): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('galleria:consign-import', 0))");
}
