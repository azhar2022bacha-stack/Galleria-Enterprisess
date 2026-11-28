import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getAllSellersServer } from '@/lib/inviteCodesServer';
import {
  getSellerAccountSuspension,
  restoreSellerAccount,
  suspendSellerAccount,
} from '@/lib/sellerAccountRestrictionsServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
    }

    const sellers = await getAllSellersServer({ summary: true });
    return NextResponse.json({
      success: true,
      sellers: sellers.map((seller) => ({
        email: seller.email,
        name: seller.name || seller.shopName || seller.email,
        fullName: seller.fullName || seller.subtitle || '',
        suspension: getSellerAccountSuspension(seller.email),
      })),
    }, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not load seller accounts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const action = String(body?.action || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Choose a valid seller account.' }, { status: 400 });
    }

    const sellers = await getAllSellersServer({ summary: true });
    if (!sellers.some((seller) => seller.email.trim().toLowerCase() === email)) {
      return NextResponse.json({ success: false, error: 'That seller account was not found.' }, { status: 404 });
    }

    if (action === 'suspend') {
      const reason = String(body?.reason || '').trim();
      const suspension = suspendSellerAccount(email, reason);
      return NextResponse.json({ success: true, email, suspension });
    }

    if (action === 'restore') {
      restoreSellerAccount(email);
      return NextResponse.json({ success: true, email, suspension: null });
    }

    return NextResponse.json({ success: false, error: 'Choose Suspend or Restore.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not update this seller account.' }, { status: 400 });
  }
}
