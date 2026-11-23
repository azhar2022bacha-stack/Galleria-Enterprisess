import { NextResponse } from 'next/server';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { purchaseSellerPackage } from '@/lib/sellerWalletAdjustmentsServer';

export async function POST(request: Request) {
  const email = getRequestSellerEmail(request);
  if (!email) return NextResponse.json({ success: false, error: 'Seller sign-in required.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  try {
    const result = purchaseSellerPackage(email, body?.tierId, body?.walletCents);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const expected = ['Insufficient confirmed wallet funds.', 'Select a higher package.'].includes(message);
    return NextResponse.json({ success: false, error: expected ? message : 'Package purchase could not be confirmed.' }, { status: expected ? 409 : 500 });
  }
}
