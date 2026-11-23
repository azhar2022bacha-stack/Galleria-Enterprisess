export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { readSellerWalletAdjustments, reviewWithdrawal, WithdrawalError } from '@/lib/sellerWalletAdjustmentsServer';

export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({}, {status:401});
  return NextResponse.json({withdrawals:readSellerWalletAdjustments().filter(row=>row.eventType === 'withdrawal-request')},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({}, {status:401});
  const body = await request.json().catch(()=>null);
  if (!body || !['completed','rejected'].includes(body.status)) return NextResponse.json({error:'Invalid review.'},{status:400});
  try {
    reviewWithdrawal(body.id, body.status, String(body.reason || '').trim());
    return NextResponse.json({success:true});
  } catch(err) {
    return NextResponse.json({error:err instanceof WithdrawalError ? err.message : 'Could not review withdrawal.'},{status:err instanceof WithdrawalError ? 409 : 500});
  }
}
