'use client';

import React, { useState } from 'react';
import { ArrowRight, LoaderCircle, Package, Search, ShieldCheck } from 'lucide-react';
import type { OrderItem, OrderStatus } from '@/types';
import type { StorefrontCryptoPayment } from '@/lib/storefrontCrypto';
import { CryptoPaymentInstructions } from '@/components/checkout/CryptoPaymentInstructions';

type BuyerOrder = {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  promotionCode?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  cryptoPayment?: StorefrontCryptoPayment;
  orderStatus: OrderStatus;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
};

export function OrderLookupPanel() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const params = new URLSearchParams({ scope: 'buyer', orderNumber, email });
      const response = await fetch(`/api/storefront-orders?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to find this order.');
      setOrder(result.order as BuyerOrder);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to find this order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e9e4da] bg-white shadow-sm">
      <div className="border-b border-[#eee9df] bg-gradient-to-r from-[#fcfbf8] to-white px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14263d] text-[#d4b16a]"><Package className="h-5 w-5" /></span>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#14263d]">Track an order</h2>
            <p className="mt-0.5 text-xs text-[#758092]">Use the order number from checkout and the email you entered.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(260px,0.8fr)_1.2fr]">
        <form onSubmit={lookup} className="space-y-4">
          <label className="block text-xs font-semibold text-[#33445b]">Order number
            <input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.toUpperCase())} placeholder="GAL-0123ABCD4567EF89" autoComplete="off" className="mt-1.5 block w-full rounded-lg border border-[#dfe3e8] px-3 py-2.5 font-mono text-xs uppercase text-[#14263d] outline-none transition focus:border-[#bd9957] focus:ring-2 focus:ring-[#bd9957]/15" />
          </label>
          <label className="block text-xs font-semibold text-[#33445b]">Checkout email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1.5 block w-full rounded-lg border border-[#dfe3e8] px-3 py-2.5 text-xs text-[#14263d] outline-none transition focus:border-[#bd9957] focus:ring-2 focus:ring-[#bd9957]/15" />
          </label>
          <button disabled={loading} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#14263d] px-4 text-xs font-bold text-white transition hover:bg-[#203a5b] disabled:cursor-wait disabled:opacity-60">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find my order <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">{error}</p>}
          <p className="flex items-start gap-2 text-[10px] leading-4 text-[#758092]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />Order details are matched with both values. This lookup does not display your delivery address.</p>
        </form>

        <div className="min-h-48 rounded-xl border border-dashed border-[#dfe3e8] bg-[#fbfaf7] p-4 sm:p-5">
          {!order ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <Package className="h-7 w-7 text-[#bd9957]" />
              <p className="mt-3 text-sm font-semibold text-[#33445b]">Your order details will appear here</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#758092]">New orders stay marked as payment pending until a payment provider and fulfilment process are connected.</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8e5de] pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a27d3b]">Order received</p><h3 className="mt-1 font-mono text-sm font-bold text-[#14263d]">{order.orderNumber}</h3><p className="mt-1 text-[10px] text-[#758092]">Placed {new Date(order.createdAt).toLocaleString()}</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${order.paymentStatus === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : order.paymentStatus === 'FAILED' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'FAILED' ? 'Payment failed' : order.paymentMethod === 'Cash on Delivery' ? 'Cash due on delivery' : 'Payment pending'}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-[#758092]"><span>Payment: <strong className="text-[#33445b]">{order.paymentMethod}</strong></span><span>Order status: <strong className="capitalize text-[#33445b]">{order.orderStatus.toLowerCase()}</strong></span></div>
              {order.cryptoPayment && order.paymentStatus === 'PENDING' && order.orderStatus === 'PENDING' && (
                <CryptoPaymentInstructions payment={order.cryptoPayment} orderNumber={order.orderNumber} />
              )}
              <div className="mt-4 space-y-3">
                {order.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex items-start justify-between gap-4 text-xs"><div className="min-w-0"><p className="font-semibold text-[#26374d]">{item.title}</p><p className="mt-0.5 text-[10px] text-[#758092]">Qty {item.quantity}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</p></div><span className="shrink-0 font-semibold text-[#26374d]">${(item.price * item.quantity).toFixed(2)}</span></div>)}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-[#e8e5de] pt-3 text-xs"><div className="flex justify-between"><span className="font-semibold text-[#758092]">Subtotal</span><span className="font-semibold text-[#33445b]">${(order.subtotalAmount ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toFixed(2)}</span></div>{Boolean(order.discountAmount) && <div className="flex justify-between text-emerald-700"><span>Promotion {order.promotionCode ? `(${order.promotionCode})` : ''}</span><span>−${order.discountAmount!.toFixed(2)}</span></div>}<div className="flex justify-between border-t border-[#e8e5de] pt-2"><span className="font-semibold text-[#758092]">Merchandise total</span><span className="font-bold text-[#14263d]">${order.totalAmount.toFixed(2)}</span></div></div>
              <div className="mt-3 rounded-lg border border-[#e8e5de] bg-white px-3 py-2.5 text-[10px] leading-5 text-[#758092]">{order.trackingNumber ? <p>Tracking{order.trackingCarrier ? ` · ${order.trackingCarrier}` : ''}: <strong className="font-mono text-[#33445b]">{order.trackingNumber}</strong>{order.trackingUrl && <> · <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="font-bold text-[#8b6a2f] underline">Track package</a></>}</p> : <p>Carrier tracking will appear here after the store ships the order. Shipping and tax are not included in this merchandise total.</p>}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
