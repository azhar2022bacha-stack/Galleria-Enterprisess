import ShopPageClient from './ShopPageClient';
import { getStorefrontCatalogPage } from '@/lib/storefrontCatalogServer';

export const dynamic = 'force-dynamic';

export default async function ShopPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const first = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] || '' : value || '';
  };
  if (first('catalog') === 'legacy') return <ShopPageClient />;

  const filters = new URLSearchParams({
    category: first('category') || first('catalogCategory'),
    search: first('search').trim(),
    sort: first('sort') === 'newest' ? 'newest' : 'default',
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const page = await Promise.race([
    getStorefrontCatalogPage(filters).catch(() => undefined),
    new Promise<undefined>((resolve) => { timeout = setTimeout(resolve, 2000); }),
  ]).finally(() => clearTimeout(timeout));
  return <ShopPageClient initialPage={page && { key: filters.toString(), ...page }} />;
}
