import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { SELLER_CRYPTO_DEPOSIT_NETWORKS } from '@/lib/cryptoReceivingAddresses';
import { getSellerCryptoReceivingAddresses, readCryptoReceivingAddressConfig } from '@/lib/cryptoReceivingAddressesServer';

export const dynamic = 'force-dynamic';

const file = path.join(process.cwd(), 'src/data/wallet_recharges.json');

function read(): any[] {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  } catch {
    return [];
  }
}

function write(rows: any[]): void {
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(rows, null, 2));
  fs.renameSync(`${file}.tmp`, file);
}

function money(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tryNotify(input: Parameters<typeof createSellerNotificationServer>[0]): void {
  try {
    createSellerNotificationServer(input);
  } catch (error) {
    console.error('Unable to create wallet recharge notification:', error);
  }
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get('email')?.trim().toLowerCase();
  const admin = await getRequestAdmin(req);
  if (!email && !admin) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
  if (email && !admin) {
    const normalizedSessionEmail = getRequestSellerEmail(req);
    if (!normalizedSessionEmail) return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
    if (normalizedSessionEmail !== email) return NextResponse.json({ error: 'You can only view your own wallet recharges.' }, { status: 403 });
  }
  const data = { recharges: read().filter((row) => !email || row.handle === email) };
  const etag = '"' + createHash('sha256').update(JSON.stringify(data)).digest('hex') + '"';
  const headers = { 'Cache-Control': 'no-store, private', ETag: etag };
  if (req.headers.get('if-none-match') === etag) return new NextResponse(null, {status:304, headers});
  return NextResponse.json(data, { headers });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = await getRequestAdmin(req);
    if (body.action === 'review') {
      if (!admin) return NextResponse.json({ error: 'Admin sign-in is required to review recharges.' }, { status: 401 });
    } else {
      const normalizedSessionEmail = getRequestSellerEmail(req);
      if (!normalizedSessionEmail || normalizedSessionEmail !== String(body.email || '').trim().toLowerCase()) {
        return NextResponse.json({ error: 'Sign in to the matching seller account before submitting a recharge.' }, { status: 401 });
      }
    }
    const rows = read();

    if (body.action === 'review') {
      const item = rows.find((row) => row.id === body.id);
      if (!item || item.status !== 'Pending' || !['Confirmed', 'Rejected'].includes(body.status)) {
        throw new Error('This recharge cannot be updated.');
      }

      const requestedAmount = Number(item.amount);
      if (body.status === 'Confirmed') {
        const creditedAmount = body.creditedAmount === undefined ? requestedAmount : Number(body.creditedAmount);
        if (!Number.isFinite(creditedAmount) || creditedAmount <= 0) throw new Error('Invalid credited USD amount.');
        item.creditedAmount = Math.round(creditedAmount * 100) / 100;
      }
      item.status = body.status;
      item.reviewedAt = new Date().toISOString();
      item.reviewReason = body.status === 'Rejected'
        ? String(body.reason || 'We could not verify the payment from the information provided. Please review your receipt and transaction details before submitting again.').trim().slice(0, 1000)
        : '';
      write(rows);

      if (body.status === 'Confirmed') {
        const creditedAmount = Number(item.creditedAmount ?? requestedAmount);
        const amountMatches = Math.round(creditedAmount * 100) === Math.round(requestedAmount * 100);
        tryNotify({
          sellerEmail: item.handle,
          category: 'Wallet & Payments',
          title: amountMatches ? 'Deposit approved and added to your wallet' : 'Deposit approved with an adjusted credit amount',
          message: amountMatches
            ? [
                { text: 'Your deposit of ' },
                { text: money(creditedAmount), emphasis: 'blue' },
                { text: ` via ${item.network || item.coin || 'your selected payment method'} has been approved and credited to your wallet. Open the Wallet section to see the updated balance.` },
              ]
            : [
                { text: `You requested a deposit of ${money(requestedAmount)}. ` },
                { text: `${money(creditedAmount)} has been credited`, emphasis: 'blue' },
                { text: ' to your wallet after review. Open the Wallet section to see the updated balance.' },
              ],
          tone: 'success',
          href: '/seller/dashboard?tab=wallet',
          dedupeKey: `recharge-reviewed:${item.id}:Confirmed`,
        });
      } else {
        const reason = item.reviewReason;
        tryNotify({
          sellerEmail: item.handle,
          category: 'Wallet & Payments',
          title: 'Deposit not approved',
          message: [
            { text: `Your deposit request for ${money(requestedAmount)} was not approved. ` },
            { text: 'Reason: ', emphasis: 'red' },
            { text: reason, emphasis: 'red' },
            { text: ' If you still need to add funds, review your payment details and submit a new request.', emphasis: 'red' },
          ],
          tone: 'rejection',
          href: '/seller/dashboard?tab=wallet',
          dedupeKey: `recharge-reviewed:${item.id}:Rejected`,
        });
      }
      return NextResponse.json({ success: true, recharge: item });
    }

    const sellerEmail = String(body.email || '').trim().toLowerCase();
    const amount = Number(body.amount);
    const submittedNetwork = String(body.network || '').trim();
    const network = SELLER_CRYPTO_DEPOSIT_NETWORKS.find((item) => item.name === submittedNetwork);
    if (!network) throw new Error('Choose a supported crypto deposit network.');
    const expectedAddress = getSellerCryptoReceivingAddresses(readCryptoReceivingAddressConfig(), sellerEmail)[network.id];
    if (!expectedAddress) throw new Error(`Admin has not configured a receiving address for ${network.name} yet.`);
    if (String(body.walletAddress || '').trim() !== expectedAddress) {
      throw new Error('This receiving address has changed. Refresh the wallet and try again with the current address.');
    }
    if (
      !sellerEmail ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !/^data:image\/(png|jpeg|webp);base64,/.test(body.receipt?.url || '') ||
      body.receipt.url.length > 7100000
    ) {
      throw new Error('A seller, valid amount and receipt are required.');
    }

    const id = randomUUID();
    const recharge = {
      id,
      reference: `RC-${id.slice(0, 8).toUpperCase()}`,
      depositor: String(body.name || sellerEmail),
      handle: sellerEmail,
      coin: String(body.network || '').startsWith('USDC') ? 'USDC' : 'USDT',
      network: network.name,
      amount: Math.round(amount * 100) / 100,
      txHash: '',
      walletAddress: expectedAddress,
      receipt: body.receipt,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };
    rows.unshift(recharge);
    write(rows);
    tryNotify({
      sellerEmail,
      category: 'Wallet & Payments',
      title: 'Deposit request received',
      message: [
        { text: `Your deposit request for ${money(recharge.amount)} via ${recharge.network} has been received. ` },
        { text: 'It is now under review', emphasis: 'blue' },
        { text: '. We’ll notify you when it has been approved or if we need more information.' },
      ],
      tone: 'info',
      href: '/seller/dashboard?tab=wallet',
      dedupeKey: `recharge-submitted:${id}`,
    });
    return NextResponse.json({ success: true, recharge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
