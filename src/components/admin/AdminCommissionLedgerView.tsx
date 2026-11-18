'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, RefreshCw, CheckCircle2, DollarSign, ArrowUpDown } from 'lucide-react';

export interface CommissionEntry {
  id: string;
  storeOwner: string;
  handle: string;
  email?: string;
  status: 'pending' | 'paid';
  subtotal: number;
  rate: number;
  commission: number;
  fromVideo: string;
  orders: string;
}

// 34 entries matching screenshot data and summing to $36.48 pending payout
const INITIAL_ENTRIES: CommissionEntry[] = [
  // Row 1 from screenshot
  {
    id: 'comm-1',
    storeOwner: 'Sophia Lee',
    handle: '@sophia',
    email: 'sophia@tikmall.local',
    status: 'pending',
    subtotal: 0.0,
    rate: 15,
    commission: 0.0,
    fromVideo: '—',
    orders: '—',
  },
  // Row 2 from screenshot
  {
    id: 'comm-2',
    storeOwner: 'Sophia Lee',
    handle: '@sophia',
    email: 'sophia@tikmall.local',
    status: 'pending',
    subtotal: 0.0,
    rate: 15,
    commission: 0.0,
    fromVideo: '—',
    orders: '—',
  },
  // Row 3 from screenshot
  {
    id: 'comm-3',
    storeOwner: 'Zoe Adams',
    handle: '@zoe',
    email: 'zoe@tikmall.local',
    status: 'pending',
    subtotal: 0.0,
    rate: 20,
    commission: 0.0,
    fromVideo: 'yes',
    orders: '—',
  },
  // Row 4 from screenshot
  {
    id: 'comm-4',
    storeOwner: 'Leo Park',
    handle: '@leopark',
    status: 'pending',
    subtotal: 0.0,
    rate: 10,
    commission: 0.0,
    fromVideo: '—',
    orders: '—',
  },
  // Row 5 from screenshot
  {
    id: 'comm-5',
    storeOwner: 'Zoe Adams',
    handle: '@zoe',
    email: 'zoe@tikmall.local',
    status: 'pending',
    subtotal: 0.0,
    rate: 20,
    commission: 0.0,
    fromVideo: 'yes',
    orders: '—',
  },
  // Row 6 from screenshot
  {
    id: 'comm-6',
    storeOwner: 'Zoe Adams',
    handle: '@zoe',
    email: 'zoe@tikmall.local',
    status: 'pending',
    subtotal: 0.0,
    rate: 20,
    commission: 0.0,
    fromVideo: 'yes',
    orders: '—',
  },
  // Row 7 from screenshot
  {
    id: 'comm-7',
    storeOwner: 'Zoe Adams',
    handle: '@zoe',
    email: 'zoe@tikmall.local',
    status: 'pending',
    subtotal: 0.0,
    rate: 20,
    commission: 0.0,
    fromVideo: 'yes',
    orders: '—',
  },
  // Entry with real payout (part of the $36.48 pending payout)
  {
    id: 'comm-8',
    storeOwner: 'Marcus Vance',
    handle: '@marcus',
    email: 'marcus@tikmall.local',
    status: 'pending',
    subtotal: 123.2,
    rate: 15,
    commission: 18.48,
    fromVideo: 'yes',
    orders: '#10492',
  },
  {
    id: 'comm-9',
    storeOwner: 'Yuki Tanaka',
    handle: '@yuki',
    email: 'yuki@tikmall.local',
    status: 'pending',
    subtotal: 60.0,
    rate: 20,
    commission: 12.0,
    fromVideo: 'yes',
    orders: '#10488',
  },
  {
    id: 'comm-10',
    storeOwner: 'Sophia Chen',
    handle: '@sophia_c',
    email: 'sophia.c@tikmall.local',
    status: 'pending',
    subtotal: 40.0,
    rate: 15,
    commission: 6.0,
    fromVideo: 'yes',
    orders: '#10481',
  },
  // Remaining entries (11 to 34) to equal exactly 34 entries
  ...Array.from({ length: 24 }, (_, i) => {
    const idx = i + 11;
    const owners = [
      { name: 'Sophia Lee', handle: '@sophia', email: 'sophia@tikmall.local', rate: 15 },
      { name: 'Zoe Adams', handle: '@zoe', email: 'zoe@tikmall.local', rate: 20 },
      { name: 'Leo Park', handle: '@leopark', email: 'leo@tikmall.local', rate: 10 },
      { name: 'Marcus Vance', handle: '@marcus', email: 'marcus@tikmall.local', rate: 15 },
      { name: 'Yuki Tanaka', handle: '@yuki', email: 'yuki@tikmall.local', rate: 20 },
    ];
    const owner = owners[idx % owners.length];
    return {
      id: `comm-${idx}`,
      storeOwner: owner.name,
      handle: owner.handle,
      email: owner.email,
      status: 'pending' as const,
      subtotal: 0.0,
      rate: owner.rate,
      commission: 0.0,
      fromVideo: idx % 2 === 0 ? 'yes' : '—',
      orders: '—',
    };
  }),
];

interface AdminCommissionLedgerViewProps {
  notify?: (msg: string) => void;
}

export function AdminCommissionLedgerView({ notify }: AdminCommissionLedgerViewProps) {
  const [entries, setEntries] = useState<CommissionEntry[]>(INITIAL_ENTRIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPendingPayout = useMemo(() => {
    return entries
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + e.commission, 0);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.storeOwner.toLowerCase().includes(q) ||
        e.handle.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const handleRefresh = () => {
    notify?.('Commission ledger records and rates refreshed.');
  };

  const handlePayoutAll = async () => {
    const eligibleEntries = entries.filter(
      (entry) => entry.status === 'pending' && entry.email && entry.commission > 0
    );
    const zeroValueEntryIds = new Set(
      entries.filter((entry) => entry.status === 'pending' && entry.email && entry.commission <= 0).map((entry) => entry.id)
    );
    const payoutsBySeller = new Map<string, { email: string; amount: number; count: number }>();
    eligibleEntries.forEach((entry) => {
      const email = entry.email!.trim().toLowerCase();
      const existing = payoutsBySeller.get(email) || { email, amount: 0, count: 0 };
      existing.amount += entry.commission;
      existing.count += 1;
      payoutsBySeller.set(email, existing);
    });
    const payoutEntriesBySeller = new Map<string, string[]>();
    eligibleEntries.forEach((entry) => {
      const email = entry.email!.trim().toLowerCase();
      payoutEntriesBySeller.set(email, [...(payoutEntriesBySeller.get(email) || []), entry.id]);
    });

    const payoutResults = await Promise.all(Array.from(payoutsBySeller.values()).map(async (payout) => {
      const entryIds = (payoutEntriesBySeller.get(payout.email) || []).sort().join(',');
      try {
        const response = await fetch('/api/admin/wallet-adjustments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerEmail: payout.email,
            accountType: 'wallet',
            eventType: 'commission-payout',
            amount: payout.amount,
            reason: `Commission payout covering ${payout.count} eligible record${payout.count === 1 ? '' : 's'}`,
            dedupeKey: `commission-payout:${payout.email}:${entryIds}`,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Payout could not be released.');
        return { email: payout.email, amount: payout.amount, success: true };
      } catch (error) {
        console.warn('Seller commission payout failed:', error);
        return { email: payout.email, amount: payout.amount, success: false };
      }
    }));

    const paidEmails = new Set(payoutResults.filter((result) => result.success).map((result) => result.email));
    if (paidEmails.size > 0 || zeroValueEntryIds.size > 0) {
      setEntries((prev) => prev.map((entry) =>
        entry.status === 'pending' && (
          zeroValueEntryIds.has(entry.id) ||
          (entry.email && paidEmails.has(entry.email.trim().toLowerCase()))
        )
          ? { ...entry, status: 'paid' }
          : entry
      ));
    }
    const releasedAmount = payoutResults.filter((result) => result.success).reduce((sum, result) => sum + result.amount, 0);
    const failedCount = payoutResults.filter((result) => !result.success).length;
    if (failedCount > 0) notify?.(`Released $${releasedAmount.toFixed(2)}. ${failedCount} seller payout(s) could not be completed; their records remain pending.`);
    else notify?.(`Payout of $${releasedAmount.toFixed(2)} released to ${paidEmails.size} seller(s).`);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container matching screenshot */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Header Row */}
        <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Commission Ledger
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-gray-500">
              {entries.length} entries · ${totalPendingPayout.toFixed(2)} pending payout
            </span>
          </div>
        </div>

        {/* Search & Filter Control Bar */}
        <div className="px-6 sm:px-8 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search store owner / @handle..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-2xs transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Refresh
            </button>
            {totalPendingPayout > 0 && (
              <button
                type="button"
                onClick={handlePayoutAll}
                className="px-3 py-1.5 rounded-lg bg-[#18181b] text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs"
              >
                Release Payouts (${totalPendingPayout.toFixed(2)})
              </button>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-600 font-semibold bg-white">
                <th className="py-3.5 px-6 font-semibold w-[25%]">Store Owner</th>
                <th className="py-3.5 px-4 font-semibold w-[12%]">Status</th>
                <th className="py-3.5 px-4 font-semibold w-[12%]">Subtotal</th>
                <th className="py-3.5 px-4 font-semibold w-[10%]">Rate</th>
                <th className="py-3.5 px-4 font-semibold w-[15%]">Commission</th>
                <th className="py-3.5 px-4 font-semibold w-[13%]">From video</th>
                <th className="py-3.5 px-6 font-semibold w-[13%]">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedEntries.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Store Owner */}
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-gray-900 text-xs sm:text-[13px]">
                      {item.storeOwner}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {item.handle}
                    </div>
                    {item.email && (
                      <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                        {item.email}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className="px-3 py-1 rounded-md text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200/70 inline-block shadow-2xs">
                      {item.status}
                    </span>
                  </td>

                  {/* Subtotal */}
                  <td className="py-3.5 px-4 text-gray-800 font-mono">
                    ${item.subtotal.toFixed(2)}
                  </td>

                  {/* Rate */}
                  <td className="py-3.5 px-4 text-gray-800 font-mono">
                    {item.rate}%
                  </td>

                  {/* Commission */}
                  <td className="py-3.5 px-4 text-gray-800 font-mono font-medium">
                    ${item.commission.toFixed(2)}
                  </td>

                  {/* From video */}
                  <td className="py-3.5 px-4 text-gray-700">
                    {item.fromVideo}
                  </td>

                  {/* Orders */}
                  <td className="py-3.5 px-6 text-gray-700">
                    {item.orders}
                  </td>
                </tr>
              ))}

              {paginatedEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No commission entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Controls */}
        <div className="px-6 sm:px-8 py-3.5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredEntries.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{filteredEntries.length}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-md font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-black text-white'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
