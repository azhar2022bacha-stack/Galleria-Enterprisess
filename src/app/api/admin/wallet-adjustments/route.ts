import { NextResponse } from 'next/server';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import {
  addSellerWalletAdjustment,
  findSellerWalletAdjustment,
  readSellerWalletAdjustments,
  type SellerWalletAdjustmentEvent,
} from '@/lib/sellerWalletAdjustmentsServer';

export const dynamic = 'force-dynamic';

function getSellerSessionEmail(request: Request): string {
  return getRequestSellerEmail(request);
}

const money = (amount: number) => `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function GET(request: Request) {
  const requestedEmail = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  const sessionEmail = getSellerSessionEmail(request);
  if (!sessionEmail) return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
  if (requestedEmail && requestedEmail !== sessionEmail) {
    return NextResponse.json({ error: 'You can only view adjustments for your seller account.' }, { status: 403 });
  }
  const email = sessionEmail;
  return NextResponse.json({ adjustments: readSellerWalletAdjustments(email) });
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
    const body = await request.json();
    const sellerEmail = String(body.sellerEmail || '').trim().toLowerCase();
    const accountType = body.accountType === 'guarantee' ? 'guarantee' : 'wallet';
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const reason = String(body.reason || (body.eventType === 'commission-payout' ? 'Commission payout' : 'Admin adjustment')).trim().slice(0, 500);
    const eventType: SellerWalletAdjustmentEvent = body.eventType === 'commission-payout'
      ? 'commission-payout'
      : body.eventType === 'withdrawal-refund'
        ? 'withdrawal-refund'
        : 'manual-adjustment';
    const dedupeKey = String(body.dedupeKey || '').slice(0, 200) || undefined;

    if (!sellerEmail || !Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10000000) {
      return NextResponse.json({ error: 'A seller and a valid non-zero adjustment amount are required.' }, { status: 400 });
    }

    if (dedupeKey) {
      const existing = findSellerWalletAdjustment(sellerEmail, dedupeKey);
      if (existing) return NextResponse.json({ success: true, adjustment: existing, duplicate: true });
    }

    const { adjustment } = addSellerWalletAdjustment({
      sellerEmail,
      accountType,
      amountCents: Math.round(amount * 100),
      reason,
      dedupeKey: dedupeKey || `wallet-adjustment:${Date.now()}`,
      eventType,
    });

    const isCommissionPayout = eventType === 'commission-payout';
    const isWithdrawalRefund = eventType === 'withdrawal-refund';
    const isNegative = amount < 0;
    const accountLabel = accountType === 'wallet' ? 'wallet' : 'guarantee balance';
    try {
      createSellerNotificationServer({
        sellerEmail,
        category: isCommissionPayout ? 'Earnings & Settlements' : 'Wallet & Payments',
        title: isCommissionPayout
          ? 'Your commission payout has been released'
          : isWithdrawalRefund
            ? 'Withdrawal request rejected and funds returned'
            : `Your ${accountLabel} was adjusted`,
        message: isCommissionPayout
          ? [
              { text: 'A commission payout of ' },
              { text: money(amount), emphasis: 'blue' },
              { text: ` has been credited to your wallet. ${reason ? `Details: ${reason}. ` : ''}Open Wallet to see the updated balance and transaction.` },
            ]
          : isWithdrawalRefund
            ? [
                { text: `Your withdrawal request was not approved. `, emphasis: 'red' },
                { text: money(amount), emphasis: 'red' },
                { text: ` has been returned to your wallet. Reason: ${reason}. Open Wallet to see the updated balance.`, emphasis: 'red' },
              ]
            : [
              { text: `Galleria Enterprises, Inc. ${isNegative ? 'deducted ' : 'added '}` },
              { text: money(amount), emphasis: isNegative ? 'red' : 'blue' },
              { text: ` ${isNegative ? 'from' : 'to'} your ${accountLabel}. Reason: ${reason}.` },
            ],
        tone: isCommissionPayout ? 'success' : isWithdrawalRefund ? 'rejection' : isNegative ? 'warning' : 'success',
        href: isCommissionPayout || accountType === 'wallet' ? '/seller/dashboard?tab=wallet' : '/seller/dashboard?tab=notifications',
        dedupeKey: dedupeKey ? `wallet-adjustment:${dedupeKey}` : `wallet-adjustment:${adjustment.id}`,
      });
    } catch (notificationError) {
      console.error('Unable to create wallet adjustment notification:', notificationError);
    }

    return NextResponse.json({ success: true, adjustment });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to save wallet adjustment.' }, { status: 400 });
  }
}
