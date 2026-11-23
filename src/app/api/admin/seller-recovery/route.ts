import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getAllSellersServer, getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { issueRecovery, recoveredAccount, RecoveryError } from '@/lib/sellerRecoveryServer';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(req: Request) {
  if (!await getRequestAdmin(req)) return NextResponse.json({}, { status: 401 });
  const sellers = (await getAllSellersServer({ summary: true })).map(({id, shopName, email}) => ({id, shopName, email}));
  return NextResponse.json({ sellers }, { headers });
}
export async function POST(req: Request) {
  if (!await getRequestAdmin(req)) return NextResponse.json({}, { status: 401 });
  const body = await req.json().catch(() => null);
  const account = String(body?.account || '').trim().toLowerCase();
  if (!account || !await getSellerByEmailServer(account)) return NextResponse.json({error:'Select an existing seller.'}, {status:400});
  try {
    const email = String(body.email || '').trim().toLowerCase();
    if (body.action !== 'issue' || email.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email))
      throw new RecoveryError('Enter the new sign-in email for this seller.');
    const owner = recoveredAccount(email);
    if ((owner && owner !== account) || (email !== account && await getSellerByEmailServer(email)))
      throw new RecoveryError('That sign-in email is already in use.');
    return NextResponse.json({token:issueRecovery(account, email), email}, {headers});
  } catch (err) { return NextResponse.json({error:err instanceof RecoveryError ? err.message : 'Recovery is temporarily unavailable.'}, {status:409, headers}); }
}
