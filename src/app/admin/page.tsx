'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { AdminSidebar, AdminTab, SettingsSubTab } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import type { SellerConfirmedOrder } from '@/components/admin/AdminConfirmSellerOrdersView';
import { fetchAdminConsignOrders } from '@/lib/adminConsignOrders';
import { EMPTY_ADMIN_TODO_COUNTS, fetchAdminTodoCounts, totalAdminTodoCount } from '@/lib/adminTodoCounts';
import type { AdminTodoCounts } from '@/lib/adminTodoCounts';
import { fetchConsignMerchants } from '@/lib/consignMerchants';
import { installAdminAuditTracking, recordAdminActivity } from '@/lib/adminAuditClient';

const SELLER_CONFIRMATION_READ_IDS_KEY = 'galleria_admin_seller_confirmations_read_v1';

function sameTodoCounts(left: AdminTodoCounts, right: AdminTodoCounts): boolean {
  return (Object.keys(left) as (keyof AdminTodoCounts)[]).every((key) => left[key] === right[key]);
}

function isSellerConfirmedOrder(order: SellerConfirmedOrder): boolean {
  const sellerStatus = String(order.sellerStatus || '').trim().toLowerCase().replace(/[ _-]+/g, ' ');
  const status = String(order.status || '').trim().toLowerCase();
  const pastConfirmation = /^(?:cancel+ed|refund|reject|exception|picked up|shipped|on the way|received|settled|delivered)/;
  if (pastConfirmation.test(status) || pastConfirmation.test(sellerStatus)) return false;
  if (sellerStatus === 'confirmed' || /^paid\b/.test(status)) return true;
  return Boolean(order.sellerPaidAt || order.paymentAdjustmentId);
}

function sellerConfirmationTime(order: SellerConfirmedOrder): number {
  return Date.parse(order.sellerPaidAt || order.updatedAt || order.createdAt || order.date || '') || 0;
}

function sameSellerConfirmations(left: SellerConfirmedOrder[], right: SellerConfirmedOrder[]): boolean {
  return left.length === right.length && left.every((order, index) =>
    JSON.stringify(order) === JSON.stringify(right[index])
  );
}

const ViewSkeleton = () => (
  <div className="w-full h-80 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
  </div>
);

const AdminOrdersView = dynamic(() => import('@/components/admin/AdminOrdersView').then((m) => m.AdminOrdersView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminDraftOrdersView = dynamic(() => import('@/components/admin/AdminDraftOrdersView').then((m) => m.AdminDraftOrdersView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminProductsView = dynamic(() => import('@/components/admin/AdminProductsView').then((m) => m.AdminProductsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminProductFeedView = dynamic(() => import('@/components/admin/AdminProductFeedView').then((m) => m.AdminProductFeedView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminStorehouseCatalogView = dynamic(() => import('@/components/admin/AdminStorehouseCatalogView').then((m) => m.AdminStorehouseCatalogView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminCollectionsView = dynamic(() => import('@/components/admin/AdminCollectionsView').then((m) => m.AdminCollectionsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminCategoriesView = dynamic(() => import('@/components/admin/AdminCategoriesView').then((m) => m.AdminCategoriesView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminInventoryView = dynamic(() => import('@/components/admin/AdminInventoryView').then((m) => m.AdminInventoryView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminReservationsView = dynamic(() => import('@/components/admin/AdminReservationsView').then((m) => m.AdminReservationsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminCustomersView = dynamic(() => import('@/components/admin/AdminCustomersView').then((m) => m.AdminCustomersView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminCustomerGroupsView = dynamic(() => import('@/components/admin/AdminCustomerGroupsView').then((m) => m.AdminCustomerGroupsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminPromotionsView = dynamic(() => import('@/components/admin/AdminPromotionsView').then((m) => m.AdminPromotionsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminCampaignsView = dynamic(() => import('@/components/admin/AdminCampaignsView').then((m) => m.AdminCampaignsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminPriceListsView = dynamic(() => import('@/components/admin/AdminPriceListsView').then((m) => m.AdminPriceListsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminProductUpdateView = dynamic(() => import('@/components/admin/AdminProductUpdateView').then((m) => m.AdminProductUpdateView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminStoreCategoriesView = dynamic(() => import('@/components/admin/AdminStoreCategoriesView').then((m) => m.AdminStoreCategoriesView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminTodoView = dynamic(() => import('@/components/admin/AdminTodoView').then((m) => m.AdminTodoView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminConfirmSellerOrdersView = dynamic(() => import('@/components/admin/AdminConfirmSellerOrdersView').then((m) => m.AdminConfirmSellerOrdersView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminAuditLogView = dynamic(() => import('@/components/admin/AdminAuditLogView').then((m) => m.AdminAuditLogView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminAccountsView = dynamic(() => import('@/components/admin/AdminAccountsView').then((m) => m.AdminAccountsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminConsignView = dynamic(() => import('@/components/admin/AdminConsignView').then((m) => m.AdminConsignView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminOwnersView = dynamic(() => import('@/components/admin/AdminOwnersView').then((m) => m.AdminOwnersView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminSupportView = dynamic(() => import('@/components/admin/AdminSupportView').then((m) => m.AdminSupportView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminWithdrawalsView = dynamic(() => import('@/components/admin/AdminWithdrawalsView').then((m) => m.AdminWithdrawalsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminInvitesView = dynamic(() => import('@/components/admin/AdminInvitesView').then((m) => m.AdminInvitesView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminVerificationView = dynamic(() => import('@/components/admin/AdminVerificationView').then((m) => m.AdminVerificationView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminReviewsView = dynamic(() => import('@/components/admin/AdminReviewsView').then((m) => m.AdminReviewsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminDisputesView = dynamic(() => import('@/components/admin/AdminDisputesView').then((m) => m.AdminDisputesView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminHandoverView = dynamic(() => import('@/components/admin/AdminHandoverView').then((m) => m.AdminHandoverView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminAnalyticsView = dynamic(() => import('@/components/admin/AdminAnalyticsView').then((m) => m.AdminAnalyticsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminShortcutsView = dynamic(() => import('@/components/admin/AdminShortcutsView').then((m) => m.AdminShortcutsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminLiveStreamsView = dynamic(() => import('@/components/admin/AdminLiveStreamsView').then((m) => m.AdminLiveStreamsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminPayoutsView = dynamic(() => import('@/components/admin/AdminPayoutsView').then((m) => m.AdminPayoutsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminSiteSettingsView = dynamic(() => import('@/components/admin/AdminSiteSettingsView').then((m) => m.AdminSiteSettingsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminWalletLedgerView = dynamic(() => import('@/components/admin/AdminWalletLedgerView').then((m) => m.AdminWalletLedgerView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminReceivingAddressView = dynamic(() => import('@/components/admin/AdminReceivingAddressView').then((m) => m.AdminReceivingAddressView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminRestockView = dynamic(() => import('@/components/admin/AdminRestockView').then((m) => m.AdminRestockView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminRefundRequestsView = dynamic(() => import('@/components/admin/AdminRefundRequestsView').then((m) => m.AdminRefundRequestsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminMerchantLoginsView = dynamic(() => import('@/components/admin/AdminMerchantLoginsView').then((m) => m.AdminMerchantLoginsView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminSellerProductReviewView = dynamic(() => import('@/components/admin/AdminSellerProductReviewView').then((m) => m.AdminSellerProductReviewView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminRetailListingReviewView = dynamic(() => import('@/components/admin/AdminRetailListingReviewView').then((m) => m.AdminRetailListingReviewView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminStorefrontOrdersView = dynamic(() => import('@/components/admin/AdminStorefrontOrdersView').then((m) => m.AdminStorefrontOrdersView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminShowcaseVideosView = dynamic(() => import('@/components/admin/AdminShowcaseVideosView').then((m) => m.AdminShowcaseVideosView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminWalletRechargesView = dynamic(() => import('@/components/admin/AdminWalletRechargesView').then((m) => m.AdminWalletRechargesView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminCommissionLedgerView = dynamic(() => import('@/components/admin/AdminCommissionLedgerView').then((m) => m.AdminCommissionLedgerView), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminOtherViews = dynamic(() => import('@/components/admin/AdminOtherViews').then((m) => m.AdminOtherViews), { ssr: false, loading: () => <ViewSkeleton /> });
const AdminSearchModal = dynamic(() => import('@/components/admin/AdminSearchModal').then((m) => m.AdminSearchModal), { ssr: false });

const ADMIN_PANEL_BY_TAB: Partial<Record<AdminTab, unknown>> = {
  orders: AdminOrdersView,
  drafts: AdminDraftOrdersView,
  products: AdminProductsView,
  product_feed: AdminProductFeedView,
  storehouse_catalog: AdminStorehouseCatalogView,
  collections: AdminCollectionsView,
  categories: AdminCategoriesView,
  inventory: AdminInventoryView,
  reservations: AdminReservationsView,
  customers: AdminCustomersView,
  customer_groups: AdminCustomerGroupsView,
  promotions: AdminPromotionsView,
  campaigns: AdminCampaignsView,
  price_lists: AdminPriceListsView,
  product_update: AdminProductUpdateView,
  store_categories: AdminStoreCategoriesView,
  todo: AdminTodoView,
  confirm_order_by_seller: AdminConfirmSellerOrdersView,
  audit_log: AdminAuditLogView,
  accounts: AdminAccountsView,
  consign: AdminConsignView,
  consign_product_queries: AdminConsignView,
  owners: AdminOwnersView,
  support: AdminSupportView,
  withdrawals: AdminWithdrawalsView,
  admin_withdrawals: AdminWithdrawalsView,
  invites: AdminInvitesView,
  verification: AdminVerificationView,
  reviews: AdminReviewsView,
  disputes: AdminDisputesView,
  handover: AdminHandoverView,
  analytics: AdminAnalyticsView,
  shortcuts: AdminShortcutsView,
  live: AdminLiveStreamsView,
  payouts: AdminPayoutsView,
  site_settings: AdminSiteSettingsView,
  wallet_ledger: AdminWalletLedgerView,
  receiving_address: AdminReceivingAddressView,
  restock: AdminRestockView,
  refund_governance: AdminRefundRequestsView,
  logins: AdminMerchantLoginsView,
  product_review: AdminSellerProductReviewView,
  videos: AdminShowcaseVideosView,
  recharges: AdminWalletRechargesView,
  commission_ledger: AdminCommissionLedgerView,
  admin_settings: AdminOtherViews,
};

const prefetchedAdminComponents = new WeakSet<object>();

function prefetchAdminComponent(panel: unknown): void {
  if (!panel || (typeof panel !== 'function' && typeof panel !== 'object')) return;
  const key = panel as object;
  if (prefetchedAdminComponents.has(key)) return;
  const component = panel as { preload?: () => unknown };
  if (!component || typeof component.preload !== 'function') return;
  prefetchedAdminComponents.add(key);
  try {
    void Promise.resolve(component.preload()).catch(() => prefetchedAdminComponents.delete(key));
  } catch {
    prefetchedAdminComponents.delete(key);
  }
}

function prefetchAdminTab(tab: AdminTab): void {
  prefetchAdminComponent(ADMIN_PANEL_BY_TAB[tab]);
}

export default function AdminPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('store');
  const [rechargeInitialStatus, setRechargeInitialStatus] = useState<'All' | 'Pending' | 'Confirmed'>('Pending');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [todoCounts, setTodoCounts] = useState<AdminTodoCounts>(EMPTY_ADMIN_TODO_COUNTS);
  const [sellerConfirmedOrders, setSellerConfirmedOrders] = useState<SellerConfirmedOrder[]>([]);
  const [readSellerConfirmedOrderIds, setReadSellerConfirmedOrderIds] = useState<string[]>([]);
  const seenSellerConfirmedOrderIds = useRef<Set<string> | null>(null);
  const lastLoggedAdminTab = useRef<string | null>(null);
  const waitingCount = totalAdminTodoCount(todoCounts);
  const sellerConfirmedUnreadCount = sellerConfirmedOrders.filter((order) => !readSellerConfirmedOrderIds.includes(order.id)).length;

  useEffect(() => installAdminAuditTracking(), []);

  useEffect(() => {
    if (authVerified && currentAdminEmail) void fetchConsignMerchants(currentAdminEmail).catch(() => {});
  }, [authVerified, currentAdminEmail]);

  useEffect(() => {
    const sidebar = document.querySelector('[data-admin-sidebar]');
    if (!sidebar) return;
    const prefetchFromTarget = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-prefetch-search]')) {
        prefetchAdminComponent(AdminSearchModal);
        return;
      }
      const tab = event.target.closest<HTMLElement>('[data-prefetch-tab]')?.dataset.prefetchTab as AdminTab | undefined;
      if (tab) prefetchAdminTab(tab);
    };
    sidebar.addEventListener('pointerover', prefetchFromTarget);
    sidebar.addEventListener('focusin', prefetchFromTarget);
    return () => {
      sidebar.removeEventListener('pointerover', prefetchFromTarget);
      sidebar.removeEventListener('focusin', prefetchFromTarget);
    };
  }, [activeTab === 'admin_settings', authVerified, isMounted]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const verifySession = async () => {
      if (cancelled || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const response = await fetch('/api/admin/auth/session', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error('Admin session expired. Please sign in again.');
        if (!cancelled) {
          setCurrentAdminEmail(String(data.account?.email || ''));
          setAuthVerified(true);
        }
      } catch {
        if (!cancelled) router.replace('/admin/login');
      } finally {
        inFlight = false;
      }
    };
    void verifySession();
    const interval = window.setInterval(() => void verifySession(), 30_000);
    window.addEventListener('focus', verifySession);
    document.addEventListener('visibilitychange', verifySession);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', verifySession);
      document.removeEventListener('visibilitychange', verifySession);
    };
  }, [router]);

  useEffect(() => {
    if (!isMounted || !authVerified) return;
    const tabKey = `${activeTab}:${activeTab === 'admin_settings' ? settingsSubTab : ''}`;
    if (lastLoggedAdminTab.current === tabKey) return;
    lastLoggedAdminTab.current = tabKey;
    const sectionTitle = activeTab === 'admin_settings'
      ? `${settingsSubTab.replace(/_/g, ' ')} settings`
      : activeTab.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    void recordAdminActivity({
      actionText: `Opened ${sectionTitle} in the admin panel`,
      details: `Admin section: ${sectionTitle}.`,
      category: 'Other',
      endpoint: 'Admin navigation',
      method: 'NAVIGATE',
    });
  }, [activeTab, authVerified, isMounted, settingsSubTab]);

  useEffect(() => {
    const loadReadIds = () => {
      try {
        const saved = window.localStorage.getItem(SELLER_CONFIRMATION_READ_IDS_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setReadSellerConfirmedOrderIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
      } catch {
        setReadSellerConfirmedOrderIds([]);
      }
    };
    loadReadIds();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SELLER_CONFIRMATION_READ_IDS_KEY) loadReadIds();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync tab with URL query parameter on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as AdminTab;
      const sub = params.get('sub') as SettingsSubTab;
      if (tab) setActiveTab(tab);
      if (sub) setSettingsSubTab(sub);
    }
    setIsMounted(true);
  }, []);

  // Update URL parameters when tab changes (guarded by isMounted to prevent race conditions on reload)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.get('tab') !== activeTab) {
      url.searchParams.set('tab', activeTab);
      changed = true;
    }
    if (activeTab === 'admin_settings') {
      if (url.searchParams.get('sub') !== settingsSubTab) {
        url.searchParams.set('sub', settingsSubTab);
        changed = true;
      }
    } else {
      if (url.searchParams.has('sub')) {
        url.searchParams.delete('sub');
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab, settingsSubTab, isMounted]);

  // Global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep To-do totals connected to the current saved records.
  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;
    const updateCounts = async () => {
      if (document.visibilityState === 'hidden') return;
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const nextCounts = await fetchAdminTodoCounts();
        if (!cancelled) {
          setTodoCounts((current) => sameTodoCounts(current, nextCounts) ? current : nextCounts);
        }
      } finally {
        requestInFlight = false;
      }
    };
    void updateCounts();
    const intervalId = window.setInterval(() => void updateCounts(), 30_000);
    window.addEventListener('storage', updateCounts);
    window.addEventListener('focus', updateCounts);
    window.addEventListener('galleria:admin-todo-changed', updateCounts);
    window.addEventListener('buyxoco_admin_data_changed', updateCounts);
    window.addEventListener('galleria:seller-orders-changed', updateCounts);
    document.addEventListener('visibilitychange', updateCounts);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('focus', updateCounts);
      window.removeEventListener('galleria:admin-todo-changed', updateCounts);
      window.removeEventListener('buyxoco_admin_data_changed', updateCounts);
      window.removeEventListener('galleria:seller-orders-changed', updateCounts);
      document.removeEventListener('visibilitychange', updateCounts);
    };
  }, []);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const viewingSellerConfirmations = activeTab === 'confirm_order_by_seller';
  useEffect(() => {
    if (!authVerified) return;
    const controller = new AbortController();
    let requestInFlight = false;
    const refreshSellerConfirmations = async () => {
      if (requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;
      try {
        const data = await fetchAdminConsignOrders();
        if (!data?.success || !Array.isArray(data.orders)) return;
        const confirmed = (data.orders as SellerConfirmedOrder[])
          .filter(isSellerConfirmedOrder)
          .sort((left, right) => sellerConfirmationTime(right) - sellerConfirmationTime(left));
        if (controller.signal.aborted) return;
        const currentIds = new Set(confirmed.map((order) => order.id));
        const previousIds = seenSellerConfirmedOrderIds.current;
        if (previousIds) {
          const newlyConfirmed = confirmed.filter((order) => !previousIds.has(order.id));
          if (newlyConfirmed.length > 0) {
            const toast = newlyConfirmed.length === 1
              ? `Order #${newlyConfirmed[0].orderNumber || newlyConfirmed[0].id} confirmed by seller.`
              : `${newlyConfirmed.length} orders confirmed by sellers.`;
            setToastMessage(toast);
            window.setTimeout(() => setToastMessage((current) => current === toast ? null : current), 3500);
          }
        }
        seenSellerConfirmedOrderIds.current = currentIds;
        setSellerConfirmedOrders((current) => sameSellerConfirmations(current, confirmed) ? current : confirmed);
      } catch {
        // Keep the last confirmed-order list visible if a refresh temporarily fails.
      } finally {
        requestInFlight = false;
      }
    };

    void refreshSellerConfirmations();
    const intervalId = window.setInterval(() => void refreshSellerConfirmations(), viewingSellerConfirmations ? 10_000 : 30_000);
    window.addEventListener('storage', refreshSellerConfirmations);
    window.addEventListener('focus', refreshSellerConfirmations);
    window.addEventListener('galleria:seller-orders-changed', refreshSellerConfirmations);
    document.addEventListener('visibilitychange', refreshSellerConfirmations);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refreshSellerConfirmations);
      window.removeEventListener('focus', refreshSellerConfirmations);
      window.removeEventListener('galleria:seller-orders-changed', refreshSellerConfirmations);
      document.removeEventListener('visibilitychange', refreshSellerConfirmations);
    };
  }, [authVerified, viewingSellerConfirmations]);

  const markAllSellerConfirmationsRead = () => {
    const nextReadIds = Array.from(new Set([...readSellerConfirmedOrderIds, ...sellerConfirmedOrders.map((order) => order.id)]));
    setReadSellerConfirmedOrderIds(nextReadIds);
    try {
      window.localStorage.setItem(SELLER_CONFIRMATION_READ_IDS_KEY, JSON.stringify(nextReadIds));
    } catch {}
  };

  const selectTab = (tab: AdminTab) => {
    if (tab === 'recharges') setRechargeInitialStatus('Pending');
    setActiveTab(tab);
  };

  const getTabTitle = (tab: AdminTab): string => {
    switch (tab) {
      case 'orders':
        return 'Orders';
      case 'drafts':
        return 'Draft Orders';
      case 'products':
        return 'Products';
      case 'product_feed':
        return 'Product Feed';
      case 'storehouse_catalog':
        return 'Storehouse Catalog';
      case 'collections':
        return 'Collections';
      case 'categories':
        return 'Categories';
      case 'inventory':
        return 'Inventory';
      case 'reservations':
        return 'Reservations';
      case 'customers':
        return 'Customers';
      case 'customer_groups':
        return 'Customer Groups';
      case 'promotions':
        return 'Promotions';
      case 'campaigns':
        return 'Campaigns';
      case 'price_lists':
        return 'Price Lists';
      case 'product_update':
        return 'Product Update';
      case 'store_categories':
        return 'Manage Categories';
      case 'todo':
        return 'To-do';
      case 'confirm_order_by_seller':
        return 'Confirm Order by Seller';
      case 'audit_log':
        return 'Audit log';
      case 'accounts':
        return 'Accounts';
      case 'consign':
        return 'Consign';
      case 'consign_product_queries':
        return 'Product Queries';
      case 'owners':
        return 'Sellers';
      case 'support':
        return 'Support';
      case 'recharges':
        return 'Recharges';
      case 'withdrawals':
        return 'Withdrawals';
      case 'invites':
        return 'Invites';
      case 'verification':
        return 'Verification';
      case 'reviews':
        return 'Reviews';
      case 'disputes':
        return 'Disputes';
      case 'handover':
        return 'Handover';
      case 'analytics':
        return 'Analytics';
      case 'shortcuts':
        return 'Shortcuts';
      case 'live':
        return 'Live';
      case 'payouts':
        return 'Payouts';
      case 'site_settings':
        return 'Website Info Manage';
      case 'wallet_ledger':
        return 'Ledger';
      case 'receiving_address':
        return 'Receiving';
      case 'restock':
        return 'Restock';
      case 'refund_governance':
        return 'Refunds';
      case 'logins':
        return 'Logins';
      case 'product_review':
        return 'Product Review';
      case 'retail_listings':
        return 'Retail Listings';
      case 'storefront_orders':
        return 'Store Orders';
      case 'videos':
        return 'Videos';
      case 'commission_ledger':
        return 'Commission Ledger';
      case 'admin_withdrawals':
        return 'Withdrawals';
      case 'admin_settings': {
        const subLabels: Record<SettingsSubTab, string> = {
          store: 'Store Settings',
          users: 'Users',
          regions: 'Regions',
          tax_regions: 'Tax Regions',
          return_reasons: 'Return Reasons',
          refund_reasons: 'Refund Reasons',
          sales_channels: 'Sales Channels',
          product_types: 'Product Types',
          product_tags: 'Product Tags',
          locations_shipping: 'Locations & Shipping',
          publishable_api_keys: 'Publishable API Keys',
          secret_api_keys: 'Secret API Keys',
          workflows: 'Workflows',
        };
        return `Settings · ${subLabels[settingsSubTab] || 'Settings'}`;
      }
      default:
        return 'Admin Panel';
    }
  };

  if (!isMounted || !authVerified) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-admin-layout className="min-h-screen bg-[#f9fafb] flex text-gray-900 font-sans selection:bg-[#e11d48] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-slideUp">
          <div className="bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-xl border border-gray-700 flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          selectTab(tab);
          notify(`Switched to ${getTabTitle(tab)}`);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        waitingCount={waitingCount}
        withdrawalsCount={todoCounts.withdrawals}
        sellerConfirmedOrdersCount={sellerConfirmedUnreadCount}
        settingsSubTab={settingsSubTab}
        onSelectSettingsSubTab={(sub) => {
          setSettingsSubTab(sub);
          notify(`Settings: ${sub.replace('_', ' ')}`);
        }}
        onBackToMain={() => {
          setActiveTab('orders');
          notify('Returned to Orders');
        }}
      />

      {/* Main Content Area */}
      <div data-admin-main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        {/* Top Header */}
        <AdminHeader
          title={getTabTitle(activeTab)}
          onOpenNotifications={() => setActiveTab('todo')}
          waitingCount={waitingCount}
          activeTab={activeTab}
          settingsSubTab={settingsSubTab}
          adminEmail={currentAdminEmail}
          onSignOut={() => {
            void fetch('/api/admin/auth/session', { method: 'DELETE' }).finally(() => router.replace('/admin/login'));
          }}
        />

        {/* View Canvas */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {activeTab === 'orders' ? (
            <AdminOrdersView
              onOpenTodo={() => setActiveTab('todo')}
              notify={notify}
              waitingCount={waitingCount}
              todoCounts={todoCounts}
            />
          ) : activeTab === 'drafts' ? (
            <AdminDraftOrdersView notify={notify} />
          ) : activeTab === 'products' ? (
            <AdminProductsView notify={notify} />
          ) : activeTab === 'product_feed' ? (
            <AdminProductFeedView notify={notify} />
          ) : activeTab === 'storehouse_catalog' ? (
            <AdminStorehouseCatalogView />
          ) : activeTab === 'collections' ? (
            <AdminCollectionsView notify={notify} />
          ) : activeTab === 'categories' ? (
            <AdminCategoriesView notify={notify} />
          ) : activeTab === 'inventory' ? (
            <AdminInventoryView notify={notify} />
          ) : activeTab === 'reservations' ? (
            <AdminReservationsView notify={notify} />
          ) : activeTab === 'customers' ? (
            <AdminCustomersView notify={notify} />
          ) : activeTab === 'customer_groups' ? (
            <AdminCustomerGroupsView notify={notify} />
          ) : activeTab === 'promotions' ? (
            <AdminPromotionsView notify={notify} />
          ) : activeTab === 'campaigns' ? (
            <AdminCampaignsView notify={notify} />
          ) : activeTab === 'price_lists' ? (
            <AdminPriceListsView notify={notify} />
          ) : activeTab === 'product_update' ? (
            <AdminProductUpdateView notify={notify} />
          ) : activeTab === 'store_categories' ? (
            <AdminStoreCategoriesView />
          ) : activeTab === 'todo' ? (
            <AdminTodoView
              counts={todoCounts}
              notify={notify}
              onSelectTab={selectTab}
              onOpenDeposits={() => {
                setRechargeInitialStatus('Confirmed');
                setActiveTab('recharges');
              }}
            />
          ) : activeTab === 'confirm_order_by_seller' ? (
            <AdminConfirmSellerOrdersView
              orders={sellerConfirmedOrders}
              readOrderIds={readSellerConfirmedOrderIds}
              onMarkAllRead={markAllSellerConfirmationsRead}
              onOpenConsign={() => selectTab('consign')}
            />
          ) : activeTab === 'audit_log' ? (
            <AdminAuditLogView notify={notify} />
          ) : activeTab === 'accounts' ? (
            <AdminAccountsView notify={notify} />
          ) : activeTab === 'consign' || activeTab === 'consign_product_queries' ? (
            <AdminConsignView
              key={currentAdminEmail}
              adminEmail={currentAdminEmail}
              notify={notify}
              initialTab={activeTab === 'consign_product_queries' ? 'product_queries' : 'consign'}
            />
          ) : activeTab === 'owners' ? (
            <AdminOwnersView notify={notify} />
          ) : activeTab === 'support' ? (
            <AdminSupportView notify={notify} />
          ) : activeTab === 'withdrawals' || activeTab === 'admin_withdrawals' ? (
            <AdminWithdrawalsView notify={notify} />
          ) : activeTab === 'invites' ? (
            <AdminInvitesView notify={notify} />
          ) : activeTab === 'verification' ? (
            <AdminVerificationView notify={notify} />
          ) : activeTab === 'reviews' ? (
            <AdminReviewsView notify={notify} />
          ) : activeTab === 'disputes' ? (
            <AdminDisputesView notify={notify} />
          ) : activeTab === 'handover' ? (
            <AdminHandoverView notify={notify} />
          ) : activeTab === 'analytics' ? (
            <AdminAnalyticsView />
          ) : activeTab === 'shortcuts' ? (
            <AdminShortcutsView
              onSelectTab={(tab) => {
                selectTab(tab);
              }}
              notify={notify}
            />
          ) : activeTab === 'live' ? (
            <AdminLiveStreamsView notify={notify} />
          ) : activeTab === 'payouts' ? (
            <AdminPayoutsView notify={notify} />
          ) : activeTab === 'site_settings' ? (
            <AdminSiteSettingsView notify={notify} />
          ) : activeTab === 'wallet_ledger' ? (
            <AdminWalletLedgerView notify={notify} />
          ) : activeTab === 'receiving_address' ? (
            <AdminReceivingAddressView notify={notify} />
          ) : activeTab === 'restock' ? (
            <AdminRestockView notify={notify} />
          ) : activeTab === 'refund_governance' ? (
            <AdminRefundRequestsView notify={notify} />
          ) : activeTab === 'logins' ? (
            <AdminMerchantLoginsView notify={notify} />
          ) : activeTab === 'product_review' ? (
            <AdminSellerProductReviewView notify={notify} />
          ) : activeTab === 'retail_listings' ? (
            <AdminRetailListingReviewView notify={notify} />
          ) : activeTab === 'storefront_orders' ? (
            <AdminStorefrontOrdersView />
          ) : activeTab === 'videos' ? (
            <AdminShowcaseVideosView notify={notify} />
          ) : activeTab === 'recharges' ? (
            <AdminWalletRechargesView notify={notify} initialStatus={rechargeInitialStatus} />
          ) : activeTab === 'commission_ledger' ? (
            <AdminCommissionLedgerView notify={notify} />
          ) : (
            <AdminOtherViews
              activeTab={activeTab}
              settingsSubTab={settingsSubTab}
              notify={notify}
              onOpenTodo={() => setActiveTab('todo')}
            />
          )}
        </main>
      </div>

      {/* Command Palette / Search Modal */}
      <AdminSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={selectTab}
      />
    </div>
  );
}
