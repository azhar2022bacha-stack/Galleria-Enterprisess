import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getRequestAdmin } from '@/lib/adminSession';
import { readRetailListings, RetailListingsChangedError, writeRetailListingsAtomically } from '@/lib/retailListingsServer';
import type { RetailListing } from '@/lib/retailListings';
import { readProductUpdateHistory, writeProductUpdateHistory, type ProductUpdateBatch } from '@/lib/productUpdateHistoryServer';
import { getStoreCategories } from '@/lib/storeCategoriesServer';
import { findStorehouseImageReferences } from '@/lib/storehouseCatalogServer';
import { ALL_PRODUCTS } from '@/services/mockData';
import { getStoreTaxonomyForProduct } from '@/lib/storeCatalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type UpdateRow = {
  id?: string;
  sku?: string;
  upc?: string;
  title?: string;
  brand?: string;
  model?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  price?: number | string;
  stockQuantity?: number | string;
  description?: string;
  image?: string;
  additionalImages?: string[];
  specifications?: Record<string, unknown>;
  priceSourceUrl?: string;
  priceCheckedAt?: string;
};

type PreparedRow = {
  rowNumber: number;
  existingId?: string;
  product: Omit<RetailListing, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'sellerEmail' | 'sellerName' | 'sellerSlug' | 'slug'>;
  categoryName: string;
  subcategoryName: string;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(value: unknown): string {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function similarity(left: string, right: string): number {
  const a = new Set(normalize(left).split(' ').filter((token) => token.length > 1));
  const b = new Set(normalize(right).split(' ').filter((token) => token.length > 1));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

const TITLE_STOP_WORDS = new Set(['a', 'an', 'and', 'for', 'from', 'genuine', 'compatible', 'new', 'original', 'the', 'with']);
function titleAnchors(title: string): string[] {
  return [...new Set(normalize(title).split(' ').filter((token) => token.length > 1 && !TITLE_STOP_WORDS.has(token)))].slice(0, 4);
}

function validImage(value: string): boolean {
  if (value.startsWith('/')) return !value.includes('..') && (value.startsWith('/images/') || value.startsWith('/uploads/'));
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !/^(example\.invalid|replace-me)$/i.test(url.hostname);
  } catch { return false; }
}

function validSource(value: string): boolean {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function specifications(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const rawEntries = Object.entries(value as Record<string, unknown>);
  if (rawEntries.some(([, item]) => item !== null && typeof item === 'object')) return null;
  const entries = rawEntries
    .map(([key, item]) => [key.trim(), String(item ?? '').trim()] as const)
    .filter(([key, item]) => key && item);
  if (!entries.length || entries.length > 40 || entries.some(([key, item]) => key.length > 80 || item.length > 500)) return null;
  return Object.fromEntries(entries);
}

function makeValidation(items: UpdateRow[], listings: RetailListing[], categories: ReturnType<typeof getStoreCategories>) {
  const errors: { row: number; message: string }[] = [];
  const warnings: { row: number; message: string }[] = [];
  const prepared: PreparedRow[] = [];
  const seenSkus = new Map<string, number>();
  const seenUpcs = new Map<string, number>();
  const seenTitles = new Map<string, number>();
  const existingBySku = new Map<string, RetailListing>();
  const existingByUpc = new Map<string, RetailListing>();
  const sampleSkus = new Set(ALL_PRODUCTS.map((product) => normalize(product.sku)).filter(Boolean));
  const titlesByIdentity = new Map<string, { id?: string; title: string }[]>();
  const productsByModel = new Map<string, { id?: string }[]>();
  const titlesByAnchor = new Map<string, { id?: string; title: string }[]>();
  const registerTitle = (record: { id?: string; title: string; brand?: string; model?: string }) => {
    const normalizedTitle = normalize(record.title);
    const exactMatches = titlesByIdentity.get(normalizedTitle) || [];
    exactMatches.push({ id: record.id, title: record.title });
    titlesByIdentity.set(normalizedTitle, exactMatches);
    const modelIdentity = `${normalize(record.brand)} ${normalize(record.model)}`.trim();
    if (record.model && modelIdentity) {
      const modelMatches = productsByModel.get(modelIdentity) || [];
      modelMatches.push({ id: record.id });
      productsByModel.set(modelIdentity, modelMatches);
    }
    for (const anchor of titleAnchors(record.title)) {
      const similarCandidates = titlesByAnchor.get(anchor) || [];
      similarCandidates.push({ id: record.id, title: record.title });
      titlesByAnchor.set(anchor, similarCandidates);
    }
  };

  for (const listing of listings) {
    const sku = normalize(listing.sku);
    const upc = normalize(listing.upc);
    if (sku) existingBySku.set(sku, listing);
    if (upc) existingByUpc.set(upc, listing);
    registerTitle({ id: listing.id, title: listing.title, brand: listing.brand || listing.sellerName, model: listing.model });
  }
  for (const product of ALL_PRODUCTS) registerTitle({ id: `mock:${product.id}`, title: product.title, brand: product.brand, model: product.model });

  items.forEach((raw, index) => {
    const rowNumber = Number.isInteger(Number((raw as any).rowNumber)) ? Number((raw as any).rowNumber) : index + 2;
    const sku = text(raw.sku);
    const skuKey = normalize(sku);
    if (!skuKey || sku.length > 64) { errors.push({ row: rowNumber, message: 'SKU is required and must be 64 characters or fewer.' }); return; }
    if (skuKey === 'example only') return;
    if (seenSkus.has(skuKey)) { errors.push({ row: rowNumber, message: `Duplicate SKU in this file (also on row ${seenSkus.get(skuKey)}).` }); return; }
    if (sampleSkus.has(skuKey)) { errors.push({ row: rowNumber, message: 'This SKU is already used by an existing storefront sample product.' }); return; }
    seenSkus.set(skuKey, rowNumber);

    const upc = text(raw.upc).replace(/[\s-]/g, '');
    const upcKey = normalize(upc);
    if (upc && !/^\d{8,14}$/.test(upc)) { errors.push({ row: rowNumber, message: 'UPC/GTIN must contain 8 to 14 digits.' }); return; }
    if (upcKey && seenUpcs.has(upcKey)) { errors.push({ row: rowNumber, message: `Duplicate UPC/GTIN in this file (also on row ${seenUpcs.get(upcKey)}).` }); return; }
    if (upcKey) seenUpcs.set(upcKey, rowNumber);

    const bySku = existingBySku.get(skuKey);
    const byUpc = upcKey ? existingByUpc.get(upcKey) : undefined;
    const byId = raw.id ? listings.find((listing) => listing.id === raw.id) : undefined;
    if (bySku && byUpc && bySku.id !== byUpc.id) { errors.push({ row: rowNumber, message: 'SKU and UPC/GTIN match different catalog products.' }); return; }
    if (byId && ((bySku && bySku.id !== byId.id) || (byUpc && byUpc.id !== byId.id))) { errors.push({ row: rowNumber, message: 'The supplied SKU/UPC belongs to a different catalog product.' }); return; }
    const existing = byId || bySku || byUpc;

    const incomingTitle = text(raw.title);
    const incomingBrand = text(raw.brand);
    const incomingModel = text(raw.model);
    const title = incomingTitle || existing?.title || '';
    const brand = incomingBrand || existing?.brand || '';
    const model = incomingModel || existing?.model || '';
    if (title.length < 3 || title.length > 120) { errors.push({ row: rowNumber, message: 'Product title is required for new rows and must be 3 to 120 characters.' }); return; }
    if (brand.length > 100 || (!existing && brand.length < 2)) { errors.push({ row: rowNumber, message: 'Brand is required for new rows and must be 2 to 100 characters.' }); return; }
    if (model.length > 100 || (!existing && model.length < 1)) { errors.push({ row: rowNumber, message: 'Model is required for new rows and must be 1 to 100 characters.' }); return; }

    const inferredCategory = categories.find((entry) => entry.name === existing?.category);
    const categorySlug = text(raw.categorySlug) || existing?.categorySlug || inferredCategory?.slug || '';
    const inferredSubcategory = inferredCategory?.subcategories.find((entry) => entry.name === existing?.subcategory);
    const subcategorySlug = text(raw.subcategorySlug) || existing?.subcategorySlug || inferredSubcategory?.slug || '';
    const category = categories.find((entry) => entry.slug === categorySlug);
    const subcategory = category?.subcategories.find((entry) => entry.slug === subcategorySlug);
    if (!category || !subcategory) { errors.push({ row: rowNumber, message: 'Choose a valid category_slug and subcategory_slug.' }); return; }

    const price = raw.price === undefined || raw.price === '' ? existing?.price : Number(raw.price);
    const stockQuantity = raw.stockQuantity === undefined || raw.stockQuantity === '' ? existing?.stockQuantity : Number(raw.stockQuantity);
    if (!Number.isFinite(price) || Number(price) <= 0 || Number(price) > 1000000) { errors.push({ row: rowNumber, message: 'Price must be a positive USD amount no greater than 1,000,000.' }); return; }
    if (!Number.isInteger(stockQuantity) || Number(stockQuantity) < 0 || Number(stockQuantity) > 10000000) { errors.push({ row: rowNumber, message: 'Stock quantity must be a whole number from 0 to 10,000,000.' }); return; }

    const description = text(raw.description) || existing?.description || '';
    const image = text(raw.image) || existing?.image || '';
    if (description.length < 15 || description.length > 3000) { errors.push({ row: rowNumber, message: 'Description is required for new rows and must be 15 to 3,000 characters.' }); return; }
    if (!image || !validImage(image)) { errors.push({ row: rowNumber, message: 'Image must be an HTTPS image URL or a local /images/ or /uploads/ path.' }); return; }

    const parsedSpecs = raw.specifications === undefined ? existing?.specifications : specifications(raw.specifications);
    if (raw.specifications !== undefined && !parsedSpecs) { errors.push({ row: rowNumber, message: 'Specifications must be a non-empty JSON object with text values.' }); return; }
    const specs = parsedSpecs || undefined;
    if (!existing && (!incomingTitle || !incomingBrand || !incomingModel || raw.price === undefined || raw.stockQuantity === undefined || !text(raw.description) || !text(raw.image))) {
      errors.push({ row: rowNumber, message: 'New products need title, brand, model, price, stock, description, and image.' }); return;
    }

    const priceChanged = Boolean(existing && raw.price !== undefined && Number(raw.price) !== existing.price);
    const priceSourceUrl = text(raw.priceSourceUrl) || (priceChanged ? '' : existing?.priceSourceUrl || '');
    const priceCheckedAt = text(raw.priceCheckedAt) || (priceChanged ? '' : existing?.priceCheckedAt || '');
    if ((text(raw.priceSourceUrl) || text(raw.priceCheckedAt)) && (!text(raw.priceSourceUrl) || !text(raw.priceCheckedAt))) { errors.push({ row: rowNumber, message: 'If you provide price provenance, include both the source URL and checked date.' }); return; }
    if (priceSourceUrl && !validSource(priceSourceUrl)) { errors.push({ row: rowNumber, message: 'Price source URL must use HTTPS.' }); return; }
    if (priceCheckedAt) {
      const parsedDate = new Date(`${priceCheckedAt}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(priceCheckedAt) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== priceCheckedAt || priceCheckedAt > new Date().toISOString().slice(0, 10)) {
        errors.push({ row: rowNumber, message: 'Price checked date must be a valid date in YYYY-MM-DD format and not in the future.' }); return;
      }
    }

    const rawAdditionalImages = raw.additionalImages === undefined ? existing?.additionalImages || [] : raw.additionalImages;
    if (!Array.isArray(rawAdditionalImages) || rawAdditionalImages.length > 10 || rawAdditionalImages.some((value) => typeof value !== 'string' || !validImage(value.trim()))) {
      errors.push({ row: rowNumber, message: 'Additional images must contain up to 10 valid HTTPS URLs or local /images/ or /uploads/ paths.' }); return;
    }
    const additionalImages = [...new Set(rawAdditionalImages.map((value) => value.trim()).filter((value) => value && value !== image))];

    const normalizedTitle = normalize(title);
    if (seenTitles.has(normalizedTitle)) { errors.push({ row: rowNumber, message: `Duplicate product title in this file (also on row ${seenTitles.get(normalizedTitle)}).` }); return; }
    seenTitles.set(normalizedTitle, rowNumber);
    const normalizedIdentity = `${normalize(brand)} ${normalize(model)}`.trim();
    const duplicateIdentity = (productsByModel.get(normalizedIdentity) || []).find((candidate) => candidate.id !== existing?.id);
    if (duplicateIdentity) { errors.push({ row: rowNumber, message: 'This brand and model already exist in the catalog under another SKU.' }); return; }
    const exactTitle = (titlesByIdentity.get(normalizedTitle) || []).find((candidate) => candidate.id !== existing?.id);
    if (exactTitle) { errors.push({ row: rowNumber, message: 'This product title already exists under another SKU.' }); return; }
    const similarCandidates = new Map<string | undefined, { id?: string; title: string }>();
    for (const anchor of titleAnchors(title)) for (const candidate of titlesByAnchor.get(anchor) || []) similarCandidates.set(candidate.id, candidate);
    const similar = [...similarCandidates.values()].find((candidate) => candidate.id !== existing?.id && similarity(candidate.title, title) >= 0.78);
    if (similar && warnings.length < 80) warnings.push({ row: rowNumber, message: `Similar existing title: “${similar.title}”. Verify the model/SKU before importing.` });

    const newUpc = upc || existing?.upc || undefined;
    const upcOwner = newUpc ? existingByUpc.get(normalize(newUpc)) : undefined;
    if (upcOwner && (!existing || upcOwner.id !== existing.id)) { errors.push({ row: rowNumber, message: 'UPC/GTIN already belongs to another product.' }); return; }

    prepared.push({
      rowNumber,
      existingId: existing?.id,
      categoryName: category.name,
      subcategoryName: subcategory.name,
      product: {
        title,
        sku,
        upc: newUpc,
        brand,
        model,
        description,
        specifications: specs,
        price: Number(price),
        priceSourceUrl: priceSourceUrl || undefined,
        priceCheckedAt: priceCheckedAt || undefined,
        category: category.name,
        categorySlug: category.slug,
        subcategory: subcategory.name,
        subcategorySlug: subcategory.slug,
        stockQuantity: Number(stockQuantity),
        image,
        additionalImages: additionalImages.length ? additionalImages : undefined,
      },
    });
    registerTitle({ id: existing?.id || `incoming:${rowNumber}`, title, brand, model });
  });

  const touchedCategoryCounts = categorySummary(prepared, listings, categories);
  for (const count of touchedCategoryCounts) {
    if (count.totalAfter <= 300 || count.totalAfter <= count.totalBefore) continue;
    const lastRow = prepared.filter((row) => row.categoryName === count.category && row.subcategoryName === count.subcategory).at(-1);
    errors.push({ row: lastRow?.rowNumber || 0, message: `${count.category} / ${count.subcategory} would have ${count.totalAfter} products. The storefront collection limit is 300; reduce this import or move products to another subcategory.` });
  }

  return { prepared, errors, warnings };
}

function categorySummary(prepared: PreparedRow[], listings: RetailListing[], categories: ReturnType<typeof getStoreCategories>) {
  const counts = new Map<string, { category: string; subcategory: string; created: number; updated: number }>();
  for (const row of prepared) {
    const key = `${row.categoryName}\u0000${row.subcategoryName}`;
    const entry = counts.get(key) || { category: row.categoryName, subcategory: row.subcategoryName, created: 0, updated: 0 };
    if (row.existingId) entry.updated += 1; else entry.created += 1;
    counts.set(key, entry);
  }
  const titleIdsByBucket = new Map<string, Map<string, Set<string>>>();
  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const put = (bucket: string, title: string, id: string) => {
    const titles = titleIdsByBucket.get(bucket) || new Map<string, Set<string>>();
    const ids = titles.get(normalize(title)) || new Set<string>();
    ids.add(id); titles.set(normalize(title), ids); titleIdsByBucket.set(bucket, titles);
  };
  const remove = (bucket: string, title: string, id: string) => {
    const titles = titleIdsByBucket.get(bucket);
    const ids = titles?.get(normalize(title));
    ids?.delete(id);
    if (ids?.size === 0) titles?.delete(normalize(title));
  };
  const bucket = (categorySlug?: string, subcategorySlug?: string) => categorySlug && subcategorySlug ? `${categorySlug}\u0000${subcategorySlug}` : '';
  for (const product of ALL_PRODUCTS) {
    const taxonomy = getStoreTaxonomyForProduct(product);
    const key = bucket(taxonomy.categorySlug, taxonomy.subcategorySlug);
    if (key) put(key, product.title, `mock:${product.id}`);
  }
  for (const listing of listings) {
    if (listing.status !== 'published') continue;
    const category = categories.find((item) => item.slug === listing.categorySlug || item.name === listing.category);
    const subcategory = category?.subcategories.find((item) => item.slug === listing.subcategorySlug || item.name === listing.subcategory);
    const key = bucket(category?.slug, subcategory?.slug);
    if (key) put(key, listing.title, listing.id);
  }
  const initialCountByBucket = new Map([...titleIdsByBucket].map(([key, titles]) => [key, titles.size]));
  for (const row of prepared) {
    if (row.existingId) {
      const old = listingById.get(row.existingId);
      if (old?.status === 'published') {
        const oldCategory = categories.find((item) => item.slug === old.categorySlug || item.name === old.category);
        const oldSubcategory = oldCategory?.subcategories.find((item) => item.slug === old.subcategorySlug || item.name === old.subcategory);
        const oldKey = bucket(oldCategory?.slug, oldSubcategory?.slug);
        if (oldKey) remove(oldKey, old.title, old.id);
      }
    }
    const key = bucket(row.product.categorySlug, row.product.subcategorySlug);
    if (key) put(key, row.product.title, row.existingId || `incoming:${row.rowNumber}`);
  }
  return [...counts.values()].map((entry) => {
    const category = categories.find((item) => item.name === entry.category);
    const subcategory = category?.subcategories.find((item) => item.name === entry.subcategory);
    const key = bucket(category?.slug, subcategory?.slug);
    return { ...entry, totalBefore: key ? (initialCountByBucket.get(key) || 0) : 0, totalAfter: key ? (titleIdsByBucket.get(key)?.size || 0) : 0 };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory));
}

export async function GET(request: Request) {
  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  const history = (await readProductUpdateHistory()).slice(-50).reverse().map(({ previousListings: _previousListings, productIds: _productIds, createdProductIds: _createdProductIds, ...summary }) => summary);
  return NextResponse.json({ success: true, history });
}

function isAdminCatalogProduct(listing: RetailListing): boolean {
  return listing.sellerSlug === 'official-store-catalog';
}

function imagePathsForListing(listing: RetailListing): string[] {
  const paths = [listing.image, ...(listing.additionalImages || []), listing.pendingChanges?.image, ...(listing.pendingChanges?.additionalImages || [])];
  return paths.filter((value): value is string => typeof value === 'string' && /^\/uploads\/(?:admin-product-updates|admin-product-feed|retail-listings)\/[A-Za-z0-9._-]+$/.test(value));
}

function stripDeletedListingsFromHistory(batches: ProductUpdateBatch[], removedIds: Set<string>): ProductUpdateBatch[] {
  return batches.flatMap((batch) => {
    const productIds = batch.productIds.filter((id) => !removedIds.has(id));
    const createdProductIds = batch.createdProductIds.filter((id) => !removedIds.has(id));
    const previousListings = batch.previousListings.filter((listing) => !removedIds.has(listing.id));
    if (!productIds.length && !previousListings.length) return [];
    return [{
      ...batch,
      productIds,
      createdProductIds,
      previousListings,
      createdCount: createdProductIds.length,
      updatedCount: Math.max(0, productIds.length - createdProductIds.length),
    }];
  });
}

export async function DELETE(request: Request) {
  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid product deletion request.' }, { status: 400 }); }

  const listings = await readRetailListings();
  const history = await readProductUpdateHistory();
  let removedListings: RetailListing[];
  if (body?.allOfficialCatalog === true) {
    removedListings = listings.filter(isAdminCatalogProduct);
  } else {
    const ids: string[] = Array.isArray(body?.ids)
      ? [...new Set((body.ids as unknown[]).filter((id): id is string => typeof id === 'string').map((id) => id.trim()).filter((id) => id.length > 0))]
      : [];
    if (!ids.length || ids.length > 5000) return NextResponse.json({ success: false, error: 'Choose between 1 and 5,000 admin catalog products to delete.' }, { status: 400 });
    const byId = new Map(listings.map((listing) => [listing.id, listing]));
    const selectedListings = ids.map((id) => byId.get(id));
    if (selectedListings.some((listing) => !listing || !isAdminCatalogProduct(listing))) {
      return NextResponse.json({ success: false, error: 'One or more selected products are unavailable for deletion here. Seller-submitted listings are protected.' }, { status: 404 });
    }
    removedListings = selectedListings as RetailListing[];
  }

  if (!removedListings.length) return NextResponse.json({ success: true, deletedCount: 0, deletedIds: [], removedImages: 0 });

  const removedIds = new Set(removedListings.map((listing) => listing.id));
  const nextListings = listings.filter((listing) => !removedIds.has(listing.id));
  const nextHistory = stripDeletedListingsFromHistory(history, removedIds);
  let catalogSaved = false;
  try {
    await writeRetailListingsAtomically(nextListings, listings);
    catalogSaved = true;
    await writeProductUpdateHistory(nextHistory);
  } catch (error) {
    if (error instanceof RetailListingsChangedError) return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    try {
      if (catalogSaved) {
        await writeRetailListingsAtomically(listings, nextListings);
        await writeProductUpdateHistory(history);
      }
    } catch { /* Return the original failure if recovery also fails. */ }
    return NextResponse.json({ success: false, error: 'Product deletion could not be saved. The previous catalog was restored.' }, { status: 500 });
  }

  const candidateImages = new Set(removedListings.flatMap(imagePathsForListing));
  for (const batch of history) {
    for (const previous of batch.previousListings) {
      if (removedIds.has(previous.id)) imagePathsForListing(previous).forEach((image) => candidateImages.add(image));
    }
  }
  const stillReferencedImages = new Set([
    ...nextListings.flatMap(imagePathsForListing),
    ...nextHistory.flatMap((batch) => batch.previousListings.flatMap(imagePathsForListing)),
    ...await findStorehouseImageReferences(candidateImages),
  ]);
  let removedImages = 0;
  for (const image of candidateImages) {
    if (stillReferencedImages.has(image)) continue;
    try {
      await fs.unlink(path.join(process.cwd(), 'public', image.slice(1)));
      removedImages += 1;
    } catch { /* Missing and externally managed images do not undo a saved deletion. */ }
  }

  return NextResponse.json({ success: true, deletedCount: removedIds.size, deletedIds: [...removedIds], removedImages });
}

export async function POST(request: Request) {
  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 35 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Product update requests must be smaller than 35 MB.' }, { status: 413 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid product update request.' }, { status: 400 }); }
  const action = String(body?.action || '');
  const listings = await readRetailListings();
  const history = await readProductUpdateHistory();

  if (action === 'rollback') {
    const batchIndex = history.findIndex((batch) => batch.id === String(body?.batchId || ''));
    if (batchIndex < 0) return NextResponse.json({ success: false, error: 'Import batch not found.' }, { status: 404 });
    const batch = history[batchIndex];
    if (batch.status !== 'committed') return NextResponse.json({ success: false, error: 'This import has already been rolled back.' }, { status: 409 });
    const currentById = new Map(listings.map((listing) => [listing.id, listing]));
    const changedAfterImport = batch.productIds.filter((id) => currentById.get(id)?.updatedAt !== batch.committedAt);
    if (changedAfterImport.length) return NextResponse.json({ success: false, error: `${changedAfterImport.length} product(s) changed after this import. Refresh or resolve those updates before rolling back.` }, { status: 409 });
    const previousById = new Map(batch.previousListings.map((listing) => [listing.id, listing]));
    const createdIds = new Set(batch.createdProductIds);
    const restored = listings.filter((listing) => !createdIds.has(listing.id)).map((listing) => previousById.get(listing.id) || listing);
    const oldListings = listings;
    const oldHistory = [...history];
    const rolledBackAt = new Date().toISOString();
    history[batchIndex] = { ...batch, status: 'rolled_back', rolledBackAt };
    let catalogSaved = false;
    try {
      await writeRetailListingsAtomically(restored, oldListings);
      catalogSaved = true;
      await writeProductUpdateHistory(history);
    } catch (error) {
      if (error instanceof RetailListingsChangedError) return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      if (catalogSaved) {
        await writeRetailListingsAtomically(oldListings, restored).then(() => writeProductUpdateHistory(oldHistory)).catch(() => {});
      }
      return NextResponse.json({ success: false, error: 'The catalog rollback could not be saved.' }, { status: 500 });
    }
    const historySummary = history.slice(-50).reverse().map(({ previousListings: _previousListings, productIds: _productIds, createdProductIds: _createdProductIds, ...summary }) => summary);
    return NextResponse.json({ success: true, rolledBack: true, removedCount: createdIds.size, restoredCount: previousById.size, history: historySummary });
  }

  if (action !== 'preview' && action !== 'commit') return NextResponse.json({ success: false, error: 'Choose preview, commit, or rollback.' }, { status: 400 });
  if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 5000) return NextResponse.json({ success: false, error: 'Upload between 1 and 5,000 product rows.' }, { status: 400 });

  const categories = getStoreCategories();
  const validation = makeValidation(body.items as UpdateRow[], listings, categories);
  const report = {
    success: validation.errors.length === 0,
    totalRows: body.items.length,
    validRows: validation.prepared.length,
    createCount: validation.prepared.filter((row) => !row.existingId).length,
    updateCount: validation.prepared.filter((row) => Boolean(row.existingId)).length,
    categories: categorySummary(validation.prepared, listings, categories),
    errors: validation.errors,
    warnings: validation.warnings,
  };
  if (action === 'preview') return NextResponse.json(report);
  if (validation.errors.length) return NextResponse.json({ ...report, error: 'Fix the reported rows before importing.' }, { status: 400 });

  const committedAt = new Date().toISOString();
  const oldListings = listings;
  const nextListings = [...listings];
  const previousListings: RetailListing[] = [];
  const productIds: string[] = [];
  const createdProductIds: string[] = [];
  const categoryCounts = report.categories;
  const fileName = text(body.fileName).slice(0, 160) || 'manual-product-update';
  for (const row of validation.prepared) {
    const existingIndex = row.existingId ? nextListings.findIndex((listing) => listing.id === row.existingId) : -1;
    if (existingIndex >= 0) {
      const current = nextListings[existingIndex];
      previousListings.push(current);
      nextListings[existingIndex] = {
        ...current,
        ...row.product,
        slug: `${row.product.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)}-${current.id.slice(-8)}`,
        status: 'published',
        pendingChanges: undefined,
        rejectionNote: undefined,
        updatedAt: committedAt,
      };
      productIds.push(current.id);
    } else {
      const id = `ret-${randomUUID()}`;
      const listing: RetailListing = {
        ...row.product,
        id,
        slug: `${row.product.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)}-${id.slice(-8)}`,
        sellerEmail: admin.email.toLowerCase(),
        sellerName: 'Official Store Catalog',
        sellerSlug: 'official-store-catalog',
        status: 'published',
        createdAt: committedAt,
        updatedAt: committedAt,
      };
      nextListings.unshift(listing);
      productIds.push(id);
      createdProductIds.push(id);
    }
  }

  const batch: ProductUpdateBatch = {
    id: `imp-${randomUUID()}`,
    fileName,
    createdAt: committedAt,
    committedAt,
    createdBy: admin.email,
    status: 'committed',
    createdCount: createdProductIds.length,
    updatedCount: productIds.length - createdProductIds.length,
    productIds,
    createdProductIds,
    previousListings,
    categoryCounts,
  };
  const nextHistory = [...history, batch];
  let catalogSaved = false;
  try {
    await writeRetailListingsAtomically(nextListings, oldListings);
    catalogSaved = true;
    await writeProductUpdateHistory(nextHistory);
  } catch (error) {
    if (error instanceof RetailListingsChangedError) return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    if (catalogSaved) await writeRetailListingsAtomically(oldListings, nextListings).catch(() => {});
    return NextResponse.json({ success: false, error: 'The catalog import could not be fully saved.' }, { status: 500 });
  }

  const savedProducts = productIds.map((id) => nextListings.find((listing) => listing.id === id)).filter((listing): listing is RetailListing => Boolean(listing));
  return NextResponse.json({ success: true, batch: { ...batch, previousListings: undefined }, importedCount: productIds.length, createdCount: batch.createdCount, updatedCount: batch.updatedCount, categories: categoryCounts, warnings: validation.warnings, products: savedProducts });
}
