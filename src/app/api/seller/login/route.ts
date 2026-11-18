import { NextResponse } from 'next/server';
import { authenticateSellerServer } from '@/lib/inviteCodesServer';
import { setSellerSessionCookie } from '@/lib/sellerSession';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { success: false, error: 'Email address is required to sign in.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required to sign in.' },
        { status: 400 }
      );
    }

    const auth = await authenticateSellerServer(email, password);

    if (!auth.success || !auth.seller) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed. Please check your credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Signed in successfully! Opening Wholesale Dashboard...',
        seller: auth.seller,
      },
      { status: 200 }
    );

    setSellerSessionCookie(response, auth.seller.email);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error during sign in.' },
      { status: 500 }
    );
  }
}
