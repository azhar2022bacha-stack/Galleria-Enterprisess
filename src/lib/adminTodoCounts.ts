import type { AdminTab } from '@/components/admin/AdminSidebar';

export interface AdminTodoCounts {
  recharges: number;
  withdrawals: number;
  merchantReview: number;
  productReview: number;
  supportTickets: number;
  refundRequests: number;
  merchantOverdue: number;
  unfulfilledOrders: number;
  newLast7Days: number;
  chasedNoReply: number;
  newSellerOrders: number;
  deposits: number;
}

export const EMPTY_ADMIN_TODO_COUNTS: AdminTodoCounts = {
  recharges: 0,
  withdrawals: 0,
  merchantReview: 0,
  productReview: 0,
  supportTickets: 0,
  refundRequests: 0,
  merchantOverdue: 0,
  unfulfilledOrders: 0,
  newLast7Days: 0,
  chasedNoReply: 0,
  newSellerOrders: 0,
  deposits: 0,
};

let lastSuccessfulTodoCounts: AdminTodoCounts = { ...EMPTY_ADMIN_TODO_COUNTS };

export const ADMIN_TODO_CATEGORIES: {
  id: keyof AdminTodoCounts;
  label: string;
  targetTab: AdminTab;
}[] = [
  { id: 'recharges', label: 'Recharges', targetTab: 'recharges' },
  { id: 'withdrawals', label: 'Withdrawals', targetTab: 'withdrawals' },
  { id: 'merchantReview', label: 'Merchant review', targetTab: 'owners' },
  { id: 'productReview', label: 'Product review', targetTab: 'product_review' },
  { id: 'supportTickets', label: 'Support tickets', targetTab: 'support' },
  { id: 'refundRequests', label: 'Refund requests', targetTab: 'refund_governance' },
  { id: 'merchantOverdue', label: 'Merchant overdue (24h+)', targetTab: 'consign' },
  { id: 'unfulfilledOrders', label: 'Unfulfilled orders', targetTab: 'orders' },
  { id: 'chasedNoReply', label: 'Chased, no reply', targetTab: 'support' },
  { id: 'newSellerOrders', label: 'New seller orders', targetTab: 'orders' },
  { id: 'newLast7Days', label: 'incl. new (7d)', targetTab: 'owners' },
  { id: 'deposits', label: 'Deposits', targetTab: 'recharges' },
];

export function totalAdminTodoCount(counts: AdminTodoCounts): number {
  return ADMIN_TODO_CATEGORIES.reduce((total, category) => total + counts[category.id], 0);
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function readLocalArray(key: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? asArray(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

async function getJson(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function recordTime(record: any): number | null {
  const raw = record?.createdAt ?? record?.created_at ?? record?.registeredAt ?? record?.submittedAt ?? record?.date;
  if (!raw) return null;
  const timestamp = Date.parse(String(raw));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function pendingStatus(status: unknown): boolean {
  const normalized = String(status || '').trim().toLowerCase().replace(/[ _-]+/g, ' ');
  return normalized === 'pending' || normalized.startsWith('pending ') || normalized.endsWith(' pending') ||
    normalized.includes('in review') || normalized === 'under review' || normalized === 'review';
}

function getPendingWithdrawalCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const transactionKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key === 'galleria_seller_transactions' || key?.startsWith('galleria_seller_transactions:')) {
        transactionKeys.push(key);
      }
    }

    const seen = new Set<string>();
    let count = 0;
    for (const key of transactionKeys) {
      readLocalArray(key).forEach((transaction, index) => {
        if (String(transaction?.type || '').toLowerCase() !== 'withdrawal') return;
        if (String(transaction?.status || '').toLowerCase() !== 'pending') return;
        const id = `${key}:${String(transaction?.id || index)}`;
        if (seen.has(id)) return;
        seen.add(id);
        count += 1;
      });
    }
    return count;
  } catch {
    return 0;
  }
}

function uniqueOrders(localOrders: any[], localConsignOrders: any[], serverOrders: any[]): any[] {
  const byId = new Map<string, any>();
  for (const [sourceName, rows] of [
    ['local', localOrders],
    ['local-consign', localConsignOrders],
    ['server', serverOrders],
  ] as const) {
    rows.forEach((order, index) => {
      if (!order || typeof order !== 'object') return;
      const key = String(order.id || order.orderNumber || order.code || `${sourceName}:${index}`);
      byId.set(key, { ...byId.get(key), ...order });
    });
  }
  return Array.from(byId.values());
}

function orderIsUnfulfilled(order: any): boolean {
  const states = [order?.status, order?.sellerStatus, order?.fulfillmentStatus]
    .map((value) => String(value || '').trim().toLowerCase());
  if (states.some((state) => /cancel|refunded/.test(state))) return false;
  return !states.some((state) => {
    if (/partially/.test(state) || /^not fulfilled$/.test(state)) return false;
    return /\b(delivered|received|settled|completed|complete|fulfilled)\b/.test(state);
  });
}

function orderIsNewSellerOrder(order: any): boolean {
  const sellerStatus = String(order?.sellerStatus || '').trim().toLowerCase().replace(/[ _-]+/g, ' ');
  if (sellerStatus) {
    return sellerStatus === 'awaiting payment' || sellerStatus === 'pending' || sellerStatus === 'new';
  }

  const status = String(order?.status || order?.fulfillmentStatus || '')
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, ' ');
  return status.startsWith('awaiting payment') || status === 'pending' || status === 'new' || status === 'new order';
}

function orderIsMerchantOverdue(order: any, now: number): boolean {
  if (!orderIsUnfulfilled(order)) return false;
  const states = [order?.status, order?.sellerStatus, order?.fulfillmentStatus]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
  if (/picked.?up|ship|transit/.test(states)) return false;
  const timestamp = recordTime({
    createdAt: order?.updatedAt || order?.updated_at || order?.createdAt || order?.created_at || order?.date,
  });
  return timestamp !== null && now - timestamp >= 24 * 60 * 60 * 1000;
}

function productReviewCount(productMap: unknown): number {
  if (!productMap || typeof productMap !== 'object' || Array.isArray(productMap)) return 0;
  const uniquePending = new Set<string>();
  const entries = Object.entries(productMap as Record<string, unknown>);
  const sellerEntries = entries.filter(([sellerEmail]) => sellerEmail !== 'default');
  (sellerEntries.length > 0 ? sellerEntries : entries).forEach(([sellerEmail, value]) => {
    asArray(value).forEach((product, index) => {
      if (!pendingStatus(product?.status)) return;
      const key = product?.id
        ? `id:${product.id}`
        : product?.sku
          ? `sku:${product.sku}`
          : product?.title
            ? `title:${product.title}`
            : `${sellerEmail}:${index}`;
      uniquePending.add(`${sellerEmail}:${String(key)}`);
    });
  });
  return uniquePending.size;
}

export function summarizeAdminTodoSources(recharges: unknown, ownersData: unknown, products: unknown, chatsData: unknown) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const owners = asArray(ownersData);
  const chats = asArray(chatsData);
  const openChats = chats.filter((chat) => {
    const status = String(chat?.status || 'open').toLowerCase();
    return status !== 'closed' && status !== 'resolved' && asArray(chat?.messages).some((message) => !message?.deleted);
  });
  const chasedNoReply = openChats.filter((chat) => {
    const messages = asArray(chat?.messages).filter((message) => !message?.deleted);
    const latest = messages.reduce((current, message) => {
      if (!current) return message;
      const currentTime = Date.parse(String(current.at || '')) || 0;
      const messageTime = Date.parse(String(message.at || '')) || 0;
      return messageTime >= currentTime ? message : current;
    }, null as any);
    const latestAt = latest ? Date.parse(String(latest.at || '')) : Number.NaN;
    return String(latest?.role || '').toLowerCase() === 'admin' &&
      Number.isFinite(latestAt) && now - latestAt >= 24 * 60 * 60 * 1000;
  }).length;

  const pendingOwners = owners.filter((owner) => pendingStatus(owner?.status)).length;
  const newOwners = owners.filter((owner) => {
    const timestamp = recordTime(owner);
    return timestamp !== null && timestamp >= weekAgo && timestamp <= now;
  }).length;

  return {
    ...(recharges ? {
      recharges: asArray(recharges).filter((row) => pendingStatus(row?.status)).length,
      deposits: asArray(recharges).filter((row) => String(row?.status || '').trim().toLowerCase() === 'confirmed').length,
    } : {}),
    ...(ownersData ? { merchantReview: pendingOwners, newLast7Days: newOwners } : {}),
    ...(products ? { productReview: productReviewCount(products) } : {}),
    ...(chatsData ? { supportTickets: openChats.length, chasedNoReply } : {}),
  };
}

export async function fetchAdminTodoCounts(): Promise<AdminTodoCounts> {
  const data = await getJson('/api/admin/todo-counts');
  const now = Date.now();
  const orderData = Array.isArray(data?.orders) ? data : null;
  const localOrders = readLocalArray('galleria_seller_orders');
  const localConsignOrders = readLocalArray('galleria_consign_orders_v3');
  const hasOrderSnapshot = Boolean(orderData) || localOrders.length > 0 || localConsignOrders.length > 0;
  const orders = uniqueOrders(
    localOrders,
    localConsignOrders,
    asArray(orderData?.orders)
  );
  const refunds = readLocalArray('galleria_seller_refunds');
  const pendingRefunds = refunds.filter((refund) => String(refund?.status || '').toLowerCase() === 'pending').length;
  const nextCounts: AdminTodoCounts = {
    ...lastSuccessfulTodoCounts,
    ...data?.counts,
    withdrawals: getPendingWithdrawalCount(),
    refundRequests: pendingRefunds,
    merchantOverdue: hasOrderSnapshot
      ? orders.filter((order) => orderIsMerchantOverdue(order, now)).length
      : lastSuccessfulTodoCounts.merchantOverdue,
    unfulfilledOrders: hasOrderSnapshot
      ? orders.filter(orderIsUnfulfilled).length
      : lastSuccessfulTodoCounts.unfulfilledOrders,
    newSellerOrders: hasOrderSnapshot
      ? orders.filter(orderIsNewSellerOrder).length
      : lastSuccessfulTodoCounts.newSellerOrders,
  };
  lastSuccessfulTodoCounts = nextCounts;
  return nextCounts;
}
