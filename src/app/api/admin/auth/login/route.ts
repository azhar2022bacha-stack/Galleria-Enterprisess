import { NextResponse } from 'next/server';
import { getAdminAccountByEmail, setAdminLastLogin, toPublicAdminAccount, verifyAdminPassword } from '@/lib/adminAccountsServer';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from '@/lib/adminSession';
import { recordAdminAuditEvent } from '@/lib/adminAuditServer';

export const dynamic = 'force-dynamic';

async function logSignInEvent(request: Request, event: Parameters<typeof recordAdminAuditEvent>[1]) {
  try {
    await recordAdminAuditEvent(request, event);
  } catch (error) {
    console.error('Unable to record admin sign-in activity:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ success: false, error: 'Enter your email and password.' }, { status: 400 });
    if (email.length > 255 || password.length > 256) return NextResponse.json({ success: false, error: 'Email or password is too long.' }, { status: 400 });

    const account = await getAdminAccountByEmail(email);
    if (!account || !(await verifyAdminPassword(account, password))) {
      await logSignInEvent(request, {
        actionText: `Admin sign-in failed for ${email || 'unknown account'}`,
        details: 'The email and password did not match an active admin account.',
        category: 'Logins',
        endpoint: 'Admin sign in',
        method: 'LOGIN',
        status: 401,
        success: false,
        actor: email || 'Unknown admin',
      });
      return NextResponse.json({ success: false, error: 'Email or password is incorrect.' }, { status: 401 });
    }
    if (account.status !== 'Active') {
      await logSignInEvent(request, {
        actionText: `Suspended admin sign-in blocked for ${account.email}`,
        details: 'The account is suspended and cannot access the admin panel.',
        category: 'Logins',
        endpoint: 'Admin sign in',
        method: 'LOGIN',
        status: 403,
        success: false,
        actor: account.email,
      });
      return NextResponse.json({ success: false, error: 'This admin account is suspended. Contact admin·root for access.' }, { status: 403 });
    }

    const token = createAdminSessionToken(account);
    await setAdminLastLogin(account.id);
    await logSignInEvent(request, {
      actionText: `Admin signed in as ${account.email}`,
      details: `${account.isRoot ? 'Main admin' : 'Admin'} account sign-in succeeded.`,
      category: 'Logins',
      endpoint: 'Admin sign in',
      method: 'LOGIN',
      status: 200,
      success: true,
      actor: account.email,
    });
    const response = NextResponse.json({ success: true, account: toPublicAdminAccount(account) });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('Admin sign-in failed:', error);
    return NextResponse.json({ success: false, error: 'Admin sign-in is not configured correctly.' }, { status: 503 });
  }
}
