import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { initDb } from '@/lib/db';
import { readConsignCatalog } from '@/lib/consignCatalogServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }
  const headers = { 'Cache-Control': 'no-store' };
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ success: true, products: [], categories: [], totalCount: 0 }, { headers });
  }

  const params = new URL(request.url).searchParams;
  const category = (params.get('category') || '').trim().slice(0, 160);
  const search = (params.get('search') || '').trim().slice(0, 160);
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1_000_000) : 1;

  try {
    if (!(await initDb())) throw new Error('Consign catalog database unavailable.');
    return NextResponse.json({ success: true, ...await readConsignCatalog(category, search, page) }, { headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Consign products could not be loaded. Please try again.' }, { status: 503, headers });
  }
}
