import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import {
  getAllSellersServer,
  getConsignMerchantDirectory,
  updateSellerStatusServer,
  createAdminSellerServer,
} from '@/lib/inviteCodesServer';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';

export async function GET(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
    const merchantView = new URL(request.url).searchParams.get('view') === 'merchants';
    const sellers = merchantView ? await getConsignMerchantDirectory() : await getAllSellersServer();
    const rechargeFile=path.join(process.cwd(),'src/data/wallet_recharges.json');
    const recharges=fs.existsSync(rechargeFile)?JSON.parse(fs.readFileSync(rechargeFile,'utf8')):[];
    const adjustmentFile=path.join(process.cwd(),'src/data/seller_wallet_adjustments.json');
    const adjustments=fs.existsSync(adjustmentFile)?JSON.parse(fs.readFileSync(adjustmentFile,'utf8')):[];
    if (merchantView) {
      const credits = new Map<string, number>();
      const addCredit = (email: unknown, amount: number) => {
        if (typeof email !== 'string' || !Number.isFinite(amount)) return;
        const key = email.trim().toLowerCase();
        credits.set(key, (credits.get(key) ?? 0) + amount);
      };
      for (const row of recharges) {
        if (row.status === 'Confirmed') addCredit(row.handle, Math.round(Number(row.creditedAmount ?? row.amount) * 100));
      }
      for (const row of adjustments) {
        if (row.accountType === 'wallet') addCredit(row.sellerEmail, Math.round(Number(row.amount) * 100));
      }
      const merchants = sellers.map((seller) => ({
        ...seller, balance: Math.max(0, credits.get(seller.email) ?? 0) / 100,
      }));
      return NextResponse.json({ success: true, merchants }, { headers: { 'Cache-Control': 'no-store, private' } });
    }
    const owners=sellers.map((seller:any)=>{
      const approved=recharges.filter((r:any)=>r.status==='Confirmed'&&r.handle?.toLowerCase()===seller.email?.toLowerCase());
      const sellerAdjustments=adjustments.filter((a:any)=>a.sellerEmail?.toLowerCase()===seller.email?.toLowerCase());
      const rechargeCredit=approved.reduce((sum:number,r:any)=>sum+Math.round((r.creditedAmount??r.amount)*100),0)/100;
      const walletAdjustments=sellerAdjustments.filter((a:any)=>a.accountType==='wallet').reduce((sum:number,a:any)=>sum+Number(a.amount||0),0);
      const guaranteeAdjustments=sellerAdjustments.filter((a:any)=>a.accountType==='guarantee').reduce((sum:number,a:any)=>sum+Number(a.amount||0),0);
      const credit=Math.max(0,Math.round((rechargeCredit+walletAdjustments)*100)/100);
      const guarantee=Math.max(0,Math.round(((seller.balances?.guarantee||0)+guaranteeAdjustments)*100)/100);
      return {...seller,usdBalance:credit,usdtBalance:credit,balances:{...seller.balances,wallet:credit,guarantee}};
    });
    return NextResponse.json({
      success: true,
      owners,
      total: owners.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch owners directory' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
    const body = await request.json();
    const { id, email, status } = body;

    const identifier = email || id;
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Email or ID is required to update seller status' },
        { status: 400 }
      );
    }

    if (!['approved', 'review', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'approved', 'review', or 'suspended'" },
        { status: 400 }
      );
    }

    const sellers = await getAllSellersServer();
    const target = sellers.find((seller: any) =>
      email
        ? String(seller.email || '').toLowerCase() === String(email).toLowerCase()
        : String(seller.id || '') === String(id)
    );
    await updateSellerStatusServer(identifier, status);
    const targetEmail = String(email || target?.email || '').trim().toLowerCase();
    if (targetEmail && target?.status !== status) {
      try {
        const shopName = String(target?.name || target?.shopName || 'Your shop');
        const isApproved = status === 'approved';
        const isSuspended = status === 'suspended';
        createSellerNotificationServer({
          sellerEmail: targetEmail,
          category: 'Account & Verification',
          title: isApproved
            ? target?.status === 'suspended' ? 'Your seller account is active again' : 'Your seller account has been approved'
            : isSuspended ? 'Action needed: your seller account is restricted' : 'Your seller account is under review',
          message: isApproved
            ? [
                { text: `${shopName} has been approved. ` },
                { text: 'You can now access your seller account', emphasis: 'blue' },
                { text: ' and continue selling.' },
              ]
            : isSuspended
              ? [
                  { text: `${shopName} has been temporarily suspended. `, emphasis: 'red' },
                  { text: 'Please contact Galleria Enterprises, Inc. Support if you need help restoring access.', emphasis: 'red' },
                ]
              : [
                  { text: `The review of ${shopName} has started. ` },
                  { text: 'Your account is under review', emphasis: 'blue' },
                  { text: '. We’ll post any updates here.' },
                ],
          tone: isApproved ? 'success' : isSuspended ? 'rejection' : 'info',
          href: '/seller/dashboard?tab=notifications',
          dedupeKey: `seller-account-status:${targetEmail}:${status}:${new Date().toISOString()}`,
        });
      } catch (notificationError) {
        console.error('Unable to create seller status notification:', notificationError);
      }
    }
    return NextResponse.json({
      success: true,
      message: `Seller status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update seller status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
    const body = await request.json();
    const { fullName, email, shopName, phone, packageTier, productLimit, profitMargin, status } =
      body;

    if (!fullName || !email || !shopName) {
      return NextResponse.json(
        { success: false, error: 'Full Name, Email, and Shop Name are required' },
        { status: 400 }
      );
    }

    const newOwner = await createAdminSellerServer({
      fullName,
      email,
      shopName,
      phone,
      packageTier,
      productLimit,
      profitMargin,
      status,
    });

    try {
      createSellerNotificationServer({
        sellerEmail: newOwner.email,
        category: 'Account & Verification',
        title: newOwner.status === 'approved' ? 'Your seller account has been approved' : 'Seller account review started',
        message: newOwner.status === 'approved'
          ? [
              { text: `Your shop, ${newOwner.name}, has been created and approved. ` },
              { text: 'You can sign in to your seller account', emphasis: 'blue' },
              { text: ' to get started.' },
            ]
          : [
              { text: `Your shop, ${newOwner.name}, has been created. ` },
              { text: 'Your account is under review', emphasis: 'blue' },
              { text: '. We’ll post the decision here.' },
            ],
        tone: newOwner.status === 'approved' ? 'success' : 'info',
        href: '/seller/dashboard?tab=notifications',
        dedupeKey: `admin-created-seller:${newOwner.email.toLowerCase()}`,
      });
    } catch (notificationError) {
      console.error('Unable to create new seller notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: `Shop "${newOwner.name}" successfully created and registered.`,
      seller: newOwner,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create seller' },
      { status: 500 }
    );
  }
}
