import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getAllSellersServer, getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { issueRecovery, issueVerification, pendingEmail, RecoveryError } from '@/lib/sellerRecoveryServer';
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
    if (body.action === 'pending') return NextResponse.json({email: pendingEmail(account) || ''}, {headers});
    if (body.action === 'verify') return NextResponse.json(issueVerification(account), {headers});
    if (body.action === 'issue') return NextResponse.json({token:issueRecovery(account)}, {headers});
    return NextResponse.json({error:'Unknown action.'},{status:400});
  } catch (err) { return NextResponse.json({error:err instanceof RecoveryError ? err.message : 'Recovery is temporarily unavailable.'}, {status:409, headers}); }
}
