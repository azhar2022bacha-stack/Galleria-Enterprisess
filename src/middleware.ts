import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_session';

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(base64);
  return new Uint8Array(Array.from(binary, (character) => character.charCodeAt(0)));
}

async function hasValidSession(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(payload)
    );
    if (!validSignature) return false;
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { sub?: string; exp?: number };
    return Boolean(data.sub && Number.isFinite(data.exp) && Number(data.exp) > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicAuthPaths = new Set([
    '/api/admin/auth/login',
    '/api/admin/auth/session',
    '/api/admin/auth/setup',
    '/api/admin/auth/setup-status',
  ]);
  if (pathname === '/admin/login' || publicAuthPaths.has(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, private');
    return response;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value || '';
  if (token && await hasValidSession(token)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, private');
    return response;
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: 'Please sign in to the admin panel.' },
      { status: 401, headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  const loginUrl = new URL('/admin/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
