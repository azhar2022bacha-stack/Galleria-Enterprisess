import { NextResponse } from 'next/server';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { readSellerWalletAdjustments } from '@/lib/sellerWalletAdjustmentsServer';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const sellerEmail = getRequestSellerEmail(request);
  if (!sellerEmail) {
    return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
  }
  const requestedEmail = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  if (requestedEmail && requestedEmail !== sellerEmail) {
    return NextResponse.json({ error: 'You can only view adjustments for your seller account.' }, { status: 403 });
  }
  const adjustments = readSellerWalletAdjustments(sellerEmail).filter((adjustment) => adjustment.accountType === 'wallet');
  return NextResponse.json({ adjustments }, { headers: { 'Cache-Control': 'no-store, private' } });
}
