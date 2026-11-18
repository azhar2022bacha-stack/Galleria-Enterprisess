import { NextResponse } from 'next/server';
import { getAdminAccounts } from '@/lib/adminAccountsServer';

export const dynamic = 'force-dynamic';

function isLocalRequest(request: Request): boolean {
  const host = (request.headers.get('host') || new URL(request.url).host).toLowerCase();
  return host === 'localhost' || host.startsWith('localhost:') || host === '127.0.0.1' || host.startsWith('127.0.0.1:') || host === '[::1]' || host.startsWith('[::1]:');
}

export async function GET(request: Request) {
  try {
    const accounts = await getAdminAccounts();
    const rootAccount = accounts.find((account) => account.isRoot);
    const configuredRootEmail = String(process.env.ADMIN_ROOT_EMAIL || '').trim().toLowerCase();
    const hasConfiguredBootstrapPassword = Boolean(process.env.ADMIN_ROOT_PASSWORD);
    const localSetupAllowed = process.env.NODE_ENV === 'development'
      && isLocalRequest(request)
      && Boolean(configuredRootEmail)
      && hasConfiguredBootstrapPassword;
    return NextResponse.json({
      success: true,
      setupRequired: !rootAccount,
      setupAllowed: !rootAccount && localSetupAllowed,
      email: rootAccount?.email || (localSetupAllowed ? configuredRootEmail : ''),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to check admin setup.' }, { status: 503 });
  }
}
