import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'consign_orders.json');


export interface PersistedShippingAddress {
  recipient: string;
  phone: string;
  email: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  country?: string;
}

export interface PersistedConsignOrder {
  id: string;
  orderNumber: string;
  shopName: string;
  merchantEmail?: string;
  itemTitle: string;
  itemCount: number;
  shopperName: string;
  shopperEmail: string;
  cost: number;
  commission: number;
  commissionRate: string;
  status: string;
  sellerStatus?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  products?: { id: string; title: string; price: number; quantity?: number; image?: string }[];
  shippingAddress?: PersistedShippingAddress;

}

function readOrdersFile(): PersistedConsignOrder[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrdersFile(orders: PersistedConsignOrder[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

function tryNotifySeller(input: Parameters<typeof createSellerNotificationServer>[0]): void {
  try {
    createSellerNotificationServer(input);
  } catch (error) {
    console.error('Unable to create consignment notification:', error);
  }
}

function orderNotificationDetails(order: PersistedConsignOrder) {
  const number = order.orderNumber ? `#${String(order.orderNumber).replace(/^#/, '')}` : order.id;
  const product = order.itemTitle || order.products?.map((item) => item.title).join(', ') || 'your order';
  const amount = Number(order.cost || 0);
  const status = String(order.status || '');
  const sellerStatus = String(order.sellerStatus || '');

  if (status.startsWith('Cancelled')) {
    return {
      title: `Order ${number} was cancelled`,
      message: [
        { text: `Order ${number} for ${product} was cancelled. `, emphasis: 'red' as const },
        { text: 'Please review the order details and contact Support if you believe this is incorrect.', emphasis: 'red' as const },
      ],
      tone: 'warning' as const,
      category: 'Orders & Shipping' as const,
      href: '/seller/dashboard?tab=orders',
    };
  }
  if (status.startsWith('Refunded')) {
    return {
      title: `Order ${number} was refunded`,
      message: [
        { text: `Order ${number} for ${product} was marked as refunded. `, emphasis: 'red' as const },
        ...(amount > 0 ? [{ text: `Order amount: $${amount.toFixed(2)}. `, emphasis: 'blue' as const }] : []),
        { text: 'Open Disputes to review the status and message the admin.' },
      ],
      tone: 'success' as const,
      category: 'Refunds & Disputes' as const,
      href: '/seller/dashboard?tab=disputes',
    };
  }
  if (status.startsWith('Rejected')) {
    return {
      title: `Order ${number} was rejected`,
      message: [
        { text: `Order ${number} for ${product} was rejected by an administrator. `, emphasis: 'red' as const },
        { text: 'Open Disputes to review the decision and reply to the admin.' },
      ],
      tone: 'rejection' as const,
      category: 'Refunds & Disputes' as const,
      href: '/seller/dashboard?tab=disputes',
    };
  }
  if (status.startsWith('Exception') || status.startsWith('Overdue')) {
    return {
      title: `Update needed for order ${number}`,
      message: [
        { text: `Order ${number} for ${product} has a shipping or handover issue: ` },
        { text: status, emphasis: 'red' as const },
        { text: '. Please review the order and contact Support if you need help.' },
      ],
      tone: 'warning' as const,
      category: 'Orders & Shipping' as const,
      href: '/seller/dashboard?tab=orders',
    };
  }

  const stage = sellerStatus === 'confirmed' || status.startsWith('Awaiting pickup')
    ? 'confirmed and is ready for pickup'
    : sellerStatus === 'picked_up' || status.startsWith('Picked up')
      ? 'been picked up'
      : sellerStatus === 'on_the_way' || status.startsWith('Shipped')
        ? 'been dispatched and is in transit'
        : sellerStatus === 'delivered' || status.startsWith('Received')
          ? 'been delivered'
          : status.startsWith('Awaiting payment')
            ? 'been assigned to your shop and is awaiting payment'
            : `been updated to ${status || sellerStatus}`;

  const isDelivered = sellerStatus === 'delivered' || status.startsWith('Received');
  return {
    title: isDelivered ? `Order ${number} was delivered` : `Order ${number} update`,
    message: [
      { text: `Order ${number} for ${product} has ` },
      { text: stage, emphasis: 'blue' as const },
      ...(amount > 0 ? [{ text: `. Order amount: ` }, { text: `$${amount.toFixed(2)}`, emphasis: 'blue' as const }] : []),
      { text: '. Open Orders for the latest details.' },
    ],
    tone: isDelivered ? 'success' as const : 'info' as const,
    category: 'Orders & Shipping' as const,
    href: '/seller/dashboard?tab=orders',
  };
}

export async function GET(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const merchantEmail = (searchParams.get('merchantEmail') || '').trim().toLowerCase();
    const allOrders = readOrdersFile();

    const filtered = merchantEmail
      ? allOrders.filter(
          (o) => (o.merchantEmail || '').trim().toLowerCase() === merchantEmail
        )
      : allOrders;

    return NextResponse.json({ success: true, orders: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load consign orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await request.json();
    const incomingList: PersistedConsignOrder[] = Array.isArray(body?.orders)
      ? body.orders
      : body?.order
      ? [body.order]
      : [];

    if (incomingList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No consign orders provided' },
        { status: 400 }
      );
    }

    const existing = readOrdersFile();
    const byId = new Map(existing.map((o) => [o.id, o]));

    for (const item of incomingList) {
      if (!item?.id) continue;
      const prev = byId.get(item.id);
      byId.set(item.id, {
        ...prev,
        ...item,
        shippingAddress: item.shippingAddress || prev?.shippingAddress,
      });
    }

    // Keep newest orders first
    const incomingIds = new Set(incomingList.map((o) => o.id));
    const orderedResult = [
      ...incomingList.map((o) => byId.get(o.id)!),
      ...existing.filter((o) => !incomingIds.has(o.id)),
    ];

    writeOrdersFile(orderedResult);

    for (const item of incomingList) {
      const savedOrder = byId.get(item.id);
      if (!savedOrder?.merchantEmail) continue;
      tryNotifySeller({
        sellerEmail: savedOrder.merchantEmail,
        category: 'Orders & Shipping',
        title: `New order ${savedOrder.orderNumber ? `#${String(savedOrder.orderNumber).replace(/^#/, '')}` : ''} received`,
        message: [
          { text: `A new order for ${savedOrder.itemTitle || 'your products'} has been assigned to your shop. ` },
          { text: `${savedOrder.itemCount || savedOrder.products?.length || 1} item(s)`, emphasis: 'blue' },
          { text: savedOrder.cost ? ` · $${Number(savedOrder.cost).toFixed(2)} · ` : ' · ' },
          { text: 'Awaiting payment', emphasis: 'blue' },
          { text: '. Open Orders to review the details.' },
        ],
        tone: 'info',
        href: '/seller/dashboard?tab=orders',
        dedupeKey: `consign-order-assigned:${savedOrder.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      orders: incomingList.map((o) => byId.get(o.id)!),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save consign orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await request.json();
    const { id, orderNumber, status, sellerStatus, actor } = body || {};

    if (!id && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order id or orderNumber is required' },
        { status: 400 }
      );
    }

    const existing = readOrdersFile();
    const matchesOrder = (order: PersistedConsignOrder) =>
      Boolean((id && order.id === id) || (orderNumber && order.orderNumber === orderNumber));
    const previousOrder = existing.find(matchesOrder);
    const updatedAt = new Date().toISOString();

    const nextOrders: PersistedConsignOrder[] = existing.map((order) => {
      if (matchesOrder(order)) {
        return {
          ...order,
          ...(status !== undefined ? { status } : {}),
          ...(sellerStatus !== undefined ? { sellerStatus } : {}),
          updatedAt,
        };
      }
      return order;
    });
    const updatedOrder = nextOrders.find(matchesOrder) || null;

    if (updatedOrder) {
      writeOrdersFile(nextOrders);
      const changed = previousOrder &&
        (previousOrder.status !== updatedOrder.status || previousOrder.sellerStatus !== updatedOrder.sellerStatus);
      if (changed && actor !== 'seller' && updatedOrder.merchantEmail) {
        const details = orderNotificationDetails(updatedOrder);
        tryNotifySeller({
          sellerEmail: updatedOrder.merchantEmail,
          category: details.category,
          title: details.title,
          message: details.message,
          tone: details.tone,
          href: details.href,
          dedupeKey: 'consign-order-update:' + updatedOrder.id + ':' + updatedOrder.status + ':' + updatedOrder.sellerStatus + ':' + updatedOrder.updatedAt,
        });
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update consign order' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      writeOrdersFile([]);
      return NextResponse.json({ success: true, cleared: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const existing = readOrdersFile();
    const filtered = existing.filter((o) => o.id !== id && o.orderNumber !== id);
    writeOrdersFile(filtered);

    return NextResponse.json({ success: true, removedId: id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete consign order' },
      { status: 500 }
    );
  }
}
