import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSellerEmailFromToken, SELLER_SESSION_COOKIE } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

export default function SellerDashboardLayout({ children }: { children: ReactNode }) {
  const sessionToken = cookies().get(SELLER_SESSION_COOKIE)?.value || '';
  if (!getSellerEmailFromToken(sessionToken)) {
    redirect('/seller?mode=signin');
  }

  return children;
}
