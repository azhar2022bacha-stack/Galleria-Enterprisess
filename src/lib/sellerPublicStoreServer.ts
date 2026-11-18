import { createHash } from 'crypto';
import type { Product } from '@/types';
import { getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { getSellerShopSettingsServer } from '@/lib/sellerShopSettingsServer';
import { readAllSellerProductsMap, type StoredSellerProductItem } from '@/lib/sellerProductsServer';

export interface SellerPublicStoreProduct extends Product {
  pricePerKg?: number;
  minOrderKg?: number;
  originalSellerProductId: string;
}

export interface SellerPublicStoreProfile {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  productCount: number;
  hash: string;
}

export interface ResolvedSellerPublicStore {
  store: SellerPublicStoreProfile;
  products: SellerPublicStoreProduct[];
  sellerEmail: string;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'seller-store';
}

function emailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 8);
}

export function makeSellerPublicStoreSlug(storeName: string, email: string): string {
  return `${slugify(storeName)}-${emailHash(email)}`;
}

function readStock(item: StoredSellerProductItem): number {
  const raw = item.stockBags ?? item.stock ?? 0;
  const stock = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
}

function productFromStoredItem(
  item: StoredSellerProductItem,
  store: SellerPublicStoreProfile
): SellerPublicStoreProduct | null {
  const originalSellerProductId = String(item.id || '').trim();
  const title = String(item.title || '').trim();
  const pricePerKgValue = Number(item.pricePerKg);
  const pricePerKg = Number.isFinite(pricePerKgValue) && pricePerKgValue > 0 ? pricePerKgValue : undefined;
  const minOrderValue = Number(item.minOrderKg);
  const minOrderKg = Number.isFinite(minOrderValue) && minOrderValue > 0 ? minOrderValue : 1;
  const explicitPrice = Number(item.price);
  const price = Number.isFinite(explicitPrice) && explicitPrice > 0
    ? explicitPrice
    : pricePerKg ? Math.round(pricePerKg * minOrderKg * 100) / 100 : 0;
  if (!originalSellerProductId || !title || !price) return null;

  const category = String(item.category || 'Products').trim() || 'Products';
  const categorySlug = slugify(category);
  const stockQuantity = item.status?.toLowerCase() === 'out of stock' ? 0 : readStock(item);
  const id = `seller-${store.hash}-${encodeURIComponent(originalSellerProductId)}`;

  return {
    id,
    originalSellerProductId,
    title,
    slug: slugify(title),
    sku: String(item.sku || originalSellerProductId).trim(),
    price,
    pricePerKg,
    minOrderKg,
    rating: 0,
    reviewCount: 0,
    description: String((item as StoredSellerProductItem & { description?: string }).description || '').trim()
      || `Listed by ${store.name}. Minimum order: ${minOrderKg} kg.`,
    shortDescription: category,
    category,
    categorySlug,
    storeCategorySlug: categorySlug,
    image: String(item.image || '/images/storefront/catalog-prod-01.png'),
    inStock: stockQuantity > 0,
    stockQuantity,
    brand: store.name,
    sellerStoreSlug: store.slug,
    tags: ['seller store'],
    specifications: [
      { name: 'Seller', value: store.name },
      { name: 'Category', value: category },
      ...(pricePerKg ? [{ name: 'Price per kg', value: `$${pricePerKg.toFixed(2)}` }] : []),
      ...(minOrderKg ? [{ name: 'Minimum order', value: `${minOrderKg} kg` }] : []),
      ...(item.sku ? [{ name: 'SKU', value: item.sku }] : []),
    ],
  };
}

export async function getSellerPublicStoreByEmail(email: string): Promise<ResolvedSellerPublicStore | null> {
  const sellerEmail = email.trim().toLowerCase();
  if (!sellerEmail) return null;
  const seller = await getSellerByEmailServer(sellerEmail);
  if (!seller || seller.status === 'suspended') return null;

  const defaults = {
    shopName: seller.shopName || seller.fullName || 'Seller Store',
    description: '',
  };
  const settings = getSellerShopSettingsServer(sellerEmail, defaults);
  const name = settings.shopName || defaults.shopName;
  const hash = emailHash(sellerEmail);
  const productMap = readAllSellerProductsMap();
  const storedProducts = productMap[sellerEmail] || productMap[email] || [];
  const store: SellerPublicStoreProfile = {
    slug: makeSellerPublicStoreSlug(name, sellerEmail),
    name,
    description: settings.description || '',
    ...(settings.logoUrl ? { logoUrl: settings.logoUrl } : {}),
    productCount: 0,
    hash,
  };
  const products = storedProducts
    .map((item) => productFromStoredItem(item, store))
    .filter((product): product is SellerPublicStoreProduct => product !== null);
  store.productCount = products.length;
  return { store, products, sellerEmail };
}

export async function getSellerPublicStoreBySlug(slug: string): Promise<ResolvedSellerPublicStore | null> {
  const hash = slug.match(/-([a-f0-9]{8})$/i)?.[1]?.toLowerCase();
  if (!hash) return null;
  const productMap = readAllSellerProductsMap();
  const sellerEmail = Object.keys(productMap).find((key) => key.includes('@') && emailHash(key) === hash);
  if (!sellerEmail) return null;
  const store = await getSellerPublicStoreByEmail(sellerEmail);
  return store?.store.hash === hash ? store : null;
}

export async function getSellerProductForOrder(productId: string): Promise<{
  store: SellerPublicStoreProfile;
  sellerEmail: string;
  product: SellerPublicStoreProduct;
} | null> {
  const match = productId.match(/^seller-([a-f0-9]{8})-(.+)$/i);
  if (!match) return null;
  const store = await getSellerPublicStoreBySlug(`store-${match[1]}`);
  if (!store) return null;
  let originalId = match[2];
  try { originalId = decodeURIComponent(originalId); } catch { return null; }
  const product = store.products.find((item) => item.originalSellerProductId === originalId);
  return product ? { store: store.store, sellerEmail: store.sellerEmail, product } : null;
}
