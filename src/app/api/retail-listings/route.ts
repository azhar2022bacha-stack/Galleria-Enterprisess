import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { getRequestAdmin } from '@/lib/adminSession';
import { readRetailListings, writeRetailListings } from '@/lib/retailListingsServer';
import type { RetailListing } from '@/lib/retailListings';
import { getStoreCategories } from '@/lib/storeCategoriesServer';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'product';
}

function makeSellerSlug(storeName: string, email: string): string {
  const suffix = createHash('sha256').update(email).digest('hex').slice(0, 8);
  return `${slugify(storeName).slice(0, 48)}-${suffix}`;
}

function sellerHashFromSlug(value: string): string | null {
  return value.match(/-([a-f0-9]{8})$/i)?.[1]?.toLowerCase() || null;
}

function parseOptions(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return Array.from(new Set(raw.map((item) => String(item).trim()).filter(Boolean).map((item) => item.slice(0, 40))))
    .slice(0, 20);
}

function optionCount(value: unknown): number {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return raw.map((item) => String(item).trim()).filter(Boolean).length;
}

function normalizeIdentity(value: unknown): string {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function resolveTaxonomy(body: any) {
  const categories = getStoreCategories();
  const category = categories.find((item) => item.slug === String(body?.categorySlug || '') || item.name === String(body?.category || ''));
  const subcategory = category?.subcategories.find((item) => item.slug === String(body?.subcategorySlug || '') || item.name === String(body?.subcategory || ''));
  return { category, subcategory };
}

function hasDuplicateProduct(body: any, listings: RetailListing[], excludeId = ''): boolean {
  const normalizedTitle = normalizeIdentity(body?.title);
  const normalizedSku = normalizeIdentity(body?.sku);
  const matches = (title: string, sku?: string) => Boolean(
    (normalizedTitle && normalizeIdentity(title) === normalizedTitle)
    || (normalizedSku && sku && normalizeIdentity(sku) === normalizedSku)
  );
  return listings.some((listing) => listing.id !== excludeId && matches(listing.title, listing.sku));
}

function validateListing(body: any): string | null {
  if (typeof body?.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 120) return 'Product title must be 3 to 120 characters.';
  if (typeof body?.description !== 'string' || body.description.trim().length < 15 || body.description.trim().length > 3000) return 'Description must be 15 to 3,000 characters.';
  const { category, subcategory } = resolveTaxonomy(body);
  if (!category || !subcategory) return 'Choose a valid main category and subcategory.';
  if (typeof body?.sellerName !== 'string' || body.sellerName.trim().length < 2 || body.sellerName.trim().length > 80 || body.sellerName.includes('@')) return 'Enter a public shop name between 2 and 80 characters. Do not use an email address.';
  if (typeof body?.colors !== 'string' || body.colors.length > 1000 || typeof body?.sizes !== 'string' || body.sizes.length > 1000) return 'Variant options must be comma-separated text under 1,000 characters.';
  if (optionCount(body.colors) > 20 || optionCount(body.sizes) > 20) return 'Each product can have up to 20 colors and 20 sizes.';
  if (!Number.isFinite(Number(body?.price)) || Number(body.price) <= 0 || Number(body.price) > 1000000) return 'Enter a retail price greater than $0.';
  if (!Number.isInteger(Number(body?.stockQuantity)) || Number(body.stockQuantity) < 0 || Number(body.stockQuantity) > 10000000) return 'Stock must be a whole number of 0 or more.';
  if (typeof body?.image !== 'string' || !body.image.trim() || body.image.trim().length > 1000) return 'Upload a clear product photo or provide an HTTPS image URL.';
  if (body.image.trim()) {
    const image = body.image.trim();
    if (!(image.startsWith('/') || /^https:\/\//i.test(image))) return 'Image links must use HTTPS or a local path.';
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'public';
  const listings = await readRetailListings();

  if (scope === 'public') {
    return NextResponse.json({ success: true, listings: listings
      .filter((item) => item.status === 'published')
      .map(({ sellerEmail: _sellerEmail, rejectionNote: _rejectionNote, pendingChanges: _pendingChanges, ...item }) => item) });
  }

  if (scope === 'store') {
    const storeSlug = searchParams.get('slug') || '';
    if (!storeSlug) return NextResponse.json({ success: false, error: 'Store name is required.' }, { status: 400 });
    const storeHash = sellerHashFromSlug(storeSlug);
    const storeListings = listings.filter((item) => item.status === 'published' && (
      item.sellerSlug === storeSlug || Boolean(storeHash && sellerHashFromSlug(item.sellerSlug) === storeHash)
    ))
      .map(({ sellerEmail: _sellerEmail, rejectionNote: _rejectionNote, pendingChanges: _pendingChanges, ...item }) => item);
    return NextResponse.json({ success: true, listings: storeListings });
  }

  const admin = await getRequestAdmin(request);
  if (scope === 'admin') {
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    return NextResponse.json({ success: true, listings });
  }

  const sellerEmail = getRequestSellerEmail(request);
  if (scope === 'seller' && sellerEmail) {
    return NextResponse.json({ success: true, listings: listings.filter((item) => item.sellerEmail === sellerEmail) });
  }
  if (scope === 'seller') return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  return NextResponse.json({ success: false, error: 'Unsupported listing scope.' }, { status: 400 });
}

export async function POST(request: Request) {
  const sellerEmail = getRequestSellerEmail(request);
  if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid listing data.' }, { status: 400 }); }
  const validationError = validateListing(body);
  if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });

  const listings = await readRetailListings();
  if (hasDuplicateProduct(body, listings)) return NextResponse.json({ success: false, error: 'A product with this name or SKU is already in the catalog. Check the existing listing before submitting it again.' }, { status: 409 });
  const now = new Date().toISOString();
  const title = body.title.trim();
  const { category, subcategory } = resolveTaxonomy(body);
  const baseSlug = slugify(title);
  const listing: RetailListing = {
    id: `ret-${randomUUID()}`,
    sellerEmail,
    sellerName: body.sellerName.trim().slice(0, 80),
    sellerSlug: makeSellerSlug(body.sellerName.trim(), sellerEmail),
    sku: String(body.sku || `RET-${randomUUID().slice(0, 8).toUpperCase()}`).trim().slice(0, 64),
    title,
    slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
    description: body.description.trim(),
    price: Number(body.price),
    category: category!.name,
    categorySlug: category!.slug,
    subcategory: subcategory!.name,
    subcategorySlug: subcategory!.slug,
    stockQuantity: Number(body.stockQuantity),
    colors: parseOptions(body.colors),
    sizes: parseOptions(body.sizes),
    image: body.image.trim() || '/images/storefront/catalog-prod-01.png',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  listings.unshift(listing);
  await writeRetailListings(listings);
  return NextResponse.json({ success: true, listing }, { status: 201 });
}

export async function PUT(request: Request) {
  const sellerEmail = getRequestSellerEmail(request);
  if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid listing data.' }, { status: 400 }); }
  const validationError = validateListing(body);
  if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });

  const listings = await readRetailListings();
  const index = listings.findIndex((item) => item.id === String(body.id || '') && item.sellerEmail === sellerEmail);
  if (index < 0) return NextResponse.json({ success: false, error: 'Listing not found for this seller.' }, { status: 404 });
  if (hasDuplicateProduct(body, listings, listings[index].id)) return NextResponse.json({ success: false, error: 'A product with this name or SKU is already in the catalog. Check the existing listing before submitting it again.' }, { status: 409 });
  const { category, subcategory } = resolveTaxonomy(body);
  const current = listings[index];
  const changes = {
    title: body.title.trim(),
    sellerName: body.sellerName.trim().slice(0, 80),
    sellerSlug: makeSellerSlug(body.sellerName.trim(), sellerEmail),
    description: body.description.trim(),
    price: Number(body.price),
    category: category!.name,
    categorySlug: category!.slug,
    subcategory: subcategory!.name,
    subcategorySlug: subcategory!.slug,
    stockQuantity: Number(body.stockQuantity),
    colors: parseOptions(body.colors),
    sizes: parseOptions(body.sizes),
    sku: String(body.sku || current.sku).trim().slice(0, 64),
    image: body.image.trim() || '/images/storefront/catalog-prod-01.png',
  };
  listings[index] = current.status === 'published'
    ? { ...current, pendingChanges: changes, rejectionNote: undefined, updatedAt: new Date().toISOString() }
    : { ...current, ...changes, status: 'pending', pendingChanges: undefined, rejectionNote: undefined, updatedAt: new Date().toISOString() };
  await writeRetailListings(listings);
  return NextResponse.json({ success: true, listing: listings[index] });
}

export async function PATCH(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid review decision.' }, { status: 400 }); }

  if (body?.action === 'update-stock') {
    const sellerEmail = getRequestSellerEmail(request);
    if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
    const stockQuantity = Number(body.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 10000000) {
      return NextResponse.json({ success: false, error: 'Stock must be a whole number of 0 or more.' }, { status: 400 });
    }
    const listings = await readRetailListings();
    const index = listings.findIndex((item) => item.id === String(body.id || '') && item.sellerEmail === sellerEmail);
    if (index < 0) return NextResponse.json({ success: false, error: 'Listing not found for this seller.' }, { status: 404 });
    const current = listings[index];
    listings[index] = {
      ...current,
      stockQuantity,
      pendingChanges: current.pendingChanges ? { ...current.pendingChanges, stockQuantity } : undefined,
      updatedAt: new Date().toISOString(),
    };
    await writeRetailListings(listings);
    return NextResponse.json({ success: true, listing: listings[index] });
  }

  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });

  if (body?.action === 'admin-update') {
    const listings = await readRetailListings();
    const index = listings.findIndex((item) => item.id === String(body?.id || ''));
    if (index < 0) return NextResponse.json({ success: false, error: 'Product listing not found.' }, { status: 404 });
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const sku = typeof body.sku === 'string' ? body.sku.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const categoryAndSubcategory = resolveTaxonomy(body);
    const price = Number(body.price);
    const stockQuantity = Number(body.stockQuantity);
    const image = typeof body.image === 'string' ? body.image.trim() : '';
    if (title.length < 3 || title.length > 120) return NextResponse.json({ success: false, error: 'Product title must be 3 to 120 characters.' }, { status: 400 });
    if (!sku || sku.length > 64) return NextResponse.json({ success: false, error: 'Enter a product SKU up to 64 characters.' }, { status: 400 });
    if (description.length < 15 || description.length > 3000) return NextResponse.json({ success: false, error: 'Description must be 15 to 3,000 characters.' }, { status: 400 });
    if (!categoryAndSubcategory.category || !categoryAndSubcategory.subcategory) return NextResponse.json({ success: false, error: 'Choose a valid main category and subcategory.' }, { status: 400 });
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) return NextResponse.json({ success: false, error: 'Enter a retail price greater than $0.' }, { status: 400 });
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 10000000) return NextResponse.json({ success: false, error: 'Stock must be a whole number of 0 or more.' }, { status: 400 });
    if (!image || image.length > 1000 || !(image.startsWith('/') || /^https:\/\//i.test(image))) return NextResponse.json({ success: false, error: 'Use an HTTPS image URL or a local image path.' }, { status: 400 });
    if (hasDuplicateProduct({ title, sku }, listings, listings[index].id)) return NextResponse.json({ success: false, error: 'Another catalog listing already uses this product name or SKU.' }, { status: 409 });
    const current = listings[index];
    listings[index] = {
      ...current,
      title,
      slug: `${slugify(title)}-${current.id.slice(-8)}`,
      sku,
      description,
      price,
      category: categoryAndSubcategory.category.name,
      categorySlug: categoryAndSubcategory.category.slug,
      subcategory: categoryAndSubcategory.subcategory.name,
      subcategorySlug: categoryAndSubcategory.subcategory.slug,
      stockQuantity,
      image,
      pendingChanges: undefined,
      rejectionNote: undefined,
      updatedAt: new Date().toISOString(),
    };
    await writeRetailListings(listings);
    return NextResponse.json({ success: true, listing: listings[index] });
  }

  const decision = body?.decision;
  if (!['published', 'rejected'].includes(decision)) return NextResponse.json({ success: false, error: 'Choose approve or reject.' }, { status: 400 });

  const listings = await readRetailListings();
  const index = listings.findIndex((item) => item.id === String(body?.id || ''));
  if (index < 0) return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 });
  const current = listings[index];
  if (decision === 'published' && hasDuplicateProduct(current, listings, current.id)) {
    return NextResponse.json({ success: false, error: 'Another catalog listing now uses this product name or SKU. Resolve the duplicate before approving this product.' }, { status: 409 });
  }
  const rejectionNote = decision === 'rejected' ? String(body?.rejectionNote || 'Please review the product details and submit again.').slice(0, 500) : undefined;
  if (current.pendingChanges) {
    listings[index] = decision === 'published'
      ? { ...current, ...current.pendingChanges, status: 'published', pendingChanges: undefined, rejectionNote: undefined, updatedAt: new Date().toISOString() }
      : { ...current, status: 'published', pendingChanges: undefined, rejectionNote, updatedAt: new Date().toISOString() };
  } else {
    listings[index] = { ...current, status: decision, rejectionNote, updatedAt: new Date().toISOString() };
  }
  await writeRetailListings(listings);
  return NextResponse.json({ success: true, listing: listings[index] });
}
