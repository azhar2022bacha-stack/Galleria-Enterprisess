import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { toPublicAdminAccount } from '@/lib/adminAccountsServer';
import { recordAdminAuditEvent } from '@/lib/adminAuditServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const account = await getRequestAdmin(request);
    if (!account) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    return NextResponse.json({ success: true, account: toPublicAdminAccount(account) });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to verify the admin session.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getRequestAdmin(request);
  if (admin) {
    try {
      await recordAdminAuditEvent(request, {
        actionText: `Admin signed out: ${admin.email}`,
        details: 'The admin session was ended.',
        category: 'Logins',
        endpoint: 'Admin sign out',
        method: 'LOGOUT',
        status: 200,
        success: true,
        actor: admin.email,
      });
    } catch (error) {
      console.error('Unable to record admin sign-out activity:', error);
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
