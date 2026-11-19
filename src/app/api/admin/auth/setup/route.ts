import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { bootstrapRootAdmin, toPublicAdminAccount } from '@/lib/adminAccountsServer';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from '@/lib/adminSession';
import { recordAdminAuditEvent } from '@/lib/adminAuditServer';

export const dynamic = 'force-dynamic';

function isLocalRequest(request: Request): boolean {
  const host = (request.headers.get('host') || new URL(request.url).host).toLowerCase();
  return host === 'localhost' || host.startsWith('localhost:') || host === '127.0.0.1' || host.startsWith('127.0.0.1:') || host === '[::1]' || host.startsWith('[::1]:');
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development' || !isLocalRequest(request)) {
    return NextResponse.json({ success: false, error: 'First-time setup is only available on localhost. Configure ADMIN_ROOT_EMAIL and ADMIN_ROOT_PASSWORD on the server.' }, { status: 403 });
  }

  const configuredEmail = String(process.env.ADMIN_ROOT_EMAIL || '').trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_ROOT_PASSWORD || '';
  if (!configuredEmail || !configuredPassword) {
    return NextResponse.json({ success: false, error: 'First-time setup is disabled. Configure the root credentials on the server.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
    const providedPassword = Buffer.from(password);
    const expectedPassword = Buffer.from(configuredPassword);
    const passwordMatches = providedPassword.length === expectedPassword.length
      && timingSafeEqual(providedPassword, expectedPassword);
    if (email !== configuredEmail || !passwordMatches) {
      return NextResponse.json({ success: false, error: 'Use the root credentials configured on the server.' }, { status: 401 });
    }
    if (!password || password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Enter the same password in both password fields.' }, { status: 400 });
    }

    const account = await bootstrapRootAdmin(email, password);
    const token = createAdminSessionToken(account);
    try {
      await recordAdminAuditEvent(request, {
        actionText: `Initialized main admin account for ${account.email}`,
        details: 'The first admin·root account was created through local first-time setup.',
        category: 'Sensitive',
        endpoint: 'Admin account setup',
        method: 'SETUP',
        status: 201,
        success: true,
        actor: account.email,
      });
    } catch (auditError) {
      console.error('Unable to record main admin setup activity:', auditError);
    }
    const response = NextResponse.json({ success: true, account: toPublicAdminAccount(account) }, { status: 201 });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to set up the main admin account.' }, { status: 400 });
  }
}
