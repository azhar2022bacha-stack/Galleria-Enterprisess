import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'consign_orders.json');
const REFUNDS_FILE = path.join(process.cwd(), 'src', 'data', 'consign_refunds.json');

interface ConsignRefundOrderSnapshot {
  id: string;
  orderNumber?: string;
  shopName?: string;
  merchantEmail?: string;
  itemTitle?: string;
  itemCount?: number;
  shopperName?: string;
  shopperEmail?: string;
  shippingAddress?: Record<string, string>;
  cost?: number;
  commission?: number;
  commissionRate?: string;
  status?: string;
  sellerStatus?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  products?: Array<{
    id?: string;
    title: string;
    price?: number;
    quantity?: number;
    image?: string;
    imageUrl?: string;
  }>;
}

interface ConsignOrderRefundMetadata {
  id: string;
  status: 'Refunded';
  reason: string;
  createdAt: string;
  orderSnapshot: ConsignRefundOrderSnapshot;
}

interface ConsignRefundOrder extends ConsignRefundOrderSnapshot {
  status: string;
  refund?: ConsignOrderRefundMetadata;
}

interface ConsignRefundHistoryRecord {
  id: string;
  orderId: string;
  orderCode: string;
  productTitle: string;
  amount: number;
  status: 'Refunded';
  reason: string;
  createdAt: string;
  source: 'consign-admin';
  sellerEmail: string;
  shopName: string;
  shopperName: string;
  shopperEmail: string;
  commission: number;
  commissionRate: string;
  itemCount: number;
  orderSnapshot: ConsignRefundOrderSnapshot;
}

function readOrders(): ConsignRefundOrder[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: ConsignRefundOrder[]): void {
  const directory = path.dirname(DATA_FILE);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(orders, null, 2), 'utf8');
  fs.renameSync(temporaryFile, DATA_FILE);
}

function readRefunds(): ConsignRefundHistoryRecord[] {
  try {
    if (!fs.existsSync(REFUNDS_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(REFUNDS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasSellerPaidConsignOrder(order: ConsignRefundOrder): boolean {
  const sellerStatus = String(order.sellerStatus || '').trim().toLowerCase();
  if (sellerStatus && sellerStatus !== 'awaiting_payment') return true;

  const status = String(order.status || '').trim().toLowerCase();
  return status.startsWith('paid') ||
    status.startsWith('awaiting pickup') ||
    status.startsWith('picked up') ||
    status.startsWith('shipped') ||
    status.startsWith('received') ||
    status.startsWith('settled');
}

function writeRefunds(refunds: ConsignRefundHistoryRecord[]): void {
  const directory = path.dirname(REFUNDS_FILE);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  const temporaryFile = `${REFUNDS_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(refunds, null, 2), 'utf8');
  fs.renameSync(temporaryFile, REFUNDS_FILE);
}

function getSellerSessionEmail(request: Request): string {
  return getRequestSellerEmail(request);
}

function refundFromOrder(order: ConsignRefundOrder): ConsignRefundHistoryRecord | null {
  if (!order.refund) return null;
  const snapshot = order.refund.orderSnapshot || order;
  return {
    id: order.refund.id,
    orderId: order.id,
    orderCode: snapshot.orderNumber || order.orderNumber || order.id,
    productTitle: snapshot.itemTitle || snapshot.products?.map((product) => product.title).join(', ') || 'Consign order',
    amount: Number(snapshot.cost || 0),
    status: 'Refunded' as const,
    reason: order.refund.reason,
    createdAt: order.refund.createdAt,
    source: 'consign-admin' as const,
    sellerEmail: order.merchantEmail || snapshot.merchantEmail || '',
    shopName: snapshot.shopName || '',
    shopperName: snapshot.shopperName || '',
    shopperEmail: snapshot.shopperEmail || '',
    commission: Number(snapshot.commission || 0),
    commissionRate: snapshot.commissionRate || '',
    itemCount: Number(snapshot.itemCount || snapshot.products?.length || 0),
    orderSnapshot: snapshot,
  };
}

export async function GET(request: Request) {
  const admin = await getRequestAdmin(request);
  const sessionEmail = getSellerSessionEmail(request);
  if (!admin && !sessionEmail) {
    return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
  }

  const refunds = readRefunds()
    .filter((refund) => admin || String(refund.sellerEmail || '').trim().toLowerCase() === sessionEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ success: true, refunds });
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await request.json();
    const orderId = String(body?.orderId || '').trim();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    const orders = readOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) {
      return NextResponse.json({ success: false, error: 'The Consign order was not found.' }, { status: 404 });
    }

    const currentOrder = orders[index];
    const sellerEmail = (currentOrder.merchantEmail || '').trim().toLowerCase();
    if (!sellerEmail) {
      return NextResponse.json(
        { success: false, error: 'This Consign order is not linked to a seller account.' },
        { status: 400 }
      );
    }

    const refundHistory = readRefunds();
    let refund = refundHistory.find((item) => item.orderId === currentOrder.id) || null;
    if (!refund && currentOrder.refund) {
      refund = refundFromOrder(currentOrder);
      if (refund) {
        refundHistory.unshift(refund);
        writeRefunds(refundHistory);
      }
    }

    if (!refund && !hasSellerPaidConsignOrder(currentOrder)) {
      return NextResponse.json(
        { success: false, error: 'The seller must pay for this Consign order before it can be refunded.' },
        { status: 409 }
      );
    }

    let updatedOrder = currentOrder;
    if (!refund) {
      const createdAt = new Date().toISOString();
      const orderSnapshot = { ...currentOrder };
      const metadata: ConsignOrderRefundMetadata = {
        id: randomUUID(),
        status: 'Refunded',
        reason: 'This Consign order was refunded by an administrator.',
        createdAt,
        orderSnapshot,
      };
      refund = {
        id: metadata.id,
        orderId: currentOrder.id,
        orderCode: currentOrder.orderNumber || currentOrder.id,
        productTitle: currentOrder.itemTitle || currentOrder.products?.map((product) => product.title).join(', ') || 'Consign order',
        amount: Number(currentOrder.cost || 0),
        status: 'Refunded',
        reason: metadata.reason,
        createdAt,
        source: 'consign-admin',
        sellerEmail,
        shopName: currentOrder.shopName || '',
        shopperName: currentOrder.shopperName || '',
        shopperEmail: currentOrder.shopperEmail || '',
        commission: Number(currentOrder.commission || 0),
        commissionRate: currentOrder.commissionRate || '',
        itemCount: Number(currentOrder.itemCount || currentOrder.products?.length || 0),
        orderSnapshot,
      };
      refundHistory.unshift(refund);
      writeRefunds(refundHistory);
      updatedOrder = {
        ...currentOrder,
        status: 'Refunded',
        updatedAt: createdAt,
        refund: metadata,
      };
      orders[index] = updatedOrder;
      writeOrders(orders);

      const orderCode = currentOrder.orderNumber || currentOrder.id;
      try {
        createSellerNotificationServer({
          sellerEmail,
          category: 'Refunds & Disputes',
          title: `Consign order #${orderCode} refunded`,
          message: [
            { text: `Consign order #${orderCode} for ${currentOrder.itemTitle || 'your products'} was marked as refunded. ` },
            { text: `Order amount: $${Number(currentOrder.cost || 0).toFixed(2)}. `, emphasis: 'blue' },
            { text: 'Open Disputes in your seller account to view the refund status and reply to the admin.' },
          ],
          tone: 'success',
          href: '/seller/dashboard?tab=disputes',
          dedupeKey: `consign-admin-refunded:${currentOrder.id}`,
        });
      } catch (error) {
        console.error('Unable to create consign refund notification:', error);
      }
    } else if (currentOrder.status !== 'Refunded' || !currentOrder.refund) {
      updatedOrder = {
        ...currentOrder,
        status: 'Refunded',
        updatedAt: new Date().toISOString(),
        refund: currentOrder.refund || {
          id: refund.id,
          status: 'Refunded',
          reason: refund.reason,
          createdAt: refund.createdAt,
          orderSnapshot: refund.orderSnapshot,
        },
      };
      orders[index] = updatedOrder;
      writeOrders(orders);
    }

    return NextResponse.json({ success: true, order: updatedOrder, refund });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to refund this Consign order.' },
      { status: 500 }
    );
  }
}
