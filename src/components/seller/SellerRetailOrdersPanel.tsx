'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Clock3, LoaderCircle, PackageCheck, RefreshCw, ShieldCheck } from 'lucide-react';

interface SellerRetailOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  buyer: { name: string; email: string };
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    selectedColor?: string;
    selectedSize?: string;
  }[];
  sellerSubtotal: number;
  discountAmount?: number;
  promotionCode?: string;
  shippingAddress: {
    street: string;
    apartment?: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
  };
}

export function SellerRetailOrdersPanel() {
  const [orders, setOrders] = useState<SellerRetailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/storefront-orders?scope=seller', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load retail order requests.');
      setOrders(Array.isArray(result.orders) ? result.orders : []);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load retail order requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 20000);
    window.addEventListener('focus', load);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="rounded-2xl bg-[#071324] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4ae5e]/35 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c77f]"><PackageCheck className="h-3.5 w-3.5" /> Retail marketplace</div>
            <h1 className="font-serif text-3xl sm:text-4xl">Retail order requests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Orders containing your approved listings appear here. Check payment and fulfillment status before dispatching; collect Cash on Delivery at the customer’s door.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3"><div className="text-2xl font-bold">{orders.length}</div><div className="text-[10px] text-slate-300">requests for your products</div></div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="text-base font-semibold text-slate-900">Incoming requests</h2><p className="mt-0.5 text-xs text-slate-500">Buyer and delivery details are shown only to sellers assigned to the order.</p></div>
          <button type="button" onClick={() => { setLoading(true); void load(); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
        </div>
        {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:mx-6">{error}</div>}
        {loading ? (
          <div className="flex h-52 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading order requests</div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-16 text-center"><PackageCheck className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No retail order requests yet</p><p className="mt-1 text-xs text-slate-400">Requests for your approved listings will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <article key={order.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-sm font-bold text-slate-900">Order {order.orderNumber}</h3><p className="mt-1 text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleString()} · {order.buyer.name}</p><p className="mt-0.5 text-[11px] text-slate-500">Buyer contact: {order.buyer.email}</p></div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${order.paymentStatus === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : order.paymentStatus === 'FAILED' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><Clock3 className="h-3 w-3" />{order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'FAILED' ? 'Payment failed' : order.paymentMethod === 'Cash on Delivery' ? 'Cash due on delivery' : 'Payment pending'}</span>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Method: <strong className="text-slate-700">{order.paymentMethod}</strong> · Status: <strong className="capitalize text-slate-700">{order.orderStatus.toLowerCase()}</strong></p>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(230px,0.55fr)]">
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {order.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3 text-xs">
                        <span className="font-medium text-slate-700">{item.title} <span className="text-slate-400">× {item.quantity}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</span></span>
                        <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between bg-slate-50 px-3.5 py-3 text-xs"><span className="font-semibold text-slate-600">Your item subtotal</span><span className="font-bold text-slate-900">${order.sellerSubtotal.toFixed(2)}</span></div>
                  </div>
                  {Boolean(order.discountAmount) && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[10px] leading-4 text-blue-900">Customer promotion {order.promotionCode ? `(${order.promotionCode})` : ''} reduced the order by ${order.discountAmount!.toFixed(2)}. Seller payout allocation is not configured yet.</p>}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Delivery information</h4><p className="mt-2 text-xs leading-5 text-slate-700">{order.shippingAddress.street}{order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}<br />{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zipCode].filter(Boolean).join(', ')}<br />{order.shippingAddress.country}</p>{order.shippingAddress.phoneNumber && <p className="mt-2 text-xs text-slate-600">Phone: {order.shippingAddress.phoneNumber}</p>}</div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-[10px] leading-5 text-blue-900"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />{order.paymentMethod === 'Cash on Delivery' ? 'Collect the listed order total at delivery and have the store admin record the cash collection.' : order.paymentStatus === 'PAID' ? 'Payment is confirmed. Follow the fulfillment status and tracking information below.' : 'Do not dispatch until card payment is confirmed.'}{order.trackingNumber && <> Tracking{order.trackingCarrier ? ` · ${order.trackingCarrier}` : ''}: <strong>{order.trackingNumber}</strong>{order.trackingUrl && <> · <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline">Track package</a></>}</>}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
