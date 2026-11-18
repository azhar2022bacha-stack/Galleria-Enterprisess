'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3, RefreshCw, Search, Wallet, XCircle } from 'lucide-react';

interface LedgerEntry {
  id: string;
  timeDate: string;
  timeClock: string;
  shopName: string;
  handle: string;
  email: string;
  accountUid: string;
  primaryType: string;
  subType: string;
  amount: string;
  isPositive: boolean;
  currency: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceCode: string;
  referenceNote: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Rejected';
}

interface LedgerFilters {
  accountQuery: string;
  referenceQuery: string;
  fromDate: string;
  toDate: string;
  statusFilter: string;
  typeFilter: string;
}

function parseLedgerAmount(amount: string): number {
  return Math.abs(Number(String(amount).replace(/[$,]/g, '')) || 0);
}

function parsePickerDate(value: string): number | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).getTime();
}

function parseEntryDate(value: string): number | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2])).getTime();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(new Date(parsed).getFullYear(), new Date(parsed).getMonth(), new Date(parsed).getDate()).getTime() : null;
}

interface OwnerRecord {
  id?: string;
  email?: string;
  name?: string;
  shopName?: string;
  fullName?: string;
  handle?: string;
  username?: string;
  creatorId?: string;
  walletOwnerId?: string;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() || fallback : fallback;
}

function asAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number, sign: boolean): string {
  const formatted = `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${sign ? '+' : '-'}${formatted}`;
}

function dateAndTime(value: unknown): { date: string; clock: string } {
  const parsed = value ? new Date(String(value)) : new Date(NaN);
  if (!Number.isFinite(parsed.getTime())) return { date: '—', clock: '—' };
  return {
    date: parsed.toLocaleDateString('en-US'),
    clock: parsed.toLocaleTimeString('en-US'),
  };
}

function mapStatus(value: unknown): LedgerEntry['status'] {
  const normalized = asText(value).toLowerCase();
  if (normalized === 'pending' || normalized === 'awaiting') return 'Pending';
  if (normalized === 'rejected' || normalized.startsWith('reject')) return 'Rejected';
  if (normalized === 'failed' || normalized === 'cancelled' || normalized === 'canceled') return 'Failed';
  return 'Completed';
}

function mapAccount(emailValue: unknown, owners: OwnerRecord[]) {
  const email = asText(emailValue).toLowerCase();
  const owner = owners.find((candidate) => asText(candidate.email).toLowerCase() === email);
  return {
    shopName: asText(owner?.shopName || owner?.name, email || 'Seller account'),
    handle: asText(owner?.handle || owner?.username, '—'),
    email: email || '—',
    accountUid: asText(owner?.id || owner?.creatorId || owner?.walletOwnerId, '—'),
  };
}

function makeEntry(input: {
  id: unknown;
  date: unknown;
  accountEmail: unknown;
  owners: OwnerRecord[];
  type: string;
  subType: unknown;
  amount: unknown;
  positive: boolean;
  reference: unknown;
  note: unknown;
  status: unknown;
  showAmount?: boolean;
  balanceBefore?: unknown;
  balanceAfter?: unknown;
}): LedgerEntry {
  const { date, clock } = dateAndTime(input.date);
  const amount = input.showAmount === false || input.amount === undefined || input.amount === null ? null : asAmount(input.amount);
  return {
    id: asText(input.id, `${input.type}-${String(input.reference || input.date || 'unreferenced')}`),
    timeDate: date,
    timeClock: clock,
    ...mapAccount(input.accountEmail, input.owners),
    primaryType: input.type,
    subType: asText(input.subType, input.type),
    amount: amount === null ? '—' : money(amount, input.positive),
    isPositive: input.positive,
    currency: 'USD',
    balanceBefore: input.balanceBefore === undefined ? '—' : `$${asAmount(input.balanceBefore).toFixed(2)}`,
    balanceAfter: input.balanceAfter === undefined ? '—' : `$${asAmount(input.balanceAfter).toFixed(2)}`,
    referenceCode: asText(input.reference, '—'),
    referenceNote: asText(input.note, '—'),
    status: mapStatus(input.status),
  };
}

function readLocalTransactions(owners: OwnerRecord[]): LedgerEntry[] {
  if (typeof window === 'undefined') return [];
  let activeSellerEmail = '';
  try {
    activeSellerEmail = asText(JSON.parse(window.localStorage.getItem('galleria_active_seller') || '{}')?.email).toLowerCase();
  } catch {}

  const rows: LedgerEntry[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    const baseKey = 'galleria_seller_transactions';
    if (!key || (key !== baseKey && !key.startsWith(`${baseKey}:`))) continue;
    const email = key.startsWith(`${baseKey}:`) ? key.slice(baseKey.length + 1).trim().toLowerCase() : activeSellerEmail;
    if (!email || email === 'guest') continue;
    let transactions: any[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
      transactions = Array.isArray(parsed) ? parsed : [];
    } catch {}

    for (const transaction of transactions) {
      const txType = asText(transaction?.type).toLowerCase();
      if (!['deposit', 'withdrawal', 'order_payout', 'order_payment', 'rebate'].includes(txType)) continue;
      const description = asText(transaction?.description);
      const isExternalWithdrawal = txType === 'withdrawal' && Boolean(transaction?.address || transaction?.network || /^withdrawal\s+to\b/i.test(description));
      const isCommissionPayout = txType === 'rebate' && /commission\s+payout/i.test(description);
      const primaryType = txType === 'deposit'
        ? 'Top-up'
        : txType === 'order_payout' || isExternalWithdrawal || isCommissionPayout
          ? 'Payout'
          : 'Adjust';
      const isPositive = txType === 'deposit' || txType === 'order_payout' || txType === 'rebate';
      rows.push(makeEntry({
        id: `${email}:${asText(transaction?.id, description)}`,
        date: transaction?.createdAt,
        accountEmail: email,
        owners,
        type: primaryType,
        subType: isExternalWithdrawal ? 'seller withdrawal' : txType.replace(/_/g, ' '),
        amount: transaction?.amount,
        positive: isPositive,
        reference: transaction?.id,
        note: description,
        status: transaction?.status,
      }));
    }
  }
  return rows;
}

function buildLedgerEntries(data: {
  owners: OwnerRecord[];
  recharges: any[];
  refunds: any[];
  orders: any[];
}): LedgerEntry[] {
  const { owners, recharges, refunds, orders } = data;
  const rows = new Map<string, LedgerEntry>();
  const add = (entry: LedgerEntry) => rows.set(entry.id.toLowerCase(), entry);

  readLocalTransactions(owners).forEach(add);

  for (const recharge of recharges) {
    const email = asText(recharge?.handle).toLowerCase();
    const amount = recharge?.creditedAmount ?? recharge?.amount;
    add(makeEntry({
      id: `${email}:recharge-${asText(recharge?.id)}`,
      date: recharge?.reviewedAt || recharge?.submittedAt,
      accountEmail: email,
      owners,
      type: 'Top-up',
      subType: asText(recharge?.network || recharge?.coin, 'wallet deposit'),
      amount,
      positive: true,
      reference: recharge?.reference || recharge?.id,
      note: asText(recharge?.reviewReason || recharge?.network, 'Seller wallet top-up'),
      status: recharge?.status,
    }));
  }

  for (const refund of refunds) {
    const email = asText(refund?.sellerEmail).toLowerCase();
    add(makeEntry({
      id: `${email}:refund-${asText(refund?.id || refund?.orderId)}`,
      date: refund?.createdAt,
      accountEmail: email,
      owners,
      type: 'Refund',
      subType: 'consign capital returned',
      amount: refund?.amount,
      positive: true,
      reference: refund?.orderCode || refund?.orderId || refund?.id,
      note: `${asText(refund?.productTitle, 'Order refund')}${refund?.reason ? ` · ${asText(refund.reason)}` : ''}`,
      status: refund?.status,
    }));
  }

  for (const order of orders) {
    const orderStatus = asText(order?.status);
    if (!orderStatus.toLowerCase().startsWith('rejected')) continue;
    const sellerStatus = asText(order?.sellerStatus).toLowerCase();
    const sellerPaid = (sellerStatus && sellerStatus !== 'awaiting_payment') || /^(paid|awaiting pickup|picked up|shipped|received|settled)/i.test(orderStatus);
    const email = asText(order?.merchantEmail).toLowerCase();
    const orderCode = asText(order?.orderNumber || order?.id);
    add(makeEntry({
      id: `${email}:rejected-order-${asText(order?.id || orderCode)}`,
      date: order?.updatedAt || order?.createdAt || order?.date,
      accountEmail: email,
      owners,
      type: 'Rejected',
      subType: 'order rejected',
      amount: sellerPaid ? (order?.sellerPaidAmount ?? order?.cost) : undefined,
      positive: sellerPaid,
      showAmount: sellerPaid,
      reference: orderCode,
      note: sellerPaid
        ? 'Rejected · any return is processed manually by Admin'
        : 'Rejected before seller payment · no wallet amount to return',
      status: 'Rejected',
    }));
  }

  return Array.from(rows.values()).sort((a, b) => {
    const dateA = parseEntryDate(a.timeDate) || 0;
    const dateB = parseEntryDate(b.timeDate) || 0;
    return dateB - dateA;
  });
}

function filterLedgerEntries(availableEntries: LedgerEntry[], filters: LedgerFilters): LedgerEntry[] {
  let filtered = availableEntries;
  if (filters.accountQuery.trim()) {
    const q = filters.accountQuery.toLowerCase().trim();
    filtered = filtered.filter((entry) =>
      entry.shopName.toLowerCase().includes(q) || entry.handle.toLowerCase().includes(q) ||
      entry.email.toLowerCase().includes(q) || entry.accountUid.toLowerCase().includes(q)
    );
  }
  if (filters.referenceQuery.trim()) {
    const q = filters.referenceQuery.toLowerCase().trim();
    filtered = filtered.filter((entry) => entry.referenceCode.toLowerCase().includes(q) || entry.referenceNote.toLowerCase().includes(q));
  }
  if (filters.fromDate) {
    const from = parsePickerDate(filters.fromDate);
    if (from !== null) filtered = filtered.filter((entry) => {
      const date = parseEntryDate(entry.timeDate);
      return date !== null && date >= from;
    });
  }
  if (filters.toDate) {
    const to = parsePickerDate(filters.toDate);
    if (to !== null) filtered = filtered.filter((entry) => {
      const date = parseEntryDate(entry.timeDate);
      return date !== null && date <= to;
    });
  }
  if (filters.statusFilter !== 'All status') filtered = filtered.filter((entry) => entry.status === filters.statusFilter);
  if (filters.typeFilter !== 'All types') filtered = filtered.filter((entry) => entry.primaryType === filters.typeFilter);
  return filtered;
}

async function fetchLedgerSource(url: string): Promise<any> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = await response.json();
    if (payload?.success === false) throw new Error(asText(payload.error, 'Source unavailable'));
    return payload;
  } finally {
    window.clearTimeout(timeout);
  }
}

interface AdminWalletLedgerViewProps {
  notify?: (msg: string) => void;
}

export function AdminWalletLedgerView({ notify }: AdminWalletLedgerViewProps) {
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const [accountQuery, setAccountQuery] = useState('');
  const [referenceQuery, setReferenceQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All status');
  const [typeFilter, setTypeFilter] = useState('All types');
  const activeFilters = useRef<LedgerFilters>({ accountQuery: '', referenceQuery: '', fromDate: '', toDate: '', statusFilter: 'All status', typeFilter: 'All types' });
  activeFilters.current = { accountQuery, referenceQuery, fromDate, toDate, statusFilter, typeFilter };

  const [sourceEntries, setSourceEntries] = useState<LedgerEntry[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const currentFilters = (): LedgerFilters => ({ accountQuery, referenceQuery, fromDate, toDate, statusFilter, typeFilter });

  const loadLedger = useCallback(async (showNotice = false) => {
    setIsLoading(true);
    try {
      const sources = [
        { label: 'seller accounts', url: '/api/admin/owners' },
        { label: 'top-ups', url: '/api/recharges' },
        { label: 'refunds', url: '/api/consign/refunds' },
        { label: 'orders', url: '/api/consign/orders' },
      ];
      const results = await Promise.allSettled(sources.map((source) => fetchLedgerSource(source.url)));
      const failures = results.flatMap((result, index) => result.status === 'rejected' ? [sources[index].label] : []);
      const payload = (index: number) => results[index].status === 'fulfilled' ? results[index].value : {};
      const ownersPayload = payload(0);
      const rechargesPayload = payload(1);
      const refundsPayload = payload(2);
      const ordersPayload = payload(3);
      const owners = Array.isArray(ownersPayload?.owners) ? ownersPayload.owners : [];
      const nextRows = buildLedgerEntries({
        owners,
        recharges: Array.isArray(rechargesPayload?.recharges) ? rechargesPayload.recharges : [],
        refunds: Array.isArray(refundsPayload?.refunds) ? refundsPayload.refunds : [],
        orders: Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : [],
      });
      setSourceEntries(nextRows);
      setEntries(filterLedgerEntries(nextRows, activeFilters.current));
      setLoadError(failures.length ? `Some ledger sources could not load: ${failures.join(', ')}. Check your admin sign-in or refresh.` : '');
      if (showNotice) notifyRef.current?.(`Ledger refreshed · ${nextRows.length} real entries`);
    } catch {
      setLoadError('The Ledger could not process its data. Please refresh the page and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLedger();
    const onFocus = () => { void loadLedger(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadLedger]);

  const handleAccountQueryChange = (value: string) => {
    setAccountQuery(value);
    if (!value.trim()) {
      setEntries(filterLedgerEntries(sourceEntries, { ...currentFilters(), accountQuery: '' }));
    }
  };

  const handleReferenceQueryChange = (value: string) => {
    setReferenceQuery(value);
    if (!value.trim()) {
      setEntries(filterLedgerEntries(sourceEntries, { ...currentFilters(), referenceQuery: '' }));
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setEntries(filterLedgerEntries(sourceEntries, { ...currentFilters(), typeFilter: value }));
  };

  const handleSearch = () => {
    const filtered = filterLedgerEntries(sourceEntries, currentFilters());
    setEntries(filtered);
    notify?.(`Found ${filtered.length} matching ledger entries`);
  };

  const handleReset = () => {
    setAccountQuery('');
    setReferenceQuery('');
    setFromDate('');
    setToDate('');
    setStatusFilter('All status');
    setTypeFilter('All types');
    setEntries(sourceEntries);
    notify?.('Filters reset');
  };

  const handleRefresh = () => {
    void loadLedger(true);
  };

  const summary = useMemo(() => {
    const completedTransactions = entries.filter((entry) => entry.status === 'Completed' && entry.primaryType !== 'Rejected');
    return {
      credits: completedTransactions.filter((entry) => entry.isPositive).reduce((sum, entry) => sum + parseLedgerAmount(entry.amount), 0),
      debits: completedTransactions.filter((entry) => !entry.isPositive).reduce((sum, entry) => sum + parseLedgerAmount(entry.amount), 0),
      completed: entries.filter((entry) => entry.status === 'Completed').length,
      pending: entries.filter((entry) => entry.status === 'Pending').length,
      failed: entries.filter((entry) => entry.status === 'Failed').length,
      rejected: entries.filter((entry) => entry.status === 'Rejected').length,
    };
  }, [entries]);

  const typeCounts = useMemo(() => ({
    Adjust: sourceEntries.filter((entry) => entry.primaryType === 'Adjust').length,
    Refund: sourceEntries.filter((entry) => entry.primaryType === 'Refund').length,
    Payout: sourceEntries.filter((entry) => entry.primaryType === 'Payout').length,
    'Top-up': sourceEntries.filter((entry) => entry.primaryType === 'Top-up').length,
    Rejected: sourceEntries.filter((entry) => entry.primaryType === 'Rejected').length,
  }), [sourceEntries]);

  return (
    <div className="mx-auto max-w-[1500px] animate-fadeIn space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-2xl bg-[#101d34] px-5 py-6 text-white shadow-lg sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/[0.04]" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-100">
              <Activity className="h-3.5 w-3.5 text-[#e1bd62]" /> Wallet activity
            </span>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Wallet Ledger</h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Review recorded wallet activity, including top-ups, payouts, refunds, adjustments, and rejected orders.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-500">Transactions in view</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{entries.length}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Wallet className="h-4 w-4" /></span></div>
          <p className="mt-2 text-[10px] text-slate-500">Matching the current ledger results</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-500">Credits</p><p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">+${summary.credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><ArrowDownLeft className="h-4 w-4" /></span></div>
          <p className="mt-2 text-[10px] text-slate-500">Deposits, refunds, and other additions</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-500">Debits</p><p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">−${summary.debits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100"><ArrowUpRight className="h-4 w-4" /></span></div>
          <p className="mt-2 text-[10px] text-slate-500">Withdrawals, fees, and other deductions</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-500">Entry status</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{summary.completed} <span className="text-sm font-semibold text-emerald-700">completed</span></p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"><CheckCircle2 className="h-4 w-4" /></span></div>
          <p className="mt-2 text-[10px] text-slate-500">{summary.pending} pending · {summary.failed} failed · {summary.rejected} rejected</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Search className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900">Find ledger entries</h2><p className="mt-0.5 text-[10px] text-slate-500">Use the account, reference, date, status, and type filters.</p></div></div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(180px,1fr)_150px_150px_155px]">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">Account · shop / handle / email / ID</label>
              <input type="text" value={accountQuery} onChange={(e) => handleAccountQueryChange(e.target.value)} placeholder="Search a shop, seller, email, or account ID" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">Reference · code or note</label>
              <input type="text" value={referenceQuery} onChange={(e) => handleReferenceQueryChange(e.target.value)} placeholder="Search a transaction reference" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">From date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }} aria-label="From date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">To date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }} aria-label="To date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="All status">All status</option><option value="Completed">Completed</option><option value="Pending">Pending</option><option value="Failed">Failed</option><option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-[240px]">
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">Transaction type</label>
              <select value={typeFilter} onChange={(e) => handleTypeFilterChange(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="All types">All types ({sourceEntries.length})</option><option value="Adjust">Adjust ({typeCounts.Adjust})</option><option value="Refund">Refund ({typeCounts.Refund})</option><option value="Payout">Payout ({typeCounts.Payout})</option><option value="Top-up">Top-up ({typeCounts['Top-up']})</option><option value="Rejected">Rejected ({typeCounts.Rejected})</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleSearch} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101d34] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c2d49]"><Search className="h-3.5 w-3.5" /> Search</button>
              <button type="button" onClick={handleReset} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Reset</button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 px-4 py-2.5 text-[10px] text-slate-500 sm:px-5">
          <span><strong className="text-slate-800">{entries.length}</strong> ledger entries · Adjust {typeCounts.Adjust} · Refund {typeCounts.Refund} · Payout {typeCounts.Payout} · Top-up {typeCounts['Top-up']} · Rejected {typeCounts.Rejected}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Credits add to balance <span className="ml-2 h-2 w-2 rounded-full bg-rose-500" /> Debits reduce balance</span>
        </div>
        {loadError && <p role="status" className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-[11px] text-amber-800">{loadError}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-5 py-3">Date &amp; time</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Transaction</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Balance change</th><th className="px-4 py-3">Reference</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="align-top transition-colors hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4"><p className="text-[11px] font-semibold text-slate-800">{entry.timeDate}</p><p className="mt-1 text-[10px] text-slate-500">{entry.timeClock}</p></td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[220px] items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-700">{entry.shopName.trim().slice(0, 1).toUpperCase() || 'A'}</span>
                      <div className="min-w-0"><p className="truncate text-[11px] font-bold text-slate-900">{entry.shopName}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{entry.handle} · {entry.email}</p><p className="mt-1 truncate font-mono text-[9px] text-slate-400" title={entry.accountUid}>{entry.accountUid}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700">{entry.primaryType}</span><p className="mt-1.5 text-[10px] text-slate-500">{entry.subType.replace(/_/g, ' ')}</p></td>
                  <td className="whitespace-nowrap px-4 py-4 text-right"><span className={`text-xs font-bold ${entry.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>{entry.amount}</span><p className="mt-1 text-[9px] text-slate-400">{entry.currency}</p></td>
                  <td className="px-4 py-4"><div className="min-w-[150px] rounded-lg bg-slate-50 px-2.5 py-2"><p className="font-mono text-[9px] text-slate-500">Before <span className="text-[10px] font-medium text-slate-700">{entry.balanceBefore}</span></p><p className="my-1 text-[9px] text-slate-400">↓</p><p className="font-mono text-[9px] text-slate-500">After <span className="text-[10px] font-bold text-slate-900">{entry.balanceAfter}</span></p></div></td>
                  <td className="px-4 py-4"><p className="max-w-[220px] truncate font-mono text-[10px] font-medium text-slate-700" title={entry.referenceCode}>{entry.referenceCode}</p><p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-slate-500">{entry.referenceNote}</p></td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold ${entry.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : entry.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{entry.status === 'Completed' ? <CheckCircle2 className="h-3 w-3" /> : entry.status === 'Pending' ? <Clock3 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{entry.status}</span></td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">{isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}</span><p className="mt-3 text-xs font-semibold text-slate-800">{isLoading ? 'Loading real ledger entries…' : sourceEntries.length ? 'No matching ledger entries' : 'No recorded wallet activity yet'}</p><p className="mt-1 text-[10px] text-slate-500">{isLoading ? 'Reading the existing seller, top-up, refund, and order records.' : sourceEntries.length ? 'Adjust your search terms or reset the filters.' : 'Real wallet entries will appear here as they are recorded.'}</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-[9px] text-slate-400"><span>Amounts and balances are shown in the currency listed for each entry. “—” means the current source does not provide a before/after balance.</span><span>{summary.completed} completed · {summary.pending} pending · {summary.failed} failed · {summary.rejected} rejected</span></div>
      </section>
    </div>
  );
}
