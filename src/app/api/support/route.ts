import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import { getSupportInbox, handleSupportAction, normalizeEmail, updateSupportProfile } from '@/lib/supportServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const requestedRole = q.get('role');
    const rawEmail = q.get('email');
    const requestedEmail = rawEmail ? normalizeEmail(rawEmail) : '';

    const isSellerView = requestedRole === 'seller' || (requestedRole !== 'admin' && Boolean(requestedEmail));

    let viewerRole: 'admin' | 'seller';
    let filterEmail: string | undefined;

    if (isSellerView) {
      const sessionSellerEmail = getRequestSellerEmail(req);
      const admin = sessionSellerEmail ? null : await getRequestAdmin(req);
      if (!sessionSellerEmail && !admin) {
        return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
      }
      if (sessionSellerEmail) {
        if (requestedEmail && sessionSellerEmail !== requestedEmail) {
          return NextResponse.json({ error: 'You can only access your own support conversation.' }, { status: 403 });
        }
        viewerRole = 'seller';
        filterEmail = sessionSellerEmail;
      } else {
        viewerRole = 'admin';
        filterEmail = requestedEmail || undefined;
      }
    } else {
      const admin = await getRequestAdmin(req);
      if (!admin) {
        return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
      }
      viewerRole = 'admin';
      filterEmail = requestedEmail || undefined;
    }

    const { chats, profiles } = await getSupportInbox(filterEmail);

    if (q.get('summary') === '1') {
      const incoming = chats.flatMap((chat) =>
        (Array.isArray(chat.messages) ? chat.messages : []).filter(
          (message) =>
            message.role !== viewerRole &&
            !message.deleted &&
            !message.hiddenFor?.includes(viewerRole)
        )
      );
      return NextResponse.json(
        {
          unreadCount: incoming.filter((message) => !message.read).length,
          incomingIds: incoming.map((message) => message.id).filter(Boolean),
        },
        { headers: { 'Cache-Control': 'no-store, private' } }
      );
    }

    return NextResponse.json(
      { chats, profiles, ...(filterEmail && viewerRole === 'seller' ? { sellerEmail: filterEmail } : {}) },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  } catch (error: any) {
    console.error('Support GET failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to load support conversations.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const role = b?.role;
    if (role !== 'seller' && role !== 'admin') {
      return NextResponse.json({ error: 'A valid support role is required.' }, { status: 400 });
    }

    let email = normalizeEmail(b?.email || '');

    if (role === 'admin') {
      if (!(await getRequestAdmin(req))) {
        return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
      }
      if (!email) {
        return NextResponse.json({ error: 'A seller account is required.' }, { status: 400 });
      }
    } else {
      const normalizedSessionEmail = getRequestSellerEmail(req);
      if (!normalizedSessionEmail) {
        return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
      }
      if (email && email !== normalizedSessionEmail) {
        return NextResponse.json({ error: 'Sign in to the matching seller account.' }, { status: 403 });
      }
      email = normalizedSessionEmail;
    }

    if (b.action === 'profile') {
      const key = role === 'admin' ? 'admin' : email;
      await updateSupportProfile(key, b.photo || null);
      return NextResponse.json({ success: true });
    }

    const result = await handleSupportAction({
      action: String(b.action || ''),
      email,
      role,
      name: typeof b.name === 'string' ? b.name : undefined,
      text: typeof b.text === 'string' ? b.text : undefined,
      attachment: b.attachment ?? null,
      reply: typeof b.reply === 'string' ? b.reply : undefined,
      messageId: typeof b.messageId === 'string' ? b.messageId : undefined,
    });

    return NextResponse.json({ chat: result.chat });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unable to save message.' }, { status: 400 });
  }
}
