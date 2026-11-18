import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getPool, initDb, dbQuery } from '@/lib/db';
import { readRetailListings, writeRetailListingsAtomically } from '@/lib/retailListingsServer';
import type { RetailListing } from '@/lib/retailListings';
import { getStoreCategories } from '@/lib/storeCategoriesServer';
import { readStorehouseProductFeedCategories } from '@/lib/storehouseProductFeedCategoriesServer';
import {
  appendStorehouseFallbackProducts,
  findStorehouseFallbackProductKeys,
  type StorehouseFallbackProduct,
} from '@/lib/storehouseCatalogFallbackServer';
import { ALL_PRODUCTS } from '@/services/mockData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STOREHOUSE_FEED_BATCH = 'ADMIN-PRODUCT-FEED-V1';
const MAX_ROWS = 5000;
const MAX_BODY_BYTES = 35 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

type Destination = 'main-store' | 'seller-storehouse';
type CategoryOption = { name: string; slug: string; subcategories: { name: string; slug: string }[] };
type FeedInput = {
  rowNumber?: number;
  title?: unknown;
  description?: unknown;
  priceUsd?: unknown;
  price_usd?: unknown;
  price?: unknown;
  sku?: unknown;
  brand?: unknown;
  category?: unknown;
  categorySlug?: unknown;
  subcategory?: unknown;
  subcategorySlug?: unknown;
  imageUrl?: unknown;
  image_url?: unknown;
  image?: unknown;
  imageDataUrl?: unknown;
  stockQuantity?: unknown;
  stock_quantity?: unknown;
  stock?: unknown;
};
type PreparedFeedProduct = {
  rowNumber: number;
  title: string;
  description: string;
  price: number;
  sku: string;
  brand: string;
  category: CategoryOption;
  subcategory: { name: string; slug: string };
  image: string;
  imageBuffer?: Buffer;
  imageExtension?: string;
  imageHash?: string;
  stockQuantity: number;
};

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function normalizeKey(value: unknown): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return normalizeKey(value).replace(/\s+/g, '-').slice(0, 90) || 'product';
}

function categoryOptions(destination: Destination): CategoryOption[] {
  if (destination === 'main-store') return getStoreCategories();
  return readStorehouseProductFeedCategories();
}

function imageData(value: unknown): { buffer: Buffer; extension: string; hash: string } | null {
  if (typeof value !== 'string' || !value) return null;
  const match = value.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error('Choose a PNG, JPG, or WebP product image.');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('Product images must be smaller than 12 MB.');
  const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const isPng = extension === 'png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpg = extension === 'jpg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp = extension === 'webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!isPng && !isJpg && !isWebp) throw new Error('The image file does not match its PNG, JPG, or WebP format.');
  return { buffer, extension, hash: createHash('sha256').update(buffer).digest('hex') };
}

function validImageUrl(value: string): boolean {
  if (value.startsWith('/')) return !value.includes('..') && !value.includes('\\') && /^\/(images|uploads)\//.test(value);
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = String((error as Error & { code?: string }).code || '');
  return /^(?:ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|57P01|57P03)$/.test(code)
    || code.startsWith('08')
    || /connection terminated|database.*(?:unavailable|not reachable)/i.test(error.message);
}

function makeProductSlug(title: string, id: string): string {
  return `${slugify(title)}-${id.slice(-8)}`;
}

async function validateProducts(destination: Destination, inputs: FeedInput[]) {
  const errors: { row: number; message: string }[] = [];
  const prepared: PreparedFeedProduct[] = [];
  const categories = categoryOptions(destination);
  const seenSkus = new Set<string>();
  const seenTitles = new Set<string>();

  inputs.forEach((input, index) => {
    const rowNumber = Number.isInteger(Number(input.rowNumber)) ? Number(input.rowNumber) : index + 2;
    const title = text(input.title);
    const description = text(input.description);
    const sku = text(input.sku);
    const brand = text(input.brand);
    const categoryValue = text(input.categorySlug) || text(input.category);
    const subcategoryValue = text(input.subcategorySlug) || text(input.subcategory);
    const price = Number(input.priceUsd ?? input.price_usd ?? input.price);
    const stockRaw = input.stockQuantity ?? input.stock_quantity ?? input.stock;
    const stockQuantity = stockRaw === undefined || stockRaw === null || text(stockRaw) === '' ? 1 : Number(stockRaw);
    let image = text(input.imageUrl) || text(input.image_url) || text(input.image);
    let uploadedImage: ReturnType<typeof imageData> = null;

    try { uploadedImage = imageData(input.imageDataUrl); }
    catch (error) { errors.push({ row: rowNumber, message: error instanceof Error ? error.message : 'Invalid image file.' }); return; }

    if (title.length < 3 || title.length > 120) { errors.push({ row: rowNumber, message: 'Title must be between 3 and 120 characters.' }); return; }
    if (description.length < 15 || description.length > 3000) { errors.push({ row: rowNumber, message: 'Description must be between 15 and 3,000 characters.' }); return; }
    if (!sku || sku.length > 64) { errors.push({ row: rowNumber, message: 'SKU is required and must be 64 characters or fewer.' }); return; }
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) { errors.push({ row: rowNumber, message: 'Enter a USD price greater than 0 and no more than 1,000,000.' }); return; }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 10_000_000) { errors.push({ row: rowNumber, message: 'Stock quantity must be a whole number of 0 or more.' }); return; }
    if (brand.length > 120) { errors.push({ row: rowNumber, message: 'Brand must be 120 characters or fewer.' }); return; }
    if (!uploadedImage && (!image || image.length > 1000 || !validImageUrl(image))) {
      errors.push({ row: rowNumber, message: 'Provide an HTTPS image URL, a local /images or /uploads path, or upload an image file.' }); return;
    }

    const category = categories.find((item) => normalizeKey(item.slug) === normalizeKey(categoryValue) || normalizeKey(item.name) === normalizeKey(categoryValue));
    const subcategory = category?.subcategories.find((item) => normalizeKey(item.slug) === normalizeKey(subcategoryValue) || normalizeKey(item.name) === normalizeKey(subcategoryValue));
    if (!category || !subcategory) { errors.push({ row: rowNumber, message: `Choose a valid category and subcategory for the ${destination === 'main-store' ? 'Main Store' : 'Seller Storehouse'}.` }); return; }

    const skuKey = sku.toUpperCase();
    const titleKey = normalizeKey(title);
    if (seenSkus.has(skuKey)) { errors.push({ row: rowNumber, message: `Duplicate SKU in this upload: ${sku}.` }); return; }
    if (seenTitles.has(titleKey)) { errors.push({ row: rowNumber, message: `Duplicate product title in this upload: ${title}.` }); return; }
    seenSkus.add(skuKey);
    seenTitles.add(titleKey);

    prepared.push({
      rowNumber,
      title,
      description,
      price,
      sku,
      brand,
      category,
      subcategory,
      image: uploadedImage ? '' : image,
      imageBuffer: uploadedImage?.buffer,
      imageExtension: uploadedImage?.extension,
      imageHash: uploadedImage?.hash,
      stockQuantity,
    });
  });

  if (!errors.length && prepared.length) {
    const skuKeys = prepared.map((item) => item.sku.toUpperCase());
    const titleKeys = prepared.map((item) => normalizeKey(item.title));
    if (destination === 'main-store') {
      const listings = await readRetailListings();
      const existingSkus = new Set([
        ...ALL_PRODUCTS.map((product) => text(product.sku).toUpperCase()),
        ...listings.map((listing) => text(listing.sku).toUpperCase()),
      ].filter(Boolean));
      const existingTitles = new Set([
        ...ALL_PRODUCTS.map((product) => normalizeKey(product.title)),
        ...listings.map((listing) => normalizeKey(listing.title)),
      ].filter(Boolean));
      prepared.forEach((item) => {
        if (existingSkus.has(item.sku.toUpperCase())) errors.push({ row: item.rowNumber, message: `SKU already exists in the Main Store: ${item.sku}.` });
        else if (existingTitles.has(normalizeKey(item.title))) errors.push({ row: item.rowNumber, message: `Product title already exists in the Main Store: ${item.title}.` });
      });
    } else {
      const fallbackKeys = findStorehouseFallbackProductKeys();
      const existingSkus = new Set(fallbackKeys.skuKeys);
      const existingTitles = new Set(fallbackKeys.titleKeys);
      if (process.env.DATABASE_URL?.trim() && await initDb()) {
        const result = await dbQuery<{ sku_key: string | null; product_name_key: string | null }>(
          `SELECT sku_key, product_name_key FROM storehouse_catalog_products
           WHERE sku_key = ANY($1::text[]) OR product_name_key = ANY($2::text[])`,
          [skuKeys, titleKeys],
        );
        for (const row of result?.rows || []) {
          if (row.sku_key) existingSkus.add(row.sku_key.toUpperCase());
          if (row.product_name_key) existingTitles.add(row.product_name_key);
        }
      }
      prepared.forEach((item) => {
        if (existingSkus.has(item.sku.toUpperCase())) errors.push({ row: item.rowNumber, message: `SKU already exists in the Seller Storehouse: ${item.sku}.` });
        else if (existingTitles.has(normalizeKey(item.title))) errors.push({ row: item.rowNumber, message: `Product title already exists in the Seller Storehouse: ${item.title}.` });
      });
    }
  }

  return { prepared, errors };
}

async function persistUploadedImages(products: PreparedFeedProduct[]): Promise<string[]> {
  const outputPaths: string[] = [];
  const directory = path.join(process.cwd(), 'public', 'uploads', 'admin-product-feed');
  await fs.mkdir(directory, { recursive: true });
  try {
    for (const product of products) {
      if (!product.imageBuffer || !product.imageExtension) continue;
      const fileName = `${randomUUID()}.${product.imageExtension}`;
      await fs.writeFile(path.join(directory, fileName), product.imageBuffer, { flag: 'wx' });
      product.image = `/uploads/admin-product-feed/${fileName}`;
      outputPaths.push(path.join(directory, fileName));
    }
    return outputPaths;
  } catch (error) {
    await Promise.all(outputPaths.map((filePath) => fs.rm(filePath, { force: true })));
    throw error;
  }
}

function makeRetailListing(product: PreparedFeedProduct, adminEmail: string, now: string): RetailListing {
  const id = `ret-${randomUUID()}`;
  return {
    id,
    sellerEmail: adminEmail,
    sellerName: 'Official Store Catalog',
    sellerSlug: 'official-store-catalog',
    sku: product.sku,
    title: product.title,
    slug: makeProductSlug(product.title, id),
    description: product.description,
    brand: product.brand || undefined,
    price: product.price,
    category: product.category.name,
    categorySlug: product.category.slug,
    subcategory: product.subcategory.name,
    subcategorySlug: product.subcategory.slug,
    stockQuantity: product.stockQuantity,
    image: product.image,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  };
}

function makeStorehouseProduct(product: PreparedFeedProduct) {
  const id = `feed-${randomUUID()}`;
  return {
    id,
    title: product.title,
    slug: slugify(product.title),
    sku: product.sku,
    shortDescription: product.description.slice(0, 220),
    description: product.description,
    category: product.category.name,
    categorySlug: product.category.slug,
    subcategory: product.subcategory.name,
    brand: product.brand || 'Unbranded',
    price: product.price,
    compareAtPrice: product.price,
    currency: 'USD',
    stockQuantity: product.stockQuantity,
    minOrderQuantity: 1,
    condition: 'Brand New' as const,
    status: product.stockQuantity === 0 ? 'Limited Availability' as const : product.stockQuantity < 10 ? 'Low Stock' as const : 'In Stock' as const,
    mainImage: product.image,
    galleryImages: [],
    attributes: {},
    rating: 0,
    reviewCount: 0,
    isDemo: false,
    demoBatch: STOREHOUSE_FEED_BATCH,
  };
}

async function saveToStorehouse(products: PreparedFeedProduct[], adminEmail: string, fileName: string) {
  const batchId = `feed-batch-${randomUUID()}`;
  const now = new Date().toISOString();
  const categoryCounts = products.reduce<Record<string, number>>((counts, item) => {
    counts[item.category.slug] = (counts[item.category.slug] || 0) + 1;
    return counts;
  }, {});
  const rows = products.map((item) => {
    const product = makeStorehouseProduct(item);
    return {
      product_id: product.id,
      category_slug: item.category.slug,
      category_name: item.category.name,
      subcategory_slug: item.subcategory.slug,
      subcategory_name: item.subcategory.name,
      currency: 'USD',
      price: item.price,
      source_batch: STOREHOUSE_FEED_BATCH,
      product_data: product,
      sku_key: item.sku.toUpperCase(),
      product_name_key: normalizeKey(item.title),
      image_sha256: item.imageHash || null,
      import_batch_id: batchId,
    };
  });

  const saveToLocalCatalog = () => {
    appendStorehouseFallbackProducts(rows.map((row) => ({
      product_id: row.product_id,
      category_slug: row.category_slug,
      category_name: row.category_name,
      subcategory_slug: row.subcategory_slug,
      subcategory_name: row.subcategory_name,
      sku_key: row.sku_key,
      product_name_key: row.product_name_key,
      source_batch: row.source_batch,
      product_data: row.product_data,
    } satisfies StorehouseFallbackProduct)));
    return { batchId, storageMode: 'local-file' as const };
  };

  if (!process.env.DATABASE_URL?.trim() || !(await initDb())) return saveToLocalCatalog();
  const pool = getPool();
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (error) {
    if (isDatabaseConnectionError(error)) return saveToLocalCatalog();
    throw error;
  }

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO storehouse_catalog_import_batches
         (id, input_digest, source_name, status, expected_products, uploaded_products, published_products, category_counts, errors, created_by, created_at, updated_at, completed_at)
       VALUES ($1, $2, $3, 'completed', $4, $4, $4, $5::jsonb, '[]'::jsonb, $6, $7, $7, $7)`,
      [batchId, createHash('sha256').update(JSON.stringify(rows)).digest('hex'), fileName || 'Admin Product Feed', products.length, JSON.stringify(categoryCounts), adminEmail, now],
    );
    const inserted = await client.query(
      `INSERT INTO storehouse_catalog_products (
         product_id, category_slug, category_name, subcategory_name, currency, price,
         source_batch, product_data, sku_key, product_name_key, image_sha256, import_batch_id, updated_at
       )
       SELECT product_id, category_slug, category_name, subcategory_name, currency, price,
              source_batch, product_data, sku_key, product_name_key, image_sha256, import_batch_id, CURRENT_TIMESTAMP
       FROM jsonb_to_recordset($1::jsonb) AS incoming(
         product_id TEXT, category_slug TEXT, category_name TEXT, subcategory_name TEXT,
         currency VARCHAR(3), price NUMERIC(12,2), source_batch TEXT, product_data JSONB,
         sku_key TEXT, product_name_key TEXT, image_sha256 CHAR(64), import_batch_id TEXT
       )`,
      [JSON.stringify(rows.map((row) => ({ ...row, import_batch_id: batchId })))],
    );
    if (inserted.rowCount !== products.length) throw new Error('Not all products could be saved to the Seller Storehouse.');
    await client.query('COMMIT');
    return { batchId, storageMode: 'postgresql' as const };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Keep the product upload under 35 MB.' }, { status: 413 });
  }

  let body: { action?: string; destination?: string; items?: FeedInput[]; fileName?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: 'The product feed request is not valid JSON.' }, { status: 400 }); }

  const destination = body.destination as Destination;
  if (destination !== 'main-store' && destination !== 'seller-storehouse') {
    return NextResponse.json({ success: false, error: 'Choose the Main Store or Seller Storehouse destination.' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > MAX_ROWS) {
    return NextResponse.json({ success: false, error: `Upload between 1 and ${MAX_ROWS.toLocaleString()} products at a time.` }, { status: 400 });
  }
  if (body.items.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    return NextResponse.json({ success: false, error: 'Every product row must be an object with product fields.' }, { status: 400 });
  }
  if (body.action !== 'preview' && body.action !== 'commit') {
    return NextResponse.json({ success: false, error: 'Choose preview or commit.' }, { status: 400 });
  }

  try {
    const { prepared, errors } = await validateProducts(destination, body.items);
    const report = {
      success: errors.length === 0,
      totalRows: body.items.length,
      validRows: prepared.length,
      errors: errors.slice(0, 50),
      destination,
      ...(destination === 'seller-storehouse' ? {
        storageMode: process.env.DATABASE_URL?.trim() && await initDb() ? 'postgresql' : 'local-file',
      } : {}),
    };
    if (body.action === 'preview' || errors.length) {
      return NextResponse.json({ ...report, ...(errors.length ? { error: 'Review the listed rows before importing.' } : {}) }, { status: errors.length ? 400 : 200 });
    }

    const imagePaths = await persistUploadedImages(prepared);
    try {
      if (destination === 'main-store') {
        const listings = await readRetailListings();
        const createdAt = new Date().toISOString();
        const additions = prepared.map((item) => makeRetailListing(item, admin.email, createdAt));
        await writeRetailListingsAtomically([...additions, ...listings]);
        return NextResponse.json({ success: true, destination, importedCount: additions.length, products: additions });
      }

      const saved = await saveToStorehouse(prepared, admin.email, text(body.fileName).slice(0, 160));
      return NextResponse.json({ success: true, destination, importedCount: prepared.length, ...saved });
    } catch (error) {
      await Promise.all(imagePaths.map((filePath) => fs.rm(filePath, { force: true })));
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Product feed upload failed.' }, { status: 503 });
  }
}
