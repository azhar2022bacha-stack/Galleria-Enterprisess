'use client';

import React, { useEffect, useState } from 'react';
import { maskCustomerEmail, maskCustomerPhone, maskStreetAddress } from '@/lib/privacy';
import {
  RefundRequest,
  getRefunds,
  subscribeToOrders,
  updateRefundStatus,
} from '@/lib/sellerOrders';

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

interface SellerRefundsPanelProps {
  notify?: (msg: string) => void;
}

export function SellerRefundsPanel({ notify }: SellerRefundsPanelProps) {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const localRefunds = getRefunds();
      try {
        const response = await fetch('/api/consign/refunds', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load Consign refunds.');
        const data = await response.json();
        const serverRefunds = Array.isArray(data.refunds) ? (data.refunds as RefundRequest[]) : [];
        const uniqueRefunds = new Map<string, RefundRequest>();
        [...serverRefunds, ...localRefunds].forEach((refund) => {
          if (!uniqueRefunds.has(refund.id)) uniqueRefunds.set(refund.id, refund);
        });
        if (active) {
          setRefunds(
            Array.from(uniqueRefunds.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          );
        }
      } catch {
        if (active) setRefunds(localRefunds);
      }
    };

    const refreshLocalRefunds = () => void refresh();
    void refresh();
    const unsubscribe = subscribeToOrders(refreshLocalRefunds);
    const intervalId = window.setInterval(refreshLocalRefunds, 15_000);
    window.addEventListener('focus', refreshLocalRefunds);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshLocalRefunds);
    };
  }, []);

  const pendingCount = refunds.filter((r) => r.status === 'Pending').length;

  const handleAction = (id: string, status: 'Approved' | 'Rejected', code: string) => {
    updateRefundStatus(id, status);
    notify?.(`Refund for order ${code} marked as ${status}.`);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Refunds</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Refunds and refund requests related to your orders.
          </p>
        </div>

        {/* Pending: 0 badge matching screenshot */}
        <div>
          <span className="inline-block px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-xs font-semibold whitespace-nowrap shadow-sm">
            Pending: {pendingCount}
          </span>
        </div>
      </div>

      {/* Table Card matching screenshot */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-transparent">
                <th className="py-4 px-5 font-bold w-12">#</th>
                <th className="py-4 px-5 font-bold">DATE</th>
                <th className="py-4 px-5 font-bold">ORDER ID</th>
                <th className="py-4 px-5 font-bold">CUSTOMER</th>
                <th className="py-4 px-5 font-bold">PRODUCT</th>
                <th className="py-4 px-5 font-bold">AMOUNT</th>
                <th className="py-4 px-5 font-bold">STATUS</th>
                <th className="py-4 px-5 font-bold">REASON</th>
                <th className="py-4 px-5 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {refunds.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-16 text-center text-gray-400 text-xs sm:text-sm font-normal"
                  >
                    Nothing found
                  </td>
                </tr>
              ) : (
                refunds.map((item, idx) => {
                  const snapshot = item.orderSnapshot;
                  const address = snapshot?.shippingAddress;
                  return (
                  <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5 font-semibold text-gray-500">{idx + 1}</td>
                    <td className="py-4 px-5 text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="py-4 px-5 font-mono font-bold text-gray-900">{item.orderCode}</td>
                    <td className="py-4 px-5 min-w-[180px] max-w-[240px]">
                      <div className="font-semibold text-gray-800">{snapshot?.shopperName || item.shopperName || '—'}</div>
                      <div className="mt-0.5 text-[10px] text-gray-500">
                        {maskCustomerEmail(snapshot?.shopperEmail || item.shopperEmail)}
                      </div>
                      {item.source === 'consign-admin' && address && (
                        <details className="mt-1 text-[10px] text-gray-500">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">Contact &amp; address</summary>
                          <div className="mt-1 space-y-0.5 whitespace-normal rounded-lg bg-gray-50 p-2 leading-relaxed">
                            <p><span className="font-medium text-gray-700">Phone:</span> {maskCustomerPhone(address.phone)}</p>
                            <p><span className="font-medium text-gray-700">Street:</span> {maskStreetAddress(address.street)}</p>
                            <p><span className="font-medium text-gray-700">Apt / unit:</span> {address.apt || '—'}</p>
                            <p><span className="font-medium text-gray-700">City:</span> {address.city || '—'}</p>
                            <p><span className="font-medium text-gray-700">State / province:</span> {address.state || '—'}</p>
                            <p><span className="font-medium text-gray-700">Postal code:</span> {address.postalCode || '—'}</p>
                            <p><span className="font-medium text-gray-700">Country:</span> {address.country || '—'}</p>
                            <p><span className="font-medium text-gray-700">Country code:</span> {address.countryCode || '—'}</p>
                          </div>
                        </details>
                      )}
                    </td>
                    <td className="py-4 px-5 font-medium text-gray-700 min-w-[190px] max-w-[280px]">
                      <div className="truncate">{item.productTitle}</div>
                      {item.source === 'consign-admin' && snapshot && (
                        <details className="mt-1 text-[10px] font-normal text-gray-500">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">View full order details</summary>
                          <div className="mt-2 space-y-1 whitespace-normal rounded-lg bg-gray-50 p-2.5 leading-relaxed">
                            <p><span className="font-semibold text-gray-700">Shop:</span> {snapshot.shopName || item.shopName || '—'}</p>
                            <p><span className="font-semibold text-gray-700">Shop email:</span> {snapshot.merchantEmail || item.sellerEmail || '—'}</p>
                            <p><span className="font-semibold text-gray-700">Customer:</span> {snapshot.shopperName || item.shopperName || '—'} · {maskCustomerEmail(snapshot.shopperEmail || item.shopperEmail)}</p>
                            <p><span className="font-semibold text-gray-700">Order date:</span> {formatDate(snapshot.createdAt || snapshot.date || item.createdAt)}</p>
                            <p><span className="font-semibold text-gray-700">Items:</span> {snapshot.itemCount || item.itemCount || snapshot.products?.length || 1}</p>
                            <div>
                              <span className="font-semibold text-gray-700">Products:</span>
                              <ul className="ml-4 list-disc">
                                {(snapshot.products?.length ? snapshot.products : [{ id: 'summary', title: snapshot.itemTitle || item.productTitle, price: snapshot.cost || item.amount, quantity: snapshot.itemCount || 1 }]).map((product, productIndex) => (
                                  <li key={product.id || productIndex}>
                                    {product.title} · Qty {product.quantity || 1} · {money(Number(product.price || 0))}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p><span className="font-semibold text-gray-700">Order amount:</span> {money(Number(snapshot.cost ?? item.amount))}</p>
                            <p><span className="font-semibold text-gray-700">Commission:</span> {money(Number(snapshot.commission ?? item.commission ?? 0))} {snapshot.commissionRate || item.commissionRate ? `(${snapshot.commissionRate || item.commissionRate})` : ''}</p>
                            <p><span className="font-semibold text-gray-700">Order status before refund:</span> {snapshot.status || '—'}{snapshot.sellerStatus ? ` · ${snapshot.sellerStatus}` : ''}</p>
                            {address && (
                              <div>
                                <span className="font-semibold text-gray-700">Shipping details:</span>
                                <p>{[address.recipient, address.email ? maskCustomerEmail(address.email) : '', address.phone ? maskCustomerPhone(address.phone) : '', address.street ? maskStreetAddress(address.street) : '', address.apt, address.city, address.state, address.postalCode, address.country || address.countryCode].filter(Boolean).join(', ') || '—'}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-900">{money(item.amount)}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.status === 'Refunded'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-500 max-w-[180px] truncate">{item.reason}</td>
                    <td className="py-4 px-5 text-right">
                      {item.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(item.id, 'Approved', item.orderCode)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10.5px] font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'Rejected', item.orderCode)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10.5px] font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : item.status === 'Refunded' ? (
                        <span className="text-[11px] text-blue-600 font-medium">Refunded by Admin</span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">Processed</span>
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
    </div>
  );
}
