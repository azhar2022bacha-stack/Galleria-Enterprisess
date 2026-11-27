import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { subscribeSupportEvents, type SupportRealtimeEvent } from '@/lib/supportEvents';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const requestedRole = q.get('role');

  let viewerRole: 'admin' | 'seller';
  let sellerEmail = '';

  if (requestedRole === 'seller') {
    sellerEmail = getRequestSellerEmail(req);
    if (!sellerEmail) {
      return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
    }
    viewerRole = 'seller';
  } else {
    const admin = await getRequestAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
    }
    viewerRole = 'admin';
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (eventName: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
          cleanup?.();
        }
      };

      send('connected', { role: viewerRole, at: Date.now() });

      const unsubscribe = subscribeSupportEvents((event: SupportRealtimeEvent) => {
        if (viewerRole === 'seller') {
          if (event.type === 'chat-updated' && event.email !== sellerEmail) return;
          if (event.type === 'profiles-updated' && event.email !== 'admin' && event.email !== sellerEmail) return;
        }
        send('support', event);
      });

      const keepalive = setInterval(() => {
        send('ping', { at: Date.now() });
      }, 20_000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      req.signal.addEventListener('abort', () => cleanup?.(), { once: true });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
