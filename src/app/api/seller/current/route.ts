import { NextResponse } from 'next/server';
import { readStoreExposure } from '@/lib/storeExposureServer';
import { getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { hasViewedSellerApproval, recordSellerApprovalView } from '@/lib/sellerShopSettingsServer';
import { readStorefrontOrders } from '@/lib/storefrontOrdersServer';
import { readSellerWalletAdjustments, sellerWalletAdjustmentCents } from '@/lib/sellerWalletAdjustmentsServer';

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
    const guaranteeAdjustments = readSellerWalletAdjustments(sessionEmail).filter((adjustment) => adjustment.accountType === 'guarantee');

    let retailSalesCents = 0;
    for (const order of readStorefrontOrders()) {
      if (order.orderStatus === 'CANCELLED' || order.status === 'cancelled' || order.paymentStatus === 'FAILED') continue;
      const paidSale = order.paymentStatus === 'PAID'
        || (order.paymentMethod === 'Cash on Delivery' && order.orderStatus === 'DELIVERED');
      if (!paidSale) continue;

      for (const item of order.items) {
        if (item.sellerEmail !== sessionEmail) continue;
        const subtotal = Math.round(item.price * item.quantity * 100);
        if (Number.isSafeInteger(subtotal) && subtotal > 0) retailSalesCents += subtotal;
      }
    }

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
          approvalViewed: hasViewedSellerApproval(sessionEmail),
          grantedFunds: Math.max(0, sellerWalletAdjustmentCents(guaranteeAdjustments)) / 100,
          retailGrossSales: retailSalesCents / 100,
          storeTraffic: readStoreExposure(sessionEmail),
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

export async function PATCH(request: Request) {
  const sellerEmail = getRequestSellerEmail(request);
  if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.action !== 'view-approval') {
    return NextResponse.json({ success: false, error: 'Choose a valid profile action.' }, { status: 400 });
  }

  try {
    const seller = await getSellerByEmailServer(sellerEmail);
    if (seller?.status !== 'approved' || seller.idStatus !== 'Verified') {
      return NextResponse.json({ success: false, error: 'This seller account has not been approved.' }, { status: 409 });
    }
    if (hasViewedSellerApproval(sellerEmail) || recordSellerApprovalView(sellerEmail)) {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Could not save seller approval view:', error);
  }
  return NextResponse.json({ success: false, error: 'Could not save your approval status view.' }, { status: 500 });
}
