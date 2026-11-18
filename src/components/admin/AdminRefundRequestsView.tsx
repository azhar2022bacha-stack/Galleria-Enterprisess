'use client';

import React, { useEffect, useState } from 'react';
import { sendSellerNotification } from '@/lib/sellerNotifications';

type RefundFilter = 'Pending' | 'Approved' | 'Rejected' | 'All';

interface RefundRequestItem {
  id: string;
  orderNumber: string;
  buyerName: string;
  sellerName: string;
  sellerEmail?: string;
  amount: string;
  reason: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface ConsignAdminRefund {
  id: string;
  orderId: string;
  orderCode: string;
  productTitle: string;
  amount: number;
  status: 'Refunded';
  reason: string;
  createdAt: string;
  sellerEmail: string;
  shopName: string;
  shopperName: string;
}

interface ConsignRejectedDispute {
  id: string;
  orderId?: string;
  orderNumber: string;
  productName: string;
  amount: string;
  reason: string;
  openedAt: string;
  sellerEmail?: string;
  shop: string;
  status: 'rejected';
}

interface AdminRefundRequestsViewProps {
  notify?: (msg: string) => void;
}

export function AdminRefundRequestsView({ notify }: AdminRefundRequestsViewProps) {
  const [activeFilter, setActiveFilter] = useState<RefundFilter>('Pending');
  const [requests, setRequests] = useState<RefundRequestItem[]>([]);
  const [consignRefunds, setConsignRefunds] = useState<ConsignAdminRefund[]>([]);
  const [consignRejections, setConsignRejections] = useState<ConsignRejectedDispute[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/consign/refunds', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Consign refunds.');
        if (active) setConsignRefunds(Array.isArray(result.refunds) ? result.refunds : []);
      })
      .catch((error) => console.error('Unable to load completed Consign refunds:', error));
    fetch('/api/consign/disputes', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load rejected Consign orders.');
        if (active) {
          setConsignRejections(
            (Array.isArray(result.disputes) ? result.disputes : []).filter((item: ConsignRejectedDispute) => item.status === 'rejected')
          );
        }
      })
      .catch((error) => console.error('Unable to load rejected Consign orders:', error));
    return () => { active = false; };
  }, []);

  const filteredRequests = requests.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.status === activeFilter;
  });

  const handleApprove = (id: string, orderNumber: string) => {
    const request = requests.find((item) => item.id === id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    notify?.(`Refund for Order #${orderNumber} approved and credited to buyer wallet.`);
    void sendSellerNotification({
      sellerEmail: request?.sellerEmail,
      orderNumber,
      category: 'Refunds & Disputes',
      title: `Refund approved for order #${orderNumber}`,
      message: [
        { text: `The refund request for order #${orderNumber} was approved. ` },
        { text: request?.amount || 'The approved refund amount', emphasis: 'red' },
        { text: ' will be returned to the buyer and may be deducted from your eligible order earnings.', emphasis: 'red' },
      ],
      tone: 'warning',
      href: '/seller/dashboard?tab=refunds',
      dedupeKey: `seller-refund-approved:${id}`,
    });
  };

  const handleReject = (id: string, orderNumber: string) => {
    const request = requests.find((item) => item.id === id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' } : r))
    );
    notify?.(`Refund request for Order #${orderNumber} rejected.`);
    void sendSellerNotification({
      sellerEmail: request?.sellerEmail,
      orderNumber,
      category: 'Refunds & Disputes',
      title: `Refund request declined for order #${orderNumber}`,
      message: [
        { text: `The refund request for order #${orderNumber} was not approved. `, emphasis: 'red' },
        { text: 'The buyer’s refund will not be issued through this request. Contact Support if you need more information.', emphasis: 'red' },
      ],
      tone: 'rejection',
      href: '/seller/dashboard?tab=refunds',
      dedupeKey: `seller-refund-rejected:${id}`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container matching screenshot */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8">
        
        {/* Header: Title and Subtitle */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Refunds &amp; Refund Requests
          </h1>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            All refund requests (merchants + platform). Approving refunds the buyer&apos;s wallet and claws back merchant resale earnings.
          </p>
        </div>

        {/* Filter Tabs: Pending, Approved, Rejected, All */}
        <div className="flex items-center gap-2 mt-4 sm:mt-5">
          {(['Pending', 'Approved', 'Rejected', 'All'] as RefundFilter[]).map((tab) => {
            const isSelected = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-[#18181b] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-6" />

        {/* Content Area / Empty State */}
        {filteredRequests.length === 0 ? (
          <div className="py-2 text-xs sm:text-sm text-gray-500 font-normal">
            No refund requests here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold pb-2">
                  <th className="py-2 px-3">Order / Buyer</th>
                  <th className="py-2 px-3">Seller Store</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">#{req.orderNumber}</div>
                      <div className="text-[11px] text-gray-400">{req.buyerName}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">{req.sellerName}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{req.amount}</td>
                    <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate">{req.reason}</td>
                    <td className="py-3 px-3 text-gray-400">{req.date}</td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {req.status === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id, req.orderNumber)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id, req.orderNumber)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold border border-rose-200"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="mt-8 border-t border-gray-100 pt-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">Completed Consign refunds</h2>
            <p className="mt-1 text-xs text-gray-500">Consign orders refunded by an administrator, including their current status.</p>
          </div>
          {consignRefunds.length === 0 ? (
            <p className="py-3 text-xs text-gray-500">No Consign orders have been refunded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                <thead><tr className="border-b border-gray-100 text-gray-500 font-semibold"><th className="py-2 px-3">Order / Buyer</th><th className="py-2 px-3">Seller Store</th><th className="py-2 px-3">Product</th><th className="py-2 px-3">Amount</th><th className="py-2 px-3">Reason</th><th className="py-2 px-3">Date</th><th className="py-2 px-3">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {consignRefunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3"><div className="font-bold text-gray-900">#{String(refund.orderCode || refund.orderId).replace(/^#/, '')}</div><div className="text-[11px] text-gray-400">{refund.shopperName || '—'}</div></td>
                      <td className="py-3 px-3 font-medium">{refund.shopName || refund.sellerEmail || '—'}</td>
                      <td className="py-3 px-3">{refund.productTitle || 'Consign order'}</td>
                      <td className="py-3 px-3 font-semibold">${Number(refund.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-gray-600">{refund.reason}</td>
                      <td className="py-3 px-3 text-gray-500">{new Date(refund.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Refunded</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-gray-100 pt-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">Rejected Consign orders</h2>
            <p className="mt-1 text-xs text-gray-500">Consign orders rejected by an administrator and shared with the seller’s Disputes page.</p>
          </div>
          {consignRejections.length === 0 ? (
            <p className="py-3 text-xs text-gray-500">No Consign orders have been rejected.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                <thead><tr className="border-b border-gray-100 text-gray-500 font-semibold"><th className="py-2 px-3">Order</th><th className="py-2 px-3">Seller Store</th><th className="py-2 px-3">Product</th><th className="py-2 px-3">Amount</th><th className="py-2 px-3">Reason</th><th className="py-2 px-3">Date</th><th className="py-2 px-3">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {consignRejections.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">#{String(dispute.orderNumber || dispute.orderId || '').replace(/^#/, '')}</td>
                      <td className="py-3 px-3 font-medium">{dispute.shop || dispute.sellerEmail || '—'}</td>
                      <td className="py-3 px-3">{dispute.productName || 'Consign order'}</td>
                      <td className="py-3 px-3 font-semibold">{dispute.amount || '—'}</td>
                      <td className="py-3 px-3 text-gray-600">{dispute.reason}</td>
                      <td className="py-3 px-3 text-gray-500">{dispute.openedAt ? new Date(dispute.openedAt).toLocaleString() : '—'}</td>
                      <td className="py-3 px-3"><span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Rejected</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
