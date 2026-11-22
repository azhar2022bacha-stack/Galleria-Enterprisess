import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface StoredSellerProductItem {
  id: string;
  title: string;
  sku?: string;
  category?: string;
  categorySlug?: string;
  subcategory?: string;
  subcategorySlug?: string;
  price?: number;
  pricePerKg?: number;
  stock?: string | number;
  stockBags?: number;
  minOrderKg?: number;
  status?: string;
  image?: string;
  addedDate?: string;
}

const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'seller_products.json');

function ensureDataFile() {
  const dir = path.dirname(PRODUCTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, '{}', 'utf8');
  }
}

export function readAllSellerProductsMap(): Record<string, StoredSellerProductItem[]> {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8').trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.warn('Error reading seller_products.json:', err);
    return {};
  }
}

export function writeAllSellerProductsMap(map: Record<string, StoredSellerProductItem[]>) {
  ensureDataFile();
  const temporaryFile = `${PRODUCTS_FILE}.${process.pid}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporaryFile, JSON.stringify(map, null, 2), { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(temporaryFile, PRODUCTS_FILE);
  } catch (err) {
    try { fs.unlinkSync(temporaryFile); } catch {}
    console.error('Error writing seller_products.json:', err);
    throw err;
  }
}

export function getSellerProductsByEmail(email: string, snapshot?: Record<string, StoredSellerProductItem[]>): StoredSellerProductItem[] {
  if (!email) return [];
  const map = snapshot ?? readAllSellerProductsMap();
  const normalized = email.toLowerCase().trim();
  return map[normalized] || map[email] || [];
}

export function saveSellerProductsByEmail(
  email: string,
  products: StoredSellerProductItem[]
): { success: boolean; count: number } {
  const map = readAllSellerProductsMap();
  const normalized = (email || 'default').toLowerCase().trim();
  map[normalized] = products;
  // Also keep default mirror if single active seller
  map['default'] = products;
  writeAllSellerProductsMap(map);
  return { success: true, count: products.length };
}
