import { NextResponse } from 'next/server';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { submitWithdrawal, WithdrawalError } from '@/lib/sellerWalletAdjustmentsServer';

export async function POST(request: Request) {
  const email = getRequestSellerEmail(request);
  if (!email) return NextResponse.json({error:'Sign in to submit a withdrawal.'},{status:401});
  const body = await request.json().catch(()=>null);
  try {
    submitWithdrawal(email, String(body?.id || ''), body?.cents, String(body?.method || '').trim(), String(body?.address || '').trim());
    return NextResponse.json({success:true});
  } catch (err) {
    return NextResponse.json({error:err instanceof WithdrawalError ? err.message : 'Could not submit withdrawal.'},{status:err instanceof WithdrawalError ? 409 : 500});
  }
}
