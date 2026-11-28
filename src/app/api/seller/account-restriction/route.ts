import { NextResponse } from 'next/server';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { getSellerAccountSuspension } from '@/lib/sellerAccountRestrictionsServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const email = getRequestSellerEmail(request, { allowSuspended: true });
  if (!email) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });

  return NextResponse.json({
    success: true,
    suspension: getSellerAccountSuspension(email),
  }, { headers: { 'Cache-Control': 'no-store, private' } });
}
