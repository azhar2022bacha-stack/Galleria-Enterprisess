'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Search, CheckCircle2, XCircle } from 'lucide-react';
import { sendSellerNotification } from '@/lib/sellerNotifications';

export interface WithdrawalRecord {
  id: string;
  storageKey: string;
  transactionId: string;
  sellerName: string;
  handle: string;
  email: string;
  internalId: string;
  amount: number;
  status: 'pending' | 'paid_out' | 'rejected';
  payoutDetails: string;
  note: string;
  createdDate: string;
  createdTime: string;
}

const TRANSACTIONS_KEY = 'galleria_seller_transactions';

async function loadWithdrawalRecords(): Promise<WithdrawalRecord[]> {
  if (typeof window === 'undefined') return [];

  let owners: any[] = [];
  try {
    const response = await fetch('/api/admin/owners', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      owners = Array.isArray(data?.owners) ? data.owners : [];
    }
  } catch {}
  const ownersByEmail = new Map(owners.map((owner) => [String(owner.email || '').trim().toLowerCase(), owner]));

  let activeSellerEmail = '';
  try {
    activeSellerEmail = String(JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}').email || '')
      .trim()
      .toLowerCase();
  } catch {}

  const records: WithdrawalRecord[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (storageKey !== TRANSACTIONS_KEY && !storageKey?.startsWith(`${TRANSACTIONS_KEY}:`)) continue;

    const email = (storageKey.startsWith(`${TRANSACTIONS_KEY}:`)
      ? storageKey.slice(TRANSACTIONS_KEY.length + 1)
      : activeSellerEmail).trim().toLowerCase();
    let transactions: any[] = [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      transactions = Array.isArray(parsed) ? parsed : [];
    } catch {}

    transactions.forEach((transaction) => {
      if (String(transaction?.type || '').toLowerCase() !== 'withdrawal') return;
      const description = String(transaction?.description || '');
      if (!transaction?.address && !transaction?.network && !/^withdrawal\s+to\b/i.test(description)) return;
      const rawStatus = String(transaction?.status || '').toLowerCase();
      const status = rawStatus === 'pending'
        ? 'pending'
        : rawStatus === 'completed'
          ? 'paid_out'
          : rawStatus === 'rejected'
            ? 'rejected'
            : null;
      if (!status) return;

      const transactionId = String(transaction.id || '');
      const uniqueId = `${email}:${transactionId || description}`;
      if (seen.has(uniqueId)) return;
      seen.add(uniqueId);

      const owner = ownersByEmail.get(email);
      const createdAt = new Date(transaction.createdAt || '');
      const validDate = Number.isFinite(createdAt.getTime());
      const payoutMethod = String(transaction.network || 'Payout');
      const payoutAddress = String(transaction.address || description.replace(/^withdrawal\s+to\s*/i, ''));
      records.push({
        id: uniqueId,
        storageKey,
        transactionId,
        sellerName: String(owner?.shopName || owner?.name || email || 'Seller'),
        handle: String(owner?.handle || (email ? `@${email.split('@')[0]}` : '')),
        email,
        internalId: transactionId,
        amount: Number(transaction.amount) || 0,
        status,
        payoutDetails: `${payoutMethod}: ${payoutAddress}`,
        note: description,
        createdDate: validDate ? createdAt.toLocaleDateString('en-US') : '—',
        createdTime: validDate ? createdAt.toLocaleTimeString('en-US') : '',
      });
    });
  }

  return records.sort((left, right) => {
    const leftTime = Date.parse(`${left.createdDate} ${left.createdTime}`) || 0;
    const rightTime = Date.parse(`${right.createdDate} ${right.createdTime}`) || 0;
    return rightTime - leftTime;
  });
}

function saveWithdrawalStatus(item: WithdrawalRecord, status: 'completed' | 'rejected') {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(item.storageKey);
    const transactions = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(transactions)) return;
    window.localStorage.setItem(item.storageKey, JSON.stringify(transactions.map((transaction: any) =>
      transaction?.id === item.transactionId ? { ...transaction, status } : transaction
    )));
    window.dispatchEvent(new Event('galleria:seller-orders-changed'));
    window.dispatchEvent(new Event('galleria:admin-todo-changed'));
  } catch {}
}

interface AdminWithdrawalsViewProps {
  notify?: (msg: string) => void;
}

type TabType = 'pending' | 'paid_out' | 'rejected' | 'all';

export function AdminWithdrawalsView({ notify }: AdminWithdrawalsViewProps) {
  const [items, setItems] = useState<WithdrawalRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const records = await loadWithdrawalRecords();
      if (!cancelled) setItems(records);
    };
    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 15_000);
    window.addEventListener('storage', refresh);
    window.addEventListener('galleria:seller-orders-changed', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('galleria:seller-orders-changed', refresh);
    };
  }, []);

  // Computed totals and counts matching screenshot badges
  const pendingItems = useMemo(() => items.filter((i) => i.status === 'pending'), [items]);
  const paidOutItems = useMemo(() => items.filter((i) => i.status === 'paid_out'), [items]);
  const rejectedItems = useMemo(() => items.filter((i) => i.status === 'rejected'), [items]);

  const pendingAmount = useMemo(
    () => pendingItems.reduce((acc, i) => acc + i.amount, 0),
    [pendingItems]
  );
  const paidOutAmount = useMemo(
    () => paidOutItems.reduce((acc, i) => acc + i.amount, 0),
    [paidOutItems]
  );
  const rejectedAmount = useMemo(
    () => rejectedItems.reduce((acc, i) => acc + i.amount, 0),
    [rejectedItems]
  );
  const totalAmount = useMemo(
    () => items.reduce((acc, i) => acc + i.amount, 0),
    [items]
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadWithdrawalRecords().then(setItems).finally(() => {
      setIsRefreshing(false);
      notify?.('Withdrawals refreshed.');
    });
  };

  const handleMarkPaidOut = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target || target.status !== 'pending' || processingWithdrawalId === id) return;
    saveWithdrawalStatus(target, 'completed');
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'paid_out' as const } : i))
    );
    setActiveTab('paid_out');
    notify?.(`Withdrawal of ${formatCurrency(target?.amount || 0)} marked as paid out.`);
    if (target) {
      void sendSellerNotification({
        sellerEmail: target.email,
        category: 'Wallet & Payments',
        title: 'Your withdrawal has been paid',
        message: [
          { text: 'Your withdrawal of ' },
          { text: formatCurrency(target.amount), emphasis: 'blue' },
          { text: ` via ${target.payoutDetails.split(':')[0]} has been marked as paid. Check your receiving account for the transfer.` },
        ],
        tone: 'success',
        href: '/seller/dashboard?tab=wallet',
        dedupeKey: `seller-withdrawal-paid:${target.id}`,
      });
    }
  };

  const handleRejectAndRefund = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target || target.status !== 'pending' || processingWithdrawalId === id) return;
    setProcessingWithdrawalId(id);
    try {
      const response = await fetch('/api/admin/wallet-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerEmail: target.email,
          accountType: 'wallet',
          eventType: 'withdrawal-refund',
          amount: target.amount,
          reason: 'Withdrawal request rejected after review',
          dedupeKey: `withdrawal-refund:${target.id}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to return the withdrawal amount.');
    } catch (error: any) {
      notify?.(error.message || 'Unable to return the withdrawal amount.');
      return;
    } finally {
      setProcessingWithdrawalId(null);
    }
    saveWithdrawalStatus(target, 'rejected');
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'rejected' as const } : i))
    );
    setActiveTab('rejected');
    notify?.(`Withdrawal of ${formatCurrency(target?.amount || 0)} rejected and refunded to merchant wallet.`);
  };

  // Filtered rows for the table
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'paid_out' && item.status !== 'paid_out') return false;
      if (activeTab === 'rejected' && item.status !== 'rejected') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSeller = item.sellerName.toLowerCase().includes(q);
        const matchesHandle = item.handle.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesAmount = item.amount.toString().includes(q);
        const matchesNote = item.note.toLowerCase().includes(q);
        const matchesPayout = item.payoutDetails.toLowerCase().includes(q);
        return (
          matchesSeller ||
          matchesHandle ||
          matchesEmail ||
          matchesAmount ||
          matchesNote ||
          matchesPayout
        );
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8 max-w-7xl mx-auto space-y-5 animate-fadeIn pb-12">
      {/* Top Header Bar matching screenshot */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Withdrawals
        </h1>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Badges / Metrics Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Pending Badge */}
        <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#ffedd5] text-[#c2410c] border border-[#fed7aa] flex items-center shadow-2xs">
          Pending: {formatCurrency(pendingAmount)} · {pendingItems.length}
        </div>

        {/* Paid out Badge */}
        <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] flex items-center shadow-2xs">
          Paid out: {formatCurrency(paidOutAmount)} · {paidOutItems.length}
        </div>

        {/* Rejected Badge */}
        <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] flex items-center shadow-2xs">
          Rejected: {formatCurrency(rejectedAmount)} · {rejectedItems.length}
        </div>

        {/* Total Badge */}
        <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe] flex items-center shadow-2xs">
          Total: {formatCurrency(totalAmount)} · {items.length}
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paid_out')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              activeTab === 'paid_out'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Paid out
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Rejected
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>

        {/* Search input field */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seller / amount / note"
            className="w-full px-3.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="overflow-x-auto border-t border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
              <th className="py-3.5 px-3">Seller</th>
              <th className="py-3.5 px-3">Amount</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3">Payout details</th>
              <th className="py-3.5 px-3">Created</th>
              <th className="py-3.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  No withdrawal records found for this filter.
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                const isPending = item.status === 'pending';
                const isPaidOut = item.status === 'paid_out';
                const isRejected = item.status === 'rejected';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* Seller Column */}
                    <td className="py-4 px-3 align-top">
                      <div>
                        <span className="block text-sm font-bold text-gray-900 leading-tight">
                          {item.sellerName}
                        </span>
                        <span className="block text-xs text-gray-500 font-normal mt-0.5">
                          {item.handle}
                        </span>
                        <span className="block text-xs text-gray-500 font-normal">
                          {item.email}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-mono tracking-wider mt-0.5">
                          {item.internalId}
                        </span>
                      </div>
                    </td>

                    {/* Amount Column */}
                    <td className="py-4 px-3 align-top whitespace-nowrap">
                      <span className="text-sm font-normal text-gray-900 block pt-0.5">
                        {formatCurrency(item.amount)}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-3 align-top whitespace-nowrap">
                      <div className="pt-0.5">
                        {isPending && (
                          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#ffedd5] text-[#9a3412] border border-[#fed7aa] shadow-2xs">
                            Pending
                          </span>
                        )}
                        {isPaidOut && (
                          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                            Paid out
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]">
                            Rejected
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payout details Column */}
                    <td className="py-4 px-3 align-top">
                      <div className="pt-0.5">
                        <span className="text-xs text-gray-800 font-normal block">
                          {item.payoutDetails}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5 block">
                          {item.note}
                        </span>
                      </div>
                    </td>

                    {/* Created Column */}
                    <td className="py-4 px-3 align-top whitespace-nowrap">
                      <div className="text-xs text-gray-600 leading-snug pt-0.5">
                        <span className="block">{item.createdDate}</span>
                        <span className="block text-gray-500">{item.createdTime}</span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-3 align-top text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <button
                            type="button"
                            disabled={processingWithdrawalId === item.id}
                            onClick={() => handleMarkPaidOut(item.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-black text-white text-xs font-semibold leading-tight text-center shadow-2xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Mark<br />paid out
                          </button>
                          <button
                            type="button"
                            disabled={processingWithdrawalId === item.id}
                            onClick={() => handleRejectAndRefund(item.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#dc2626] hover:bg-red-700 text-white text-xs font-semibold leading-tight text-center shadow-2xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject &amp;<br />refund
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1.5 text-xs text-gray-400 font-medium">
                          {isPaidOut ? 'Paid out' : 'Refunded'}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
