/**
 * Seller order store.
 *
 * Shared between the storefront checkout (which creates orders) and the
 * seller portal (which manages them). Persisted in localStorage so data
 * survives refreshes and is visible across tabs.
 */

import { sendSellerNotification } from './sellerNotifications';


export type SellerOrderStatus =
  | 'awaiting_payment'
  | 'confirmed'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered';

export interface SellerOrderProduct {
  id: string;
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderShippingAddress {
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

export interface SellerOrderHistoryEntry {
  status: SellerOrderStatus;
  at: string; // ISO date
}

export type SellerOrderOutcome = 'Cancelled' | 'Refunded' | 'Rejected';

export interface SellerOrder {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerLocation: string;
  shippingAddress?: OrderShippingAddress;
  products: SellerOrderProduct[];
  amount: number;
  commission?: number;
  commissionRate?: string;
  sellerPaidAmount?: number;
  sellerCommission?: number;
  sellerPaidAt?: string;
  paymentAdjustmentId?: string;
  adminConfirmedAt?: string;
  settledAt?: string;
  settlementAdjustmentId?: string;
  paymentMethod: string;
  status: SellerOrderStatus;
  outcome?: SellerOrderOutcome;
  createdAt: string;
  history: SellerOrderHistoryEntry[];
  sellerEmail?: string;
  merchantEmail?: string;
  merchantName?: string;
  source?: 'checkout' | 'consign';
  consignOrderId?: string;

}

export const ORDER_STATUS_FLOW: SellerOrderStatus[] = [
  'awaiting_payment',
  'confirmed',
  'picked_up',
  'on_the_way',
  'delivered',
];

export const ORDER_STATUS_LABEL: Record<SellerOrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  picked_up: 'Picked up',
  on_the_way: 'On the way',
  delivered: 'Delivered',
};

/** Label for the button that moves an order to its next status. */
export const ORDER_NEXT_ACTION_LABEL: Record<SellerOrderStatus, string | null> = {
  awaiting_payment: 'Confirm',
  confirmed: 'Mark picked up',
  picked_up: 'Ship',
  on_the_way: 'Mark delivered',
  delivered: null,
};

export const CONSIGN_ORDERS_STORAGE_KEY = 'galleria_consign_orders_v3';
const ORDERS_KEY = 'galleria_seller_orders';
const WALLET_KEY = 'galleria_seller_wallet';
const LOW_WALLET_ALERT_THRESHOLD = 10;
const LOW_WALLET_ALERT_KEY = 'galleria_low_wallet_alert';
const TRANSACTIONS_KEY = 'galleria_seller_transactions';
const RESALE_KEY = 'galleria_seller_resale_settlements';
const COMMISSIONS_KEY = 'galleria_seller_commissions';
const REFUNDS_KEY = 'galleria_seller_refunds';
const QUERIES_KEY = 'galleria_seller_queries';
const PACKAGE_TIER_KEY = 'galleria_seller_package_tier';
const PACKAGE_SPEND_KEY = 'galleria_seller_package_spend';
const ALERT_EMAIL_KEY = 'galleria_seller_alert_email';
const OPERATIONS_KEY = 'galleria_seller_operations_messages';
const KYC_STATUS_KEY = 'galleria_seller_kyc_status';
const KYC_DATA_KEY = 'galleria_seller_kyc_data';
const PRODUCTS_KEY = 'galleria_seller_products';
const SHOP_SETTINGS_KEY = 'galleria_seller_shop_settings';
export const ORDERS_CHANGED_EVENT = 'galleria:seller-orders-changed';
export const SELLER_PRODUCTS_CHANGED_EVENT = 'galleria:seller-products-changed';

export interface ShopSettings {
  shopName: string;
  description: string;
  logoUrl?: string;
}

export type KycStatus = 'Not verified' | 'Pending' | 'Verified';

export interface KycData {
  documentType: string;
  frontImage?: string;
  backImage?: string;
  submittedAt?: string;
}

export interface OperationsMessage {
  id: string;
  category: string;
  orderNo?: string;
  contactEmail?: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  status: 'Received' | 'Under Review' | 'Answered';
  reply?: string;
}

export { PACKAGE_TIERS, type PackageTierId, type PackageTier } from './packageTiers';
import { PACKAGE_TIERS, type PackageTierId, type PackageTier } from './packageTiers';

export interface ProductQuery {
  id: string;
  userName: string;
  productName: string;
  question: string;
  reply?: string;
  status: 'Open' | 'Replied';
  createdAt: string;
  source?: 'admin-consign';
  sellerEmail?: string;
  sellerName?: string;
  productId?: string;
  productImage?: string;
  orderId?: string;
  orderCode?: string;
  topic?: string;
  subject?: string;
  repliedAt?: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  orderCode: string;
  productTitle: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Refunded';
  reason: string;
  createdAt: string;
  source?: 'consign-admin';
  sellerEmail?: string;
  shopName?: string;
  shopperName?: string;
  shopperEmail?: string;
  commission?: number;
  commissionRate?: string;
  itemCount?: number;
  orderSnapshot?: {
    id: string;
    orderNumber?: string;
    shopName?: string;
    merchantEmail?: string;
    itemTitle?: string;
    itemCount?: number;
    shopperName?: string;
    shopperEmail?: string;
    shippingAddress?: OrderShippingAddress;
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
  };
}

export interface CommissionRecord {
  id: string;
  orderCode: string;
  source: string;
  earning: number;
  createdAt: string;
}

export interface WalletTransaction {
  reviewReason?: string;
  id: string;
  type: 'deposit' | 'withdrawal' | 'order_payout' | 'order_payment' | 'rebate';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
  network?: string;
  address?: string;
}

export interface ResaleSettlement {
  id: string;
  orderCode: string;
  productTitle: string;
  capital: number;
  rebate: number;
  total: number;
  date: string;
}

const isBrowser = () => typeof window !== 'undefined';

function emitChange() {
  if (isBrowser()) window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
}

const CONSIGN_STATUS_TO_SELLER: Record<string, SellerOrderStatus> = {
  'Awaiting payment': 'awaiting_payment',
  'Paid · awaiting admin confirmation': 'confirmed',
  'Paid · awaiting pickup': 'confirmed',
  'Paid · Escrow secured': 'confirmed',
  'Picked up': 'picked_up',
  'Picked up · transit hub': 'picked_up',
  'Shipped · in transit': 'on_the_way',
  'Received · settled': 'delivered',
  'Settled · Delivered': 'delivered',
};

const SELLER_STATUS_TO_CONSIGN: Record<SellerOrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Paid · awaiting pickup',
  picked_up: 'Picked up',
  on_the_way: 'Shipped · in transit',
  delivered: 'Received · settled',
};

function formatLocationFromShipping(
  shipping?: OrderShippingAddress,
  fallbackShopName?: string
): string {
  if (shipping) {
    const loc = [shipping.city, shipping.state, shipping.countryCode]
      .filter((part) => Boolean(part && part.trim()))
      .join(', ');
    if (loc) return loc;
  }
  return fallbackShopName ? `${fallbackShopName} (Consign)` : 'Wholesale Consignment';
}

function consignOrderStage(order: { status?: string; sellerStatus?: string; sellerPaidAt?: string }): SellerOrderStatus {
  const reported = order.sellerStatus as SellerOrderStatus;
  if (reported && reported !== 'awaiting_payment' && ORDER_STATUS_FLOW.includes(reported)) return reported;
  const stage = CONSIGN_STATUS_TO_SELLER[order.status || ''];
  if (stage && stage !== 'awaiting_payment') return stage;
  return order.sellerPaidAt ? 'confirmed' : 'awaiting_payment';
}

function consignOrderOutcome(order: { status?: string; refund?: { status?: string } }): SellerOrderOutcome | undefined {
  const status = String(order.status || '').trim().toLowerCase();
  if (status.startsWith('cancelled') || status.startsWith('canceled')) return 'Cancelled';
  if (status.startsWith('refunded') || order.refund?.status === 'Refunded') return 'Refunded';
  if (status.startsWith('rejected')) return 'Rejected';
  return undefined;
}

function buildSellerOrderFromConsignRecord(co: any): SellerOrder {
  const mappedStatus = consignOrderStage(co);
  const items =
    Array.isArray(co.products) && co.products.length > 0
      ? co.products
      : [
          {
            id: co.id,
            title: co.itemTitle || 'Consign Wholesale Product',
            quantity: co.itemCount || 1,
            price: typeof co.cost === 'number' ? co.cost : 50,
            image: co.imageUrl,
          },
        ];
  const computedItemsTotal = items.reduce(
    (s: number, it: any) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  const totalAmt =
    typeof co.amount === 'number'
      ? co.amount
      : computedItemsTotal > 0
      ? computedItemsTotal
      : typeof co.cost === 'number'
      ? co.cost * (co.itemCount || 1)
      : 0;

  const shipping: OrderShippingAddress | undefined = co.shippingAddress;

  return {
    id: co.id,
    code: co.orderNumber || co.id,
    customerName: shipping?.recipient || co.shopperName || 'Registered Shopper',
    customerEmail: shipping?.email || co.shopperEmail || 'customer@example.com',
    customerLocation: formatLocationFromShipping(shipping, co.shopName),
    shippingAddress: shipping,
    products: items.map((p: any) => ({
      id: p.id,
      title: p.title || p.name || 'Wholesale Item',
      quantity: p.quantity || 1,
      price: p.price || 19.99,
      image: p.image || p.imageUrl,
    })),
    amount: Math.round(totalAmt * 100) / 100,
    ...(Number.isFinite(Number(co.commission)) ? { commission: Number(co.commission) } : {}),
    ...(co.commissionRate ? { commissionRate: String(co.commissionRate) } : {}),
    ...(Number.isFinite(Number(co.sellerPaidAmount)) ? { sellerPaidAmount: Number(co.sellerPaidAmount) } : {}),
    ...(Number.isFinite(Number(co.sellerCommission ?? co.commission)) ? { sellerCommission: Number(co.sellerCommission ?? co.commission) } : {}),
    ...(co.sellerPaidAt ? { sellerPaidAt: co.sellerPaidAt } : {}),
    ...(co.paymentAdjustmentId ? { paymentAdjustmentId: co.paymentAdjustmentId } : {}),
    ...(co.adminConfirmedAt ? { adminConfirmedAt: co.adminConfirmedAt } : {}),
    ...(co.settledAt ? { settledAt: co.settledAt } : {}),
    ...(co.settlementAdjustmentId ? { settlementAdjustmentId: co.settlementAdjustmentId } : {}),
    paymentMethod: 'Consign Escrow',
    status: mappedStatus,
    outcome: consignOrderOutcome(co),
    createdAt:
      co.createdAt ||
      (co.date === 'Just now' || !co.date ? new Date().toISOString() : co.date),
    history: [{ status: mappedStatus, at: co.updatedAt || co.createdAt || new Date().toISOString() }],

    sellerEmail: co.merchantEmail || '',
    merchantEmail: co.merchantEmail || '',
    merchantName: co.shopName,
    source: 'consign',
    consignOrderId: co.id,
  };
}

export function getOrders(filterEmail?: string): SellerOrder[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    let parsed: SellerOrder[] = raw ? (JSON.parse(raw) as SellerOrder[]) : [];
    if (!Array.isArray(parsed)) parsed = [];

    // Auto-sync: import & hydrate any dispatched consign orders from CONSIGN_ORDERS_STORAGE_KEY
    const rawConsign = window.localStorage.getItem(CONSIGN_ORDERS_STORAGE_KEY);
    if (rawConsign) {
      try {
        const consignList = JSON.parse(rawConsign);
        if (Array.isArray(consignList)) {
          let modified = false;
          consignList.forEach((co: any) => {
            if (!co || !co.id) return;
            const existingIdx = parsed.findIndex(
              (so) => so.id === co.id || so.code === co.orderNumber || so.consignOrderId === co.id
            );
            if (existingIdx === -1) {
              parsed.unshift(buildSellerOrderFromConsignRecord(co));
              modified = true;
            } else {
              const existing = parsed[existingIdx];
              const mappedStatus = consignOrderStage(co);
              const outcome = consignOrderOutcome(co);
              const gross = co.amount;
              const newAmount = typeof gross === 'number' && Number.isFinite(gross) ? gross : existing.amount;
              const needShippingHydration = !existing.shippingAddress && Boolean(co.shippingAddress);
              const needStatusSync = existing.status !== mappedStatus && (existing.source === 'consign' || existing.consignOrderId === co.id);
              const needPaymentSync = Boolean(
                existing.sellerPaidAt !== co.sellerPaidAt ||
                existing.sellerPaidAmount !== co.sellerPaidAmount ||
                existing.commissionRate !== co.commissionRate ||
                existing.sellerCommission !== (co.sellerCommission ?? co.commission) ||
                existing.paymentAdjustmentId !== co.paymentAdjustmentId ||
                existing.adminConfirmedAt !== co.adminConfirmedAt ||
                existing.settledAt !== co.settledAt ||
                existing.settlementAdjustmentId !== co.settlementAdjustmentId
              );
              if (needShippingHydration || needStatusSync || needPaymentSync || outcome !== existing.outcome || newAmount !== existing.amount) {
                parsed[existingIdx] = {
                  ...existing,
                  amount: newAmount,
                  outcome,
                  ...(needShippingHydration
                    ? {
                        shippingAddress: co.shippingAddress,
                        customerLocation: formatLocationFromShipping(co.shippingAddress, existing.merchantName),
                      }
                    : {}),
                  ...(needStatusSync ? {
                    status: mappedStatus,
                    history: [
                      ...(Array.isArray(existing.history) ? existing.history : []),
                      { status: mappedStatus, at: co.updatedAt || new Date().toISOString() },
                    ],
                  } : {}),
                  ...(co.commissionRate ? { commissionRate: String(co.commissionRate) } : {}),
                  ...(Number.isFinite(Number(co.sellerPaidAmount)) ? { sellerPaidAmount: Number(co.sellerPaidAmount) } : {}),
                  ...(Number.isFinite(Number(co.sellerCommission ?? co.commission)) ? { sellerCommission: Number(co.sellerCommission ?? co.commission) } : {}),
                  ...(co.sellerPaidAt ? { sellerPaidAt: co.sellerPaidAt } : {}),
                  ...(co.paymentAdjustmentId ? { paymentAdjustmentId: co.paymentAdjustmentId } : {}),
                  ...(co.adminConfirmedAt ? { adminConfirmedAt: co.adminConfirmedAt } : {}),
                  ...(co.settledAt ? { settledAt: co.settledAt } : {}),
                  ...(co.settlementAdjustmentId ? { settlementAdjustmentId: co.settlementAdjustmentId } : {}),

                };
                modified = true;
              }
            }
          });
          if (modified) {
            window.localStorage.setItem(ORDERS_KEY, JSON.stringify(parsed));
          }
        }
      } catch {}
    }

    if (!filterEmail || !filterEmail.trim()) return parsed;
    const target = filterEmail.trim().toLowerCase();
    return parsed.filter((o) => {
      if (o.source === 'consign' || o.merchantEmail || o.sellerEmail) {
        if (o.sellerEmail && o.sellerEmail.toLowerCase() === target) return true;
        if (o.merchantEmail && o.merchantEmail.toLowerCase() === target) return true;
        if (!o.sellerEmail && !o.merchantEmail && o.merchantName?.toLowerCase() === target) return true;
        return false;
      }
      return (
        o.customerEmail.toLowerCase() === target ||
        (o.customerName && o.customerName.toLowerCase() === target)
      );
    });
  } catch {
    return [];
  }
}

let lastConsignStageHistorySyncAt = 0;
let consignStageHistorySyncPromise: Promise<void> | null = null;

async function syncConsignStatusHistoryFromNotifications(merchantEmail?: string): Promise<void> {
  if (!isBrowser()) return;
  let email = String(merchantEmail || '').trim().toLowerCase();
  if (!email) {
    try {
      email = String(JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}').email || '')
        .trim()
        .toLowerCase();
    } catch {}
  }
  if (!email) return;
  if (consignStageHistorySyncPromise) {
    await consignStageHistorySyncPromise;
    return;
  }
  if (Date.now() - lastConsignStageHistorySyncAt < 3000) return;
  lastConsignStageHistorySyncAt = Date.now();

  const request = (async () => {
    try {
      const response = await fetch('/api/seller/notifications?email=' + encodeURIComponent(email), {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data?.notifications)) return;

      const validStatuses: SellerOrderStatus[] = ['confirmed', 'picked_up', 'on_the_way', 'delivered'];
      const eventsByOrder = new Map<string, SellerOrderHistoryEntry[]>();
      for (const notification of data.notifications) {
        const parts = String(notification?.dedupeKey || '').split(':');
        if (parts[0] !== 'consign-order-update' || parts.length < 5) continue;
        const orderId = parts[1];
        const status = parts[3] as SellerOrderStatus;
        if (!orderId || !validStatuses.includes(status)) continue;
        const keyTimestamp = parts.slice(4).join(':');
        const timestamp = !Number.isNaN(Date.parse(keyTimestamp))
          ? keyTimestamp
          : String(notification.createdAt || '');
        if (!timestamp || Number.isNaN(Date.parse(timestamp))) continue;
        const events = eventsByOrder.get(orderId) || [];
        events.push({ status, at: timestamp });
        eventsByOrder.set(orderId, events);
      }
      if (eventsByOrder.size === 0) return;

      const currentOrders = getOrders(email);
      let changed = false;
      const updatedOrders = currentOrders.map((order) => {
        if (order.source !== 'consign' && !order.consignOrderId) return order;
        const orderId = order.consignOrderId || order.id;
        const updates = eventsByOrder.get(orderId);
        if (!updates?.length) return order;
        const history = Array.isArray(order.history) ? order.history : [];
        const known = new Set(history.map((entry) => String(entry.status) + '|' + String(entry.at)));
        const missing = updates.filter((entry) => !known.has(String(entry.status) + '|' + String(entry.at)));
        if (missing.length === 0) return order;
        changed = true;
        return {
          ...order,
          history: [...history, ...missing].sort((left, right) => Date.parse(left.at) - Date.parse(right.at)),
        };
      });
      if (changed) saveOrders(updatedOrders);
    } catch {}
  })();

  const trackedRequest = request.finally(() => {
    consignStageHistorySyncPromise = null;
  });
  consignStageHistorySyncPromise = trackedRequest;
  await trackedRequest;
}
/** Pulls dispatched consign orders from the server JSON store so separate browsers/profiles stay synced. */
export async function syncConsignOrdersFromServer(merchantEmail?: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    const query =
      merchantEmail && merchantEmail.trim()
        ? `?merchantEmail=${encodeURIComponent(merchantEmail.trim())}`
        : '';
    const res = await fetch(`/api/consign/orders${query}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.orders)) return;

    const rawConsign = window.localStorage.getItem(CONSIGN_ORDERS_STORAGE_KEY);
    let localConsign: any[] = rawConsign ? JSON.parse(rawConsign) : [];
    if (!Array.isArray(localConsign)) localConsign = [];

    const byId = new Map(localConsign.map((o: any) => [o.id, o]));
    let consignChanged = false;
    let walletSettlementAppeared = false;

    for (const srv of data.orders) {
      if (!srv?.id) continue;
      const cur = byId.get(srv.id);
      if (!cur) {
        localConsign.unshift(srv);
        byId.set(srv.id, srv);
        consignChanged = true;
        if (srv.settlementAdjustmentId) walletSettlementAppeared = true;
      } else if (
        cur.status !== srv.status ||
        cur.sellerStatus !== srv.sellerStatus ||
        cur.updatedAt !== srv.updatedAt ||
        (!cur.shippingAddress && srv.shippingAddress) ||
        (srv.refund && cur.refund?.id !== srv.refund.id) ||
        cur.sellerPaidAt !== srv.sellerPaidAt ||
        cur.sellerPaidAmount !== srv.sellerPaidAmount ||
        cur.amount !== srv.amount ||
        cur.commissionRate !== srv.commissionRate ||
        cur.sellerCommission !== (srv.sellerCommission ?? srv.commission) ||
        cur.paymentAdjustmentId !== srv.paymentAdjustmentId ||
        cur.adminConfirmedAt !== srv.adminConfirmedAt ||
        cur.settledAt !== srv.settledAt ||
        cur.settlementAdjustmentId !== srv.settlementAdjustmentId
      ) {
        if (srv.settlementAdjustmentId && cur.settlementAdjustmentId !== srv.settlementAdjustmentId) {
          walletSettlementAppeared = true;
        }
        const merged = {
          ...cur,
          status: srv.status || cur.status,
          sellerStatus: srv.sellerStatus || cur.sellerStatus,
          updatedAt: srv.updatedAt || cur.updatedAt,
          shippingAddress: srv.shippingAddress || cur.shippingAddress,
          refund: srv.refund || cur.refund,
          amount: Number.isFinite(Number(srv.amount ?? srv.cost)) ? Number(srv.amount ?? srv.cost) : cur.amount,
          commission: Number.isFinite(Number(srv.commission)) ? Number(srv.commission) : cur.commission,
          commissionRate: srv.commissionRate || cur.commissionRate,
          sellerPaidAt: srv.sellerPaidAt || cur.sellerPaidAt,
          sellerPaidAmount: Number.isFinite(Number(srv.sellerPaidAmount)) ? Number(srv.sellerPaidAmount) : cur.sellerPaidAmount,
          sellerCommission: Number.isFinite(Number(srv.sellerCommission ?? srv.commission)) ? Number(srv.sellerCommission ?? srv.commission) : cur.sellerCommission,
          paymentAdjustmentId: srv.paymentAdjustmentId || cur.paymentAdjustmentId,
          adminConfirmedAt: srv.adminConfirmedAt || cur.adminConfirmedAt,
          settledAt: srv.settledAt || cur.settledAt,
          settlementAdjustmentId: srv.settlementAdjustmentId || cur.settlementAdjustmentId,

        };
        localConsign = localConsign.map((item: any) => (item.id === srv.id ? merged : item));
        consignChanged = true;
      }
    }

    if (consignChanged) {
      window.localStorage.setItem(CONSIGN_ORDERS_STORAGE_KEY, JSON.stringify(localConsign));
      getOrders(); // Imports/hydrates into ORDERS_KEY
      emitChange();
    }
    if (walletSettlementAppeared) await syncApprovedRecharges();
    await syncConsignStatusHistoryFromNotifications(merchantEmail);
  } catch {}
}

function saveOrders(orders: SellerOrder[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  emitChange();
}

function sellerStorageKey(key: string): string {
 let email = '';
 if (typeof window !== 'undefined') { try { email = JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}').email || ''; } catch {} }
 return key + ':' + (email.trim().toLowerCase() || 'guest');
}

export function getSyncedWalletAdjustmentTotalCents(): number {
  if (!isBrowser()) return 0;
  const value = Number(window.localStorage.getItem(sellerStorageKey('galleria_admin_wallet_adjustments_total')) || '0');
  return Number.isSafeInteger(value) ? value : 0;
}

export function applySyncedWalletAdjustmentTotalCents(totalCents: number): void {
  if (!isBrowser() || !Number.isSafeInteger(totalCents)) return;
  const previousCents = getSyncedWalletAdjustmentTotalCents();
  const deltaCents = totalCents - previousCents;
  if (deltaCents !== 0) {
    setWallet((amountToCents(getWallet()) + deltaCents) / 100);
    window.localStorage.setItem(sellerStorageKey('galleria_admin_wallet_adjustments_total'), String(totalCents));
  }
}

export async function syncApprovedRecharges(): Promise<void> {
  if (!isBrowser()) return;
  let email = '';
  try {
    email = JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}').email || '';
  } catch {
    return;
  }
  email = email.trim().toLowerCase();
  if (!email) return;

  try {
    const response = await fetch(`/api/recharges?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (email !== resolveSellerEmail()) return;
      const known = new Set(getTransactions().map(tx => tx.id));
      for (const row of data.recharges || []) {
        const id = 'recharge-' + row.id;
        if (row.status === 'Rejected' && !known.has(id)) {
          addWalletTransaction({id, type:'deposit', amount:Number(row.amount), status:'rejected',
            description:'Deposit ' + row.reference, reviewReason:row.reviewReason, createdAt:row.reviewedAt || row.submittedAt});
          known.add(id);
        }
      }
      const approved = (data.recharges || []).filter((row: any) => row.status === 'Confirmed');
      const totalCents = approved.reduce(
        (sum: number, row: any) => sum + Math.round(Number(row.creditedAmount ?? row.amount) * 100),
        0
      );
      const key = sellerStorageKey('galleria_approved_recharges_total');
      const previousCents = Number(window.localStorage.getItem(key) || '0');
      if (totalCents > previousCents) {
        window.localStorage.setItem(key, String(totalCents));
        setWallet((Math.round(getWallet() * 100) + totalCents - previousCents) / 100);
      }
      for (const row of approved) {
        const id = `recharge-${row.id}`;
        if (!getTransactions().some((transaction) => transaction.id === id)) {
          addWalletTransaction({
            id,
            type: 'deposit',
            amount: Number(row.creditedAmount ?? row.amount),
            description: `Approved recharge ${row.reference}`,
            status: 'completed',
            createdAt: row.submittedAt,
          });
        }
      }
    }
  } catch {}

  try {
    const response = await fetch(`/api/seller/wallet-adjustments?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const walletAdjustments = (data.adjustments || []).filter((row: any) => row.accountType === 'wallet');
    const totalCents = walletAdjustments.reduce(
      (sum: number, row: any) => sum + Math.round(Number(row.amount || 0) * 100),
      0
    );
    if (email !== resolveSellerEmail()) return;
    const refunds = new Map<string, string>();
    const prefix = 'withdrawal-refund:' + email + ':';
    for (const row of walletAdjustments) {
      if (row.eventType === 'withdrawal-refund' && row.dedupeKey?.startsWith(prefix))
        refunds.set(row.dedupeKey.slice(prefix.length), row.reason);
    }
    const history = getTransactions();
    const updated = history.map(tx => {
      const reason = refunds.get(tx.id);
      if (tx.type !== 'withdrawal' || !reason || (tx.status === 'rejected' && tx.reviewReason === reason)) return tx;
      return { ...tx, status: 'rejected' as const, reviewReason: reason };
    });
    if (updated.some((tx, index) => tx !== history[index])) {
      window.localStorage.setItem(sellerStorageKey(TRANSACTIONS_KEY), JSON.stringify(updated));
      emitChange();
    }
    applySyncedWalletAdjustmentTotalCents(totalCents);
    for (const row of walletAdjustments) {
      if (row.eventType === 'withdrawal-request' && row.withdrawal) {
        const tx: WalletTransaction = {id:row.id,type:'withdrawal',amount:Math.abs(row.amount),description:row.reason,
          status:row.withdrawal.status, network:row.withdrawal.method, address:row.withdrawal.address,
          reviewReason:row.withdrawal.reviewReason, createdAt:row.createdAt};
        const list = getTransactions();
        const previous = list.find(item => item.id === row.id);
        if (!previous) addWalletTransaction(tx);
        else if (previous.status !== tx.status || previous.reviewReason !== tx.reviewReason) {
          window.localStorage.setItem(sellerStorageKey(TRANSACTIONS_KEY), JSON.stringify(list.map(item=>item.id === tx.id ? tx : item)));
          emitChange();
        }
        continue;
      }
      const id = `admin-wallet-adjustment-${row.id}`;
      if (!getTransactions().some((transaction) => transaction.id === id)) {
        addWalletTransaction({
          id,
          type: row.eventType === 'consign-order-payment'
            ? 'order_payment'
            : row.eventType === 'consign-order-delivery'
              ? 'order_payout'
              : Number(row.amount) < 0 ? 'withdrawal' : 'rebate',
          amount: Math.abs(Number(row.amount)),
          description: row.reason || 'Galleria Enterprises, Inc. wallet adjustment',
          status: 'completed',
          createdAt: row.createdAt,
        });
      }
    }
  } catch {}
}

export function getWallet(): number {
  if (!isBrowser()) return 0;
  const value = parseFloat(window.localStorage.getItem(sellerStorageKey(WALLET_KEY)) || '0');
  return Number.isFinite(value) ? value : 0;
}

export function setWallet(value: number) {
  if (!isBrowser()) return;

  const balance = Math.round(value * 100) / 100;
  window.localStorage.setItem(sellerStorageKey(WALLET_KEY), balance.toFixed(2));
  emitChange();

  const alertKey = sellerStorageKey(LOW_WALLET_ALERT_KEY);
  if (balance > LOW_WALLET_ALERT_THRESHOLD) {
    window.localStorage.removeItem(alertKey);
    return;
  }
  if (window.localStorage.getItem(alertKey)) return;

  const sellerEmail = resolveSellerEmail();
  if (!sellerEmail) return;

  window.localStorage.setItem(alertKey, 'sent');
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(balance);
  void sendSellerNotification({
    sellerEmail,
    category: 'Wallet & Payments',
    title: 'Low wallet balance',
    message: [
      { text: 'Your wallet balance is ' },
      { text: formattedBalance, emphasis: 'blue' },
      { text: '. It is at or below the ' },
      { text: '$10.00 low-balance limit', emphasis: 'blue' },
      { text: '. Add funds in Wallet & earnings so you can continue confirming orders.' },
    ],
    tone: 'warning',
    href: '/seller/dashboard?tab=wallet',
    dedupeKey: 'low-wallet-balance:' + sellerEmail + ':' + Date.now(),
  });
}
export function getTransactions(): WalletTransaction[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(sellerStorageKey(TRANSACTIONS_KEY));
    const parsed = raw ? (JSON.parse(raw) as WalletTransaction[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addWalletTransaction(tx: WalletTransaction) {
  if (!isBrowser()) return;
  const current = getTransactions();
  window.localStorage.setItem(sellerStorageKey(TRANSACTIONS_KEY), JSON.stringify([tx, ...current]));
  emitChange();
}

export function getResaleSettlements(): ResaleSettlement[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(sellerStorageKey(RESALE_KEY));
    const parsed = raw ? (JSON.parse(raw) as ResaleSettlement[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addResaleSettlement(s: ResaleSettlement) {
  if (!isBrowser()) return;
  const current = getResaleSettlements();
  window.localStorage.setItem(sellerStorageKey(RESALE_KEY), JSON.stringify([s, ...current]));
  emitChange();
}

export function getCommissions(): CommissionRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(sellerStorageKey(COMMISSIONS_KEY));
    const parsed = raw ? (JSON.parse(raw) as CommissionRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addCommission(c: CommissionRecord) {
  if (!isBrowser()) return;
  const current = getCommissions();
  window.localStorage.setItem(sellerStorageKey(COMMISSIONS_KEY), JSON.stringify([c, ...current]));
  emitChange();
}

export function getRefunds(): RefundRequest[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(REFUNDS_KEY);
    const parsed = raw ? (JSON.parse(raw) as RefundRequest[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function updateRefundStatus(id: string, status: 'Approved' | 'Rejected') {
  if (!isBrowser()) return;
  const current = getRefunds();
  const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
  window.localStorage.setItem(REFUNDS_KEY, JSON.stringify(updated));
  emitChange();
}

export function getProductQueries(): ProductQuery[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(QUERIES_KEY);
    const parsed = raw ? (JSON.parse(raw) as ProductQuery[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function replyToQuery(id: string, reply: string) {
  if (!isBrowser()) return;
  const current = getProductQueries();
  const updated = current.map((q) =>
    q.id === id ? { ...q, reply, status: 'Replied' as const } : q
  );
  window.localStorage.setItem(QUERIES_KEY, JSON.stringify(updated));
  emitChange();
}

export function getCurrentTier(): PackageTierId {
  if (!isBrowser()) return 'free';
  const storedTier = window.localStorage.getItem(sellerStorageKey(PACKAGE_TIER_KEY));
  return PACKAGE_TIERS.some((tier) => tier.id === storedTier) ? storedTier as PackageTierId : 'free';
}

export function getCurrentPackageTier(): PackageTier {
  return PACKAGE_TIERS.find((tier) => tier.id === getCurrentTier()) || PACKAGE_TIERS[0];
}

export function getPackageSpend(): number {
  if (!isBrowser()) return 0;
  const val = parseFloat(window.localStorage.getItem(sellerStorageKey(PACKAGE_SPEND_KEY)) || '0');
  return Number.isFinite(val) ? val : 0;
}

export function cacheSellerPackage(tierId: PackageTierId, spend: number, email: string) {
  if (resolveSellerEmail() !== email.trim().toLowerCase()) return;
  window.localStorage.setItem(sellerStorageKey(PACKAGE_TIER_KEY), tierId);
  window.localStorage.setItem(sellerStorageKey(PACKAGE_SPEND_KEY), spend.toFixed(2));
  emitChange();
}

export async function upgradePackageTier(targetTierId: PackageTierId): Promise<{ success: boolean; error?: string }> {
  const email = resolveSellerEmail();
  try {
    const response = await fetch('/api/seller/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: targetTierId, walletCents: amountToCents(getWallet()) }),
    });
    const result = await response.json();
    if (response.ok && result.success && email === resolveSellerEmail()) {
      cacheSellerPackage(result.tierId, result.spend, email);
      applySyncedWalletAdjustmentTotalCents(result.walletTotalCents);
      emitChange();
    }
    return result;
  } catch {
    return { success: false, error: 'Could not confirm the purchase. Refresh your package before retrying.' };
  }
}


export function getAlertEmail(): string {
  if (!isBrowser()) return '';
  return window.localStorage.getItem(ALERT_EMAIL_KEY) || '';
}

export function saveAlertEmail(email: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ALERT_EMAIL_KEY, email);
  emitChange();
}

export function getOperationsMessages(): OperationsMessage[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(OPERATIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as OperationsMessage[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addOperationsMessage(msg: OperationsMessage) {
  if (!isBrowser()) return;
  const current = getOperationsMessages();
  window.localStorage.setItem(OPERATIONS_KEY, JSON.stringify([msg, ...current]));
  emitChange();
}

function resolveSellerEmail(email?: string): string {
  if (email && email.trim()) return email.trim().toLowerCase();
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('galleria_active_seller');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) return parsed.email.trim().toLowerCase();
      }
    } catch {}
  }
  return '';
}

export function getKycStatus(email?: string): KycStatus {
  if (!isBrowser()) return 'Not verified';
  const targetEmail = resolveSellerEmail(email);
  if (targetEmail) {
    const userKey = `${KYC_STATUS_KEY}_${targetEmail}`;
    const userVal = window.localStorage.getItem(userKey);
    if (userVal) return userVal as KycStatus;
  }
  return 'Not verified';
}

export function setKycStatus(status: KycStatus, email?: string) {
  if (!isBrowser()) return;
  const targetEmail = resolveSellerEmail(email);
  if (targetEmail) {
    window.localStorage.setItem(`${KYC_STATUS_KEY}_${targetEmail}`, status);
  }
  emitChange();
}

export function getKycData(email?: string): KycData | null {
  if (!isBrowser()) return null;
  const targetEmail = resolveSellerEmail(email);
  if (targetEmail) {
    try {
      const raw = window.localStorage.getItem(`${KYC_DATA_KEY}_${targetEmail}`);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

export function submitKycVerification(data: KycData, email?: string) {
  if (!isBrowser()) return;
  const targetEmail = resolveSellerEmail(email);
  if (targetEmail) {
    window.localStorage.setItem(`${KYC_STATUS_KEY}_${targetEmail}`, 'Pending');
    window.localStorage.setItem(
      `${KYC_DATA_KEY}_${targetEmail}`,
      JSON.stringify({ ...data, submittedAt: new Date().toISOString() })
    );
  }
  emitChange();
}

export function getSellerProducts<T = any>(email?: string): T[] {
  if (!isBrowser()) return [];
  const targetEmail = resolveSellerEmail(email);
  const keysToTry: string[] = [];
  if (targetEmail) {
    keysToTry.push(`${PRODUCTS_KEY}_${targetEmail}`);
  }
  if (!targetEmail) return [];

  for (const key of keysToTry) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (targetEmail && key !== `${PRODUCTS_KEY}_${targetEmail}`) {
            window.localStorage.setItem(`${PRODUCTS_KEY}_${targetEmail}`, raw);
          }
          window.localStorage.setItem(`${PRODUCTS_KEY}_default`, raw);
          window.localStorage.setItem(PRODUCTS_KEY, raw);
          return parsed;
        }
      }
    } catch {}
  }

  try {
    const primaryKey = targetEmail ? `${PRODUCTS_KEY}_${targetEmail}` : `${PRODUCTS_KEY}_default`;
    const raw = window.localStorage.getItem(primaryKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
}

const sellerProductWrites = new Map<string, Promise<boolean>>();

export function saveSellerProducts(products: any[], email?: string): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false);
  const targetEmail = resolveSellerEmail(email);
  const serialized = JSON.stringify(products);
  if (targetEmail) {
    window.localStorage.setItem(`${PRODUCTS_KEY}_${targetEmail}`, serialized);
  }
  window.localStorage.setItem(`${PRODUCTS_KEY}_default`, serialized);
  window.localStorage.setItem(PRODUCTS_KEY, serialized);
  window.dispatchEvent(new Event(SELLER_PRODUCTS_CHANGED_EVENT));

  const account = targetEmail || 'default';
  const previousWrite = sellerProductWrites.get(account) || Promise.resolve();
  const write = previousWrite.then(async () => {
    try {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"email":' + JSON.stringify(account) + ',"products":' + serialized + '}',
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to sync products to server:', error);
      return false;
    }
  }).finally(() => {
    if (sellerProductWrites.get(account) === write) sellerProductWrites.delete(account);
  });
  sellerProductWrites.set(account, write);
  return write;
}

/** Subscribe only to seller catalog changes, without reacting to wallet/order updates. */
export function subscribeToSellerProducts(callback: () => void, email?: string): () => void {
  if (!isBrowser()) return () => {};
  const targetEmail = resolveSellerEmail(email);
  const onStorage = (event: StorageEvent) => {
    if (!event.key) {
      callback();
      return;
    }
    if (targetEmail
      ? event.key === `${PRODUCTS_KEY}_${targetEmail}`
      : event.key === `${PRODUCTS_KEY}_default` || event.key === PRODUCTS_KEY) {
      callback();
    }
  };
  window.addEventListener(SELLER_PRODUCTS_CHANGED_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SELLER_PRODUCTS_CHANGED_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function getShopSettings(): ShopSettings {
  if (!isBrowser())
    return { shopName: 'Ansar collection', description: '' };
  try {
    const activeSeller = JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}');
    const legacySettings = activeSeller?.email ? null : window.localStorage.getItem(SHOP_SETTINGS_KEY);
    const raw =
      window.localStorage.getItem(sellerStorageKey(SHOP_SETTINGS_KEY)) ||
      legacySettings;
    return raw
      ? JSON.parse(raw)
      : { shopName: 'Ansar collection', description: '' };
  } catch {
    return { shopName: 'Ansar collection', description: '' };
  }
}

export function saveShopSettings(settings: ShopSettings) {
  if (!isBrowser()) return;
  window.localStorage.setItem(sellerStorageKey(SHOP_SETTINGS_KEY), JSON.stringify(settings));
  emitChange();
}

export function hasSavedShopSettings(): boolean {
  if (!isBrowser()) return false;
  try {
    const activeSeller = JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}');
    return Boolean(
      window.localStorage.getItem(sellerStorageKey(SHOP_SETTINGS_KEY)) ||
        (!activeSeller?.email && window.localStorage.getItem(SHOP_SETTINGS_KEY))
    );
  } catch {
    return Boolean(window.localStorage.getItem(sellerStorageKey(SHOP_SETTINGS_KEY)));
  }
}

export function topUpWallet(amount: number, network: string): number {
  if (amount <= 0) return getWallet();
  const newBalance = Math.round((getWallet() + amount) * 100) / 100;
  setWallet(newBalance);
  addWalletTransaction({
    id: `tx-dep-${Date.now()}`,
    type: 'deposit',
    amount,
    description: `Deposit via ${network}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    network,
  });
  return newBalance;
}

export async function requestWithdrawal(amount: number, method: string, address: string, id: string) {
  try {
    const response = await fetch('/api/seller/withdrawals', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,cents:amountToCents(amount),method,address})});
    const data = await response.json();
    if (!response.ok) return {success:false,error:data.error || 'Could not submit withdrawal.'};
    await syncApprovedRecharges();
    return {success:true};
  } catch { return {success:false,error:'Could not confirm the withdrawal. Retry with the same details.'}; }
}

export function getNextStatus(status: SellerOrderStatus): SellerOrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(status);
  return idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[idx + 1] : null;
}

interface CheckoutOrderInput {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: { productId: string; title: string; price: number; quantity: number; image?: string }[];
  shippingAddress: {
    fullName: string;
    phoneNumber?: string;
    email?: string;
    street: string;
    apartment?: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
}

/** Input for consign order pushed from Admin Panel */
export interface ConsignOrderInput {
  id?: string;
  orderNumber?: string;
  shopName: string;
  merchantEmail?: string;
  shopperName: string;
  shopperEmail: string;
  shippingAddress?: OrderShippingAddress;
  products: { id: string; title: string; price: number; quantity?: number; image?: string }[];
  amount: number;
  paymentMethod?: string;
  status?: SellerOrderStatus;
  createdAt?: string;
}

/** Called when admin dispatches a consign order to push it into the registered seller's orders */
export function addOrderFromConsign(input: ConsignOrderInput): SellerOrder {
  const now = input.createdAt || new Date().toISOString();
  const orderId = input.id || `co_${Date.now()}`;
  const code = input.orderNumber || `CO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const shipping = input.shippingAddress;
  const sellerOrder: SellerOrder = {
    id: orderId,
    code,
    customerName: shipping?.recipient || input.shopperName,
    customerEmail: shipping?.email || input.shopperEmail || 'registered@seller.local',
    customerLocation: formatLocationFromShipping(shipping, input.shopName),
    shippingAddress: shipping,
    products: input.products.map((p) => ({
      id: p.id,
      title: p.title,
      quantity: p.quantity || 1,
      price: p.price,
      image: p.image,
    })),
    amount: Math.round(input.amount * 100) / 100,
    paymentMethod: input.paymentMethod || 'Consign Escrow',
    status: input.status || 'awaiting_payment',
    createdAt: now,
    history: [{ status: input.status || 'awaiting_payment', at: now }],
    sellerEmail: input.merchantEmail || '',
    merchantEmail: input.merchantEmail || '',
    merchantName: input.shopName,
    source: 'consign',
    consignOrderId: orderId,
  };

  const existing = getOrders();
  saveOrders([sellerOrder, ...existing.filter((o) => o.id !== sellerOrder.id && o.code !== sellerOrder.code)]);
  return sellerOrder;
}

function syncStatusToConsign(sellerOrders: SellerOrder[]) {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(CONSIGN_ORDERS_STORAGE_KEY);
    if (!raw) return;
    const consignList = JSON.parse(raw);
    if (!Array.isArray(consignList) || consignList.length === 0) return;

    let modified = false;
    const changedItems: { id: string; orderNumber?: string; status: string; sellerStatus: SellerOrderStatus }[] = [];

    const updated = consignList.map((co: any) => {
      const match = sellerOrders.find(
        (so) => so.id === co.id || so.code === co.orderNumber || so.consignOrderId === co.id
      );
      if (match) {
        const nextStatus = SELLER_STATUS_TO_CONSIGN[match.status] || co.status;
        if (co.status !== nextStatus || co.sellerStatus !== match.status) {
          modified = true;
          changedItems.push({
            id: co.id,
            orderNumber: co.orderNumber,
            status: nextStatus,
            sellerStatus: match.status,
          });
          return { ...co, status: nextStatus, sellerStatus: match.status };
        }
      }
      return co;
    });

    if (modified) {
      window.localStorage.setItem(CONSIGN_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      for (const ch of changedItems) {
        fetch('/api/consign/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...ch, actor: 'seller' }),
        }).catch(() => {});
      }
    }
  } catch {}
}

export function updateConsignOrderStatusInSeller(orderId: string, nextStatus: SellerOrderStatus) {
  if (!isBrowser()) return;
  const orders = getOrders();
  const match = orders.find((o) => o.id === orderId || o.code === orderId || o.consignOrderId === orderId);
  if (!match) return;
  const now = new Date().toISOString();
  const updated = orders.map((o) => {
    if (o.id === match.id) {
      return {
        ...o,
        status: nextStatus,
        history: [...o.history, { status: nextStatus, at: now }],
      };
    }
    return o;
  });
  saveOrders(updated);
}

/** Called by the storefront checkout after it creates an order. */
export function addOrderFromCheckout(order: CheckoutOrderInput, customerEmail: string): SellerOrder {
  const countryCodes: Record<string, string> = {
    Australia: 'AU',
    Canada: 'CA',
    Germany: 'DE',
    India: 'IN',
    Pakistan: 'PK',
    'United Arab Emirates': 'AE',
    'United Kingdom': 'GB',
    'United States': 'US',
  };
  const sellerOrder: SellerOrder = {
    id: order.id,
    code: order.orderNumber,
    customerName: order.shippingAddress.fullName,
    customerEmail,
    customerLocation: [order.shippingAddress.city, order.shippingAddress.country].filter(Boolean).join(', '),
    shippingAddress: {
      recipient: order.shippingAddress.fullName,
      phone: order.shippingAddress.phoneNumber || '',
      email: order.shippingAddress.email || customerEmail,
      street: order.shippingAddress.street,
      apt: order.shippingAddress.apartment || '',
      city: order.shippingAddress.city,
      state: order.shippingAddress.state || '',
      postalCode: order.shippingAddress.zipCode,
      countryCode: countryCodes[order.shippingAddress.country] || '',
      country: order.shippingAddress.country,
    },
    products: order.items.map((i) => ({
      id: i.productId,
      title: i.title,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
    })),
    amount: Math.round(order.totalAmount * 100) / 100,
    paymentMethod: order.paymentMethod,
    status: 'awaiting_payment',
    createdAt: order.createdAt,
    history: [{ status: 'awaiting_payment', at: order.createdAt }],
  };
  saveOrders([sellerOrder, ...getOrders().filter((o) => o.id !== sellerOrder.id)]);
  return sellerOrder;
}

/**
 * Moves the given orders one step forward in the status flow.
 * Orders reaching "delivered" credit their amount to the seller wallet.
 * Returns the number of orders that were advanced.
 */
/** Convert a decimal dollar amount to cents without binary floating-point rounding drift. */
export function amountToCents(amount: number): number {
  if (!Number.isFinite(amount)) return Number.NaN;

  const isNegative = amount < 0;
  const [mantissa, exponentText] = Math.abs(amount).toString().toLowerCase().split('e');
  const exponent = exponentText ? Number(exponentText) : 0;
  const [whole = '0', fraction = ''] = mantissa.split('.');
  const digits = `${whole}${fraction}`;
  const shift = 2 - fraction.length + exponent;
  let cents: number;

  if (shift >= 0) {
    cents = Number(digits) * 10 ** shift;
  } else {
    const digitsToKeep = digits.length + shift;
    const keptDigits = digitsToKeep > 0 ? digits.slice(0, digitsToKeep) : '0';
    const nextDigit = digitsToKeep >= 0 && digitsToKeep < digits.length
      ? Number(digits[digitsToKeep])
      : 0;
    cents = Number(keptDigits || '0') + (nextDigit >= 5 ? 1 : 0);
  }

  if (!Number.isSafeInteger(cents)) return Number.NaN;
  return isNegative ? -cents : cents;
}

function calculateCommissionCents(totalCents: number, commissionRate: number): number {
  // Exact integer arithmetic, rounded half-up to the nearest cent.
  const fullDollars = Math.floor(totalCents / 100);
  const remainingCents = totalCents % 100;
  return fullDollars * commissionRate + Math.floor((remainingCents * commissionRate + 50) / 100);
}

export function orderPaymentBreakdownAtRate(amount: number, commissionRate: number) {
  const totalCents = amountToCents(amount);
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    return { commission: Number.NaN, payable: Number.NaN, commissionRate, payableRate: 100 - commissionRate };
  }
  const commissionCents = calculateCommissionCents(totalCents, commissionRate);
  return {
    commission: commissionCents / 100,
    payable: (totalCents - commissionCents) / 100,
    commissionRate,
    payableRate: 100 - commissionRate,
  };
}

export function orderPaymentBreakdown(amount: number, tierId: PackageTierId = getCurrentTier()) {
  const commissionRate = PACKAGE_TIERS.find((tier) => tier.id === tierId)?.rebatePercent ?? PACKAGE_TIERS[0].rebatePercent;
  return orderPaymentBreakdownAtRate(amount, commissionRate);
}

export const CONSIGN_SELLER_COMMISSION_RATE = 15;

export function sellerOrderPaymentBreakdown(order: Pick<SellerOrder, 'amount' | 'source' | 'consignOrderId' | 'commissionRate' | 'sellerPaidAmount'>) {
  const paidRate = Number.parseFloat(order.commissionRate || '');
  return order.sellerPaidAmount != null && Number.isFinite(paidRate)
    ? orderPaymentBreakdownAtRate(order.amount, paidRate)
    : orderPaymentBreakdown(order.amount);
}

export async function paySellerOrders(ids: string[]): Promise<{
  success: boolean;
  error?: string;
  orderCount?: number;
  gross?: number;
  commission?: number;
  payable?: number;
}> {
  if (!isBrowser()) return { success: false, error: 'Seller sign-in is required to pay an order.' };
  const selectedIds = Array.from(new Set(ids.filter(Boolean)));
  if (selectedIds.length === 0) return { success: false, error: 'There are no unpaid orders to pay.' };

  const currentOrders = getOrders();
  const selectedOrders = currentOrders.filter(
    (order) => selectedIds.includes(order.id) && order.status === 'awaiting_payment' && !order.outcome
  );
  if (selectedOrders.length !== selectedIds.length) {
    return { success: false, error: 'One or more orders are no longer unpaid. Refresh and try again.' };
  }

  let grossCents = 0;
  let commissionCents = 0;
  const paymentBreakdowns = new Map<string, ReturnType<typeof sellerOrderPaymentBreakdown>>();
  for (const order of selectedOrders) {
    if (!Number.isFinite(order.amount) || order.amount <= 0) {
      return { success: false, error: `Order ${order.code} has an invalid amount.` };
    }
    const orderCents = amountToCents(order.amount);
    const breakdown = sellerOrderPaymentBreakdown(order);
    const orderCommissionCents = amountToCents(breakdown.commission);
    if (!Number.isSafeInteger(orderCents) || !Number.isSafeInteger(orderCommissionCents)) {
      return { success: false, error: `Order ${order.code} has an invalid amount.` };
    }
    paymentBreakdowns.set(order.id, breakdown);
    grossCents += orderCents;
    commissionCents += orderCommissionCents;
    if (!Number.isSafeInteger(grossCents) || !Number.isSafeInteger(commissionCents)) {
      return { success: false, error: 'The combined order amount is too large to process safely.' };
    }
  }

  const payableCents = grossCents - commissionCents;
  const balanceCents = amountToCents(getWallet());
  if (!Number.isSafeInteger(balanceCents) || balanceCents < 0) {
    return { success: false, error: 'The wallet balance is invalid. Please refresh and try again.' };
  }
  if (balanceCents < payableCents) {
    const shortfall = (payableCents - balanceCents) / 100;
    const shortfallLabel = `$${shortfall.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return {
      success: false,
      error: `Insufficient wallet balance. You need ${shortfallLabel} more to pay all ${selectedOrders.length} orders. Please top up your wallet.`,
    };
  }

  const consignOrders = selectedOrders.filter((order) => order.source === 'consign' || Boolean(order.consignOrderId));
  const localOrders = selectedOrders.filter((order) => !consignOrders.includes(order));

  if (consignOrders.length > 0) {
    const sellerEmail = resolveSellerEmail(consignOrders[0].sellerEmail || consignOrders[0].merchantEmail);
    if (!sellerEmail) return { success: false, error: 'Seller sign-in is required to pay a consignment order.' };
    let response: Response;
    let data: any;
    try {
      response = await fetch('/api/consign/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seller-pay',
          orderIds: consignOrders.map((order) => order.consignOrderId || order.id),
          walletBalanceCents: balanceCents,
          walletAdjustmentTotalCents: getSyncedWalletAdjustmentTotalCents(),
        }),
      });
      data = await response.json().catch(() => null);
    } catch {
      return { success: false, error: 'The order service could not be reached. Your wallet was not changed; please try again.' };
    }
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || 'The consignment order payment could not be completed.' };
    }

    await syncApprovedRecharges();
    if (Number.isSafeInteger(data.walletAdjustmentTotalCents) && getSyncedWalletAdjustmentTotalCents() < data.walletAdjustmentTotalCents) {
      applySyncedWalletAdjustmentTotalCents(data.walletAdjustmentTotalCents);
    }
    await syncConsignOrdersFromServer(sellerEmail);
  }

  if (localOrders.length > 0) {
    const localPayableCents = localOrders.reduce((sum, order) =>
      sum + amountToCents(paymentBreakdowns.get(order.id)!.payable), 0);
    const latestBalanceCents = amountToCents(getWallet());
    if (!Number.isSafeInteger(latestBalanceCents) || latestBalanceCents < localPayableCents) {
      return { success: false, error: 'Your consignment payment was completed, but the remaining wallet balance is too low for the other selected orders.' };
    }

    const now = new Date().toISOString();
    const localIds = new Set(localOrders.map((order) => order.id));
    const currentAfterSync = getOrders();
    const updated = currentAfterSync.map((order) => localIds.has(order.id)
      ? {
          ...order,
          status: 'confirmed' as SellerOrderStatus,
          sellerPaidAmount: paymentBreakdowns.get(order.id)!.payable,
          sellerCommission: paymentBreakdowns.get(order.id)!.commission,
          commissionRate: paymentBreakdowns.get(order.id)!.commissionRate + '%',
          sellerPaidAt: now,
          history: [...order.history, { status: 'confirmed' as SellerOrderStatus, at: now }],
        }
      : order
    );
    setWallet((latestBalanceCents - localPayableCents) / 100);
    addWalletTransaction({
      id: localOrders.length === 1 ? 'tx-pay-' + localOrders[0].id : 'tx-pay-local-' + Date.now(),
      type: 'order_payment',
      amount: localPayableCents / 100,
      description: localOrders.length === 1
        ? 'Order ' + localOrders[0].code + ' payment after commission'
        : 'One-click payment for ' + localOrders.length + ' orders after commission',
      status: 'completed',
      createdAt: now,
    });
    saveOrders(updated);

    for (const order of localOrders) {
      const sellerEmail = resolveSellerEmail(order.sellerEmail || order.merchantEmail);
      const chargedAmount = paymentBreakdowns.get(order.id)!.payable;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(chargedAmount);
      void sendSellerNotification({
        sellerEmail,
        orderNumber: order.code,
        category: 'Orders & Shipping',
        title: 'Order payment confirmed',
        message: [
          { text: 'Your payment for order ' },
          { text: '#' + order.code, emphasis: 'blue' },
          { text: ' was successful. ' },
          { text: formattedAmount, emphasis: 'blue' },
          { text: ' was deducted from your wallet. The order is now confirmed.' },
        ],
        tone: 'success',
        href: '/seller/dashboard?tab=orders',
        dedupeKey: 'seller-order-payment-confirmed:' + order.id,
      });
    }
  }

  const amountBreakdowns = selectedOrders.map((order) => paymentBreakdowns.get(order.id)!);
  return {
    success: true,
    orderCount: selectedOrders.length,
    gross: grossCents / 100,
    commission: amountBreakdowns.reduce((sum, breakdown) => sum + breakdown.commission, 0),
    payable: payableCents / 100,
  };
}

export function paySellerOrder(id: string): Promise<{ success: boolean; error?: string }> {
  return paySellerOrders([id]);
}

export function advanceOrders(ids: string[]): number {
  const now = new Date().toISOString();
  let advanced = 0;
  let creditCents = 0;

  const updated = getOrders().map((o) => {
    if (!ids.includes(o.id)) return o;
    const next = getNextStatus(o.status);
    if (!next || o.status === 'awaiting_payment') return o;
    if (next === 'delivered' && (o.source === 'consign' || o.consignOrderId)) return o;
    advanced += 1;
    if (next === 'delivered') {
      const breakdown = orderPaymentBreakdown(o.amount);
      creditCents += amountToCents(o.amount);
      addWalletTransaction({
        id: `tx-deliv-${Date.now()}-${o.id}`,
        type: 'order_payout',
        amount: o.amount,
        description: `Order ${o.code} payout`,
        status: 'completed',
        createdAt: now,
      });
      addResaleSettlement({
        id: `rs-${Date.now()}-${o.id}`,
        orderCode: o.code,
        productTitle: o.products.map((p) => p.title).join(', ') || 'Wholesale Order',
        capital: breakdown.payable,
        rebate: breakdown.commission,
        total: o.amount,
        date: now,
      });
      addCommission({
        id: `comm-${Date.now()}-${o.id}`,
        orderCode: o.code,
        source: 'Resale rebate',
        earning: breakdown.commission,
        createdAt: now,
      });
    }
    return { ...o, status: next, history: [...o.history, { status: next, at: now }] };
  });

  if (advanced > 0) {
    if (creditCents > 0) setWallet((amountToCents(getWallet()) + creditCents) / 100);
    saveOrders(updated);
    syncStatusToConsign(updated);
  }
  return advanced;
}

/** Subscribe to order/wallet changes (same tab and other tabs). Returns an unsubscribe fn. */
export function subscribeToOrders(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === ORDERS_KEY ||
      e.key === CONSIGN_ORDERS_STORAGE_KEY ||
      e.key === sellerStorageKey(WALLET_KEY) ||
      e.key === sellerStorageKey(TRANSACTIONS_KEY) ||
      e.key === sellerStorageKey(RESALE_KEY) ||
      e.key === sellerStorageKey(COMMISSIONS_KEY) ||
      e.key === REFUNDS_KEY ||
      e.key === QUERIES_KEY ||
      e.key === sellerStorageKey(PACKAGE_TIER_KEY) ||
      e.key === sellerStorageKey(PACKAGE_SPEND_KEY) ||
      e.key === ALERT_EMAIL_KEY ||
      e.key === OPERATIONS_KEY ||
      e.key === KYC_STATUS_KEY ||
      e.key === KYC_DATA_KEY ||
      e.key === SHOP_SETTINGS_KEY ||
      e.key === sellerStorageKey(SHOP_SETTINGS_KEY)
    )
      callback();
  };
  window.addEventListener(ORDERS_CHANGED_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(ORDERS_CHANGED_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}
