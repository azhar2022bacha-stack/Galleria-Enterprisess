import { NextResponse } from 'next/server';
import { getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionEmail = getRequestSellerEmail(request);
    const emailParam = (searchParams.get('email') || '').trim().toLowerCase();
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
    }
    if (emailParam && emailParam !== sessionEmail) {
      return NextResponse.json({ success: false, error: 'You can only view your own seller account.' }, { status: 403 });
    }

    const seller = await getSellerByEmailServer(sessionEmail);

    if (!seller) {
      return NextResponse.json(
        {
          success: false,
          message: 'No registered seller found for this account',
          seller: null,
        },
        { status: 200 }
      );
    }

    const isApproved = seller.status === 'approved' && seller.idStatus === 'Verified';

    return NextResponse.json(
      {
        success: true,
        seller: {
          fullName: seller.fullName,
          email: seller.email,
          shopName: seller.shopName,
          inviteCode: seller.inviteCode,
          status: seller.status || 'review',
          idStatus: seller.idStatus || 'No ID uploaded',
          isApproved,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
