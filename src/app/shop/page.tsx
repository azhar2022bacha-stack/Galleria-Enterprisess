import { setTimeout as delay } from 'node:timers/promises';
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
  const deadline = new AbortController();
  const page = await Promise.race([
    getStorefrontCatalogPage(filters).catch(() => undefined),
    delay(2000, undefined, { signal: deadline.signal }).catch(() => undefined),
  ]).finally(() => deadline.abort());
  return <ShopPageClient initialPage={page && { key: filters.toString(), ...page }} />;
}
