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

export interface SellerOrder {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerLocation: string;
  shippingAddress?: OrderShippingAddress;
  products: SellerOrderProduct[];
  amount: number;
  sellerPaidAmount?: number;
  paymentMethod: string;
  status: SellerOrderStatus;
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

export type PackageTierId = 'free' | 'silver' | 'gold' | 'platinum';

export interface PackageTier {
  id: PackageTierId;
  name: string;
  rebatePercent: number;
  productLimit: number;
  price: number;
}

export const PACKAGE_TIERS: PackageTier[] = [
  { id: 'free', name: 'Free Shop', rebatePercent: 15, productLimit: 300, price: 0 },
  { id: 'silver', name: 'Silver Shop', rebatePercent: 20, productLimit: 1000, price: 10000 },
  { id: 'gold', name: 'Gold Shop', rebatePercent: 30, productLimit: 2500, price: 20000 },
  { id: 'platinum', name: 'Platinum Shop', rebatePercent: 40, productLimit: 5000, price: 30000 },
];

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

function buildSellerOrderFromConsignRecord(co: any): SellerOrder {
  const mappedStatus =
    (co.sellerStatus as SellerOrderStatus) ||
    CONSIGN_STATUS_TO_SELLER[co.status] ||
    'awaiting_payment';
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
    paymentMethod: 'Consign Escrow',
    status: mappedStatus,
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
              const mappedStatus =
                (co.sellerStatus as SellerOrderStatus) || CONSIGN_STATUS_TO_SELLER[co.status];
              const needShippingHydration = !existing.shippingAddress && Boolean(co.shippingAddress);
              const needStatusSync = mappedStatus && existing.status !== mappedStatus && existing.source === 'consign';
              if (needShippingHydration || needStatusSync) {
                parsed[existingIdx] = {
                  ...existing,
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

    for (const srv of data.orders) {
      if (!srv?.id) continue;
      const cur = byId.get(srv.id);
      if (!cur) {
        localConsign.unshift(srv);
        byId.set(srv.id, srv);
        consignChanged = true;
      } else if (
        cur.status !== srv.status ||
        cur.sellerStatus !== srv.sellerStatus ||
        cur.updatedAt !== srv.updatedAt ||
        (!cur.shippingAddress && srv.shippingAddress) ||
        (srv.refund && cur.refund?.id !== srv.refund.id)
      ) {
        const merged = {
          ...cur,
          status: srv.status || cur.status,
          sellerStatus: srv.sellerStatus || cur.sellerStatus,
          updatedAt: srv.updatedAt || cur.updatedAt,
          shippingAddress: srv.shippingAddress || cur.shippingAddress,
          refund: srv.refund || cur.refund,

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
    const response = await fetch(`/api/admin/wallet-adjustments?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const walletAdjustments = (data.adjustments || []).filter((row: any) => row.accountType === 'wallet');
    const totalCents = walletAdjustments.reduce(
      (sum: number, row: any) => sum + Math.round(Number(row.amount || 0) * 100),
      0
    );
    const key = sellerStorageKey('galleria_admin_wallet_adjustments_total');
    const previousCents = Number(window.localStorage.getItem(key) || '0');
    const deltaCents = totalCents - previousCents;
    if (deltaCents !== 0) {
      setWallet((Math.round(getWallet() * 100) + deltaCents) / 100);
      window.localStorage.setItem(key, String(totalCents));
    }
    for (const row of walletAdjustments) {
      const id = `admin-wallet-adjustment-${row.id}`;
      if (!getTransactions().some((transaction) => transaction.id === id)) {
        addWalletTransaction({
          id,
          type: Number(row.amount) < 0 ? 'withdrawal' : 'rebate',
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

export function upgradePackageTier(
  targetTierId: PackageTierId
): { success: boolean; error?: string } {
  const targetTier = PACKAGE_TIERS.find((t) => t.id === targetTierId);
  if (!targetTier) return { success: false, error: 'Invalid tier.' };

  const currentSpend = getPackageSpend();
  const cost = Math.max(0, targetTier.price - currentSpend);

  const wallet = getWallet();
  if (cost > wallet) {
    return {
      success: false,
      error: `Insufficient wallet balance. You need $${(cost - wallet).toLocaleString()} more.`,
    };
  }

  const newBalance = Math.round((wallet - cost) * 100) / 100;
  setWallet(newBalance);
  window.localStorage.setItem(sellerStorageKey(PACKAGE_TIER_KEY), targetTierId);
  window.localStorage.setItem(sellerStorageKey(PACKAGE_SPEND_KEY), targetTier.price.toFixed(2));

  addWalletTransaction({
    id: `tx-tier-${Date.now()}`,
    type: 'withdrawal',
    amount: cost,
    description: `Upgrade to ${targetTier.name}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  emitChange();
  return { success: true };
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

export function saveSellerProducts(products: any[], email?: string) {
  if (!isBrowser()) return;
  const targetEmail = resolveSellerEmail(email);
  const serialized = JSON.stringify(products);
  if (targetEmail) {
    window.localStorage.setItem(`${PRODUCTS_KEY}_${targetEmail}`, serialized);
  }
  window.localStorage.setItem(`${PRODUCTS_KEY}_default`, serialized);
  window.localStorage.setItem(PRODUCTS_KEY, serialized);
  emitChange();

  // Dual-sync to server storage so Admin Panel -> Extension -> Owners -> Products sees live updates
  try {
    fetch('/api/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail || 'default', products }),
    }).catch((e) => console.warn('Failed to sync products to server:', e));
  } catch (err) {
    // Non-blocking
  }
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

export function requestWithdrawal(
  amount: number,
  method: string,
  address: string
): { success: boolean; error?: string } {
  const current = getWallet();
  if (amount <= 0) return { success: false, error: 'Please enter a valid amount to withdraw.' };
  if (amount > current) return { success: false, error: 'Insufficient wallet balance.' };
  if (!address.trim()) return { success: false, error: 'Please provide payout details / address.' };

  const newBalance = Math.round((current - amount) * 100) / 100;
  setWallet(newBalance);
  addWalletTransaction({
    id: `tx-wd-${Date.now()}`,
    type: 'withdrawal',
    amount,
    description: `Withdrawal to ${address}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    network: method,
    address,
  });
  return { success: true };
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

export function orderPaymentBreakdown(amount: number, tierId: PackageTierId = getCurrentTier()) {
  const commissionRate = PACKAGE_TIERS.find((tier) => tier.id === tierId)?.rebatePercent ?? PACKAGE_TIERS[0].rebatePercent;
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

export function paySellerOrders(ids: string[]): {
  success: boolean;
  error?: string;
  orderCount?: number;
  gross?: number;
  commission?: number;
  payable?: number;
} {
  const selectedIds = Array.from(new Set(ids.filter(Boolean)));
  if (selectedIds.length === 0) return { success: false, error: 'There are no unpaid orders to pay.' };

  const currentOrders = getOrders();
  const selectedOrders = currentOrders.filter(
    (order) => selectedIds.includes(order.id) && order.status === 'awaiting_payment'
  );
  if (selectedOrders.length !== selectedIds.length) {
    return { success: false, error: 'One or more orders are no longer unpaid. Refresh and try again.' };
  }

  const commissionRate = getCurrentPackageTier().rebatePercent;
  const tierId = getCurrentTier();
  let grossCents = 0;
  let commissionCents = 0;
  for (const order of selectedOrders) {
    if (!Number.isFinite(order.amount) || order.amount <= 0) {
      return { success: false, error: `Order ${order.code} has an invalid amount.` };
    }
    const orderCents = amountToCents(order.amount);
    const orderCommissionCents = amountToCents(orderPaymentBreakdown(order.amount, tierId).commission);
    if (!Number.isSafeInteger(orderCents) || !Number.isSafeInteger(orderCommissionCents)) {
      return { success: false, error: `Order ${order.code} has an invalid amount.` };
    }
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

  const now = new Date().toISOString();
  const selectedSet = new Set(selectedIds);
  const updated = currentOrders.map((order) =>
    selectedSet.has(order.id)
      ? {
          ...order,
          status: 'confirmed' as SellerOrderStatus,
          sellerPaidAmount: orderPaymentBreakdown(order.amount, tierId).payable,
          history: [...order.history, { status: 'confirmed' as SellerOrderStatus, at: now }],
        }
      : order
  );

  setWallet((balanceCents - payableCents) / 100);
  addWalletTransaction({
    id: selectedOrders.length === 1 ? 'tx-pay-' + selectedOrders[0].id : 'tx-pay-all-' + Date.now(),
    type: 'order_payment',
    amount: payableCents / 100,
    description: selectedOrders.length === 1
      ? 'Order ' + selectedOrders[0].code + ' payment (' + (100 - commissionRate) + '% after commission)'
      : 'One-click payment for ' + selectedOrders.length + ' orders (' + (100 - commissionRate) + '% after ' + commissionRate + '% commission)',
    status: 'completed',
    createdAt: now,
  });
  saveOrders(updated);
  syncStatusToConsign(updated);
  for (const order of selectedOrders) {
    const sellerEmail = resolveSellerEmail(order.sellerEmail || order.merchantEmail);
    const chargedAmount = orderPaymentBreakdown(order.amount, tierId).payable;
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
        { text: ' was deducted from your wallet. The order is now confirmed and awaiting pickup.' },
      ],
      tone: 'success',
      href: '/seller/dashboard?tab=orders',
      dedupeKey: 'seller-order-payment-confirmed:' + order.id,
    });
  }

  return {
    success: true,
    orderCount: selectedOrders.length,
    gross: grossCents / 100,
    commission: commissionCents / 100,
    payable: payableCents / 100,
  };
}

export function paySellerOrder(id: string): { success: boolean; error?: string } {
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
      e.key === sellerStorageKey(SHOP_SETTINGS_KEY) ||
      (e.key && e.key.startsWith(PRODUCTS_KEY))
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
