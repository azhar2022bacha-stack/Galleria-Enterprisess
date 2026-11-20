'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Clock3, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import type { StorefrontOrderRecord } from '@/lib/storefrontOrders';

export function AdminStorefrontOrdersView() {
  const [orders, setOrders] = useState<StorefrontOrderRecord[]>([]);
  const [fulfillmentDrafts, setFulfillmentDrafts] = useState<Record<string, { orderStatus: string; trackingCarrier: string; trackingNumber: string; trackingUrl: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/storefront-orders?scope=admin', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load storefront orders.');
      const nextOrders = Array.isArray(result.orders) ? result.orders as StorefrontOrderRecord[] : [];
      setOrders(nextOrders);
      setFulfillmentDrafts((current) => {
        const next = { ...current };
        for (const order of nextOrders) if (!next[order.id]) next[order.id] = { orderStatus: order.orderStatus, trackingCarrier: order.trackingCarrier || '', trackingNumber: order.trackingNumber || '', trackingUrl: order.trackingUrl || '' };
        return next;
      });
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load storefront orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveFulfillment = async (order: StorefrontOrderRecord) => {
    const draft = fulfillmentDrafts[order.id];
    if (!draft) return;
    setSavingId(order.id);
    setError('');
    try {
      const response = await fetch('/api/storefront-orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-fulfillment', id: order.id, ...draft }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update fulfillment.');
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update fulfillment.');
    } finally {
      setSavingId('');
    }
  };

  const markCashCollected = async (order: StorefrontOrderRecord) => {
    if (!window.confirm(`Confirm that cash for order ${order.orderNumber} was collected at delivery?`)) return;
    await recordPayment(order, 'mark-cod-collected');
  };

  const markCryptoReceived = async (order: StorefrontOrderRecord) => {
    const payment = order.cryptoPayment;
    if (!payment) return;
    const transactionId = window.prompt(`After verifying receipt of ${payment.amount} ${payment.token} on ${payment.chain}, enter the confirmed transaction ID.`)?.trim();
    if (!transactionId) return;
    await recordPayment(order, 'mark-crypto-received', transactionId);
  };

  const recordPayment = async (order: StorefrontOrderRecord, action: 'mark-cod-collected' | 'mark-crypto-received', transactionId?: string) => {
    setSavingId(order.id);
    setError('');
    try {
      const response = await fetch('/api/storefront-orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id: order.id, transactionId }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to record payment.');
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
      setFulfillmentDrafts((current) => ({ ...current, [order.id]: { ...(current[order.id] || { trackingCarrier: '', trackingNumber: '', trackingUrl: '' }), orderStatus: result.order.orderStatus } }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to record payment.');
    } finally {
      setSavingId('');
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(interval);
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="rounded-2xl bg-[#071324] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4ae5e]/35 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c77f]"><ShieldCheck className="h-3.5 w-3.5" /> Marketplace operations</div><h1 className="font-serif text-3xl sm:text-4xl">Storefront orders</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage payments, fulfillment, and tracking for storefront orders.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3"><div className="text-2xl font-bold">{orders.length}</div><div className="text-[10px] text-slate-300">total requests</div></div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="text-base font-semibold text-slate-900">Order queue</h2><p className="mt-0.5 text-xs text-slate-500">Personal shipping details are available to admins and assigned sellers only.</p></div>
          <button type="button" onClick={() => { setLoading(true); void load(); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
        </div>
        {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:mx-6">{error}</div>}
        {loading ? (
          <div className="flex h-52 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading requests</div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">No storefront order requests yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <article key={order.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-sm font-bold text-slate-900">{order.orderNumber}</h3><p className="mt-1 text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleString()} · {order.buyerName} · {order.buyerEmail}</p></div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${order.paymentStatus === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : order.paymentStatus === 'FAILED' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><Clock3 className="h-3 w-3" />{order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'FAILED' ? 'Payment failed' : order.paymentMethod === 'Cash on Delivery' ? 'Cash due on delivery' : 'Payment pending'}</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">Method: <span className="font-semibold">{order.paymentMethod}</span> · Fulfillment: <span className="font-semibold capitalize">{order.orderStatus.toLowerCase()}</span></p>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.5fr)]">
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {order.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-3 text-xs">
                        <span className="font-medium text-slate-700">{item.title} × {item.quantity}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}<span className="ml-2 text-slate-400">Seller: {item.sellerName || 'Unassigned sample catalog'}</span></span>
                        <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="space-y-1.5 bg-slate-50 px-3.5 py-3 text-xs"><div className="flex justify-between"><span className="font-semibold text-slate-600">Subtotal</span><span className="font-semibold text-slate-800">${(order.subtotalAmount ?? order.totalAmount).toFixed(2)}</span></div>{Boolean(order.discountAmount) && <div className="flex justify-between text-emerald-700"><span>Promotion {order.promotionCode ? `(${order.promotionCode})` : ''}</span><span>−${order.discountAmount!.toFixed(2)}</span></div>}<div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="font-semibold text-slate-700">Merchandise total</span><span className="font-bold text-slate-900">${order.totalAmount.toFixed(2)}</span></div></div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Ship to</h4><p className="mt-2 text-xs leading-5 text-slate-700">{order.shippingAddress.fullName}<br />{order.shippingAddress.street}{order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}<br />{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zipCode].filter(Boolean).join(', ')}<br />{order.shippingAddress.country}<br />{order.shippingAddress.phoneNumber}</p></div>
                </div>
                {order.cryptoPayment && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-slate-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900">Crypto payment</h4>
                      <p className="mt-1">{order.cryptoPayment.amount} {order.cryptoPayment.token} on {order.cryptoPayment.chain} · {order.cryptoPayment.networkName}</p>
                      <p className="mt-1 break-all font-mono">{order.cryptoPayment.address}</p>
                      {order.cryptoPayment.transactionId && <p className="mt-1 break-all">Transaction ID <strong className="font-mono">{order.cryptoPayment.transactionId}</strong></p>}
                    </div>
                    {order.paymentStatus === 'PENDING' && order.orderStatus === 'PENDING' && (
                      <button type="button" disabled={savingId === order.id} onClick={() => void markCryptoReceived(order)} className="rounded-lg bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50">Verify and mark as received</button>
                    )}
                  </div>
                </div>}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-bold text-slate-800">Fulfillment & tracking</h4>{order.paymentMethod === 'Cash on Delivery' && order.paymentStatus !== 'PAID' && order.orderStatus !== 'CANCELLED' && <button type="button" disabled={savingId === order.id} onClick={() => void markCashCollected(order)} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50">{savingId === order.id ? 'Saving…' : 'Mark cash collected'}</button>}</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-[10px] font-semibold text-slate-600">Order status<select value={fulfillmentDrafts[order.id]?.orderStatus || order.orderStatus} onChange={(event) => setFulfillmentDrafts((current) => ({ ...current, [order.id]: { ...(current[order.id] || { trackingCarrier: '', trackingNumber: '', trackingUrl: '' }), orderStatus: event.target.value } }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800"><option value="PENDING">Pending</option><option value="PROCESSING">Processing</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select></label>
                    <label className="text-[10px] font-semibold text-slate-600">Carrier<input value={fulfillmentDrafts[order.id]?.trackingCarrier ?? order.trackingCarrier ?? ''} onChange={(event) => setFulfillmentDrafts((current) => ({ ...current, [order.id]: { ...(current[order.id] || { orderStatus: order.orderStatus, trackingNumber: '', trackingUrl: '' }), trackingCarrier: event.target.value } }))} placeholder="UPS, USPS…" className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800" /></label>
                    <label className="text-[10px] font-semibold text-slate-600">Tracking number<input value={fulfillmentDrafts[order.id]?.trackingNumber ?? order.trackingNumber ?? ''} onChange={(event) => setFulfillmentDrafts((current) => ({ ...current, [order.id]: { ...(current[order.id] || { orderStatus: order.orderStatus, trackingCarrier: '', trackingUrl: '' }), trackingNumber: event.target.value } }))} placeholder="Carrier reference" className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800" /></label>
                    <label className="text-[10px] font-semibold text-slate-600">Tracking URL<input type="url" value={fulfillmentDrafts[order.id]?.trackingUrl ?? order.trackingUrl ?? ''} onChange={(event) => setFulfillmentDrafts((current) => ({ ...current, [order.id]: { ...(current[order.id] || { orderStatus: order.orderStatus, trackingCarrier: '', trackingNumber: '' }), trackingUrl: event.target.value } }))} placeholder="https://carrier.example/track" className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800" /></label>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] leading-4 text-slate-500">Confirm card and crypto payments before shipping. Collect COD at delivery.</p><button type="button" disabled={savingId === order.id} onClick={() => void saveFulfillment(order)} className="rounded-lg bg-[#14263d] px-3.5 py-2 text-[10px] font-bold text-white disabled:opacity-50">{savingId === order.id ? 'Saving…' : 'Save fulfillment'}</button></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
