/**
 * Admin Panel Data Store and State Management
 * Persisted in localStorage so order and account changes
 * survive page reloads and sync live.
 */

export interface AdminOrder {
  id: string;
  orderNumber: string; // e.g. '#31'
  date: string; // e.g. 'Sep 18, 2026'
  customer: string; // e.g. 'buy buy'
  email?: string;
  salesChannel: string; // e.g. 'Default Sales Channel'
  paymentStatus: 'Captured' | 'Pending' | 'Refunded' | 'Partially Refunded';
  fulfillmentStatus: 'Delivered' | 'Not fulfilled' | 'Fulfilled' | 'Partially Delivered' | 'Refunded' | 'Rejected' | 'Cancelled';
  total: number; // in USD
  currency: string;
}

export const INITIAL_ADMIN_ORDERS: AdminOrder[] = [
  {
    id: 'ord-31',
    orderNumber: '#31',
    date: 'Sep 18, 2026',
    customer: 'buy buy',
    email: 'buyer.buy@example.com',
    salesChannel: 'Default Sales Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Delivered',
    total: 16.16,
    currency: 'USD',
  },
  {
    id: 'ord-30',
    orderNumber: '#30',
    date: 'Sep 18, 2026',
    customer: 'buy buy',
    email: 'buyer.buy@example.com',
    salesChannel: 'Default Sales Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Delivered',
    total: 256.71,
    currency: 'USD',
  },
  {
    id: 'ord-29',
    orderNumber: '#29',
    date: 'Sep 3, 2026',
    customer: 'buy buy',
    email: 'buyer.buy@example.com',
    salesChannel: 'Default Sales Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Not fulfilled',
    total: 19.99,
    currency: 'USD',
  },
  {
    id: 'ord-28',
    orderNumber: '#28',
    date: 'Aug 23, 2026',
    customer: 'buy buy',
    email: 'buyer.buy@example.com',
    salesChannel: 'Default Sales Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Not fulfilled',
    total: 26.16,
    currency: 'USD',
  },
  {
    id: 'ord-27',
    orderNumber: '#27',
    date: 'Aug 19, 2026',
    customer: 'Eleanor Vance',
    email: 'eleanor@vancecorp.io',
    salesChannel: 'Default Sales Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Delivered',
    total: 489.5,
    currency: 'USD',
  },
  {
    id: 'ord-26',
    orderNumber: '#26',
    date: 'Aug 15, 2026',
    customer: 'David Chen',
    email: 'david.chen@oriental.hk',
    salesChannel: 'B2B Wholesale Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Delivered',
    total: 1250.0,
    currency: 'USD',
  },
  {
    id: 'ord-25',
    orderNumber: '#25',
    date: 'Aug 11, 2026',
    customer: 'Sarah Jenkins',
    email: 'sarah.j@globallux.com',
    salesChannel: 'Default Sales Channel',
    paymentStatus: 'Captured',
    fulfillmentStatus: 'Not fulfilled',
    total: 84.2,
    currency: 'USD',
  },
];

const ADMIN_ORDERS_KEY = 'buyxoco_admin_orders';

export function getAdminOrders(): AdminOrder[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_ORDERS;
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_KEY);
    if (!raw) return INITIAL_ADMIN_ORDERS;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading admin orders', err);
    return INITIAL_ADMIN_ORDERS;
  }
}

export function saveAdminOrders(orders: AdminOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('buyxoco_admin_data_changed'));
  } catch (err) {
    console.error('Failed saving admin orders', err);
  }
}

export interface CreditScoreLog {
  id: string;
  timestamp: string;
  change: number;
  fromScore: number;
  toScore: number;
  reason: string;
  admin: string;
}

export interface WalletLedgerItem {
  id: string;
  date: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string;
}

export interface AdminSeller {
  id: string;
  name: string; // e.g. "Azhar collection"
  subtitle: string; // e.g. "Azhar shop"
  shopName?: string;
  email: string;
  phone?: string;
  tiktok?: string;
  creatorId?: string; // e.g. "01M5086R6S9GYHPK6GDW0BK8RG"
  walletOwnerId?: string; // e.g. "01M5086R6S9GYHPK6GDW0BK8RG"
  tempPassword?: string; // "no"
  forcePasswordChange?: boolean;
  createdAtFormatted?: string; // "10/15/2026, 10:01:54 AM"
  promoteRate?: string; // "10%"
  shopType?: string; // "independent"
  visitorsCount?: number; // 0
  targetExposure?: number; // 300
  packageTier: string; // e.g. "Free Shop"
  productLimit: number | 'Unlimited';
  profitMargin: number; // e.g. 15 for 15%
  status: 'approved' | 'review' | 'suspended';
  idStatus: string; // e.g. "No ID uploaded"
  productsCount: number;
  products?: any[];
  balances: {
    pending: number;
    wallet: number;
    guarantee: number;
  };
  usdBalance?: number;
  usdtBalance?: number;
  depositHeld?: number;
  creditScore?: number;
  creditLogs?: CreditScoreLog[];
  gmv?: number;
  commission?: number;
  referrals?: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
  };
  inventoryDistinct?: number;
  capitalLocked?: number;
  consignTotal?: number;
  consignUnpaid?: number;
  consignTurnover?: number;
  consignProfit?: number;
  walletLedger?: WalletLedgerItem[];
  joinedDate: string; // e.g. "Oct 15"
  notes?: string;
  kycSubmission?: {
    id: string;
    sellerEmail: string;
    sellerName: string;
    shopName: string;
    docType: string;
    frontImage: string;
    backImage?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  } | null;
}

export const INITIAL_ADMIN_SELLERS: AdminSeller[] = [];


const ADMIN_SELLERS_KEY = 'buyxoco_admin_sellers';

export function getAdminSellers(): AdminSeller[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_SELLERS;
  try {
    const raw = localStorage.getItem(ADMIN_SELLERS_KEY);
    if (!raw) return INITIAL_ADMIN_SELLERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Purge any legacy mock sellers (seller-1 through seller-25)
      const nonMock = parsed.filter(
        (s) =>
          !/^seller-\d+$/.test(s.id) &&
          s.email !== 'ansarkhan363@gmail.com' &&
          s.email !== 'ansarkhan3363@gmail.com' &&
          s.email !== 'galleria.hub@example.com' &&
          s.email !== 'sven@nordiclux.se' &&
          s.email !== 'tokyo.crafts@artisan.jp'
      );
      return nonMock;
    }
    return INITIAL_ADMIN_SELLERS;
  } catch (err) {
    console.error('Failed reading admin sellers', err);
    return INITIAL_ADMIN_SELLERS;
  }
}

export function saveAdminSellers(sellers: AdminSeller[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_SELLERS_KEY, JSON.stringify(sellers));
    window.dispatchEvent(new Event('buyxoco_admin_data_changed'));
  } catch (err) {
    console.error('Failed saving admin sellers', err);
  }
}
