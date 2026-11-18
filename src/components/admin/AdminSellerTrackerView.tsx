'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, PackageOpen, RefreshCw, Search } from 'lucide-react';
import { CONSIGN_ORDERS_STORAGE_KEY } from '@/lib/sellerOrders';

type TrackerProduct = {
  id?: string;
  title?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
};

type TrackerOrder = {
  id: string;
  orderNumber?: string;
  shopName?: string;
  merchantEmail?: string;
  itemTitle?: string;
  itemCount?: number;
  shopperName?: string;
  shopperEmail?: string;
  cost?: number;
  status?: string;
  date?: string;
  createdAt?: string;
  products?: TrackerProduct[];
};

const TRACKER_STAGES = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
  'Packed',
  'Ready for Pickup',
  'Picked Up',
  'In Transit',
  'Arrived at Sorting Facility',
  'Out for Delivery',
  'Delivered',
] as const;

const PROGRESS_STORAGE_KEY = 'galleria_admin_seller_tracker_progress_v1';

type ProgressMap = Record<string, number>;

function readLocalOrders(): TrackerOrder[] {
  try {
    const raw = window.localStorage.getItem(CONSIGN_ORDERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((order) => order && order.id) : [];
  } catch {
    return [];
  }
}

function readProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        Number.isInteger(value) && Number(value) >= -1 && Number(value) < TRACKER_STAGES.length
      )
    ) as ProgressMap;
  } catch {
    return {};
  }
}

function mergeOrders(serverOrders: TrackerOrder[], localOrders: TrackerOrder[]): TrackerOrder[] {
  const byId = new Map<string, TrackerOrder>();
  localOrders.forEach((order) => byId.set(String(order.id), order));
  serverOrders.forEach((order) => {
    const key = String(order.id);
    byId.set(key, { ...byId.get(key), ...order });
  });
  return [...byId.values()].sort((left, right) =>
    Date.parse(String(right.createdAt || right.date || '')) - Date.parse(String(left.createdAt || left.date || ''))
  );
}

function money(value?: number) {
  return '$' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateLabel(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminSellerTrackerView() {
  const [orders, setOrders] = useState<TrackerOrder[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      const localOrders = readLocalOrders();
      try {
        const response = await fetch('/api/consign/orders', { cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load consign orders.');
        const data = await response.json();
        if (!data?.success || !Array.isArray(data.orders)) throw new Error('Could not load consign orders.');
        if (active) {
          setOrders(mergeOrders(data.orders as TrackerOrder[], localOrders));
          setLoadError('');
        }
      } catch {
        if (active) {
          setOrders(mergeOrders([], localOrders));
          setLoadError(localOrders.length ? '' : 'Consign orders could not be loaded. Please refresh to try again.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    setProgress(readProgress());
    void loadOrders();
    const intervalId = window.setInterval(() => void loadOrders(), 8000);
    const onFocus = () => void loadOrders();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSIGN_ORDERS_STORAGE_KEY) void loadOrders();
      if (event.key === PROGRESS_STORAGE_KEY) setProgress(readProgress());
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => [
      order.orderNumber,
      order.id,
      order.shopName,
      order.merchantEmail,
      order.shopperName,
      order.shopperEmail,
      order.itemTitle,
      order.status,
      ...(order.products || []).flatMap((product) => [product.title, product.name]),
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [orders, search]);

  const advanceStage = (orderId: string, nextIndex: number) => {
    const currentIndex = progress[orderId] ?? -1;
    if (nextIndex !== currentIndex + 1) return;
    const nextProgress = { ...progress, [orderId]: nextIndex };
    setProgress(nextProgress);
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
    } catch {
      setLoadError('This browser could not save tracker progress.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 animate-fadeIn">
      <header className="rounded-2xl bg-[#101827] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PackageOpen className="h-5 w-5 text-amber-400" />
              <h1 className="text-xl font-bold">Seller Tracker</h1>
            </div>
            <p className="mt-1 text-sm text-gray-300">Advance each consign order through its fulfillment stages.</p>
            <p className="mt-1 text-xs text-gray-400">Stage progress is saved in this browser only.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-amber-400">{orders.length}</p>
              <p className="text-[11px] text-gray-300">consign orders</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                const event = new Event('focus');
                window.dispatchEvent(event);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2.5 text-gray-500">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, seller, shopper, email, or product"
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </label>
      </header>

      {loadError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loadError}</div>}

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">Loading consign orders…</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
          <PackageOpen className="mx-auto h-9 w-9 text-gray-300" />
          <h2 className="mt-3 font-semibold text-gray-800">{orders.length ? 'No matching orders' : 'No consign orders to track yet'}</h2>
          <p className="mt-1 text-sm text-gray-500">{orders.length ? 'Try another search term.' : 'Orders dispatched from Consign will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentIndex = progress[order.id] ?? -1;
            const itemTitles = order.products?.map((product) => product.title || product.name).filter(Boolean).join(', ') || order.itemTitle || 'Consign items';
            const itemCount = Number(order.itemCount || order.products?.reduce((sum, product) => sum + Number(product.quantity || 1), 0) || 0);
            const currentStage = currentIndex >= 0 ? TRACKER_STAGES[currentIndex] : 'Not started';
            const percent = Math.max(0, ((currentIndex + 1) / TRACKER_STAGES.length) * 100);

            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900">Order #{order.orderNumber || order.id}</h2>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{currentStage}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">Shopper: {order.shopperName || 'Shopper unavailable'}</p>
                      <p className="mt-1 break-all text-xs text-gray-500">{order.shopperEmail || 'Email unavailable'} · {dateLabel(order.createdAt || order.date)}</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900">{money(order.cost)}</p>
                      <p className="text-xs text-gray-500">{itemCount} item(s)</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>Seller: {order.shopName || 'Seller unavailable'}</span>
                    {order.merchantEmail && <span className="break-all">{order.merchantEmail}</span>}
                    <span>Items: {itemTitles}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: percent + '%' }} />
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-gray-500">{Math.max(0, currentIndex + 1)} / {TRACKER_STAGES.length} stages</span>
                  </div>
                </div>
                <ol className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                  {TRACKER_STAGES.map((stage, index) => {
                    const completed = index < currentIndex;
                    const current = index === currentIndex;
                    const next = index === currentIndex + 1;
                    return (
                      <li key={stage}>
                        <button
                          type="button"
                          disabled={!next}
                          onClick={() => advanceStage(order.id, index)}
                          aria-current={current ? 'step' : undefined}
                          className={'flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ' + (
                            current
                              ? 'border-blue-200 bg-blue-50 font-semibold text-blue-800'
                              : completed
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                                : next
                                  ? 'border-amber-300 bg-amber-50 font-semibold text-amber-900 hover:border-amber-400'
                                  : 'border-gray-100 bg-gray-50 text-gray-400'
                          )}
                        >
                          <span className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ' + (
                            completed ? 'bg-emerald-100 text-emerald-700' : current ? 'bg-blue-600 text-white' : next ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-500'
                          )}>
                            {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <span className="min-w-0 flex-1">{stage}</span>
                          <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide">{current ? 'Current' : completed ? 'Done' : next ? 'Next' : 'Locked'}</span>
                          {next && <Clock3 className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}