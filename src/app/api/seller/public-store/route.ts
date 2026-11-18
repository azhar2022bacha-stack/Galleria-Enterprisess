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
    return NextResponse.json(
      { success: true, store: result.store, products: result.products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to load this seller store.' },
      { status: 500 }
    );
  }
}
