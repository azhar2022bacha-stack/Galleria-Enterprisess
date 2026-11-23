import { stat } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

async function revision(file: string) {
  try {
    // Payment writers replace these files atomically, including across PM2 workers.
    const info = await stat(path.join(process.cwd(), 'src/data', file), { bigint: true });
    return [info.ino, info.mtimeNs, info.size].join('-');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'empty';
    throw error;
  }
}

export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) return new NextResponse(null, { status: 401 });
  const since = new URL(request.url).searchParams.get('since');
  const deadline = Date.now() + 12_000;
  const headers = { 'Cache-Control': 'private, no-store' };

  while (!request.signal.aborted) {
    const [recharges, withdrawals] = await Promise.all([
      revision('wallet_recharges.json'), revision('seller_wallet_adjustments.json'),
    ]);
    if (since !== recharges + ':' + withdrawals) {
      return NextResponse.json({ recharges, withdrawals }, { headers });
    }
    if (Date.now() >= deadline) break;
    try {
      await delay(200, undefined, { signal: request.signal });
    } catch (error) {
      if (!request.signal.aborted) throw error;
    }
  }
  return new NextResponse(null, { status: 204, headers });
}
