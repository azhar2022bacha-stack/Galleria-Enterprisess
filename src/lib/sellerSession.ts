import { recoveredCredentials } from './sellerRecoveryServer';
import { getSellerAccountSuspension } from './sellerAccountRestrictionsServer';
import { createHmac, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';

export const SELLER_SESSION_COOKIE = 'seller_session_email';
export const SELLER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

interface SellerSessionPayload {
  email: string;
  exp: number;
  version?: string;
}

function sessionSecret(): string {
  const secret = process.env.SELLER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret || secret.length < 16) {
    throw new Error('Set SELLER_SESSION_SECRET (at least 16 characters) to enable seller sign-in.');
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
}

export function createSellerSessionToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid seller email is required to create a session.');
  }
  const payload: SellerSessionPayload = {
    email: normalizedEmail,
    version: recoveredCredentials(normalizedEmail)?.version,
    exp: Math.floor(Date.now() / 1000) + SELLER_SESSION_MAX_AGE,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function getSellerEmailFromToken(token: string): string {
  const [encodedPayload, suppliedSignature, extra] = token.split('.');
  if (!encodedPayload || !suppliedSignature || extra) return '';
  try {
    const expectedSignature = Buffer.from(sign(encodedPayload));
    const receivedSignature = Buffer.from(suppliedSignature);
    if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) return '';

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SellerSessionPayload;
    if (typeof payload.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return '';
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return '';
    const account = payload.email.trim().toLowerCase();
    return payload.version === recoveredCredentials(account)?.version ? account : "";
  } catch {
    return '';
  }
}

export function getRequestSellerEmail(request: Request, options: { allowSuspended?: boolean } = {}): string {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SELLER_SESSION_COOKIE}=`));
  if (!cookie) return '';

  try {
    const email = getSellerEmailFromToken(decodeURIComponent(cookie.slice(SELLER_SESSION_COOKIE.length + 1)));
    if (!email) return '';
    if (!options.allowSuspended && getSellerAccountSuspension(email)) return '';
    return email;
  } catch {
    return '';
  }
}

export function setSellerSessionCookie(response: NextResponse, email: string): void {
  response.cookies.set(SELLER_SESSION_COOKIE, createSellerSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SELLER_SESSION_MAX_AGE,
  });
}

export function clearSellerSessionCookie(response: NextResponse): void {
  response.cookies.set(SELLER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
