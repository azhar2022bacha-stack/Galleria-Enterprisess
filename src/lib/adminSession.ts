import { createHmac, timingSafeEqual } from 'crypto';
import { getAdminAccountById, type AdminAccountRecord } from '@/lib/adminAccountsServer';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export interface AdminSessionPayload {
  sub: string;
  exp: number;
}

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Set a dedicated ADMIN_SESSION_SECRET (at least 32 characters) to enable admin sign-in.');
  }
  return secret;
}

function signature(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export function createAdminSessionToken(account: AdminAccountRecord): string {
  const payload: AdminSessionPayload = {
    sub: account.id,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signature(encoded)}`;
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) return null;
  try {
    const expectedSignature = Buffer.from(signature(encoded));
    const receivedSignature = Buffer.from(suppliedSignature);
    if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieValue(request: Request, name: string): string {
  const header = request.headers.get('cookie') || '';
  const item = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!item) return '';
  try { return decodeURIComponent(item.slice(name.length + 1)); } catch { return ''; }
}

export async function getRequestAdmin(request: Request): Promise<AdminAccountRecord | null> {
  const token = cookieValue(request, ADMIN_SESSION_COOKIE);
  const payload = verifyAdminSessionToken(token);
  if (!payload) return null;
  const account = await getAdminAccountById(payload.sub);
  return account?.status === 'Active' ? account : null;
}

