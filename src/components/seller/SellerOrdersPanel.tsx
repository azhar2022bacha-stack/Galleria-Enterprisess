'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { createPortal } from 'react-dom';
import { Check, CheckCircle2, Eye, MapPin, MessageSquare, Package, RotateCcw, Search, User, X } from 'lucide-react';
import { maskCustomerEmail, maskCustomerPhone, maskStreetAddress } from '@/lib/privacy';
import {
  SellerOrder,
  SellerOrderStatus,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  ORDER_NEXT_ACTION_LABEL,
  advanceOrders,
  paySellerOrder,
  paySellerOrders,
  amountToCents,
  orderPaymentBreakdown,
  getCurrentPackageTier,
  getNextStatus,
  getOrders,
  getWallet,
  getTransactions,
  subscribeToOrders,
  syncConsignOrdersFromServer,
} from '@/lib/sellerOrders';

type TabId = 'all' | SellerOrderStatus | 'unread';

interface UnreadOrderMessages {
  orderId?: string;
  orderNumber?: string;
  count: number;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  ...ORDER_STATUS_FLOW.map((s) => ({ id: s as TabId, label: ORDER_STATUS_LABEL[s] })),
  { id: 'unread', label: 'Unread' },
];

const FULFILMENT_TRACK_STAGES = [
  'Pending',
  'Confirmed',
  'Picked Up',
  'On the Way',
  'Delivered',
] as const;

const FULFILMENT_CURRENT_STAGE: Record<SellerOrderStatus, number> = {
  awaiting_payment: 0,
  confirmed: 1,
  picked_up: 2,
  on_the_way: 3,
  delivered: 4,
};
const FULFILMENT_HISTORY_STATUS: Partial<Record<(typeof FULFILMENT_TRACK_STAGES)[number], SellerOrderStatus>> = {
  Pending: 'awaiting_payment',
  Confirmed: 'confirmed',
  'Picked Up': 'picked_up',
  'On the Way': 'on_the_way',
  Delivered: 'delivered',
};
const PAGE_SIZE = 10;

const STATUS_PILL: Record<SellerOrderStatus, string> = {
  awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-violet-50 text-violet-700 border-violet-200',
  on_the_way: 'bg-sky-50 text-sky-700 border-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

function maskEmail(value?: string) {
 return maskCustomerEmail(value);
}
interface SellerOrdersPanelProps {
  onOpenWallet: () => void;
  notify: (msg: string) => void;
  sellerEmail?: string;
  sellerName?: string;
  sellerShopName?: string;
}

export function SellerOrdersPanel({
  onOpenWallet,
  notify,
  sellerEmail,
  sellerName,
  sellerShopName,
}: SellerOrdersPanelProps) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [isPayAllReviewOpen, setIsPayAllReviewOpen] = useState(false);
  const [payAllReviewError, setPayAllReviewError] = useState('');
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [orderOutcomes, setOrderOutcomes] = useState<Record<string, 'Refunded' | 'Rejected' | 'Cancelled'>>({});
  const [unreadOrderMessages, setUnreadOrderMessages] = useState<UnreadOrderMessages[]>([]);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [outcomesLoaded, setOutcomesLoaded] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);
  const currentPackageTier = getCurrentPackageTier();
  const commissionRate = currentPackageTier.rebatePercent;
  const payableRate = 100 - commissionRate;

  // Active seller identity
  const activeSellerInfo = useMemo(() => {
    let email = (sellerEmail || '').trim().toLowerCase();
    let name = (sellerName || '').trim().toLowerCase();
    let shopName = (sellerShopName || '').trim().toLowerCase();
    if (typeof window !== 'undefined' && (!email || !name || !shopName)) {
      try {
        const raw = localStorage.getItem('galleria_active_seller');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!email && parsed?.email) email = parsed.email.trim().toLowerCase();
          if (!name && (parsed?.fullName || parsed?.shopName)) {
            name = (parsed.fullName || parsed.shopName).trim().toLowerCase();
          }
          if (!shopName && parsed?.shopName) {
            shopName = parsed.shopName.trim().toLowerCase();
          }
        }
      } catch {}
    }
    return { email, name, shopName };
  }, [sellerEmail, sellerName, sellerShopName]);

  const normalizeOrderCode = (value: unknown) => String(value || '').trim().replace(/^#/, '').toLowerCase();
  const getOrderOutcome = (order: SellerOrder) => {
    if (order.source !== 'consign' && !order.consignOrderId) return undefined;
    return orderOutcomes[`id:${order.consignOrderId || order.id}`] ||
      orderOutcomes[`code:${normalizeOrderCode(order.code)}`];
  };
  const isPaymentBlocked = (order: SellerOrder) =>
    Boolean(getOrderOutcome(order)) || (order.source === 'consign' && !outcomesLoaded);
  const getReturnAmount = (order: SellerOrder) => {
    if (Number.isFinite(order.sellerPaidAmount)) return Number(order.sellerPaidAmount);
    const matchingPayment = getTransactions().find((transaction) =>
      transaction.type === 'order_payment' && transaction.id === `tx-pay-${order.id}`
    );
    return matchingPayment?.amount ?? orderPaymentBreakdown(order.amount).payable;
  };

  // Load + live-sync with shared localStorage store & server persistence
  useEffect(() => {
    let active = true;
    const refreshOrderOutcomes = async () => {
      try {
        const notificationUrl = activeSellerInfo.email
          ? `/api/seller/notifications?email=${encodeURIComponent(activeSellerInfo.email)}`
          : '/api/seller/notifications';
        const [response, notificationsResponse] = await Promise.all([
          fetch('/api/consign/disputes?scope=seller', { cache: 'no-store' }),
          fetch(notificationUrl, { cache: 'no-store' }),
        ]);
        const [result, notificationsResult] = await Promise.all([
          response.json(),
          notificationsResponse.json().catch(() => null),
        ]);
        if (!active || !response.ok || !result?.success || !Array.isArray(result.disputes)) return;
        setUnreadOrderMessages(result.disputes
          .filter((dispute: any) => Number(dispute?.unreadSellerCount) > 0)
          .map((dispute: any) => ({
            orderId: String(dispute.orderId || '').trim() || undefined,
            orderNumber: String(dispute.orderNumber || '').trim() || undefined,
            count: Math.max(0, Number(dispute.unreadSellerCount) || 0),
          })));
        const outcomes: Record<string, 'Refunded' | 'Rejected' | 'Cancelled'> = {};
        for (const dispute of result.disputes) {
          const outcome = dispute.status === 'refunded' ? 'Refunded' : dispute.status === 'rejected' ? 'Rejected' : undefined;
          if (!outcome) continue;
          if (dispute.orderId) outcomes[`id:${String(dispute.orderId)}`] = outcome;
          const code = normalizeOrderCode(dispute.orderNumber);
          if (code) outcomes[`code:${code}`] = outcome;
        }
        if (notificationsResponse.ok && Array.isArray(notificationsResult?.notifications)) {
          for (const notification of notificationsResult.notifications) {
            const [prefix, orderId, orderStatus] = String(notification?.dedupeKey || '').split(':');
            if (prefix === 'consign-order-update' && orderId && orderStatus?.toLowerCase().startsWith('cancelled')) {
              const key = `id:${orderId}`;
              if (!outcomes[key]) outcomes[key] = 'Cancelled';
            }
          }
        }
        setOrderOutcomes(outcomes);
        setOutcomesLoaded(true);
      } catch {
        // Keep payment controls closed until the seller's current dispute statuses load.
      }
    };
    const refresh = () => {
      setOrders(getOrders());
      setWallet(getWallet());
      void refreshOrderOutcomes();
    };
    refresh();
    const syncNow = () => {
      syncConsignOrdersFromServer(activeSellerInfo.email || undefined).then(refresh);
    };
    syncNow();
    const pollId = setInterval(syncNow, 3500);
    window.addEventListener('focus', syncNow);
    const unsub = subscribeToOrders(refresh);
    return () => {
      active = false;
      clearInterval(pollId);
      window.removeEventListener('focus', syncNow);
      unsub();
    };
  }, [activeSellerInfo.email]);

  // Filter orders strictly belonging to the logged-in seller (never mix orders across merchants)
  const sellerRelevantOrders = useMemo(() => {
    const { email, name, shopName } = activeSellerInfo;
    if (!email && !name && !shopName) return orders;

    return orders.filter((o) => {
      const hasMerchantBinding =
        o.source === 'consign' || Boolean(o.merchantEmail) || Boolean(o.sellerEmail);

      if (hasMerchantBinding) {
        if (email) {
          if (o.sellerEmail && o.sellerEmail.toLowerCase() === email) return true;
          if (o.merchantEmail && o.merchantEmail.toLowerCase() === email) return true;
        }
        if (!o.sellerEmail && !o.merchantEmail && o.merchantName) {
          const mn = o.merchantName.toLowerCase();
          if ((name && mn === name) || (shopName && mn === shopName)) return true;
        }
        return false;
      }

      if (email && o.customerEmail.toLowerCase() === email) return true;
      if (name && o.customerName && o.customerName.toLowerCase() === name) return true;
      return true;
    });
  }, [orders, activeSellerInfo]);

  const awaitingPaymentOrders = useMemo(
    () => sellerRelevantOrders.filter((order) => order.status === 'awaiting_payment' && !isPaymentBlocked(order)),
    [sellerRelevantOrders, orderOutcomes, outcomesLoaded]
  );
  const oneClickPaymentTotals = useMemo(() => {
    const totals = awaitingPaymentOrders.reduce(
      (sum, order) => ({
        grossCents: sum.grossCents + amountToCents(order.amount),
        commissionCents: sum.commissionCents + amountToCents(orderPaymentBreakdown(order.amount).commission),
      }),
      { grossCents: 0, commissionCents: 0 }
    );
    return {
      gross: totals.grossCents / 100,
      commission: totals.commissionCents / 100,
      payable: (totals.grossCents - totals.commissionCents) / 100,
    };
  }, [awaitingPaymentOrders, currentPackageTier.id]);
  const walletCents = Math.round(wallet * 100);
  const payAllAmountCents = Math.round(oneClickPaymentTotals.payable * 100);
  const canPayAll = awaitingPaymentOrders.length > 0 && walletCents >= payAllAmountCents;
  const payAllShortfall = Math.max(0, (payAllAmountCents - walletCents) / 100);

  // Search filter (applies to every tab)
  const searchedOrders = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return sellerRelevantOrders;
    return sellerRelevantOrders.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.merchantName && o.merchantName.toLowerCase().includes(q)) ||
        o.products.some((p) => p.title.toLowerCase().includes(q))
    );
  }, [sellerRelevantOrders, appliedSearch]);

  const getUnreadMessageCount = useMemo(() => (order: SellerOrder) => {
    const orderId = String(order.consignOrderId || order.id || '').trim();
    const orderCode = normalizeOrderCode(order.code);
    return unreadOrderMessages
      .filter((unread) =>
        (unread.orderId && unread.orderId === orderId) ||
        (unread.orderNumber && normalizeOrderCode(unread.orderNumber) === orderCode)
      )
      .reduce((total, unread) => total + unread.count, 0);
  }, [unreadOrderMessages]);

  const unreadSearchedOrders = useMemo(
    () => searchedOrders.filter((order) => getUnreadMessageCount(order) > 0),
    [searchedOrders, getUnreadMessageCount]
  );

  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = {
      all: searchedOrders.length,
      unread: unreadSearchedOrders.length,
      awaiting_payment: 0,
      confirmed: 0,
      picked_up: 0,
      on_the_way: 0,
      delivered: 0,
    };
    searchedOrders.forEach((o) => (counts[o.status] += 1));
    return counts;
  }, [searchedOrders, unreadSearchedOrders]);

  const visibleOrders = useMemo(
    () => activeTab === 'all'
      ? searchedOrders
      : activeTab === 'unread'
        ? unreadSearchedOrders
        : searchedOrders.filter((o) => o.status === activeTab),
    [searchedOrders, unreadSearchedOrders, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageOrders = visibleOrders.slice(startIdx, startIdx + PAGE_SIZE);
  const showingFrom = visibleOrders.length === 0 ? 0 : startIdx + 1;
  const showingTo = startIdx + pageOrders.length;

  // Drop selections that are no longer on screen
  useEffect(() => {
    const onPage = new Set(pageOrders.map((o) => o.id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => onPage.has(id));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, appliedSearch, currentPage, orders]);

  const allOnPageSelected = pageOrders.length > 0 && pageOrders.every((o) => selectedIds.includes(o.id));
  const someOnPageSelected = pageOrders.some((o) => selectedIds.includes(o.id));
  const advanceableSelected = selectedIds.filter((id) => {
    const o = orders.find((x) => x.id === id);
    return o && o.status !== 'awaiting_payment' && getNextStatus(o.status);
  });

  // ---- Handlers ----
  const runSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setAppliedSearch(searchInput);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (value === '') {
      setAppliedSearch('');
      setPage(1);
    }
  };

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleReset = () => {
    setActiveTab('all');
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
    setSelectedIds([]);
  };

  const handleReadAll = async () => {
    if (isMarkingAllRead || unreadOrderMessages.length === 0) return;
    setIsMarkingAllRead(true);
    try {
      const response = await fetch('/api/consign/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', role: 'seller' }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to mark order messages as read.');
      }
      setUnreadOrderMessages([]);
      notify('All order messages marked as read.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to mark order messages as read.');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const toggleAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageOrders.some((o) => o.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageOrders.map((o) => o.id)])));
    }
  };

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const advanceOne = (order: SellerOrder) => {
    if (isPaymentBlocked(order)) {
      const outcome = getOrderOutcome(order);
      notify(outcome
        ? `Order ${order.code} was ${outcome.toLowerCase()} and cannot be paid.`
        : `Order ${order.code} status is being checked. Please try again shortly.`);
      return;
    }
    setPaymentError('');
    setPaymentId(order.id);
  };

  const handlePayAll = () => {
    if (awaitingPaymentOrders.length === 0) return;
    setPayAllReviewError('');
    setIsPayAllReviewOpen(true);
  };

  const handleConfirmPayAll = () => {
    if (awaitingPaymentOrders.some(isPaymentBlocked)) {
      setPayAllReviewError('A refunded or rejected order cannot be paid. Refresh the order statuses and try again.');
      return;
    }
    const result = paySellerOrders(awaitingPaymentOrders.map((order) => order.id));
    if (!result.success) {
      setPayAllReviewError(result.error || 'Unable to pay all unpaid orders.');
      return;
    }
    setWallet(getWallet());
    setOrders(getOrders());
    setSelectedIds([]);
    setIsPayAllReviewOpen(false);
    setPayAllReviewError('');
    notify(
      `Paid all ${result.orderCount} orders. ${money(result.commission || 0)} commission (${commissionRate}%) was deducted; ${money(result.payable || 0)} was charged to your wallet.`
    );
  };

  const detailsOrder = detailsId ? orders.find((o) => o.id === detailsId) || null : null;

  const paymentOrder = orders.find(o => o.id === paymentId);
  const paymentOutcome = paymentOrder ? getOrderOutcome(paymentOrder) : undefined;
  const paymentBlocked = paymentOrder ? isPaymentBlocked(paymentOrder) : false;
  return (
    <div className="animate-fadeIn">
      {isPayAllReviewOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <section role="dialog" aria-modal="true" aria-label="Review all unpaid orders" className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <header className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Review all unpaid orders</h2>
                <p className="text-xs text-gray-500 mt-1">Check every order and the combined wallet charge before confirming.</p>
              </div>
              <button type="button" aria-label="Close review" onClick={() => setIsPayAllReviewOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-5 overflow-y-auto space-y-4">
              {awaitingPaymentOrders.length === 0 ? (
                <p className="text-sm text-gray-500">There are no unpaid orders to review.</p>
              ) : (
                awaitingPaymentOrders.map((order) => {
                  const breakdown = orderPaymentBreakdown(order.amount);
                  const shippingAddress = order.shippingAddress;
                  return (
                    <article key={order.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900">Order {order.code}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">Awaiting payment</span>
                      </div>

                      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs">
                        <div><dt className="inline text-gray-500">Customer: </dt><dd className="inline font-medium">{order.shippingAddress?.recipient || order.customerName}</dd></div>
                        <div><dt className="inline text-gray-500">Email: </dt><dd className="inline">{maskEmail(order.shippingAddress?.email || order.customerEmail)}</dd></div>
                        <div><dt className="inline text-gray-500">Phone: </dt><dd className="inline">{maskCustomerPhone(shippingAddress?.phone)}</dd></div>
                        <div><dt className="inline text-gray-500">Street: </dt><dd className="inline">{maskStreetAddress(shippingAddress?.street)}</dd></div>
                        <div><dt className="inline text-gray-500">Apartment / unit: </dt><dd className="inline">{shippingAddress?.apt || '—'}</dd></div>
                        <div><dt className="inline text-gray-500">City: </dt><dd className="inline">{shippingAddress?.city || order.customerLocation || '—'}</dd></div>
                        <div><dt className="inline text-gray-500">State: </dt><dd className="inline">{shippingAddress?.state || '—'}</dd></div>
                        <div><dt className="inline text-gray-500">Postal code: </dt><dd className="inline">{shippingAddress?.postalCode || '—'}</dd></div>
                        <div><dt className="inline text-gray-500">Country: </dt><dd className="inline">{shippingAddress?.country || '—'}</dd></div>
                        <div><dt className="inline text-gray-500">Country code: </dt><dd className="inline">{shippingAddress?.countryCode || '—'}</dd></div>
                        <div><dt className="inline text-gray-500">Payment method: </dt><dd className="inline">{order.paymentMethod || 'Wallet'}</dd></div>
                      </dl>

                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-2">Items</p>
                        <ul className="space-y-2">
                          {order.products.map((product) => (
                            <li key={product.id} className="flex items-start justify-between gap-3 text-xs">
                              <span className="text-gray-700">{product.title} <span className="text-gray-400">× {product.quantity}</span></span>
                              <span className="whitespace-nowrap">{money(product.price * product.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <dl className="mt-3 border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                        <div className="flex justify-between gap-3"><dt className="text-gray-500">Order amount</dt><dd className="font-semibold">{money(order.amount)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-gray-500">{commissionRate}% commission deducted</dt><dd className="font-semibold text-emerald-700">−{money(breakdown.commission)}</dd></div>
                        <div className="flex justify-between gap-3 font-bold"><dt>Amount to pay</dt><dd>{money(breakdown.payable)}</dd></div>
                      </dl>
                    </article>
                  );
                })
              )}

              <section className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <h3 className="font-bold text-sm mb-3">Combined payment summary</h3>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Orders included</dt><dd className="font-semibold">{awaitingPaymentOrders.length}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Combined order amount</dt><dd className="font-semibold">{money(oneClickPaymentTotals.gross)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">{commissionRate}% commission deducted</dt><dd className="font-semibold text-emerald-700">−{money(oneClickPaymentTotals.commission)}</dd></div>
                  <div className="flex justify-between gap-3 border-t border-gray-200 pt-2 text-sm font-bold"><dt>Total to pay</dt><dd>{money(oneClickPaymentTotals.payable)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Wallet balance</dt><dd className="font-semibold">{money(wallet)}</dd></div>
                  {canPayAll && <div className="flex justify-between gap-3"><dt className="text-gray-500">Balance after payment</dt><dd className="font-semibold">{money((walletCents - payAllAmountCents) / 100)}</dd></div>}
                </dl>
              </section>

              {awaitingPaymentOrders.length > 0 && !canPayAll && (
                <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex flex-wrap items-center justify-between gap-3">
                  <span>Insufficient wallet balance. You need {money(payAllShortfall)} more to pay all these orders.</span>
                  <button type="button" onClick={() => { setIsPayAllReviewOpen(false); onOpenWallet(); }} className="px-3 py-1.5 rounded-md bg-amber-500 text-white font-semibold hover:bg-amber-600">Top up wallet</button>
                </div>
              )}
              {payAllReviewError && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">{payAllReviewError}</p>}
            </div>

            <footer className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setIsPayAllReviewOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50">Back</button>
              <button type="button" onClick={handleConfirmPayAll} disabled={!canPayAll} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                Confirm &amp; Pay All ({awaitingPaymentOrders.length})
              </button>
            </footer>
          </section>
        </div>,
        document.body
      )}

      {paymentOrder && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <section role="dialog" aria-modal="true" aria-label="Confirm order payment" className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold">Pay for order {paymentOrder.code}</h2>
            <dl className="text-sm space-y-3 my-5">
              <div className="flex justify-between"><dt>Order total</dt><dd>{money(paymentOrder.amount)}</dd></div>
              <div className="flex justify-between text-emerald-700"><dt>Your commission ({commissionRate}%)</dt><dd>{money(orderPaymentBreakdown(paymentOrder.amount).commission)}</dd></div>
              <div className="flex justify-between font-bold"><dt>Amount to pay ({payableRate}%)</dt><dd>{money(orderPaymentBreakdown(paymentOrder.amount).payable)}</dd></div>
              <div className="flex justify-between"><dt>Wallet balance</dt><dd>{money(wallet)}</dd></div>
            </dl>
            <p className="text-xs text-gray-500 mb-4">Your {commissionRate}% commission is excluded from this payment.</p>
            {paymentOutcome && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-lg mb-4">This order was {paymentOutcome.toLowerCase()} and cannot be paid.{paymentOrder.status !== 'awaiting_payment' && paymentOutcome !== 'Cancelled' ? ` You will receive ${money(getReturnAmount(paymentOrder))} back for this order within 24 hours.` : paymentOrder.status !== 'awaiting_payment' && paymentOutcome === 'Cancelled' ? ' Contact Admin about the payment.' : ''}</p>}
            {paymentOrder.source === 'consign' && !outcomesLoaded && <p role="status" className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">Checking this order’s latest refund or rejection status…</p>}
            {paymentOrder.status !== 'awaiting_payment' && <p className="text-sm text-emerald-700 mb-4">This order has already been paid. No further payment is required.</p>}
            {paymentError && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg mb-4">{paymentError}</p>}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border" onClick={() => setPaymentId(null)}>Cancel</button>
              <button disabled={paymentOrder.status !== 'awaiting_payment' || paymentBlocked} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => {
                if (isPaymentBlocked(paymentOrder)) {
                  const outcome = getOrderOutcome(paymentOrder);
                  setPaymentError(outcome ? `This order was ${outcome.toLowerCase()} and cannot be paid.` : 'The latest order status is still being checked.');
                  return;
                }
                const result = paySellerOrder(paymentOrder.id);
                setWallet(getWallet()); setOrders(getOrders());
                if (!result.success) { setPaymentError(result.error || 'Payment failed.'); return; }
                setPaymentId(null); notify('Payment successful. Order confirmed.');
              }}>Pay</button>
            </div>
            {paymentError && <button className="mt-3 text-blue-600 text-sm" onClick={() => { setPaymentId(null); setDetailsId(null); onOpenWallet(); }}>Top up wallet →</button>}
          </section>
        </div>, document.body)}

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Orders</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Search any order by code, customer or product — paid orders stay right here.
            </p>
          </div>

          <form onSubmit={runSearch} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="orders-read-all-button"
              type="button"
              onClick={() => void handleReadAll()}
              disabled={isMarkingAllRead || unreadOrderMessages.length === 0}
              title="Mark all unread order discussion messages as read"
              className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold whitespace-nowrap hover:bg-blue-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMarkingAllRead ? 'Reading…' : 'Read All'}
            </button>
            <button
              id="orders-wallet-badge"
              type="button"
              onClick={onOpenWallet}
              title="Open Wallet & Earnings"
              className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold whitespace-nowrap hover:bg-emerald-100 transition-colors"
            >
              Wallet: {money(wallet)}
            </button>
            <button
              id="orders-pay-all-button"
              type="button"
              onClick={handlePayAll}
              disabled={awaitingPaymentOrders.length === 0}
              title={`Pay all ${awaitingPaymentOrders.length} unpaid orders. The ${commissionRate}% commission is deducted from the combined amount.`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 border border-emerald-700 text-white text-[11px] font-semibold whitespace-nowrap hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              One Click Pay All ({awaitingPaymentOrders.length})
            </button>
            {awaitingPaymentOrders.length > 0 && (
              <span className="text-[10px] text-gray-500 whitespace-nowrap" title={`Combined amount: ${money(oneClickPaymentTotals.gross)}; ${commissionRate}% commission: ${money(oneClickPaymentTotals.commission)}; wallet charge: ${money(oneClickPaymentTotals.payable)}.`}>
                Pay {money(oneClickPaymentTotals.payable)} after {commissionRate}% commission
              </span>
            )}
            <div className="relative">
              <input
                id="orders-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Order code / customer / product"
                className="w-48 sm:w-60 pl-3 pr-7 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              id="orders-search-button"
              type="submit"
              className="px-3.5 py-2 bg-[#0f172a] hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Search</span>
            </button>
            {activeTab === 'awaiting_payment' && (
              <button
                id="orders-reset-button"
                type="button"
                onClick={handleReset}
                title="Reset to all orders"
                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm animate-fadeIn"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Reset</span>
              </button>
            )}
          </form>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                id={`orders-tab-${tab.id}`}
                onClick={() => changeTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`min-w-[16px] px-1 rounded-full text-[9.5px] leading-4 ${
                      active ? 'bg-white/25 text-white' : 'bg-white text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 pl-1 pr-2 w-8">
                  <input
                    id="orders-select-all"
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                    }}
                    onChange={toggleAllOnPage}
                    disabled={pageOrders.length === 0}
                    aria-label="Select all orders on this page"
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#2563eb] cursor-pointer disabled:cursor-not-allowed"
                  />
                </th>
                <th className="py-2.5 px-2">Order</th>
                <th className="py-2.5 px-2">Customer</th>
                <th className="py-2.5 px-2">Products</th>
                <th className="py-2.5 px-2">Amount</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    No orders in this view.
                  </td>
                </tr>
              ) : (
                pageOrders.map((o) => {
                  const selected = selectedIds.includes(o.id);
                  const nextLabel = ORDER_NEXT_ACTION_LABEL[o.status];
                  const itemCount = o.products.reduce((s, p) => s + p.quantity, 0);
                  const outcome = getOrderOutcome(o);
                  const paymentBlocked = isPaymentBlocked(o);
                  const hasPaidForOrder = o.status !== 'awaiting_payment';
                  const unreadMessageCount = getUnreadMessageCount(o);
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-gray-50 transition-colors ${
                        selected ? 'bg-blue-50/50' : 'hover:bg-gray-50/70'
                      }`}
                    >
                      <td className="py-3 pl-1 pr-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(o.id)}
                          aria-label={`Select order ${o.code}`}
                          className="w-3.5 h-3.5 rounded border-gray-300 accent-[#2563eb] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => setDetailsId(o.id)}
                          className="font-mono font-bold text-gray-900 hover:text-[#2563eb] transition-colors"
                        >
                          {o.code}
                        </button>
                        {unreadMessageCount > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800 ring-1 ring-blue-200">
                            <MessageSquare className="h-3 w-3" /> {unreadMessageCount} unread
                          </span>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(o.createdAt)}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-semibold text-gray-800">{o.shippingAddress?.recipient || o.customerName}</p>
                        <p className="text-[10px] text-gray-400">{maskEmail(o.shippingAddress?.email || o.customerEmail)}</p>
                        <div className="mt-1 max-w-[240px] space-y-0.5 break-words text-[9px] leading-snug text-gray-500">
                          <p><span className="font-medium text-gray-600">Phone:</span> {maskCustomerPhone(o.shippingAddress?.phone)}</p>
                          <p><span className="font-medium text-gray-600">Street:</span> {maskStreetAddress(o.shippingAddress?.street)}</p>
                          <p><span className="font-medium text-gray-600">Apt / unit:</span> {o.shippingAddress?.apt || '—'}</p>
                          <p><span className="font-medium text-gray-600">City:</span> {o.shippingAddress?.city || '—'}</p>
                          <p><span className="font-medium text-gray-600">State / province:</span> {o.shippingAddress?.state || '—'}</p>
                          <p><span className="font-medium text-gray-600">Postal code:</span> {o.shippingAddress?.postalCode || '—'}</p>
                          <p><span className="font-medium text-gray-600">Country:</span> {o.shippingAddress?.country || '—'}</p>
                          <p><span className="font-medium text-gray-600">Country code:</span> {o.shippingAddress?.countryCode || '—'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {o.products.slice(0, 3).map((p) =>
                              p.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={p.id}
                                  src={p.image}
                                  alt={p.title}
                                  className="w-7 h-7 rounded-md object-cover border-2 border-white bg-gray-100"
                                />
                              ) : (
                                <div
                                  key={p.id}
                                  className="w-7 h-7 rounded-md border-2 border-white bg-gray-100 flex items-center justify-center"
                                >
                                  <Package className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                              )
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-800 truncate max-w-[160px]" title={o.products.map((p) => p.title).join(', ')}>
                              {o.products[0]?.title ?? '—'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {itemCount} item{itemCount === 1 ? '' : 's'}
                              {o.products.length > 1 ? ` · +${o.products.length - 1} more` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-gray-900">{money(o.amount)}</p>
                        <p className="text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
                          + {money(orderPaymentBreakdown(o.amount).commission)} ({commissionRate}%)
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${outcome === 'Refunded' ? 'bg-blue-50 text-blue-700 border-blue-200' : outcome === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : outcome === 'Cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' : STATUS_PILL[o.status]}`}
                        >
                          {outcome || ORDER_STATUS_LABEL[o.status]}
                        </span>
                        {outcome && hasPaidForOrder && outcome !== 'Cancelled' && (
                          <p className="mt-1 max-w-[230px] text-[10px] leading-snug text-blue-700">
                            You will receive {money(getReturnAmount(o))} back for this order within 24 hours.
                          </p>
                        )}
                        {outcome === 'Cancelled' && hasPaidForOrder && <p className="mt-1 max-w-[230px] text-[10px] leading-snug text-gray-600">This order was cancelled. Contact Admin about the payment.</p>}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsId(o.id)}
                            title="View details"
                            className="px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-[10.5px] font-semibold transition-colors"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => advanceOne(o)}
                            disabled={o.status !== 'awaiting_payment' || paymentBlocked}
                            title={outcome ? `This order was ${outcome.toLowerCase()} and cannot be paid.` : paymentBlocked ? 'Checking the current order status.' : undefined}
                            className="px-2.5 py-1 bg-[#0f172a] hover:bg-black text-white rounded-md text-[10.5px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {outcome || (o.source === 'consign' && !outcomesLoaded ? 'Checking…' : 'Pay')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-1 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">
            Showing {showingFrom}–{showingTo} of {visibleOrders.length} order(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              id="orders-prev-page"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 border border-gray-200 rounded-md text-[10.5px] font-medium text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-[10.5px] font-semibold text-gray-600">
              Page {currentPage} / {totalPages}
            </span>
            <button
              id="orders-next-page"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 border border-gray-200 rounded-md text-[10.5px] font-medium text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* Order details / confirmation drawer (portaled to document.body to avoid transform containing-block clipping) */}
      {detailsOrder &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="seller-order-details-modal"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex justify-end"
            onClick={() => {
              setDetailsId(null);
              setJustConfirmedId(null);
            }}
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto"
            >
<div className="p-5 space-y-4 text-xs bg-[#f7f8fa] min-h-full"><button onClick={() => setDetailsId(null)} className="text-gray-500">← Orders</button><header><h2 className="text-xl font-bold">Order</h2><p className="text-[10px] text-gray-500">#{detailsOrder.code}</p><p>Customer: {detailsOrder.shippingAddress?.recipient || detailsOrder.customerName}</p></header>{getOrderOutcome(detailsOrder) && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800"><p className="font-semibold">{getOrderOutcome(detailsOrder)}</p>{detailsOrder.status !== 'awaiting_payment' && getOrderOutcome(detailsOrder) !== 'Cancelled' ? <p className="mt-1">You will receive {money(getReturnAmount(detailsOrder))} back for this order within 24 hours.</p> : detailsOrder.status !== 'awaiting_payment' ? <p className="mt-1">This order was cancelled. Contact Admin about the payment.</p> : <p className="mt-1">Payment is blocked because this order was {getOrderOutcome(detailsOrder)?.toLowerCase()}.</p>}</div>}<section className="rounded-xl border border-gray-200 bg-white p-4"><h3 className="font-semibold mb-3"></h3>{getOrderOutcome(detailsOrder) ? <p className="text-gray-600 mb-3">Payment is closed for this order.</p> : <><p className="text-xl font-bold">{money(orderPaymentBreakdown(detailsOrder.amount).payable)}</p><p className="text-gray-500 mb-3">Amount due · from your wallet balance ({money(wallet)})</p>{detailsOrder.status === 'awaiting_payment' && outcomesLoaded && <button onClick={() => advanceOne(detailsOrder)} className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-semibold">Pay</button>}<button onClick={() => { setDetailsId(null); onOpenWallet(); }} className="w-full mt-2 rounded-lg bg-amber-500 text-white py-2.5 font-semibold">Top up wallet →</button></>}</section><section className="rounded-xl border border-gray-200 bg-white p-4"><h3 className="font-semibold mb-3">◉ Customer Details</h3><dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2"><dt className="text-gray-500">Shopper</dt><dd>{detailsOrder.shippingAddress?.recipient || detailsOrder.customerName}</dd><dt className="text-gray-500">Email</dt><dd className="break-all">{maskEmail(detailsOrder.shippingAddress?.email || detailsOrder.customerEmail)}</dd><dt className="text-gray-500">Phone</dt><dd>{maskCustomerPhone(detailsOrder.shippingAddress?.phone)}</dd><dt className="text-gray-500">Street</dt><dd>{maskStreetAddress(detailsOrder.shippingAddress?.street)}</dd><dt className="text-gray-500">Apartment / unit</dt><dd>{detailsOrder.shippingAddress?.apt || '—'}</dd><dt className="text-gray-500">City</dt><dd>{detailsOrder.shippingAddress?.city || detailsOrder.customerLocation || '—'}</dd><dt className="text-gray-500">State</dt><dd>{detailsOrder.shippingAddress?.state || '—'}</dd><dt className="text-gray-500">Postal code</dt><dd>{detailsOrder.shippingAddress?.postalCode || '—'}</dd><dt className="text-gray-500">Country</dt><dd>{detailsOrder.shippingAddress?.country || '—'}</dd><dt className="text-gray-500">Country code</dt><dd>{detailsOrder.shippingAddress?.countryCode || '—'}</dd></dl><p className="text-[10px] text-gray-500 mt-4">Customer emails keep the three-character mask; four phone digits and up to five street-address words are masked for privacy.</p></section><section className="rounded-xl border border-gray-200 bg-white p-4"><h3 className="font-semibold mb-3">◷ Fulfilment Track</h3><ol className="space-y-3">{FULFILMENT_TRACK_STAGES.map((stage, idx) => {
  const currentIndex = FULFILMENT_CURRENT_STAGE[detailsOrder.status];
  const complete = idx < currentIndex;
  const current = idx === currentIndex;
  const historyStatus = FULFILMENT_HISTORY_STATUS[stage];
  const historyEntry = historyStatus
    ? [...detailsOrder.history].reverse().find((entry) => entry.status === historyStatus)
    : undefined;
  const stageTimestamp = historyEntry?.at || (stage === 'Pending' ? detailsOrder.createdAt : undefined);
  return <li key={stage} className="flex items-center gap-2.5">
    <span className={'w-5 h-5 rounded-full flex items-center justify-center text-[10px] ' + (complete || current ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400')}>{idx + 1}</span>
    <div className="flex-1 min-w-0">
      <span className={current ? 'font-semibold' : complete ? 'text-gray-700' : 'text-gray-400'}>{stage}</span>
      {stageTimestamp && <p className="mt-0.5 text-[10px] text-gray-500">{formatDate(stageTimestamp)}</p>}
    </div>
    {current && <span className="ml-auto text-[9px] text-blue-600 bg-blue-50 px-2 rounded">Current</span>}
  </li>;
})}</ol></section>{detailsOrder.status === 'delivered' && !getOrderOutcome(detailsOrder) && (
<section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
<p className="font-semibold text-blue-800">Congratulations! Your order has been safely delivered to the customer.</p>
<p className="mt-1 text-sm text-blue-700">Thank you for choosing Galleria Enterprises, Inc.</p>
</section>
)}<section className="rounded-xl border border-gray-200 bg-white p-4"><h3 className="font-semibold mb-3">Items</h3><ul className="space-y-3">{detailsOrder.products.map(p => <li key={p.id} className="flex items-center gap-3">{p.image ? <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded" /> : <Package className="w-10 h-10 text-gray-300" />}<div className="flex-1 min-w-0"><p className="text-emerald-700">{p.title}</p><p className="text-[10px] text-gray-400">Qty {p.quantity} · {money(p.price)} / unit</p></div><span>{money(p.price * p.quantity)}</span></li>)}</ul></section><section className="rounded-xl border border-gray-200 bg-white p-4"><h3 className="font-semibold mb-3">▤ Financial Summary</h3><dl className="space-y-2"><div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{money(detailsOrder.products.reduce((sum, p) => sum + p.price * p.quantity, 0))}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Your commission ({commissionRate}%)</dt><dd className="text-emerald-700">{money(orderPaymentBreakdown(detailsOrder.amount).commission)}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Payment method</dt><dd>{detailsOrder.paymentMethod || 'Wallet'}</dd></div><div className="flex justify-between rounded-lg bg-[#101827] text-white p-3"><dt>Amount you pay ({payableRate}%)</dt><dd className="font-bold">{money(orderPaymentBreakdown(detailsOrder.amount).payable)}</dd></div></dl></section></div>          </aside>
        </div>,
        document.body
      )}
    </div>
  );
}
