import { NextResponse } from 'next/server';
import {
  isStorehouseFeedCategory,
  readStorehouseCategory,
  readStorehouseCategoryCounts,
} from '@/lib/storehouseCatalogServer';
import {
  readStorehouseProductFeedCategories,
  readStorehouseProductFeedCategoryDeletionState,
} from '@/lib/storehouseProductFeedCategoriesServer';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { readStorehouseMix } from '@/lib/storehouseMixServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function buildCatalogIndex() {
  const categories = readStorehouseProductFeedCategories();
  let categoryCounts: Record<string, number> = {};
  let catalogAvailable = true;
  try {
    categoryCounts = await readStorehouseCategoryCounts();
  } catch {
    // Category definitions are stored separately from product rows; keep them visible if PostgreSQL is temporarily unavailable.
    catalogAvailable = false;
  }
  return {
    success: true,
    categoryCounts,
    categories,
    ...readStorehouseProductFeedCategoryDeletionState(),
    totalCount: Object.values(categoryCounts).reduce((sum, count) => sum + count, 0),
    catalogAvailable,
  };
}

function hasSellerSession(request: Request): boolean {
  return Boolean(getRequestSellerEmail(request));
}

export async function POST(request: Request) {
  if (!hasSellerSession(request)) {
    return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  }

  if (new URL(request.url).searchParams.get('view') === 'mixed') {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid catalog filters.' }, { status: 400 });
    }
    try {
      return NextResponse.json(
        { success: true, ...await readStorehouseMix(body) },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {
      return NextResponse.json(
        { success: false, error: 'Storehouse products are temporarily unavailable. Please try again.' },
        { status: 503 },
      );
    }
  }

  try {
    return NextResponse.json(await buildCatalogIndex(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Storehouse catalog counts could not be loaded.' },
      { status: 503 }
    );
  }
}

export async function GET(request: Request) {
  if (!hasSellerSession(request)) {
    return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  }

  const categorySlug = new URL(request.url).searchParams.get('category')?.trim() || '';

  try {
    if (!categorySlug) {
      return NextResponse.json(await buildCatalogIndex(), { headers: { 'Cache-Control': 'no-store' } });
    }
    if (!isStorehouseFeedCategory(categorySlug)) {
      return NextResponse.json({ success: false, error: 'Choose a Storehouse category.' }, { status: 400 });
    }

    const products = await readStorehouseCategory(categorySlug);
    return NextResponse.json(
      { success: true, products, totalCount: products.length, currency: 'USD', catalogSource: 'shared-storehouse' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'The Storehouse products could not be loaded.' },
      { status: 503 }
    );
  }
}
