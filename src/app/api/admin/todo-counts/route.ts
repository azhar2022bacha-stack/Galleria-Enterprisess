import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { summarizeAdminTodoSources } from '@/lib/adminTodoCounts';
import { getAdminTodoSellerStatuses } from '@/lib/inviteCodesServer';

export const dynamic = 'force-dynamic';

async function readData(file: string) {
  try {
    return JSON.parse((await readFile(path.join(process.cwd(), 'src', 'data', file), 'utf8')).replace(/^\uFEFF/, ''));
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT' ? [] : null;
  }
}

export async function GET(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  const [recharges, owners, products, chats, orders, wallet] = await Promise.all([
    readData('wallet_recharges.json'),
    getAdminTodoSellerStatuses().catch(() => null),
    readData('seller_products.json'),
    readData('support_chats.json'),
    readData('consign_orders.json'),
    readData('seller_wallet_adjustments.json'),
  ]);
  const counts = {
    ...summarizeAdminTodoSources(recharges, owners, products, chats),
    ...(Array.isArray(wallet) ? { withdrawals: wallet.filter(row =>
      row?.eventType === 'withdrawal-request' && row.withdrawal?.status === 'pending').length } : {}),
  };
  const orderSummaries = Array.isArray(orders) ? orders.filter(Boolean).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    code: order.code,
    status: order.status,
    sellerStatus: order.sellerStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    updatedAt: order.updatedAt,
    updated_at: order.updated_at,
    createdAt: order.createdAt,
    created_at: order.created_at,
    date: order.date,
  })) : null;
  return NextResponse.json({ counts, orders: orderSummaries }, { headers: { 'Cache-Control': 'no-store, private' } });
}
