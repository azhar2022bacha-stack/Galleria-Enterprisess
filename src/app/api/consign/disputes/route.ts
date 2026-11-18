import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

type DisputeStatus = 'open' | 'refunded' | 'rejected';

interface DisputeMessage {
  id: string;
  authorRole: 'admin' | 'seller';
  author: string;
  text: string;
  createdAt: string;
  productIds?: string[];
  productNames?: string[];
}

interface DisputeProduct {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

interface DisputeRecord {
  id: string;
  orderId?: string;
  orderNumber: string;
  productName: string;
  shop: string;
  shopperName?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerStreetAddress?: string;
  products?: DisputeProduct[];
  unreadAdminCount?: number;
  unreadSellerCount?: number;
  reason: string;
  amount: string;
  openedAt: string;
  updatedAt: string;
  status: DisputeStatus;
  messages: DisputeMessage[];
}

const DISPUTES_FILE = path.join(process.cwd(), 'src', 'data', 'admin_disputes.json');
const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'consign_orders.json');
const REFUNDS_FILE = path.join(process.cwd(), 'src', 'data', 'consign_refunds.json');
const SELLERS_FILE = path.join(process.cwd(), 'src', 'data', 'sellers.json');

function readArray(file: string): any[] {
  try {
    if (!fs.existsSync(file)) return [];
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDisputes(disputes: DisputeRecord[]): void {
  const directory = path.dirname(DISPUTES_FILE);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  const temporaryFile = `${DISPUTES_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(disputes, null, 2), 'utf8');
  fs.renameSync(temporaryFile, DISPUTES_FILE);
}

function sellerEmailFromRequest(request: Request): string {
  return getRequestSellerEmail(request);
}

function productUnreadSummary(disputes: DisputeRecord[], readerRole: 'admin' | 'seller') {
  const counts = new Map<string, { id?: string; name: string; count: number }>();
  const incomingAuthor = readerRole === 'admin' ? 'seller' : 'admin';

  for (const dispute of disputes) {
    let unreadRemaining = Math.max(0, Number(readerRole === 'admin' ? dispute.unreadAdminCount : dispute.unreadSellerCount) || 0);
    if (!unreadRemaining) continue;
    const knownProducts = Array.isArray(dispute.products) ? dispute.products : [];

    for (let index = (dispute.messages || []).length - 1; index >= 0 && unreadRemaining > 0; index -= 1) {
      const message = dispute.messages[index];
      if (message.authorRole !== incomingAuthor) continue;
      unreadRemaining -= 1;

      const messageIds = Array.isArray(message.productIds) ? [...new Set(message.productIds.map((id) => String(id || '').trim()).filter(Boolean))] : [];
      const messageNames = Array.isArray(message.productNames) ? [...new Set(message.productNames.map((name) => String(name || '').trim()).filter(Boolean))] : [];
      let relatedProducts: Array<{ id?: string; name: string }> = [];

      if (messageIds.length) {
        relatedProducts = knownProducts
          .filter((product) => product.id && messageIds.includes(product.id))
          .map((product) => ({ id: product.id, name: product.name }));
        messageIds.forEach((id, productIndex) => {
          if (!relatedProducts.some((product) => product.id === id)) {
            relatedProducts.push({ id, name: messageNames[productIndex] || dispute.productName });
          }
        });
      } else if (messageNames.length) {
        relatedProducts = messageNames.map((name) => {
          const known = knownProducts.find((product) => product.name.trim().toLowerCase() === name.toLowerCase());
          return { id: known?.id, name };
        });
      } else {
        relatedProducts = knownProducts.length
          ? knownProducts.map((product) => ({ id: product.id, name: product.name }))
          : [{ name: dispute.productName || 'Order item' }];
      }

      const countedInThisMessage = new Set<string>();
      for (const product of relatedProducts) {
        const name = String(product.name || dispute.productName || 'Order item').trim();
        const key = product.id ? `id:${product.id}` : `name:${name.toLowerCase()}`;
        if (countedInThisMessage.has(key)) continue;
        countedInThisMessage.add(key);
        const existing = counts.get(key);
        counts.set(key, { id: product.id, name, count: (existing?.count || 0) + 1 });
      }
    }
  }

  return Array.from(counts.values());
}

function normalizedOrderNumber(value: unknown): string {
  return String(value || '').trim().replace(/^#/, '').toLowerCase();
}

function findOrder(orderNumber: string, orderId?: string, orders = readArray(ORDERS_FILE)) {
  return orders.find((order) =>
    (orderId && String(order.id) === orderId) ||
    normalizedOrderNumber(order.orderNumber) === normalizedOrderNumber(orderNumber)
  );
}

function textValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function addressValue(profile: any): string {
  const direct = [profile?.sellerStreetAddress, profile?.streetAddress, profile?.businessAddress, profile?.address, profile?.street]
    .map(textValue)
    .find(Boolean);
  if (direct) return direct;
  const value = profile?.sellerStreetAddress ?? profile?.streetAddress ?? profile?.businessAddress ?? profile?.address ?? profile?.street;
  if (value && typeof value === 'object') {
    return [value.street, value.addressLine1, value.addressLine2, value.apt, value.city, value.state, value.postalCode, value.country]
      .map(textValue)
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

function orderProducts(order: any, fallbackName: string): DisputeProduct[] {
  const items = Array.isArray(order?.products) ? order.products : [];
  const products = items.map((item: any) => {
    const price = Number(item?.price || 0);
    const quantity = Math.max(1, Number(item?.quantity || 1));
    return {
      id: textValue(item?.id) || undefined,
      name: textValue(item?.title || item?.name) || fallbackName || 'Product',
      price,
      quantity,
      lineTotal: Number((price * quantity).toFixed(2)),
    };
  });
  if (products.length) return products;

  const quantity = Math.max(1, Number(order?.itemCount || 1));
  const total = Number(order?.amount ?? order?.cost ?? 0);
  const price = Number((total / quantity).toFixed(2));
  return [{ name: fallbackName || textValue(order?.itemTitle) || 'Order item', price, quantity, lineTotal: total }];
}

function orderDetails(dispute: DisputeRecord, order: any, sellers: any[]): Partial<DisputeRecord> {
  if (!order) return {};
  const sellerEmail = textValue(order.merchantEmail || dispute.sellerEmail).toLowerCase();
  const seller = sellers.find((item) => textValue(item?.email).toLowerCase() === sellerEmail);
  const phone = [seller?.phone, order.sellerPhone, order.merchantPhone]
    .map(textValue)
    .find((value) => Boolean(value) && value !== '+1 555-0100') || '';
  const existingPhone = textValue(dispute.sellerPhone);
  const sellerName = textValue(seller?.fullName || seller?.sellerName || seller?.ownerName || order.sellerName || order.ownerName || order.merchantName);
  const shopperName = textValue(order.shopperName || order.shippingAddress?.recipient || order.customerName) || dispute.shopperName;
  const streetAddress = addressValue(seller) || addressValue(order);
  const name = textValue(order.itemTitle || dispute.productName || 'Order');
  return {
    orderId: textValue(order.id) || dispute.orderId,
    orderNumber: textValue(order.orderNumber) || dispute.orderNumber,
    productName: name,
    shop: textValue(order.shopName) || dispute.shop,
    shopperName,
    sellerName: sellerName || dispute.sellerName,
    sellerEmail: sellerEmail || undefined,
    sellerPhone: phone || (existingPhone && existingPhone !== '+1 555-0100' ? existingPhone : undefined),
    sellerStreetAddress: streetAddress || dispute.sellerStreetAddress,
    products: orderProducts(order, name),
  };
}

function refundRecordToDispute(refund: any, current: DisputeRecord | undefined, sellers: any[], orders: any[]): DisputeRecord {
  const now = new Date().toISOString();
  const orderCode = String(refund.orderCode || refund.orderId || current?.orderNumber || '');
  const amount = Number(refund.amount || 0);
  const order = findOrder(orderCode, String(refund.orderId || current?.orderId || '') || undefined, orders) || refund.orderSnapshot;
  const updated: DisputeRecord = {
    id: current?.id || `consign-${String(refund.orderId || refund.id)}`,
    orderId: String(refund.orderId || current?.orderId || '') || undefined,
    orderNumber: orderCode,
    productName: String(refund.productTitle || current?.productName || 'Consign order'),
    shop: String(refund.shopName || current?.shop || '—'),
    sellerName: current?.sellerName,
    sellerEmail: String(refund.sellerEmail || current?.sellerEmail || '').trim().toLowerCase() || undefined,
    sellerPhone: current?.sellerPhone,
    sellerStreetAddress: current?.sellerStreetAddress,
    products: current?.products,
    reason: String(current?.reason || refund.reason || 'Consign order refunded by an administrator.'),
    amount: `$${amount.toFixed(2)}`,
    openedAt: current?.openedAt || String(refund.createdAt || now),
    updatedAt: now,
    status: 'refunded',
    messages: current?.messages || [],
  };
  Object.assign(updated, orderDetails(updated, order, sellers));
  if (current && current.status === 'refunded' && current.orderId === updated.orderId && current.amount === updated.amount) {
    return { ...updated, updatedAt: current.updatedAt, reason: current.reason };
  }
  return updated;
}

function loadAndSyncRefunds(sellers: any[]): DisputeRecord[] {
  const disputes = readArray(DISPUTES_FILE) as DisputeRecord[];
  const orders = readArray(ORDERS_FILE);
  let changed = false;
  for (const refund of readArray(REFUNDS_FILE)) {
    if (String(refund.status || '').toLowerCase() !== 'refunded') continue;
    const current = disputes.find((item) =>
      (refund.orderId && item.orderId === refund.orderId) || item.id === `consign-${String(refund.orderId || refund.id)}`
    );
    const next = refundRecordToDispute(refund, current, sellers, orders);
    if (!current) {
      disputes.unshift(next);
      changed = true;
    } else {
      const nextKeys = Object.keys(next) as (keyof DisputeRecord)[];
      if (nextKeys.some((key) => JSON.stringify(current[key]) !== JSON.stringify(next[key]))) {
        Object.assign(current, next);
        changed = true;
      }
    }
  }
  for (const dispute of disputes) {
    const order = findOrder(dispute.orderNumber, dispute.orderId, orders);
    const details = orderDetails(dispute, order, sellers);
    if (Object.keys(details).some((key) => JSON.stringify((dispute as any)[key]) !== JSON.stringify((details as any)[key]))) {
      Object.assign(dispute, details);
      changed = true;
    }
  }
  if (changed) writeDisputes(disputes);
  return disputes.sort((a, b) => String(b.updatedAt || b.openedAt).localeCompare(String(a.updatedAt || a.openedAt)));
}

function sanitizeLegacyDispute(input: any, existing: DisputeRecord | undefined, sellers: any[], orders: any[]): DisputeRecord | null {
  const id = String(input?.id || existing?.id || '').trim().slice(0, 120);
  const orderNumber = String(input?.orderNumber || existing?.orderNumber || '').trim().slice(0, 120);
  if (!id || !orderNumber) return null;
  const order = findOrder(orderNumber, String(input?.orderId || existing?.orderId || '') || undefined, orders);
  const status = (input?.status || existing?.status) === 'rejected' ? 'rejected' : 'open';
  const now = new Date().toISOString();
  const dispute: DisputeRecord = {
    id,
    orderId: order?.id || existing?.orderId,
    orderNumber: String(order?.orderNumber || orderNumber),
    productName: String(order?.itemTitle || input?.productName || existing?.productName || 'Order').slice(0, 200),
    shop: String(order?.shopName || input?.shop || existing?.shop || '—').slice(0, 200),
    sellerName: existing?.sellerName,
    sellerEmail: String(order?.merchantEmail || input?.sellerEmail || existing?.sellerEmail || '').trim().toLowerCase() || undefined,
    sellerPhone: existing?.sellerPhone,
    sellerStreetAddress: existing?.sellerStreetAddress,
    products: existing?.products,
    reason: String(input?.reason || existing?.reason || 'Dispute opened for review.').slice(0, 1000),
    amount: order ? `$${Number(order.cost || 0).toFixed(2)}` : String(input?.amount || existing?.amount || '$0.00').slice(0, 40),
    openedAt: String(input?.openedAt || existing?.openedAt || now),
    updatedAt: existing?.updatedAt || now,
    status: existing?.status === 'refunded' ? 'refunded' : status,
    messages: Array.isArray(existing?.messages) ? existing.messages : [],
  };
  Object.assign(dispute, orderDetails(dispute, order, sellers));
  return dispute;
}

export async function GET(request: Request) {
  const admin = await getRequestAdmin(request);
  const sellerEmail = sellerEmailFromRequest(request);
  const searchParams = new URL(request.url).searchParams;
  const scope = searchParams.get('scope');
  const sellerView = scope === 'seller';
  const adminView = scope === 'admin';
  if (adminView && !admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  if (sellerView && !sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  if (!sellerView && !adminView && !admin && !sellerEmail) return NextResponse.json({ success: false, error: 'Sign-in is required.' }, { status: 401 });

  const disputes = searchParams.get('summary') === '1'
    ? readArray(DISPUTES_FILE) as DisputeRecord[]
    : loadAndSyncRefunds(readArray(SELLERS_FILE));
  const visible = adminView || (!sellerView && !adminView && admin)
    ? disputes
    : disputes.filter((item) => item.sellerEmail?.trim().toLowerCase() === sellerEmail);
  if (searchParams.get('summary') === '1') {
    const readerIsAdmin = adminView || (!sellerView && !adminView && Boolean(admin));
    const unreadCount = visible.reduce((total, item) => total + Math.max(0, Number(readerIsAdmin ? item.unreadAdminCount : item.unreadSellerCount) || 0), 0);
    return NextResponse.json({ success: true, unreadCount, unreadProducts: productUnreadSummary(visible, readerIsAdmin ? 'admin' : 'seller') });
  }
  return NextResponse.json({ success: true, disputes: visible });
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await request.json();
    if (body?.action !== 'sync' || !Array.isArray(body.disputes)) {
      return NextResponse.json({ success: false, error: 'A dispute sync payload is required.' }, { status: 400 });
    }

    const sellers = readArray(SELLERS_FILE);
    const orders = readArray(ORDERS_FILE);
    const disputes = loadAndSyncRefunds(sellers);
    for (const item of body.disputes) {
      const existing = disputes.find((entry) => entry.id === String(item?.id || '').trim());
      const normalized = sanitizeLegacyDispute(item, existing, sellers, orders);
      if (!normalized) continue;
      if (existing) {
        Object.assign(existing, {
          orderId: existing.orderId || normalized.orderId,
          orderNumber: normalized.orderNumber,
          productName: normalized.productName,
          shop: normalized.shop,
          sellerName: normalized.sellerName || existing.sellerName,
          sellerEmail: normalized.sellerEmail || existing.sellerEmail,
          sellerPhone: normalized.sellerPhone || existing.sellerPhone,
          sellerStreetAddress: normalized.sellerStreetAddress || existing.sellerStreetAddress,
          products: normalized.products || existing.products,
          reason: normalized.reason,
          amount: normalized.amount,
          status: existing.status,
          messages: Array.isArray(existing.messages) ? existing.messages : [],
        });
      } else {
        disputes.push(normalized);
      }
    }
    writeDisputes(disputes);
    return NextResponse.json({ success: true, disputes });
  } catch (error) {
    console.error('Unable to sync admin disputes:', error);
    return NextResponse.json({ success: false, error: 'Unable to save disputes.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    const sellerEmail = sellerEmailFromRequest(request);
    if (!admin && !sellerEmail) return NextResponse.json({ success: false, error: 'Sign-in is required.' }, { status: 401 });

    const body = await request.json();
    const id = String(body?.id || '').trim();
    const action = String(body?.action || '');
    const disputes = loadAndSyncRefunds(readArray(SELLERS_FILE));

    if (action === 'mark-read') {
      const role = String(body?.role || '');
      const disputeId = String(body?.id || '').trim();
      let changed = false;
      if (role === 'admin') {
        if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 403 });
        for (const dispute of disputes) {
          if ((!disputeId || dispute.id === disputeId) && Number(dispute.unreadAdminCount) > 0) {
            dispute.unreadAdminCount = 0;
            changed = true;
          }
        }
      } else if (role === 'seller') {
        if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 403 });
        for (const dispute of disputes) {
          if ((!disputeId || dispute.id === disputeId) && dispute.sellerEmail?.trim().toLowerCase() === sellerEmail && Number(dispute.unreadSellerCount) > 0) {
            dispute.unreadSellerCount = 0;
            changed = true;
          }
        }
      } else {
        return NextResponse.json({ success: false, error: 'A valid reader role is required.' }, { status: 400 });
      }
      if (changed) writeDisputes(disputes);
      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    const target = disputes.find((item) => item.id === id);
    if (!target) return NextResponse.json({ success: false, error: 'Dispute not found.' }, { status: 404 });

    if (action === 'reply') {
      // A browser can hold both an admin session and a seller session. For a
      // seller reply, authorize against the seller cookie and the dispute owner;
      // the separate admin cookie must not invalidate a matching seller login.
      if (!sellerEmail || target.sellerEmail?.trim().toLowerCase() !== sellerEmail) {
        return NextResponse.json({ success: false, error: 'This dispute does not belong to your seller account.' }, { status: 403 });
      }
    } else if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin sign-in is required for this action.' }, { status: 403 });
    }

    const now = new Date().toISOString();
    if (action === 'status') {
      const status = body?.status as DisputeStatus;
      if (status !== 'rejected' && status !== 'refunded') {
        return NextResponse.json({ success: false, error: 'Status must be refunded or rejected.' }, { status: 400 });
      }
      if (target.status !== 'open' && target.status !== status) {
        return NextResponse.json({ success: false, error: `This dispute is already ${target.status}.` }, { status: 409 });
      }
      if (status === 'refunded') {
        const refund = readArray(REFUNDS_FILE).find((item) => item.orderId === target.orderId && item.status === 'Refunded');
        if (!refund) return NextResponse.json({ success: false, error: 'Complete the linked order refund before changing this dispute to Refunded.' }, { status: 409 });
      }
      target.status = status;
      target.updatedAt = now;
    } else if (action === 'message' || action === 'reply') {
      const text = String(body?.text || '').trim();
      if (!text || text.length > 2000) return NextResponse.json({ success: false, error: 'Enter a message of 1 to 2,000 characters.' }, { status: 400 });
      target.messages = Array.isArray(target.messages) ? target.messages : [];
      const relatedProducts = target.products || [];
      const productIds = [...new Set(relatedProducts.map((product) => String(product.id || '').trim()).filter(Boolean))];
      const productNames = [...new Set(relatedProducts.map((product) => String(product.name || '').trim()).filter(Boolean))];
      if (!productNames.length && target.productName) productNames.push(target.productName);
      target.messages.push({
        id: randomUUID(),
        authorRole: action === 'reply' ? 'seller' : 'admin',
        author: action === 'reply' ? sellerEmail : (admin?.email || 'Admin'),
        text,
        createdAt: now,
        productIds,
        productNames,
      });
      if (action === 'reply') target.unreadAdminCount = Math.max(0, Number(target.unreadAdminCount) || 0) + 1;
      else target.unreadSellerCount = Math.max(0, Number(target.unreadSellerCount) || 0) + 1;
      target.updatedAt = now;
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported dispute action.' }, { status: 400 });
    }

    writeDisputes(disputes);
    return NextResponse.json({ success: true, dispute: target });
  } catch (error) {
    console.error('Unable to update dispute:', error);
    return NextResponse.json({ success: false, error: 'Unable to update dispute.' }, { status: 500 });
  }
}
