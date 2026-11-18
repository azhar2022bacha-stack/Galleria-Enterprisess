'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Clock3, PackageOpen, Search } from 'lucide-react';
import type { SellerOrder, SellerOrderStatus } from '@/lib/sellerOrders';

const TRACKING_STAGES = [
  'Pending',
  'Confirmed',
  'Picked Up',
  'On the Way',
  'Delivered',
] as const;

type TrackingStage = (typeof TRACKING_STAGES)[number];

const STATUS_STAGE: Record<SellerOrderStatus, TrackingStage> = {
  awaiting_payment: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
};

const HISTORY_STATUS_FOR_STAGE: Partial<Record<TrackingStage, SellerOrderStatus>> = {
  Pending: 'awaiting_payment',
  Confirmed: 'confirmed',
  'Picked Up': 'picked_up',
  'On the Way': 'on_the_way',
  Delivered: 'delivered',
};

const money = (amount: number) =>
  '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dateLabel = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export function SellerOrderTrackerPanel({ orders }: { orders: SellerOrder[] }) {
  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = query
      ? orders.filter((order) => [
          order.code,
          order.customerName,
          order.customerEmail,
          ...order.products.map((product) => product.title),
        ].join(' ').toLowerCase().includes(query))
      : orders;
    return [...matching].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }, [orders, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 animate-fadeIn">
      <header className="rounded-2xl bg-[#071324] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PackageOpen className="h-5 w-5 text-[#cca23b]" />
              <h1 className="text-xl font-bold">Order Tracker</h1>
            </div>
            <p className="mt-1 text-sm text-gray-300">Follow each shopper order from placement through delivery.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <p className="text-2xl font-bold text-[#cca23b]">{orders.length}</p>
            <p className="text-[11px] text-gray-300">orders being tracked</p>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2.5 text-gray-500">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order number, shopper, email, or product"
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </label>
      </header>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
          <PackageOpen className="mx-auto h-9 w-9 text-gray-300" />
          <h2 className="mt-3 font-semibold text-gray-800">{orders.length ? 'No matching orders' : 'No orders to track yet'}</h2>
          <p className="mt-1 text-sm text-gray-500">{orders.length ? 'Try another search term.' : 'New shopper orders assigned to your shop will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentStage = STATUS_STAGE[order.status];
            const currentIndex = TRACKING_STAGES.indexOf(currentStage);
            const pending = order.status === 'awaiting_payment';
            const pillClass = pending
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : order.status === 'delivered'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-blue-200 bg-blue-50 text-blue-800';

            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900">Order #{order.code}</h2>
                        <span className={'rounded-full border px-2.5 py-1 text-[11px] font-semibold ' + pillClass}>
                          {currentStage}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {order.products.map((product) => product.title).join(', ') || 'Order items'} · {order.products.reduce((sum, product) => sum + product.quantity, 0)} item(s)
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Shopper: {order.customerName} · {dateLabel(order.createdAt) || 'Date unavailable'}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-gray-900">{money(order.amount)}</p>
                  </div>

                  <details className="group mt-4 border-t border-gray-100 pt-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[#1d4ed8]">
                      <span>View order timeline</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <ol className="mt-4 space-y-0">
                      {TRACKING_STAGES.map((stage, index) => {
                        const complete = index < currentIndex;
                        const current = index === currentIndex;
                        const historyStatus = HISTORY_STATUS_FOR_STAGE[stage];
                        const historyEntry = historyStatus
                          ? [...order.history].reverse().find((entry) => entry.status === historyStatus)
                          : undefined;
                        const timestamp = historyEntry?.at || (stage === 'Pending' ? order.createdAt : undefined);
                        const markerClass = current
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : complete
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-400';
                        const labelClass = current
                          ? 'font-semibold text-gray-900'
                          : complete
                            ? 'text-gray-700'
                            : 'text-gray-400';

                        return (
                          <li key={stage} className="relative flex min-h-11 gap-3">
                            {index < TRACKING_STAGES.length - 1 && (
                              <span className={'absolute left-[9px] top-5 h-[calc(100%-4px)] w-px ' + (complete ? 'bg-emerald-200' : 'bg-gray-200')} />
                            )}
                            <span className={'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ' + markerClass}>
                              {complete ? <Check className="h-3 w-3" /> : index + 1}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1 pb-3">
                              <div>
                                <span className={'text-sm ' + labelClass}>{stage}</span>
                                {current && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700">Current</span>}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                                {timestamp && <><Clock3 className="h-3 w-3" />{dateLabel(timestamp)}</>}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                  {order.status === 'delivered' && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="font-semibold text-blue-800">Congratulations! This order has been safely delivered to the customer.</p>
                      <p className="mt-1 text-sm text-blue-700">Thank you for choosing Galleria Enterprises, Inc.</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}