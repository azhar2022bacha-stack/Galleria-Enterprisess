import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { getStorefrontCatalog, getStorefrontCatalogPage } from '@/lib/storefrontCatalogServer';

export const dynamic = 'force-dynamic';
const gzipAsync = promisify(gzip);
const headers = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'page';
  try {
    if (scope === 'page') return NextResponse.json(await getStorefrontCatalogPage(searchParams), { headers });
    const { categories, products } = await getStorefrontCatalog();

    if (scope === 'index') {
      return NextResponse.json({ categories, total: products.length }, { headers });
    }
    if (scope === 'full') {
      const json = JSON.stringify({ categories, products, total: products.length });
      if (/(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers.get('accept-encoding') || '')) {
        const compressed = await gzipAsync(json);
        return new Response(new Uint8Array(compressed), {
          headers: { ...headers, 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' },
        });
      }
      return new Response(json, { headers: { ...headers, 'Content-Type': 'application/json', Vary: 'Accept-Encoding' } });
    }
    if (scope === 'detail') {
      const product = products.find(({ id }) => id === searchParams.get('id'));
      if (!product) return NextResponse.json({ product: null, related: [] }, { headers, status: 404 });
      const category = product.storeCategorySlug || product.categorySlug;
      const related = products.filter((item) => item.id !== product.id && (item.storeCategorySlug || item.categorySlug) === category).slice(0, 4);
      return NextResponse.json({ product, related }, { headers });
    }
    return NextResponse.json({ error: 'Unknown catalog view.' }, { status: 400 });
  } catch (error) {
    console.error('Unable to load storefront catalog:', error);
    return NextResponse.json({ error: 'The catalog is temporarily unavailable. Please try again.' }, { headers, status: 503 });
  }
}
