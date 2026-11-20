import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getPool, initDb } from '@/lib/db';
import { CONSIGN_CATALOG_PAGE_SIZE } from '@/lib/productFeed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }
  const headers = { 'Cache-Control': 'no-store' };
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ success: true, products: [], categories: [], totalCount: 0 }, { headers });
  }

  const params = new URL(request.url).searchParams;
  const category = (params.get('category') || '').trim().slice(0, 160);
  const search = (params.get('search') || '').trim().slice(0, 160);
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1_000_000) : 1;

  try {
    if (!(await initDb())) throw new Error('Consign catalog database unavailable.');
    const { rows } = await getPool().query(
      `WITH matching AS (
         SELECT entry.product_id AS id, entry.category_name AS category, entry.subcategory_name AS subcategory,
                item.product_data->>'title' AS name, item.price::float AS price,
                item.product_data->>'sku' AS sku, item.product_data->>'mainImage' AS "imageUrl",
                (item.product_data->>'stockQuantity')::integer AS stock
         FROM consign_catalog_products entry
         JOIN storehouse_catalog_products item ON item.product_id = entry.product_id
         WHERE ($1 = '' OR entry.category_name = $1)
           AND ($2 = '' OR strpos(lower(item.product_data->>'title'), lower($2)) > 0 OR strpos(lower(item.sku_key), lower($2)) > 0)
       ),
       visible AS (SELECT * FROM matching ORDER BY name, id LIMIT $3 OFFSET $4),
       categories AS (SELECT DISTINCT category_name FROM consign_catalog_products)
       SELECT COALESCE((SELECT jsonb_agg(visible ORDER BY name, id) FROM visible), '[]'::jsonb) AS products,
              COALESCE((SELECT jsonb_agg(category_name ORDER BY category_name) FROM categories), '[]'::jsonb) AS categories,
              (SELECT count(*)::integer FROM matching) AS "totalCount"`,
      [category, search, CONSIGN_CATALOG_PAGE_SIZE, (page - 1) * CONSIGN_CATALOG_PAGE_SIZE],
    );
    return NextResponse.json({ success: true, ...rows[0] }, { headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Consign products could not be loaded. Please try again.' }, { status: 503, headers });
  }
}
