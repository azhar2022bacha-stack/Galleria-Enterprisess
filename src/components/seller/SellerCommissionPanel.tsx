'use client';

import React, { useMemo } from 'react';
import {
  ORDER_STATUS_LABEL,
  orderPaymentBreakdown,
  SellerOrder,
} from '@/lib/sellerOrders';
import { maskCustomerEmail, maskCustomerPhone, maskStreetAddress } from '@/lib/privacy';

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const STATUS_STYLES: Record<SellerOrder['status'], string> = {
  awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-violet-50 text-violet-700 border-violet-200',
  on_the_way: 'bg-sky-50 text-sky-700 border-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function SellerCommissionPanel({ orders }: { orders: SellerOrder[] }) {
  const sortedOrders = useMemo(
    () => [...orders].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [orders]
  );
  const totalCommission = useMemo(
    () => orders.reduce((totalCents, order) => {
      const commission = orderPaymentBreakdown(order.amount).commission;
      return totalCents + (Number.isFinite(commission) ? Math.round(commission * 100) : 0);
    }, 0) / 100,
    [orders]
  );

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Commission History
        </h1>
        <span className="inline-flex self-start px-3.5 py-1.5 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] text-xs font-semibold whitespace-nowrap shadow-sm">
          Total commission: {money(totalCommission)}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Products</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-xs sm:text-sm font-normal">
                    No orders found.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const breakdown = orderPaymentBreakdown(order.amount);
                  const commission = Number.isFinite(breakdown.commission) ? breakdown.commission : 0;
                  const commissionRate = order.amount > 0 ? Math.round((commission / order.amount) * 100) : 0;
                  const itemCount = order.products.reduce(
                    (count, product) => count + Math.max(1, Number(product.quantity) || 1),
                    0
                  );
                  const firstProduct = order.products[0];
                  const productNames = order.products.map((product) => product.title).filter(Boolean).join(', ');

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6 align-middle">
                        <span className="block font-bold text-gray-900">{order.code}</span>
                        <span className="block text-[11px] text-gray-400 mt-1">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <span className="block font-semibold text-gray-900">{order.customerName || '—'}</span>
                        <span className="block text-[11px] text-gray-400 mt-1">{maskCustomerEmail(order.shippingAddress?.email || order.customerEmail)}</span>
                        <div className="mt-1 max-w-[220px] space-y-0.5 break-words text-[10px] leading-snug text-gray-500">
                          <p><span className="font-medium text-gray-700">Phone:</span> {maskCustomerPhone(order.shippingAddress?.phone)}</p>
                          <p><span className="font-medium text-gray-700">Street:</span> {maskStreetAddress(order.shippingAddress?.street)}</p>
                          <p><span className="font-medium text-gray-700">Apt / unit:</span> {order.shippingAddress?.apt || '—'}</p>
                          <p><span className="font-medium text-gray-700">City:</span> {order.shippingAddress?.city || order.customerLocation || '—'}</p>
                          <p><span className="font-medium text-gray-700">State / province:</span> {order.shippingAddress?.state || '—'}</p>
                          <p><span className="font-medium text-gray-700">Postal code:</span> {order.shippingAddress?.postalCode || '—'}</p>
                          <p><span className="font-medium text-gray-700">Country:</span> {order.shippingAddress?.country || '—'}</p>
                          <p><span className="font-medium text-gray-700">Country code:</span> {order.shippingAddress?.countryCode || '—'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {firstProduct?.image ? (
                            <img src={firstProduct.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-gray-100 shrink-0" aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <span className="block text-gray-800 truncate max-w-[230px]">{productNames || '—'}</span>
                            <span className="block text-[11px] text-gray-400 mt-1">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className="block font-bold text-gray-900">{money(order.amount)}</span>
                        <span className="block text-[11px] font-semibold text-emerald-600 mt-1">
                          + {money(commission)} ({commissionRate}%)
                        </span>
                      </td>
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-semibold ${STATUS_STYLES[order.status]}`}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
