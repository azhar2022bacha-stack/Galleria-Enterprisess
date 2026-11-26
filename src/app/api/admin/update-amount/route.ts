import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { addSellerWalletAdjustment, availableSellerWalletCents, findSellerWalletAdjustment } from '@/lib/sellerWalletAdjustmentsServer';

export async function POST(request: Request) {
  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
  const data = await request.json().catch(() => null);
  const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
  const cents = data?.amountCents;
  if (!email || !Number.isSafeInteger(cents) || !cents || Math.abs(cents) > 1_000_000_000 ||
      typeof data?.reference !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.reference)) {
    return NextResponse.json({ error: 'Select a seller and a valid amount.' }, { status: 400 });
  }
  try {
    if (!await getSellerByEmailServer(email)) return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
    const balance = availableSellerWalletCents(email);
    const dedupeKey = 'admin-update-amount:' + data.reference;
    const existing = findSellerWalletAdjustment(email, dedupeKey);
    if (existing) {
      if (Math.round(existing.amount * 100) !== cents) return NextResponse.json({ error: 'This reference already has a different amount.' }, { status: 409 });
      return NextResponse.json({ balanceCents: Math.max(0, balance), reference: existing.id });
    }
    const updated = balance + cents;
    if (cents < 0 && updated < 0) return NextResponse.json({ error: 'Insufficient wallet balance.', balanceCents: Math.max(0, balance) }, { status: 409 });
    if (!Number.isSafeInteger(updated)) return NextResponse.json({ error: 'Amount exceeds the supported wallet balance.' }, { status: 400 });
    const { adjustment } = addSellerWalletAdjustment({
      sellerEmail: email, amountCents: cents, eventType: 'manual-adjustment', dedupeKey,
      reason: cents > 0 ? 'Admin wallet credit' : 'Admin wallet deduction',
    });
    return NextResponse.json({ balanceCents: Math.max(0, updated), reference: adjustment.id });
  } catch {
    return NextResponse.json({ error: 'Unable to confirm the update. Retry the same adjustment.' }, { status: 500 });
  }
}
