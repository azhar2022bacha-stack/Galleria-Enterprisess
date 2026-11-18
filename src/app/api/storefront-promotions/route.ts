import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { normalizePromotion, calculatePromotion, readStorefrontPromotions, writeStorefrontPromotions } from '@/lib/storefrontPromotionsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('scope') !== 'admin') return NextResponse.json({ success: false, error: 'Choose an authenticated promotion scope.' }, { status: 400 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  return NextResponse.json({ success: true, promotions: readStorefrontPromotions() });
}

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid promotion request.' }, { status: 400 }); }
  if (body?.action === 'validate') {
    const result = calculatePromotion(body.code, body.email, body.subtotal);
    if ('error' in result) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, promotion: result });
  }
  if (!await getRequestAdmin(request)) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  const normalized = normalizePromotion(body);
  if (!normalized.promotion) return NextResponse.json({ success: false, error: normalized.error }, { status: 400 });
  const promotions = readStorefrontPromotions();
  if (promotions.some((promotion) => promotion.code === normalized.promotion!.code)) return NextResponse.json({ success: false, error: 'A promotion with this code already exists.' }, { status: 409 });
  promotions.unshift(normalized.promotion);
  writeStorefrontPromotions(promotions);
  return NextResponse.json({ success: true, promotion: normalized.promotion }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid promotion data.' }, { status: 400 }); }
  const promotions = readStorefrontPromotions();
  const index = promotions.findIndex((promotion) => promotion.id === String(body?.id || ''));
  if (index < 0) return NextResponse.json({ success: false, error: 'Promotion not found.' }, { status: 404 });
  const normalized = normalizePromotion({ ...body, createdAt: promotions[index].createdAt }, promotions[index].id);
  if (!normalized.promotion) return NextResponse.json({ success: false, error: normalized.error }, { status: 400 });
  if (promotions.some((promotion) => promotion.id !== body.id && promotion.code === normalized.promotion!.code)) return NextResponse.json({ success: false, error: 'A promotion with this code already exists.' }, { status: 409 });
  promotions[index] = normalized.promotion;
  writeStorefrontPromotions(promotions);
  return NextResponse.json({ success: true, promotion: normalized.promotion });
}

export async function DELETE(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const promotions = readStorefrontPromotions();
  if (!promotions.some((promotion) => promotion.id === id)) return NextResponse.json({ success: false, error: 'Promotion not found.' }, { status: 404 });
  writeStorefrontPromotions(promotions.filter((promotion) => promotion.id !== id));
  return NextResponse.json({ success: true });
}
