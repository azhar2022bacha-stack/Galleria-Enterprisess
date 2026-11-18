'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  Store,
  Users,
  Wallet,
} from 'lucide-react';

interface AdminPayoutsViewProps {
  notify?: (msg: string) => void;
}

interface SellerOwnerRecord {
  id: string;
  name?: string;
  shopName?: string;
  fullName?: string;
  subtitle?: string;
  email: string;
  status?: 'approved' | 'review' | 'suspended';
  packageTier?: string;
  productsCount?: number;
  productLimit?: number | 'Unlimited';
  balances?: { wallet?: number; pending?: number; guarantee?: number };
  usdBalance?: number;
}

interface ConsignOrderRecord {
  id: string;
  merchantEmail?: string;
  orderNumber?: string;
  itemCount?: number;
  cost?: number;
  commission?: number;
  status?: string;
}

interface RechargeRecord {
  id: string;
  handle?: string;
  amount?: number;
  creditedAmount?: number;
  status?: string;
}

interface WithdrawalRecord {
  sellerEmail: string;
  amount: number;
  status: 'pending' | 'paid_out' | 'rejected';
}

interface SellerStatement {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  status: string;
  packageTier: string;
  productsCount: number;
  productLimit: number | 'Unlimited';
  wallet: number;
  pendingBalance: number;
  consignOrders: number;
  itemCount: number;
  consignVolume: number;
  commission: number;
  deposited: number;
  withdrawn: number;
  pendingPayout: number;
  pendingPayoutItems: number;
}

const TRANSACTIONS_KEY = 'galleria_seller_transactions';

const formatMoney = (value: number) =>
  `$${(Number.isFinite(value) ? value : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function readWithdrawalRecords(): WithdrawalRecord[] {
  if (typeof window === 'undefined') return [];

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
    if (!storageKey || (storageKey !== TRANSACTIONS_KEY && !storageKey.startsWith(`${TRANSACTIONS_KEY}:`))) continue;

    const sellerEmail = (storageKey.startsWith(`${TRANSACTIONS_KEY}:`)
      ? storageKey.slice(TRANSACTIONS_KEY.length + 1)
      : activeSellerEmail).trim().toLowerCase();
    if (!sellerEmail) continue;

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

      const transactionId = String(transaction.id || description);
      const uniqueId = `${sellerEmail}:${transactionId}`;
      if (seen.has(uniqueId)) return;
      seen.add(uniqueId);
      records.push({ sellerEmail, amount: Number(transaction.amount) || 0, status });
    });
  }

  return records;
}

export function AdminPayoutsView({ notify }: AdminPayoutsViewProps) {
  const [owners, setOwners] = useState<SellerOwnerRecord[]>([]);
  const [orders, setOrders] = useState<ConsignOrderRecord[]>([]);
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('All packages');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadReport = useCallback(async () => {
    try {
      const [ownersResponse, ordersResponse, rechargesResponse] = await Promise.all([
        fetch('/api/admin/owners', { cache: 'no-store' }),
        fetch('/api/consign/orders', { cache: 'no-store' }),
        fetch('/api/recharges', { cache: 'no-store' }),
      ]);
      if (!ownersResponse.ok || !ordersResponse.ok || !rechargesResponse.ok) {
        throw new Error('Seller payout information could not be loaded. Please refresh or check your admin session.');
      }

      const [ownersResult, ordersResult, rechargesResult] = await Promise.all([
        ownersResponse.json(),
        ordersResponse.json(),
        rechargesResponse.json(),
      ]);
      if (ownersResult?.success === false || ordersResult?.success === false) {
        throw new Error(ownersResult?.error || ordersResult?.error || 'Seller payout information could not be loaded.');
      }

      setOwners(Array.isArray(ownersResult?.owners) ? ownersResult.owners : []);
      setOrders(Array.isArray(ordersResult?.orders) ? ordersResult.orders : []);
      setRecharges(Array.isArray(rechargesResult?.recharges) ? rechargesResult.recharges : []);
      setWithdrawals(readWithdrawalRecords());
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Seller payout information could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
    const onFocus = () => { void loadReport(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadReport]);

  const statements = useMemo<SellerStatement[]>(() => {
    const emailKey = (value: unknown) => String(value || '').trim().toLowerCase();
    return owners.map((owner) => {
      const email = emailKey(owner.email);
      const sellerOrders = orders.filter((order) => emailKey(order.merchantEmail) === email);
      const sellerRecharges = recharges.filter((recharge) =>
        emailKey(recharge.handle) === email && String(recharge.status || '').toLowerCase() === 'confirmed'
      );
      const sellerWithdrawals = withdrawals.filter((withdrawal) => emailKey(withdrawal.sellerEmail) === email);

      return {
        id: owner.id || email,
        name: owner.shopName || owner.name || 'Seller shop',
        ownerName: owner.fullName || owner.subtitle || '',
        email,
        status: owner.status || 'review',
        packageTier: owner.packageTier || 'Unassigned',
        productsCount: Math.max(0, Number(owner.productsCount) || 0),
        productLimit: owner.productLimit ?? 'Unlimited',
        wallet: Number(owner.usdBalance ?? owner.balances?.wallet) || 0,
        pendingBalance: Number(owner.balances?.pending) || 0,
        consignOrders: sellerOrders.length,
        itemCount: sellerOrders.reduce((sum, order) => sum + (Number(order.itemCount) || 0), 0),
        consignVolume: sellerOrders.reduce((sum, order) => sum + (Number(order.cost) || 0), 0),
        commission: sellerOrders.reduce((sum, order) => sum + (Number(order.commission) || 0), 0),
        deposited: sellerRecharges.reduce((sum, recharge) => sum + Number(recharge.creditedAmount ?? recharge.amount ?? 0), 0),
        withdrawn: sellerWithdrawals.filter((item) => item.status === 'paid_out').reduce((sum, item) => sum + item.amount, 0),
        pendingPayout: sellerWithdrawals.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0),
        pendingPayoutItems: sellerWithdrawals.filter((item) => item.status === 'pending').length,
      };
    });
  }, [owners, orders, recharges, withdrawals]);

  const totals = useMemo(() => statements.reduce((summary, seller) => ({
    sellerCount: summary.sellerCount + 1,
    wallet: summary.wallet + seller.wallet,
    pendingBalance: summary.pendingBalance + seller.pendingBalance,
    products: summary.products + seller.productsCount,
    consignOrders: summary.consignOrders + seller.consignOrders,
    itemCount: summary.itemCount + seller.itemCount,
    consignVolume: summary.consignVolume + seller.consignVolume,
    commission: summary.commission + seller.commission,
    deposited: summary.deposited + seller.deposited,
    withdrawn: summary.withdrawn + seller.withdrawn,
    pendingPayout: summary.pendingPayout + seller.pendingPayout,
    pendingPayoutItems: summary.pendingPayoutItems + seller.pendingPayoutItems,
    sellersWithPendingBalance: summary.sellersWithPendingBalance + (seller.pendingBalance > 0 ? 1 : 0),
    freeSellers: summary.freeSellers + (/free/i.test(seller.packageTier) ? 1 : 0),
    paidSellers: summary.paidSellers + (/free|unassigned|unknown/i.test(seller.packageTier) ? 0 : 1),
  }), {
    sellerCount: 0,
    wallet: 0,
    pendingBalance: 0,
    products: 0,
    consignOrders: 0,
    itemCount: 0,
    consignVolume: 0,
    commission: 0,
    deposited: 0,
    withdrawn: 0,
    pendingPayout: 0,
    pendingPayoutItems: 0,
    sellersWithPendingBalance: 0,
    freeSellers: 0,
    paidSellers: 0,
  }), [statements]);

  const packageOptions = useMemo(
    () => ['All packages', ...Array.from(new Set(statements.map((seller) => seller.packageTier))).sort()],
    [statements]
  );

  const filteredStatements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return statements.filter((seller) => {
      const matchesSearch = !query || [seller.name, seller.ownerName, seller.email, seller.packageTier]
        .some((value) => value.toLowerCase().includes(query));
      const matchesPackage = packageFilter === 'All packages' || seller.packageTier === packageFilter;
      const matchesStatus = statusFilter === 'All statuses' || seller.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [statements, searchQuery, packageFilter, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReport();
    setIsRefreshing(false);
    notify?.('Seller payout statement refreshed.');
  };

  const metrics = [
    { label: 'Seller accounts', value: String(totals.sellerCount), detail: `${totals.freeSellers} free · ${totals.paidSellers} paid package`, icon: Users, tone: 'blue' },
    { label: 'Seller wallet balances', value: formatMoney(totals.wallet), detail: 'Current available balances', icon: Wallet, tone: 'violet' },
    { label: 'Pending seller balance', value: formatMoney(totals.pendingBalance), detail: `Across ${totals.sellersWithPendingBalance} seller accounts`, icon: Clock3, tone: 'amber' },
    { label: 'Recorded commission', value: formatMoney(totals.commission), detail: 'From consign order records', icon: BadgeDollarSign, tone: 'emerald' },
  ] as const;

  return (
    <div className="mx-auto max-w-[1600px] animate-fadeIn space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-2xl bg-[#101d34] px-5 py-6 text-white shadow-lg sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/[0.04]" />
        <div className="pointer-events-none absolute bottom-[-105px] right-40 h-56 w-56 rounded-full bg-[#cca23b]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100">
              <CircleDollarSign className="h-3.5 w-3.5 text-[#e1bd62]" /> Finance overview
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Payouts &amp; seller statements</h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Review seller balances, plan details, product activity, consign volume, deposits, and withdrawal requests in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh statement'}
          </button>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-[#e1bd62]" /> {totals.sellerCount} sellers</span>
          <span className="inline-flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5 text-[#e1bd62]" /> {totals.products.toLocaleString('en-US')} listed products</span>
          <span className="inline-flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5 text-[#e1bd62]" /> {totals.consignOrders.toLocaleString('en-US')} consign orders recorded</span>
        </div>
      </section>

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => {
          const colors = tone === 'blue' ? 'bg-blue-50 text-blue-700 ring-blue-100'
            : tone === 'violet' ? 'bg-violet-50 text-violet-700 ring-violet-100'
              : tone === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-100'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
          return (
            <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{isLoading ? '—' : value}</p>
                </div>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${colors}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">{detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><ArrowDownLeft className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-medium text-slate-500">Confirmed deposits</p><p className="mt-0.5 text-sm font-bold text-slate-900">{formatMoney(totals.deposited)}</p></div>
        </article>
        <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700"><ArrowUpRight className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-medium text-slate-500">Withdrawals paid</p><p className="mt-0.5 text-sm font-bold text-slate-900">{formatMoney(totals.withdrawn)}</p></div>
        </article>
        <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Clock3 className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-medium text-slate-500">Pending withdrawals</p><p className="mt-0.5 text-sm font-bold text-slate-900">{formatMoney(totals.pendingPayout)} · {totals.pendingPayoutItems} requests</p></div>
        </article>
        <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><BriefcaseBusiness className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-medium text-slate-500">Consign order volume</p><p className="mt-0.5 text-sm font-bold text-slate-900">{formatMoney(totals.consignVolume)}</p></div>
        </article>
        <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-700"><PackageCheck className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-medium text-slate-500">Items in consign orders</p><p className="mt-0.5 text-sm font-bold text-slate-900">{totals.itemCount.toLocaleString('en-US')}</p></div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Seller statement</h2>
            <p className="mt-1 text-[10px] text-slate-500">Balances, plans, listed products, consign activity, and wallet movement per account.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <label className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search seller, email, or plan"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-[11px] text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <select value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none focus:border-blue-400">
              {packageOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none focus:border-blue-400">
              <option>All statuses</option><option value="approved">Approved</option><option value="review">In review</option><option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 px-4 py-2.5 text-[10px] text-slate-500 sm:px-5">
          <span>Showing <strong className="text-slate-800">{filteredStatements.length}</strong> of <strong className="text-slate-800">{statements.length}</strong> sellers</span>
          <span>Amounts in USD · updated from existing seller, order, and wallet records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1440px] w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-white text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3">Seller</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3 text-right">Products</th>
                <th className="px-3 py-3 text-right">Orders / items</th>
                <th className="px-3 py-3 text-right">Consign volume</th>
                <th className="px-3 py-3 text-right">Commission</th>
                <th className="px-3 py-3 text-right">Wallet</th>
                <th className="px-3 py-3 text-right">Pending balance</th>
                <th className="px-3 py-3 text-right">Deposited</th>
                <th className="px-3 py-3 text-right">Withdrawn</th>
                <th className="px-4 py-3 text-right">Pending payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-xs text-slate-500">Loading seller statements…</td></tr>
              ) : filteredStatements.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-14 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Store className="h-5 w-5" /></span>
                  <p className="mt-3 text-xs font-semibold text-slate-800">{statements.length ? 'No sellers match these filters' : 'No seller accounts found'}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{statements.length ? 'Try another name, package, or status.' : 'Seller account statements will appear here when available.'}</p>
                </td></tr>
              ) : filteredStatements.map((seller) => (
                <tr key={seller.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#101d34] text-[10px] font-bold text-[#e1bd62]">{seller.name.trim().slice(0, 1).toUpperCase() || 'S'}</span>
                      <div className="min-w-0"><p className="truncate text-[11px] font-bold text-slate-900">{seller.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{seller.ownerName ? `${seller.ownerName} · ` : ''}{seller.email}</p></div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${/free/i.test(seller.packageTier) ? 'bg-slate-100 text-slate-600' : 'bg-violet-50 text-violet-700'}`}>{seller.packageTier}</span><p className="mt-1 text-[9px] capitalize text-slate-400">{seller.status}</p></td>
                  <td className="px-3 py-3.5 text-right"><span className="text-[11px] font-semibold text-slate-800">{seller.productsCount}</span><p className="mt-0.5 text-[9px] text-slate-400">of {seller.productLimit}</p></td>
                  <td className="px-3 py-3.5 text-right"><span className="text-[11px] font-semibold text-slate-800">{seller.consignOrders}</span><p className="mt-0.5 text-[9px] text-slate-400">{seller.itemCount} items</p></td>
                  <td className="px-3 py-3.5 text-right text-[11px] font-semibold text-slate-800">{formatMoney(seller.consignVolume)}</td>
                  <td className="px-3 py-3.5 text-right text-[11px] font-semibold text-emerald-700">{formatMoney(seller.commission)}</td>
                  <td className="px-3 py-3.5 text-right text-[11px] font-bold text-slate-900">{formatMoney(seller.wallet)}</td>
                  <td className="px-3 py-3.5 text-right text-[11px] font-semibold text-amber-700">{formatMoney(seller.pendingBalance)}</td>
                  <td className="px-3 py-3.5 text-right text-[11px] text-slate-700">{formatMoney(seller.deposited)}</td>
                  <td className="px-3 py-3.5 text-right text-[11px] text-slate-700">{formatMoney(seller.withdrawn)}</td>
                  <td className="px-4 py-3.5 text-right"><span className={`text-[11px] font-bold ${seller.pendingPayout ? 'text-amber-700' : 'text-slate-400'}`}>{formatMoney(seller.pendingPayout)}</span><p className="mt-0.5 text-[9px] text-slate-400">{seller.pendingPayoutItems} requests</p></td>
                </tr>
              ))}
            </tbody>
            {!isLoading && filteredStatements.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700">
                  <td className="px-4 py-3">Filtered totals</td><td className="px-3 py-3">—</td>
                  <td className="px-3 py-3 text-right">{filteredStatements.reduce((sum, seller) => sum + seller.productsCount, 0)}</td>
                  <td className="px-3 py-3 text-right">{filteredStatements.reduce((sum, seller) => sum + seller.consignOrders, 0)} / {filteredStatements.reduce((sum, seller) => sum + seller.itemCount, 0)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.consignVolume, 0))}</td>
                  <td className="px-3 py-3 text-right text-emerald-700">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.commission, 0))}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.wallet, 0))}</td>
                  <td className="px-3 py-3 text-right text-amber-700">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.pendingBalance, 0))}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.deposited, 0))}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.withdrawn, 0))}</td>
                  <td className="px-4 py-3 text-right text-amber-700">{formatMoney(filteredStatements.reduce((sum, seller) => sum + seller.pendingPayout, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex flex-col gap-1 border-t border-slate-100 bg-white px-4 py-3 text-[9px] leading-relaxed text-slate-400 sm:px-5">
          <p>Wallet balances, pending balances, and packages come from seller account records. Deposit totals include confirmed wallet recharges.</p>
          <p>Sales volume and commission reflect existing consignment order records. Withdrawal totals use the seller transaction records available in this admin browser.</p>
        </div>
      </section>
    </div>
  );
}
