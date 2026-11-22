import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getConsignMerchantDirectory, getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { changeStoreExposure, readStoreExposure } from '@/lib/storeExposureServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
  const email = new URL(request.url).searchParams.get('email');
  if (email) return NextResponse.json(readStoreExposure(email));
  const sellers = (await getConsignMerchantDirectory()).map(({ email, name }) => ({ email, name }));
  return NextResponse.json({ sellers });
}

export async function POST(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const { action, amount = 0, intervalMinutes = 0 } = body ?? {};
  if (action !== 'add' && action !== 'reduce' && action !== 'clear' && action !== 'schedule' && action !== 'stop') {
    return NextResponse.json({ error: 'Choose a valid action.' }, { status: 400 });
  }
  if ((action === 'add' || action === 'reduce' || action === 'schedule') &&
      (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000)) {
    return NextResponse.json({ error: 'Enter a whole number between 1 and 100,000.' }, { status: 400 });
  }
  if (action === 'schedule' && intervalMinutes !== 10 && intervalMinutes !== 15) {
    return NextResponse.json({ error: 'Choose a 10 or 15 minute interval.' }, { status: 400 });
  }
  if (!email || !await getSellerByEmailServer(email)) return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
  return NextResponse.json(changeStoreExposure(email, action, amount, intervalMinutes));
}
