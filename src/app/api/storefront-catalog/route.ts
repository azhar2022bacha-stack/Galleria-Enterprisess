import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { getStoreCategory } from '@/lib/storeCatalog';
import { getStorefrontCatalog, type CatalogProduct } from '@/lib/storefrontCatalogServer';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 24;
const gzipAsync = promisify(gzip);
const headers = { 'Cache-Control': 'no-store' };

const sorts: Record<string, (a: CatalogProduct, b: CatalogProduct) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-low': (a, b) => a.price - b.price,
  'price-high': (a, b) => b.price - a.price,
  'name-asc': (a, b) => a.title.localeCompare(b.title),
  'name-desc': (a, b) => b.title.localeCompare(a.title),
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'page';
  try {
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
    if (scope !== 'page') return NextResponse.json({ error: 'Unknown catalog view.' }, { status: 400 });

    const category = (searchParams.get('category') || '').trim();
    const slug = categories.some((item) => item.slug === category) ? category : getStoreCategory(category)?.slug || category;
    const terms = (searchParams.get('search') || '').slice(0, 200).trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = products.filter((product) => {
      if (slug && product.storeCategorySlug !== slug) return false;
      if (!terms.length) return true;
      const searchable = [product.title, product.brand, product.sku, product.description, product.category].join(' ').toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
    const sort = searchParams.get('sort') || '';
    if (Object.hasOwn(sorts, sort)) matches.sort(sorts[sort]);
    const requested = Number(searchParams.get('page'));
    const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
    const start = (page - 1) * PAGE_SIZE;
    return NextResponse.json({ products: matches.slice(start, start + PAGE_SIZE), totalCount: matches.length }, { headers });
  } catch (error) {
    console.error('Unable to load storefront catalog:', error);
    return NextResponse.json({ error: 'The catalog is temporarily unavailable. Please try again.' }, { headers, status: 503 });
  }
}
