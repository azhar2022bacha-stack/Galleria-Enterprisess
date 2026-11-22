import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getAllSellersServer, getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { addSellerWalletAdjustment, findSellerWalletAdjustment } from '@/lib/sellerWalletAdjustmentsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) {
    return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
  }
  const accounts = await getAllSellersServer({ summary: true });
  const sellers = accounts
    .filter(({ status, idStatus, email }) => status === 'approved' && idStatus === 'Verified' && email?.trim())
    .map(({ email, shopName, fullName }) => ({
      email: email.trim().toLowerCase(),
      name: shopName || fullName || email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
  return NextResponse.json({ sellers });
}

export async function POST(request: Request) {
  if (!await getRequestAdmin(request)) {
    return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const { amountCents, paymentId } = body ?? {};

  if (!email || !Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 1_000_000_000) {
    return NextResponse.json({ error: 'Select a seller and enter an amount from $0.01 to $10,000,000.' }, { status: 400 });
  }
  if (typeof paymentId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(paymentId)) {
    return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 });
  }

  const dedupeKey = 'manual-payment:' + paymentId;
  try {
    let adjustment = findSellerWalletAdjustment(email, dedupeKey);
    if (!adjustment) {
      const seller = await getSellerByEmailServer(email);
      if (!seller?.isApproved) {
        return NextResponse.json({ error: 'Only verified sellers can receive manual payments.' }, { status: 400 });
      }
      ({ adjustment } = addSellerWalletAdjustment({
        sellerEmail: email,
        accountType: 'wallet',
        amountCents,
        reason: 'Manual payment',
        eventType: 'manual-adjustment',
        dedupeKey,
      }));
    }
    if (Math.round(adjustment.amount * 100) !== amountCents) {
      return NextResponse.json({ error: 'This payment reference was already used for a different amount.' }, { status: 409 });
    }
    return NextResponse.json({ reference: adjustment.id, amount: adjustment.amount });
  } catch (error) {
    console.error('Unable to save manual payment:', error);
    return NextResponse.json({ error: 'Unable to confirm the payment. Retry using the same confirmation.' }, { status: 500 });
  }
}
