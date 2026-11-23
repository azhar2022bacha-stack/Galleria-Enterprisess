import fs from 'fs';
import path from 'path';
import { getRequestAdmin } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) return new Response('Sign in required.', { status: 401 });
  const queue = new URL(request.url).searchParams.get('queue');
  if (queue !== 'recharges' && queue !== 'withdrawals') return new Response('Invalid queue.', { status: 400 });
  const file = path.join(process.cwd(), 'src/data',
    queue === 'recharges' ? 'wallet_recharges.json' : 'seller_wallet_adjustments.json');
  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let stopped = false;
      let revision = '';
      let heartbeatAt = 0;
      let timer: ReturnType<typeof setInterval>;
      let reconnect: ReturnType<typeof setTimeout>;
      stop = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(timer);
        clearTimeout(reconnect);
        request.signal.removeEventListener('abort', stop);
        try { controller.close(); } catch { /* The client may have already disconnected. */ }
      };
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode('event: ' + event + '\ndata: ' + data + '\n\n'));
      };
      const check = () => {
        if (stopped) return;
        try {
          let current = 'missing';
          try {
            const stat = fs.statSync(file, { bigint: true });
            current = String(stat.ino) + ':' + stat.size + ':' + stat.mtimeNs;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
          if (current !== revision) {
            revision = current;
            send('payment-change', JSON.stringify({ revision }));
          }
          if (Date.now() - heartbeatAt >= 1000) {
            send('heartbeat', '{}');
            heartbeatAt = Date.now();
          }
        } catch {
          stop();
        }
      };
      request.signal.addEventListener('abort', stop, { once: true });
      timer = setInterval(check, 250);
      // Reconnect periodically so every active connection rechecks admin authentication.
      reconnect = setTimeout(stop, 60_000);
      if (request.signal.aborted) stop();
      else check();
    },
    cancel() { stop(); },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, private, no-transform',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'identity',
    },
  });
}
