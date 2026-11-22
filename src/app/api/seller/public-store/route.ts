import { createHash } from 'node:crypto';
import { recordStoreVisit } from '@/lib/storeExposureServer';
import { NextResponse } from 'next/server';
import { getSellerPublicStoreByEmail, getSellerPublicStoreBySlug } from '@/lib/sellerPublicStoreServer';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const ownerLinkOnly = searchParams.get('ownerLink') === '1';

  try {
    if (!slug) {
    const email = getRequestSellerEmail(request);
      if (!email) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
      const result = await getSellerPublicStoreByEmail(email);
      if (!result) return NextResponse.json({ success: false, error: 'Seller store could not be found.' }, { status: 404 });
      return NextResponse.json(
        { success: true, store: result.store, ...(ownerLinkOnly ? {} : { products: result.products }) },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const result = await getSellerPublicStoreBySlug(slug);
    if (!result) return NextResponse.json({ success: false, error: 'This seller store could not be found.' }, { status: 404 });
    const response = NextResponse.json(
      { success: true, store: result.store, products: result.products },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
    if (searchParams.get('visit') === '1' && getRequestSellerEmail(request) !== result.sellerEmail) {
      const storeKey = createHash('sha256').update(result.sellerEmail).digest('hex').slice(0, 16);
      const cookie = 'store_visit_' + storeKey;
      const recorded = request.headers.get('cookie')?.split(';').some((part) => part.trim() === cookie + '=1');
      if (!recorded) {
        try {
          recordStoreVisit(result.sellerEmail);
          response.cookies.set(cookie, '1', {
            maxAge: 86_400, path: '/api/seller/public-store', httpOnly: true, sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
        } catch (error) {
          console.error('Could not record storefront visit:', error);
        }
      }
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to load this seller store.' },
      { status: 500 }
    );
  }
}
