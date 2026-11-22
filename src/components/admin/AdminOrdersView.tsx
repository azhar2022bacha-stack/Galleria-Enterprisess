'use client';

import { fetchAdminConsignOrders } from '@/lib/adminConsignOrders';
import React, { useState, useMemo, useEffect } from 'react';
import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Check,
  Download,
  Filter,
  Eye,
} from 'lucide-react';
import { AdminOrder, INITIAL_ADMIN_ORDERS, getAdminOrders } from '@/lib/adminData';
import { getOrders, SellerOrder, subscribeToOrders } from '@/lib/sellerOrders';
import type { AdminTodoCounts } from '@/lib/adminTodoCounts';


interface AdminOrdersViewProps {
  onOpenTodo: () => void;
  notify?: (msg: string) => void;
  waitingCount?: number;
  todoCounts: AdminTodoCounts;
}

function sameOrder(left: AdminOrder, right: AdminOrder): boolean {
  return left.id === right.id &&
    left.orderNumber === right.orderNumber &&
    left.date === right.date &&
    left.customer === right.customer &&
    left.email === right.email &&
    left.salesChannel === right.salesChannel &&
    left.paymentStatus === right.paymentStatus &&
    left.fulfillmentStatus === right.fulfillmentStatus &&
    left.total === right.total &&
    left.currency === right.currency;
}

function sameOrders(left: AdminOrder[], right: AdminOrder[]): boolean {
  return left.length === right.length && left.every((order, index) => sameOrder(order, right[index]));
}

export function AdminOrdersView({
  onOpenTodo,
  notify,
  waitingCount = 0,
  todoCounts,
}: AdminOrdersViewProps) {
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ADMIN_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Captured' | 'Pending' | 'Refunded'>('All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'All' | 'Delivered' | 'Not fulfilled' | 'Refunded' | 'Rejected' | 'Cancelled'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const menuId = useDismissMenusOnOutsideClick(isFilterOpen, () => setIsFilterOpen(false));
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Sync storefront orders and Consign orders, including terminal refund/rejection decisions.
  useEffect(() => {
    let active = true;
    let consignSyncInFlight = false;
    let lastKnownConsignOrders: AdminOrder[] = [];

    const applyOrders = (nextOrders: AdminOrder[]) => {
      if (!active) return;
      setOrders((current) => sameOrders(current, nextOrders) ? current : nextOrders);
      setSelectedOrder((current) => {
        if (!current) return current;
        const updated = nextOrders.find((order) => order.id === current.id);
        return updated && !sameOrder(current, updated) ? updated : current;
      });
    };

    const handleSync = () => {
      const baseOrders = getAdminOrders();
      const liveOrders = getOrders();

      // Convert real storefront checkout orders into admin format
      const convertedLive: AdminOrder[] = liveOrders.map((lo, idx) => ({
        id: lo.id,
        orderNumber: `#${32 + idx}`,
        date: new Date(lo.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        customer: lo.customerName || 'Store Buyer',
        email: lo.customerEmail,
        salesChannel: 'Default Sales Channel',
        paymentStatus: lo.status === 'awaiting_payment' ? 'Pending' : 'Captured',
        fulfillmentStatus: lo.status === 'delivered' ? 'Delivered' : 'Not fulfilled',
        total: lo.amount,
        currency: 'USD',
      }));

      // Keep the last successful Consign results visible while the next sync is in flight.
      // Use one stable live-order ordering for both the immediate and API-backed updates.
      applyOrders([...lastKnownConsignOrders, ...convertedLive, ...baseOrders]);

      if (consignSyncInFlight) return;
      consignSyncInFlight = true;
      void Promise.all([
        fetchAdminConsignOrders(),
        fetch('/api/consign/disputes', { cache: 'no-store' }),
      ])
        .then(async ([ordersResult, disputesResponse]) => {
          const disputesResult = await disputesResponse.json();
          if (!active || !ordersResult?.success) return;
          const disputes = disputesResponse.ok && disputesResult?.success && Array.isArray(disputesResult.disputes)
            ? disputesResult.disputes
            : [];
          const normalizeOrderNumber = (value: unknown) => String(value || '').trim().replace(/^#/, '').toLowerCase();
          const consignOrders: AdminOrder[] = (Array.isArray(ordersResult.orders) ? ordersResult.orders : []).map((order: any) => {
            const dispute = disputes.find((item: any) =>
              String(item.orderId || '') === String(order.id || '') ||
              normalizeOrderNumber(item.orderNumber) === normalizeOrderNumber(order.orderNumber)
            );
            const orderStatus = String(order.status || '');
            const isRefunded = orderStatus.toLowerCase() === 'refunded' || Boolean(order.refund) || dispute?.status === 'refunded';
            const isRejected = !isRefunded && (orderStatus.toLowerCase() === 'rejected' || dispute?.status === 'rejected');
            const isCancelled = !isRefunded && !isRejected && orderStatus.toLowerCase().startsWith('cancelled');
            const isAwaitingPayment = orderStatus.toLowerCase().startsWith('awaiting payment') || String(order.sellerStatus || '').toLowerCase() === 'awaiting_payment';
            const timestamp = new Date(order.createdAt || order.date || Date.now());

            return {
              id: `consign:${String(order.id || order.orderNumber)}`,
              orderNumber: `#${String(order.orderNumber || order.id || '').replace(/^#/, '')}`,
              date: Number.isNaN(timestamp.getTime())
                ? String(order.date || '—')
                : timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              customer: order.shopperName || 'Consign shopper',
              email: order.shopperEmail,
              salesChannel: `Consign · ${order.shopName || 'Seller'}`,
              paymentStatus: isRefunded ? 'Refunded' : isAwaitingPayment ? 'Pending' : 'Captured',
              fulfillmentStatus: isRefunded
                ? 'Refunded'
                : isRejected
                  ? 'Rejected'
                    : isCancelled
                      ? 'Cancelled'
                      : orderStatus.toLowerCase().includes('received') || String(order.sellerStatus || '').toLowerCase() === 'delivered'
                        ? 'Delivered'
                        : 'Not fulfilled',
              total: Number(order.cost || 0),
              currency: 'USD',
            };
          });

          lastKnownConsignOrders = consignOrders;
          applyOrders([...consignOrders, ...convertedLive, ...baseOrders]);
        })
        .catch((error) => console.error('Unable to sync Consign orders into Admin Orders:', error))
        .finally(() => { consignSyncInFlight = false; });
    };

    handleSync();
    const unsub = subscribeToOrders(handleSync);
    window.addEventListener('buyxoco_admin_data_changed', handleSync);
    const pollId = setInterval(handleSync, 15_000);
    return () => {
      active = false;
      unsub();
      clearInterval(pollId);
      window.removeEventListener('buyxoco_admin_data_changed', handleSync);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.customer.toLowerCase().includes(q) ||
          ord.salesChannel.toLowerCase().includes(q) ||
          ord.paymentStatus.toLowerCase().includes(q) ||
          ord.fulfillmentStatus.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (paymentFilter !== 'All' && ord.paymentStatus !== paymentFilter) {
        return false;
      }
      if (fulfillmentFilter !== 'All' && ord.fulfillmentStatus !== fulfillmentFilter) {
        return false;
      }
      return true;
    });
  }, [orders, searchQuery, paymentFilter, fulfillmentFilter]);

  const handleExport = () => {
    const csvHeader = 'Order,Date,Customer,Sales Channel,Payment,Fulfillment,Total\n';
    const csvRows = filteredOrders
      .map(
        (o) =>
          `"${o.orderNumber}","${o.date}","${o.customer}","${o.salesChannel}","${o.paymentStatus}","${o.fulfillmentStatus}","$ ${o.total.toFixed(2)} USD"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify?.(`Exported ${filteredOrders.length} orders to CSV.`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* 1. URGENT NOTICE BANNER (37 ITEM(S) WAITING)                   */}
      {/* ============================================================== */}
      <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#e11d48] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {waitingCount}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#881337] tracking-tight">
              item(s) waiting
            </h2>
          </div>
          <p className="text-xs text-[#9f1239] leading-relaxed">
            Recharges {todoCounts.recharges} · Withdrawals {todoCounts.withdrawals} · Merchant review {todoCounts.merchantReview} · Product review {todoCounts.productReview} · Support tickets {todoCounts.supportTickets} · Refund requests {todoCounts.refundRequests} · Merchant overdue {todoCounts.merchantOverdue} · Unfulfilled orders {todoCounts.unfulfilledOrders} · Chased, no reply {todoCounts.chasedNoReply} · New seller orders {todoCounts.newSellerOrders} · New sellers (7d) {todoCounts.newLast7Days} · Deposits {todoCounts.deposits}
          </p>
        </div>

        <button
          onClick={onOpenTodo}
          className="px-4 py-2 bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
        >
          Open to-do
        </button>
      </div>


      {/* ============================================================== */}
      {/* 2. ORDERS MAIN CARD                                            */}
      {/* ============================================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Orders
          </h1>
          <button
            onClick={handleExport}
            className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
          >
            Export
          </button>
        </div>

        {/* Toolbar: Add Filter & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative" data-click-away-menu={isFilterOpen ? menuId : undefined}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>Add filter</span>
              {(paymentFilter !== 'All' || fulfillmentFilter !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {isFilterOpen && (
              <div className="absolute top-10 left-0 z-40 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-3 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    Payment Status
                  </span>
                  <div className="flex gap-1">
                    {(['All', 'Captured', 'Pending', 'Refunded'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setPaymentFilter(s)}
                        className={`px-2 py-1 rounded text-[11px] font-medium ${
                          paymentFilter === s
                            ? 'bg-[#0f172a] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    Fulfillment Status
                  </span>
                  <div className="flex gap-1">
                    {(['All', 'Delivered', 'Not fulfilled', 'Refunded', 'Rejected', 'Cancelled'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFulfillmentFilter(s)}
                        className={`px-2 py-1 rounded text-[11px] font-medium ${
                          fulfillmentFilter === s
                            ? 'bg-[#0f172a] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setPaymentFilter('All');
                      setFulfillmentFilter('All');
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-900"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="px-2.5 py-1 bg-gray-900 text-white rounded text-[11px] font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-56 px-2.5 py-1.5 pl-8 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => notify?.('Orders sorted by newest timestamp.')}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
              title="Sort and view settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto -mx-5 sm:-mx-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200/80 text-gray-500 font-medium">
                <th className="py-2.5 px-5 sm:px-6 font-normal">Order</th>
                <th className="py-2.5 px-3 font-normal">Date</th>
                <th className="py-2.5 px-3 font-normal">Customer</th>
                <th className="py-2.5 px-3 font-normal">Sales Channel</th>
                <th className="py-2.5 px-3 font-normal">Payment</th>
                <th className="py-2.5 px-3 font-normal">Fulfillment</th>
                <th className="py-2.5 px-3 font-normal">Order Total</th>
                <th className="py-2.5 px-4 text-right font-normal"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No orders match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Order Number */}
                    <td className="py-3 px-5 sm:px-6 font-medium text-gray-900 whitespace-nowrap">
                      {ord.orderNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                      {ord.date}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">
                      {ord.customer}
                    </td>

                    {/* Sales Channel */}
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                      {ord.salesChannel}
                    </td>

                    {/* Payment Status with dot */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ord.paymentStatus === 'Captured'
                              ? 'bg-[#10b981]'
                              : ord.paymentStatus === 'Refunded'
                                ? 'bg-blue-500'
                                : 'bg-amber-400'
                          }`}
                        ></span>
                        <span className="text-gray-700">{ord.paymentStatus}</span>
                      </div>
                    </td>

                    {/* Fulfillment Status with dot */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ord.fulfillmentStatus === 'Delivered'
                              ? 'bg-[#10b981]'
                              : ord.fulfillmentStatus === 'Refunded'
                                ? 'bg-blue-500'
                                : ord.fulfillmentStatus === 'Rejected'
                                  ? 'bg-rose-600'
                                  : ord.fulfillmentStatus === 'Cancelled'
                                    ? 'bg-gray-400'
                                  : 'bg-[#ef4444]'
                          }`}
                        ></span>
                        <span className="text-gray-700">{ord.fulfillmentStatus}</span>
                      </div>
                    </td>

                    {/* Order Total */}
                    <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">
                      $ {ord.total.toFixed(2)} {ord.currency}
                    </td>

                    {/* Row Action / Dash */}
                    <td className="py-3 px-4 text-right text-gray-400 whitespace-nowrap">
                      -
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Order Details {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-gray-400">{selectedOrder.date} · {selectedOrder.salesChannel}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Customer</span>
                <span className="font-semibold text-gray-800">{selectedOrder.customer}</span>
              </div>
              {selectedOrder.email && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Email</span>
                  <span className="text-gray-700">{selectedOrder.email}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Payment Status</span>
                <span className={`font-semibold ${selectedOrder.paymentStatus === 'Refunded' ? 'text-blue-600' : selectedOrder.paymentStatus === 'Captured' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedOrder.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Fulfillment</span>
                <span
                  className={`font-semibold ${
                    selectedOrder.fulfillmentStatus === 'Delivered'
                      ? 'text-emerald-600'
                      : selectedOrder.fulfillmentStatus === 'Refunded'
                        ? 'text-blue-600'
                        : selectedOrder.fulfillmentStatus === 'Rejected'
                          ? 'text-rose-700'
                          : selectedOrder.fulfillmentStatus === 'Cancelled'
                            ? 'text-gray-600'
                          : 'text-rose-600'
                  }`}
                >
                  {selectedOrder.fulfillmentStatus}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Order Total</span>
                <span className="font-bold text-gray-900 text-sm">
                  $ {selectedOrder.total.toFixed(2)} {selectedOrder.currency}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  notify?.(`Invoice printed for ${selectedOrder.orderNumber}`);
                  setSelectedOrder(null);
                }}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
