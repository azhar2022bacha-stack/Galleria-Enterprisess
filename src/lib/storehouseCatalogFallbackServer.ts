import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DemoProduct } from '@/types/product';

export interface StorehouseFallbackProduct {
  product_id: string;
  category_slug: string;
  category_name: string;
  subcategory_slug: string;
  subcategory_name: string;
  sku_key: string;
  product_name_key: string;
  source_batch: string;
  product_data: DemoProduct;
}

export interface StorehouseFallbackScope {
  categorySlug: string;
  categoryName: string;
  subcategorySlug?: string;
  subcategoryName?: string;
}

const CATALOG_FILE = path.join(process.cwd(), 'src', 'data', 'storehouse_catalog_fallback.json');

let cachedCatalog: { mtimeMs: number; size: number; ino: number; products: StorehouseFallbackProduct[] } | undefined;

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function readStorehouseFallbackProducts(): StorehouseFallbackProduct[] {
  try {
    const { mtimeMs, size, ino } = fs.statSync(CATALOG_FILE);
    if (cachedCatalog?.mtimeMs === mtimeMs && cachedCatalog.size === size && cachedCatalog.ino === ino) {
      return cachedCatalog.products;
    }
    const parsed = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) return [];
    const products = parsed.filter((item): item is StorehouseFallbackProduct => (
      Boolean(item)
      && typeof item === 'object'
      && typeof (item as StorehouseFallbackProduct).product_id === 'string'
      && typeof (item as StorehouseFallbackProduct).category_slug === 'string'
      && typeof (item as StorehouseFallbackProduct).subcategory_slug === 'string'
      && typeof (item as StorehouseFallbackProduct).sku_key === 'string'
      && typeof (item as StorehouseFallbackProduct).product_name_key === 'string'
      && typeof (item as StorehouseFallbackProduct).product_data === 'object'
    ));
    cachedCatalog = { mtimeMs, size, ino, products };
    return products;
  } catch {
    cachedCatalog = undefined;
    return [];
  }
}

export function writeStorehouseFallbackProducts(products: StorehouseFallbackProduct[]): void {
  fs.mkdirSync(path.dirname(CATALOG_FILE), { recursive: true });
  const temporaryFile = `${CATALOG_FILE}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(products, null, 2), { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryFile, CATALOG_FILE);
  cachedCatalog = undefined;
}

export function appendStorehouseFallbackProducts(products: StorehouseFallbackProduct[]): void {
  const current = readStorehouseFallbackProducts();
  const skus = new Set(current.map((product) => product.sku_key.toUpperCase()));
  const titles = new Set(current.map((product) => product.product_name_key));
  for (const product of products) {
    if (skus.has(product.sku_key.toUpperCase())) throw new Error(`SKU already exists in the Seller Storehouse: ${product.product_data.sku}.`);
    if (titles.has(product.product_name_key)) throw new Error(`Product title already exists in the Seller Storehouse: ${product.product_data.title}.`);
    skus.add(product.sku_key.toUpperCase());
    titles.add(product.product_name_key);
  }
  writeStorehouseFallbackProducts([...current, ...products]);
}

export function findStorehouseFallbackProductKeys(): { skuKeys: Set<string>; titleKeys: Set<string> } {
  const products = readStorehouseFallbackProducts();
  return {
    skuKeys: new Set(products.map((product) => product.sku_key.toUpperCase())),
    titleKeys: new Set(products.map((product) => product.product_name_key)),
  };
}

export function removeStorehouseFallbackProducts(
  kind: 'category' | 'subcategory',
  scopes: StorehouseFallbackScope[],
): { products: StorehouseFallbackProduct[]; removedCount: number } {
  const current = readStorehouseFallbackProducts();
  const next = current.filter((product) => !scopes.some((scope) => {
    const sameCategory = product.category_slug === scope.categorySlug
      || (!product.category_slug && normalize(product.category_name) === normalize(scope.categoryName));
    if (!sameCategory) return false;
    if (kind === 'category') return true;
    return product.subcategory_slug === scope.subcategorySlug
      || normalize(product.subcategory_name) === normalize(scope.subcategoryName || '');
  }));
  return { products: next, removedCount: current.length - next.length };
}
