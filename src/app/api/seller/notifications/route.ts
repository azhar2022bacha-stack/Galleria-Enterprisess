import { NextResponse } from 'next/server';
import {
  createSellerNotificationServer,
  getSellerNotificationsServer,
  markSellerNotificationReadServer,
  type SellerNotificationCategory,
  type SellerNotificationPart,
  type SellerNotificationTone,
} from '@/lib/sellerNotificationsServer';
import fs from 'fs';
import path from 'path';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

function normalizeParts(value: unknown): SellerNotificationPart[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((part: any) => part && typeof part.text === 'string')
    .slice(0, 40)
    .map((part: any) => ({
      text: part.text.slice(0, 1200),
      ...(part.emphasis === 'blue' || part.emphasis === 'red'
        ? { emphasis: part.emphasis }
        : {}),
    }));
}

function resolveSellerEmailByOrder(orderNumber: string): string {
  if (!orderNumber) return '';
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'consign_orders.json');
    const orders = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    const normalized = orderNumber.replace(/^#/, '').trim().toLowerCase();
    const order = Array.isArray(orders)
      ? orders.find((item: any) => String(item.orderNumber || '').replace(/^#/, '').trim().toLowerCase() === normalized)
      : null;
    return String(order?.merchantEmail || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

function getSellerSessionEmail(request: Request): string {
  return getRequestSellerEmail(request);
}

export async function GET(request: Request) {
  const requestedEmail = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  const sessionEmail = getSellerSessionEmail(request);
  if (!sessionEmail) return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
  if (requestedEmail && requestedEmail !== sessionEmail) {
    return NextResponse.json({ error: 'You can only view notifications for your seller account.' }, { status: 403 });
  }
  const email = sessionEmail;
  const notifications = getSellerNotificationsServer(email);
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sellerEmail = String(body.sellerEmail || '').trim().toLowerCase() ||
      resolveSellerEmailByOrder(String(body.orderNumber || ''));
    if (!sellerEmail) {
      return NextResponse.json({ error: 'The seller for this notification could not be identified.' }, { status: 400 });
    }
    const admin = await getRequestAdmin(request);
    if (!admin) {
      const sessionEmail = getSellerSessionEmail(request);
      if (!sessionEmail) return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
      if (sessionEmail !== sellerEmail) return NextResponse.json({ error: 'You can only create notifications for your seller account.' }, { status: 403 });
    }
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'A notification title is required.' }, { status: 400 });
    }
    const allowedCategories: SellerNotificationCategory[] = [
      'Account & Verification',
      'Wallet & Payments',
      'Products & Stock',
      'Orders & Shipping',
      'Earnings & Settlements',
      'Refunds & Disputes',
      'Consignment & Handover',
      'Support',
      'Account Updates',
    ];
    const allowedTones: SellerNotificationTone[] = ['info', 'success', 'warning', 'rejection'];
    const category = allowedCategories.includes(body.category) ? body.category : 'Account Updates';
    const tone = allowedTones.includes(body.tone) ? body.tone : 'info';
    const notification = createSellerNotificationServer({
      sellerEmail,
      category,
      title: body.title,
      message: normalizeParts(body.message),
      tone,
      href: typeof body.href === 'string' ? body.href : undefined,
      dedupeKey: typeof body.dedupeKey === 'string' ? body.dedupeKey : undefined,
    });
    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to create notification.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.sellerEmail || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Seller email is required.' }, { status: 400 });
    const sessionEmail = getSellerSessionEmail(request);
    if (!sessionEmail) return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
    if (email !== sessionEmail) return NextResponse.json({ error: 'You can only update notifications for your seller account.' }, { status: 403 });
    const changed = markSellerNotificationReadServer(
      email,
      body.readAll === true ? undefined : String(body.notificationId || '') || undefined
    );
    return NextResponse.json({ success: true, updated: changed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update notification.' }, { status: 400 });
  }
}
