import { createHash, randomUUID } from 'node:crypto';
import { dbQuery } from '@/lib/db';
import { isCatalogDatabaseAvailable, projectStorehouseProductCategory, SELLER_STOREHOUSE_BATCHES } from '@/lib/storehouseCatalogServer';
import { CATALOG_CATEGORY_ALIASES, catalogCategorySlug, catalogCategorySourceSlugs } from '@/data/catalogCategoryReplacements';
import { readStorehouseFallbackProducts, type StorehouseFallbackProduct } from '@/lib/storehouseCatalogFallbackServer';
import {
  readStorehouseProductFeedCategories,
  readStorehouseProductFeedCategoryDeletionState,
} from '@/lib/storehouseProductFeedCategoriesServer';
import {
  HIDDEN_SELLER_STOREHOUSE_CATEGORY_SLUGS,
  STOREHOUSE_MIX_BATCH_SIZE,
  STOREHOUSE_MIX_LIMIT,
  getStorehouseSavingsRate,
  getStorehouseSearchTerms,
  type StorehouseMixFilters,
  type StorehouseMixPage,
} from '@/lib/storehouseMix';
import type { DemoProduct, PriceRangeFilter, SortOption } from '@/types/product';

type MixEntry = { id: string; is_fallback: boolean };
type Candidate = MixEntry & {
  category_slug: string;
  sku: string;
  title_key: string;
  sort_name: string;
  sort_number: number;
};
type Visibility = { categories: string[]; deletedSubcategories: Record<string, string[]> };
type MixSnapshot = {
  id: string;
  key: string;
  createdAt: number;
  lastUsedAt: number;
  selection: Promise<{ entries: MixEntry[]; fingerprint: string }>;
};

type PriceBounds = { min?: number; max?: number; minExclusive?: boolean; maxExclusive?: boolean };
const PRICE_BOUNDS: Record<PriceRangeFilter, PriceBounds> = {
  all: {},
  'under-25': { max: 25, maxExclusive: true },
  '25-50': { min: 25, max: 50, maxExclusive: true },
  '50-100': { min: 50, max: 100, maxExclusive: true },
  '100-250': { min: 100, max: 250 },
  '250-plus': { min: 250, minExclusive: true },
};
const SORT_OPTIONS: SortOption[] = ['default', 'name-asc', 'name-desc', 'price-asc', 'price-desc', 'discount', 'stock-desc'];
const STOCK_LABELS: Record<StorehouseMixFilters['status'], string> = {
  all: '',
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
};
const UNAVAILABLE = 'Storehouse products are temporarily unavailable. Please try again.';
const SNAPSHOT_REUSE_MS = 30_000;
const SNAPSHOT_IDLE_MS = 10 * 60_000;
const MAX_SNAPSHOTS = 16;
const snapshots = new Map<string, MixSnapshot>();

function normalizeName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizedSqlName(expression: string): string {
  return `btrim(regexp_replace(regexp_replace(lower(normalize(${expression}, NFKD)), '[\u0300-\u036f]', '', 'g'), '[^a-z0-9]+', ' ', 'g'))`;
}

function parseFilters(body: Record<string, unknown>): StorehouseMixFilters {
  return {
    searchQuery: typeof body.searchQuery === 'string' ? body.searchQuery.trim().toLowerCase().slice(0, 200) : '',
    priceRange: typeof body.priceRange === 'string' && Object.prototype.hasOwnProperty.call(PRICE_BOUNDS, body.priceRange)
      ? body.priceRange as PriceRangeFilter
      : 'all',
    status: body.status === 'in-stock' || body.status === 'low-stock' ? body.status : 'all',
    sortBy: SORT_OPTIONS.includes(body.sortBy as SortOption) ? body.sortBy as SortOption : 'default',
    subcategory: typeof body.subcategory === 'string' ? body.subcategory.trim().toLowerCase().slice(0, 200) : '',
    excludedIds: Array.isArray(body.excludedIds)
      ? [...new Set(body.excludedIds.slice(0, STOREHOUSE_MIX_LIMIT).filter(
        (id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 100
      ))].sort()
      : [],
  };
}

function readVisibility(): Visibility {
  const categories = readStorehouseProductFeedCategories()
    .map((category) => category.slug)
    .filter((slug) => !HIDDEN_SELLER_STOREHOUSE_CATEGORY_SLUGS.has(slug))
    .sort();
  const { deletedSubcategories } = readStorehouseProductFeedCategoryDeletionState();
  return { categories, deletedSubcategories };
}

function createFallbackCandidates(
  products: StorehouseFallbackProduct[],
  filters: StorehouseMixFilters,
  visibility: Visibility,
): Candidate[] {
  const categories = new Set(visibility.categories);
  const excluded = new Set(filters.excludedIds);
  const bounds = PRICE_BOUNDS[filters.priceRange];
  const status = STOCK_LABELS[filters.status];
  const searchTerms = getStorehouseSearchTerms(filters.searchQuery);
  const candidates: Candidate[] = [];

  for (const entry of products) {
    const product = entry.product_data;
    if (!product || product.id !== entry.product_id || typeof product.title !== 'string') continue;
    const categorySlug = catalogCategorySlug(entry.category_slug);
    if (!categories.has(categorySlug) || excluded.has(entry.product_id)) continue;
    if (visibility.deletedSubcategories[categorySlug]?.includes(entry.subcategory_slug)
      || visibility.deletedSubcategories[entry.category_slug]?.includes(entry.subcategory_slug)) continue;
    if (bounds.min !== undefined && (bounds.minExclusive ? product.price <= bounds.min : product.price < bounds.min)) continue;
    if (bounds.max !== undefined && (bounds.maxExclusive ? product.price >= bounds.max : product.price > bounds.max)) continue;
    if (status && product.status !== status) continue;
    if (filters.subcategory && product.subcategory?.trim().toLowerCase() !== filters.subcategory) continue;
    const searchable = [product.title, product.sku, product.brand, product.subcategory].join(' ').toLowerCase();
    if (!searchTerms.every((term) => searchable.includes(term))) continue;

    let sortNumber = 0;
    switch (filters.sortBy) {
      case 'price-asc': sortNumber = product.price; break;
      case 'price-desc': sortNumber = -product.price; break;
      case 'discount': sortNumber = -getStorehouseSavingsRate(product); break;
      case 'stock-desc': sortNumber = -product.stockQuantity; break;
    }
    const sku = entry.sku_key.trim().toUpperCase() || product.sku?.trim().toUpperCase();
    const title = entry.product_name_key.trim().toLowerCase() || normalizeName(product.title);
    candidates.push({
      id: entry.product_id, is_fallback: true, category_slug: categorySlug,
      sku: sku ? 'sku:' + sku : 'id:' + entry.product_id,
      title_key: title ? 'title:' + title : 'id:' + entry.product_id,
      sort_name: product.title.toLowerCase(),
      sort_number: sortNumber,
    });
  }
  return candidates;
}

function selectFallbackMix(candidates: Candidate[], sortBy: SortOption): MixEntry[] {
  const seenIds = new Set<string>();
  const seenSkus = new Set<string>();
  const seenTitles = new Set<string>();
  const unique = candidates.sort((a, b) => a.id.localeCompare(b.id)).filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    if (seenSkus.has(item.sku)) return false;
    seenSkus.add(item.sku);
    if (seenTitles.has(item.title_key)) return false;
    seenTitles.add(item.title_key);
    return true;
  });

  if (sortBy !== 'default') {
    if (sortBy === 'name-asc' || sortBy === 'name-desc') {
      const direction = sortBy === 'name-desc' ? -1 : 1;
      unique.sort((a, b) => direction * a.sort_name.localeCompare(b.sort_name));
    } else {
      unique.sort((a, b) => a.sort_number - b.sort_number);
    }
    return unique;
  }

  const groups = new Map<string, Candidate[]>();
  for (const item of unique) {
    const group = groups.get(item.category_slug) || [];
    group.push(item);
    groups.set(item.category_slug, group);
  }
  let activeGroups = [...groups.keys()].sort().map((category) => groups.get(category)!);
  const mixed: MixEntry[] = [];
  for (let rank = 0; activeGroups.length; rank += 1) {
    for (const group of activeGroups) {
      mixed.push(group[rank]);
    }
    activeGroups = activeGroups.filter((group) => group.length > rank + 1);
  }
  return mixed;
}

async function createSelection(filters: StorehouseMixFilters, visibility: Visibility): Promise<MixEntry[]> {
  if (!visibility.categories.length) return [];
  const fallbackProducts = readStorehouseFallbackProducts();
  const fallback = createFallbackCandidates(fallbackProducts, filters, visibility);
  if (!await isCatalogDatabaseAvailable()) {
    if (!fallbackProducts.length && process.env.DATABASE_URL?.trim()) throw new Error(UNAVAILABLE);
    return selectFallbackMix(fallback, filters.sortBy);
  }

  // Rank only the catalog identities, then load full product records for the requested page.
  const params: unknown[] = [SELLER_STOREHOUSE_BATCHES, visibility.categories.flatMap(catalogCategorySourceSlugs), filters.excludedIds || [], JSON.stringify(fallback)];
  const addParam = (value: unknown) => '$' + params.push(value);
  const categorySlug = `COALESCE(${addParam(JSON.stringify(CATALOG_CATEGORY_ALIASES))}::jsonb ->> product.category_slug, product.category_slug)`;
  const conditions = [
    "batch.status = 'completed'",
    'product.source_batch = ANY($1::text[])',
    'product.category_slug = ANY($2::text[])',
    'NOT (product.product_id = ANY($3::text[]))',
  ];
  if (Object.keys(visibility.deletedSubcategories).length) {
    const deleted = addParam(JSON.stringify(visibility.deletedSubcategories));
    const subcategory = `COALESCE(NULLIF(product.product_data->>'subcategorySlug', ''),
      replace(${normalizedSqlName('product.subcategory_name')}, ' ', '-'))`;
    conditions.push(`NOT (COALESCE(${deleted}::jsonb -> product.category_slug, '[]'::jsonb) ? ${subcategory})`);
    conditions.push(`NOT (COALESCE(${deleted}::jsonb -> ${categorySlug}, '[]'::jsonb) ? ${subcategory})`);
  }
  const bounds = PRICE_BOUNDS[filters.priceRange];
  if (bounds.min !== undefined) conditions.push('product.price ' + (bounds.minExclusive ? '> ' : '>= ') + addParam(bounds.min));
  if (bounds.max !== undefined) conditions.push('product.price ' + (bounds.maxExclusive ? '< ' : '<= ') + addParam(bounds.max));
  if (filters.status !== 'all') conditions.push("product.product_data->>'status' = " + addParam(STOCK_LABELS[filters.status]));
  if (filters.subcategory) {
    conditions.push("lower(btrim(product.subcategory_name)) = " + addParam(filters.subcategory));
  }
  const searchable = "lower(concat_ws(' ', product.product_data->>'title', product.product_data->>'sku', product.product_data->>'brand', product.subcategory_name))";
  for (const term of getStorehouseSearchTerms(filters.searchQuery)) {
    conditions.push('strpos(' + searchable + ', ' + addParam(term) + ') > 0');
  }
  const numericField = (key: 'compareAtPrice' | 'stockQuantity') =>
    `CASE WHEN jsonb_typeof(product.product_data->'${key}') = 'number'
      THEN (product.product_data->>'${key}')::numeric ELSE 0 END`;
  const compareAtPrice = numericField('compareAtPrice');
  let sortName = 'NULL::text';
  let sortNumber = '0::numeric';
  let order = 'sort_number';
  switch (filters.sortBy) {
    case 'default':
      order = 'row_number() OVER (PARTITION BY category_slug ORDER BY id), category_slug';
      break;
    case 'name-asc':
    case 'name-desc':
      sortName = "lower(product.product_data->>'title')";
      order = filters.sortBy === 'name-desc' ? 'sort_name DESC NULLS LAST' : 'sort_name NULLS LAST';
      break;
    case 'price-asc': sortNumber = 'product.price'; break;
    case 'price-desc': sortNumber = '-product.price'; break;
    case 'discount': sortNumber = `CASE WHEN ${compareAtPrice} > 0 THEN LEAST(0, product.price / ${compareAtPrice} - 1) ELSE 0 END`; break;
    case 'stock-desc': sortNumber = '-(' + numericField('stockQuantity') + ')'; break;
  }

  const uniqueIds = fallback.length
    ? 'SELECT DISTINCT ON (id) * FROM candidates ORDER BY id, is_fallback'
    : 'SELECT * FROM candidates';
  const result = await dbQuery<MixEntry>(`
    WITH candidates AS (
      SELECT product.product_id AS id, false AS is_fallback, ${categorySlug} AS category_slug,
             COALESCE(
               'sku:' || NULLIF(upper(btrim(product.sku_key)), ''),
               'sku:' || NULLIF(upper(btrim(product.product_data->>'sku')), ''),
               'id:' || product.product_id
             ) AS sku,
             COALESCE(
               'title:' || NULLIF(lower(btrim(product.product_name_key)), ''),
               'title:' || NULLIF(${normalizedSqlName("product.product_data->>'title'")}, ''),
               'id:' || product.product_id
             ) AS title_key,
             ${sortName} AS sort_name, ${sortNumber} AS sort_number
      FROM storehouse_catalog_products product
      JOIN storehouse_catalog_import_batches batch ON batch.id = product.import_batch_id
      WHERE ${conditions.join(' AND ')}
      UNION ALL
      SELECT id, is_fallback, category_slug, sku, title_key, sort_name, sort_number
      FROM jsonb_to_recordset($4::jsonb) AS file(
        id text, is_fallback boolean, category_slug text, sku text, title_key text,
        sort_name text, sort_number numeric
      )
    ), by_id AS (
      ${uniqueIds}
    ), by_sku AS (
      SELECT DISTINCT ON (sku) * FROM by_id ORDER BY sku, is_fallback, id
    ), by_title AS (
      SELECT DISTINCT ON (title_key) * FROM by_sku ORDER BY title_key, is_fallback, id
    )
    SELECT id, is_fallback
    FROM by_title
    ORDER BY ${order}, id`, params);
  if (!result) {
    if (fallbackProducts.length) return selectFallbackMix(fallback, filters.sortBy);
    throw new Error(UNAVAILABLE);
  }
  return result.rows;
}

function getSnapshot(filters: StorehouseMixFilters, visibility: Visibility, snapshotId: string): MixSnapshot {
  const now = Date.now();
  const key = JSON.stringify([filters, visibility]);
  for (const [id, snapshot] of snapshots) {
    if (now - snapshot.lastUsedAt >= SNAPSHOT_IDLE_MS) snapshots.delete(id);
  }
  const useSnapshot = (snapshot: MixSnapshot) => {
    snapshot.lastUsedAt = now;
    snapshots.delete(snapshot.id);
    snapshots.set(snapshot.id, snapshot);
    return snapshot;
  };
  const requested = snapshots.get(snapshotId);
  if (requested?.key === key) return useSnapshot(requested);
  for (const snapshot of snapshots.values()) {
    if (snapshot.key === key && now - snapshot.createdAt < SNAPSHOT_REUSE_MS) return useSnapshot(snapshot);
  }

  const id = randomUUID();
  const selection = createSelection(filters, visibility)
    .then((entries) => ({
      entries,
      fingerprint: createHash('sha256')
        .update(JSON.stringify(entries.map(({ id, is_fallback }) => [id, is_fallback])))
        .digest('hex'),
    }))
    .catch((error) => {
      snapshots.delete(id);
      throw error;
    });
  const snapshot = { id, key, createdAt: now, lastUsedAt: now, selection };
  snapshots.set(id, snapshot);
  if (snapshots.size > MAX_SNAPSHOTS) snapshots.delete(snapshots.keys().next().value!);
  return snapshot;
}

async function readPageProducts(entries: MixEntry[]): Promise<DemoProduct[]> {
  const products = new Map<string, DemoProduct>();
  const ids = entries.filter((entry) => !entry.is_fallback).map((entry) => entry.id);
  if (ids.length) {
    const result = await dbQuery<{ product_id: string; product_data: DemoProduct }>(
      'SELECT product_id, product_data FROM storehouse_catalog_products WHERE product_id = ANY($1::text[])',
      [ids],
    );
    if (!result) throw new Error(UNAVAILABLE);
    for (const row of result.rows) {
      if (row.product_data?.id === row.product_id) products.set(row.product_id, row.product_data);
    }
  }
  const fallbackIds = new Set(entries.filter((entry) => entry.is_fallback).map((entry) => entry.id));
  if (fallbackIds.size) {
    for (const row of readStorehouseFallbackProducts()) {
      if (fallbackIds.has(row.product_id) && row.product_data?.id === row.product_id) products.set(row.product_id, row.product_data);
    }
  }
  return entries.flatMap((entry) => {
    const product = products.get(entry.id);
    return product ? [projectStorehouseProductCategory(product)] : [];
  });
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export async function readStorehouseMix(body: Record<string, unknown>): Promise<StorehouseMixPage> {
  const pageSize = Math.min(positiveInteger(body.pageSize, 24), STOREHOUSE_MIX_BATCH_SIZE);
  const token = typeof body.snapshotId === 'string' ? body.snapshotId.slice(0, 101) : '';
  const [snapshotId, previousFingerprint] = token.split(':');
  const snapshot = getSnapshot(parseFilters(body), readVisibility(), snapshotId);
  const { entries, fingerprint } = await snapshot.selection;
  if (body.bulkLimit !== undefined) {
    const limit = Math.min(positiveInteger(body.bulkLimit, 1), STOREHOUSE_MIX_LIMIT);
    const excluded = new Set(Array.isArray(body.bulkExcludedIds) ? body.bulkExcludedIds.slice(0, STOREHOUSE_MIX_LIMIT) : []);
    const eligible = entries.filter((entry) => !excluded.has(entry.id));
    const products = await readPageProducts(eligible.slice(0, limit));
    return { snapshotId: `${snapshot.id}:${fingerprint}`, page: 1, totalCount: eligible.length, products };
  }

  // A restarted worker may lose the cached selection. Preserve the page when it rebuilds the same order.
  const requestedPage = previousFingerprint && previousFingerprint !== fingerprint ? 1 : positiveInteger(body.page, 1);
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(entries.length / pageSize)));
  const products = await readPageProducts(entries.slice((page - 1) * pageSize, page * pageSize));
  return { snapshotId: `${snapshot.id}:${fingerprint}`, page, totalCount: entries.length, products };
}
