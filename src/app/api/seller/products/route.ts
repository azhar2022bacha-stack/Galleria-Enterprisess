import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import {
  getSellerProductsByEmail,
  saveSellerProductsByEmail,
  readAllSellerProductsMap,
} from '@/lib/sellerProductsServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const admin = await getRequestAdmin(request);
    if (!email && !admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });

    if (email) {
      if (!admin) {
        const normalizedSessionEmail = getRequestSellerEmail(request);
        if (!normalizedSessionEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
        if (normalizedSessionEmail !== email.trim().toLowerCase()) return NextResponse.json({ success: false, error: 'You can only view your own products.' }, { status: 403 });
      }
      const allMap = readAllSellerProductsMap();
      const normalizedEmail = email.trim().toLowerCase();
      const products = getSellerProductsByEmail(email, allMap);
      return NextResponse.json({
        success: true,
        email,
        products,
        count: products.length,
        authoritative: Object.prototype.hasOwnProperty.call(allMap, normalizedEmail),
      });
    }

    const allMap = readAllSellerProductsMap();
    return NextResponse.json({
      success: true,
      data: allMap,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch seller products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, products } = body;
    const admin = await getRequestAdmin(request);
    if (!admin) {
      const normalizedSessionEmail = getRequestSellerEmail(request);
      if (!normalizedSessionEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
      if (normalizedSessionEmail !== String(email || '').trim().toLowerCase()) return NextResponse.json({ success: false, error: 'You can only update products for your seller account.' }, { status: 403 });
    }

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'products must be an array' },
        { status: 400 }
      );
    }

    const targetEmail = (email || 'default').trim();
    const result = saveSellerProductsByEmail(targetEmail, products);

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${result.count} products for ${targetEmail}`,
      count: result.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save seller products' },
      { status: 500 }
    );
  }
}
