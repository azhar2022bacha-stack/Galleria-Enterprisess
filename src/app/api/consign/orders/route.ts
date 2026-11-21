import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
import {
  addSellerWalletAdjustment,
  findSellerWalletAdjustment,
  getSellerWalletAdjustmentTotalCents,
} from '@/lib/sellerWalletAdjustmentsServer';

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
  amount?: number;
  commission: number;
  commissionRate: string;
  status: string;
  sellerStatus?: string;
  sellerPaidAt?: string;
  sellerPaidAmount?: number;
  sellerCommission?: number;
  paymentAdjustmentId?: string;
  adminConfirmedAt?: string;
  settledAt?: string;
  settlementAdjustmentId?: string;
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

type ConsignSellerStage = 'awaiting_payment' | 'confirmed' | 'picked_up' | 'on_the_way' | 'delivered';

const CONSIGN_COMMISSION_RATE = 15;
const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function toCents(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) return Number.NaN;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : Number.NaN;
}

function commissionCentsFor(grossCents: number): number {
  return Math.floor((grossCents * CONSIGN_COMMISSION_RATE + 50) / 100);
}

function grossCentsFor(order: PersistedConsignOrder): number {
  return toCents(order.amount ?? order.cost);
}

function sellerStageFor(order: PersistedConsignOrder): ConsignSellerStage {
  const explicit = String(order.sellerStatus || '').toLowerCase();
  if (['awaiting_payment', 'confirmed', 'picked_up', 'on_the_way', 'delivered'].includes(explicit)) {
    return explicit as ConsignSellerStage;
  }
  const status = String(order.status || '').toLowerCase();
  if (status.startsWith('received') || status.includes('delivered') || status.includes('settled')) return 'delivered';
  if (status.startsWith('shipped') || status.includes('in transit')) return 'on_the_way';
  if (status.startsWith('picked up')) return 'picked_up';
  if (status.startsWith('paid') || status.startsWith('awaiting pickup')) return 'confirmed';
  return 'awaiting_payment';
}

function orderHasBeenPaid(order: PersistedConsignOrder): boolean {
  return Boolean(order.paymentAdjustmentId || order.sellerPaidAt) ||
    ['confirmed', 'picked_up', 'on_the_way', 'delivered'].includes(sellerStageFor(order)) ||
    /^(paid|awaiting pickup|picked up|shipped|received|settled)/i.test(String(order.status || ''));
}

function sellerPaymentNotification(order: PersistedConsignOrder) {
  const number = order.orderNumber ? `#${String(order.orderNumber).replace(/^#/, '')}` : order.id;
  const grossCents = grossCentsFor(order);
  const paidCents = toCents(order.sellerPaidAmount);
  const commissionCents = toCents(order.sellerCommission ?? order.commission);
  return {
    sellerEmail: String(order.merchantEmail || '').trim().toLowerCase(),
    category: 'Orders & Shipping' as const,
    title: `Payment confirmed for order ${number}`,
    message: [
      { text: `Your payment for order ${number} was confirmed. ` },
      { text: money(Number.isFinite(paidCents) ? paidCents : Math.max(0, grossCents - commissionCents)), emphasis: 'blue' as const },
      { text: ' was deducted from your wallet. Your 15% commission is ' },
      { text: money(Number.isFinite(commissionCents) ? commissionCents : 0), emphasis: 'blue' as const },
      { text: '. The order is waiting for admin confirmation.' },
    ],
    tone: 'success' as const,
    href: '/seller/dashboard?tab=orders',
    dedupeKey: `consign-order-payment:${order.id}`,
  };
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

  if ((sellerStatus === 'delivered' || status.startsWith('Received')) && order.settlementAdjustmentId) {
    const grossCents = grossCentsFor(order);
    const amountText = Number.isFinite(grossCents) ? money(grossCents) : `$${amount.toFixed(2)}`;
    return {
      title: `Order ${number} delivered and wallet credited`,
      message: [
        { text: `Order ${number} for ${product} has been delivered. ` },
        { text: amountText, emphasis: 'blue' as const },
        { text: ' has been credited back to your wallet. Your order commission is already included in your earnings.' },
      ],
      tone: 'success' as const,
      category: 'Earnings & Settlements' as const,
      href: '/seller/dashboard?tab=wallet',
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

function processSellerConsignPayment(
  sellerEmail: string,
  body: any
): NextResponse {
  const orderIds = Array.from(new Set(
    (Array.isArray(body?.orderIds) ? body.orderIds : [])
      .map((value: unknown) => String(value || '').trim())
      .filter(Boolean)
  ));
  if (!orderIds.length) {
    return NextResponse.json({ success: false, error: 'Select at least one unpaid consignment order.' }, { status: 400 });
  }

  const existingOrders = readOrdersFile();
  const selected = orderIds.map((id) => existingOrders.find((order) => order.id === id));
  if (selected.some((order) => !order)) {
    return NextResponse.json({ success: false, error: 'One or more orders could not be found. Refresh your Orders page.' }, { status: 404 });
  }
  const orders = selected as PersistedConsignOrder[];
  if (orders.some((order) => String(order.merchantEmail || '').trim().toLowerCase() !== sellerEmail)) {
    return NextResponse.json({ success: false, error: 'You can only pay for orders assigned to your seller account.' }, { status: 403 });
  }

  const paymentRows = orders.map((order) => {
    const grossCents = grossCentsFor(order);
    if (!Number.isSafeInteger(grossCents) || grossCents <= 0) {
      return { order, grossCents, commissionCents: Number.NaN, payableCents: Number.NaN, existingAdjustment: undefined };
    }
    const commissionCents = commissionCentsFor(grossCents);
    return {
      order,
      grossCents,
      commissionCents,
      payableCents: grossCents - commissionCents,
      existingAdjustment: findSellerWalletAdjustment(sellerEmail, `consign-order-payment:${order.id}`),
    };
  });

  if (paymentRows.some((row) => !Number.isSafeInteger(row.commissionCents) || row.commissionCents < 0 || row.commissionCents >= row.grossCents)) {
    return NextResponse.json({ success: false, error: 'One or more orders have an invalid amount.' }, { status: 400 });
  }

  const rowsToCharge = paymentRows.filter((row) => !row.existingAdjustment && !row.order.paymentAdjustmentId && !row.order.sellerPaidAt);
  const legacyPaidOrder = paymentRows.some((row) =>
    !row.existingAdjustment && !row.order.paymentAdjustmentId && !row.order.sellerPaidAt &&
    (sellerStageFor(row.order) !== 'awaiting_payment' || !String(row.order.status || '').toLowerCase().startsWith('awaiting payment'))
  );
  if (legacyPaidOrder) {
    return NextResponse.json({ success: false, error: 'One or more orders are already paid or no longer awaiting payment. Refresh your Orders page.' }, { status: 409 });
  }

  const newPayableCents = rowsToCharge.reduce((sum, row) => sum + row.payableCents, 0);
  if (newPayableCents > 0) {
    const clientWalletCents = Number(body?.walletBalanceCents);
    const clientAdjustmentTotalCents = Number(body?.walletAdjustmentTotalCents);
    if (!Number.isSafeInteger(clientWalletCents) || clientWalletCents < 0 || !Number.isSafeInteger(clientAdjustmentTotalCents)) {
      return NextResponse.json({ success: false, error: 'Refresh your wallet and try the payment again.' }, { status: 400 });
    }

    const currentAdjustmentTotalCents = getSellerWalletAdjustmentTotalCents(sellerEmail);
    const availableWalletCents = clientWalletCents + currentAdjustmentTotalCents - clientAdjustmentTotalCents;
    if (!Number.isSafeInteger(availableWalletCents) || availableWalletCents < newPayableCents) {
      const shortfall = Math.max(0, newPayableCents - availableWalletCents);
      return NextResponse.json({
        success: false,
        error: `Insufficient wallet balance. You need ${money(shortfall)} more to pay these orders. Please top up your wallet.`,
      }, { status: 409 });
    }
  }

  const updatedAt = new Date().toISOString();
  const updates = new Map<string, PersistedConsignOrder>();
  for (const row of paymentRows) {
    const { order, grossCents, commissionCents, payableCents } = row;
    let adjustment = row.existingAdjustment;
    if (!adjustment && !order.paymentAdjustmentId && !order.sellerPaidAt) {
      const result = addSellerWalletAdjustment({
        sellerEmail,
        amountCents: -payableCents,
        reason: `Consignment order ${order.orderNumber || order.id} payment (85% after 15% commission)`,
        dedupeKey: `consign-order-payment:${order.id}`,
        eventType: 'consign-order-payment',
      });
      adjustment = result.adjustment;
    }
    const saved: PersistedConsignOrder = {
      ...order,
      amount: grossCents / 100,
      commission: commissionCents / 100,
      commissionRate: '15%',
      sellerCommission: commissionCents / 100,
      sellerPaidAmount: payableCents / 100,
      sellerPaidAt: order.sellerPaidAt || updatedAt,
      paymentAdjustmentId: order.paymentAdjustmentId || adjustment?.id,
      status: order.status.startsWith('Paid') ? order.status : 'Paid · awaiting admin confirmation',
      sellerStatus: order.sellerStatus || 'awaiting_payment',
      updatedAt,
    };
    updates.set(order.id, saved);
  }

  const nextOrders = existingOrders.map((order) => updates.get(order.id) || order);
  writeOrdersFile(nextOrders);

  for (const row of paymentRows) {
    const saved = updates.get(row.order.id)!;
    const notification = sellerPaymentNotification(saved);
    tryNotifySeller(notification);
  }

  const updatedOrders = paymentRows.map((row) => updates.get(row.order.id)!);
  const grossCents = paymentRows.reduce((sum, row) => sum + row.grossCents, 0);
  const commissionCents = paymentRows.reduce((sum, row) => sum + row.commissionCents, 0);
  const payableCents = paymentRows.reduce((sum, row) => sum + row.payableCents, 0);
  return NextResponse.json({
    success: true,
    duplicate: rowsToCharge.length === 0,
    orders: updatedOrders,
    orderCount: updatedOrders.length,
    gross: grossCents / 100,
    commission: commissionCents / 100,
    payable: payableCents / 100,
    walletAdjustmentTotalCents: getSellerWalletAdjustmentTotalCents(sellerEmail),
  });
}

export async function GET(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    const sellerEmail = getRequestSellerEmail(request);
    if (!admin && !sellerEmail) return NextResponse.json({ success: false, error: 'Sign in to an admin or seller account.' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const requestedMerchantEmail = (searchParams.get('merchantEmail') || '').trim().toLowerCase();
    if (!admin && requestedMerchantEmail && requestedMerchantEmail !== sellerEmail) {
      return NextResponse.json({ success: false, error: 'You can only view orders assigned to your seller account.' }, { status: 403 });
    }
    const merchantEmail = admin ? requestedMerchantEmail : sellerEmail;
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
    const body = await request.json();
    if (body?.action === 'seller-pay') {
      const sellerEmail = getRequestSellerEmail(request);
      if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
      return processSellerConsignPayment(sellerEmail, body);
    }
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
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
    const { id, orderNumber, status, sellerStatus } = body || {};

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
    if (!previousOrder) return NextResponse.json({ success: true, order: null });

    const allowedStages: ConsignSellerStage[] = ['awaiting_payment', 'confirmed', 'picked_up', 'on_the_way', 'delivered'];
    if (sellerStatus !== undefined && !allowedStages.includes(sellerStatus)) {
      return NextResponse.json({ success: false, error: 'The requested order stage is invalid.' }, { status: 400 });
    }

    const previousStage = sellerStageFor(previousOrder);
    const nextStage = sellerStatus as ConsignSellerStage | undefined;
    const nextStageByStage: Partial<Record<ConsignSellerStage, ConsignSellerStage>> = {
      awaiting_payment: 'confirmed',
      confirmed: 'picked_up',
      picked_up: 'on_the_way',
      on_the_way: 'delivered',
    };
    if (nextStage && nextStage !== previousStage) {
      if (nextStageByStage[previousStage] !== nextStage) {
        return NextResponse.json({ success: false, error: 'Advance the order one stage at a time.' }, { status: 409 });
      }
      if (!orderHasBeenPaid(previousOrder)) {
        return NextResponse.json({ success: false, error: 'The seller must pay the order before admin confirmation.' }, { status: 409 });
      }
    }

    const deliveryNeedsSettlement = nextStage === 'delivered' && !previousOrder.settlementAdjustmentId;
    let settlementAdjustmentId = previousOrder.settlementAdjustmentId;
    let settledAt = previousOrder.settledAt;
    if (deliveryNeedsSettlement) {
      if (!orderHasBeenPaid(previousOrder)) {
        return NextResponse.json({ success: false, error: 'This order cannot be settled because seller payment was not recorded.' }, { status: 409 });
      }
      if (previousStage !== 'on_the_way' && previousStage !== 'delivered') {
        return NextResponse.json({ success: false, error: 'Mark the order on the way before marking it delivered.' }, { status: 409 });
      }
      const grossCents = grossCentsFor(previousOrder);
      if (!Number.isSafeInteger(grossCents) || grossCents <= 0) {
        return NextResponse.json({ success: false, error: 'This order has an invalid amount and cannot be settled.' }, { status: 400 });
      }
      const adjustment = addSellerWalletAdjustment({
        sellerEmail: String(previousOrder.merchantEmail || '').trim().toLowerCase(),
        amountCents: grossCents,
        reason: `Consignment order ${previousOrder.orderNumber || previousOrder.id} delivered; full order amount returned to seller wallet`,
        dedupeKey: `consign-order-delivery:${previousOrder.id}`,
        eventType: 'consign-order-delivery',
      });
      settlementAdjustmentId = adjustment.adjustment.id;
      settledAt = previousOrder.settledAt || adjustment.adjustment.createdAt;
    }

    const updatedAt = new Date().toISOString();

    const nextOrders: PersistedConsignOrder[] = existing.map((order) => {
      if (matchesOrder(order)) {
        return {
          ...order,
          ...(status !== undefined ? { status } : {}),
          ...(sellerStatus !== undefined ? { sellerStatus } : {}),
          ...(nextStage === 'confirmed' && !previousOrder.adminConfirmedAt ? { adminConfirmedAt: updatedAt } : {}),
          ...(settlementAdjustmentId ? { settlementAdjustmentId, settledAt } : {}),
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
      const settlementAdded = Boolean(deliveryNeedsSettlement && settlementAdjustmentId);
      if ((changed || settlementAdded) && updatedOrder.merchantEmail) {
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
