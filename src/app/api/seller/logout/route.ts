import { NextResponse } from 'next/server';
import { clearSellerSessionCookie } from '@/lib/sellerSession';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSellerSessionCookie(response);
  return response;
}
