'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, LoaderCircle, PackageCheck, RefreshCw } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { OrderItem, OrderStatus } from '@/types';

type ConfirmedOrder = {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  promotionCode?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'PAID';
  orderStatus: OrderStatus;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
};

export function CheckoutCompletion({ sessionId }: { sessionId: string }) {
  const { clearCart } = useCart();
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const confirm = useCallback(async () => {
    if (!sessionId) {
      setError('Payment session details are missing. Look up the order with your order number and checkout email.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/storefront-payments/confirm?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'We could not verify the payment yet.');
      setOrder(result.order as ConfirmedOrder);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'We could not verify the payment yet.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { void confirm(); }, [confirm]);
  useEffect(() => { if (order?.paymentStatus === 'PAID') clearCart(); }, [clearCart, order]);

  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-[#fcfbf9] px-4 py-14">
      <section className="w-full max-w-2xl rounded-2xl border border-[#e9e4da] bg-white p-6 shadow-sm sm:p-9">
        {loading ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><LoaderCircle className="h-9 w-9 animate-spin text-[#bd9957]" /><h1 className="mt-4 font-serif text-2xl text-[#14263d]">Confirming your payment</h1><p className="mt-2 text-sm text-[#758092]">Please keep this page open while we check with the payment provider.</p></div> : order ? (
          <div>
            <div className="text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Card payment confirmed</p><h1 className="mt-2 font-serif text-3xl text-[#14263d]">Order placed</h1><p className="mt-2 text-sm text-[#687586]">Order <span className="font-mono font-bold text-[#14263d]">{order.orderNumber}</span> is being prepared.</p></div>
            <div className="my-6 rounded-xl border border-[#e9e4da] bg-[#fbfaf7] p-4"><div className="space-y-2.5">{order.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex justify-between gap-3 text-xs"><span className="min-w-0 text-[#33445b]">{item.title} × {item.quantity}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</span><span className="shrink-0 font-semibold text-[#14263d]">${(item.price * item.quantity).toFixed(2)}</span></div>)}</div><div className="mt-4 space-y-1.5 border-t border-[#e4dfd5] pt-3 text-xs"><div className="flex justify-between text-[#687586]"><span>Subtotal</span><span>${order.subtotalAmount.toFixed(2)}</span></div>{Boolean(order.discountAmount) && <div className="flex justify-between text-emerald-700"><span>Promotion {order.promotionCode ? `(${order.promotionCode})` : ''}</span><span>−${order.discountAmount.toFixed(2)}</span></div>}<div className="flex justify-between border-t border-[#e4dfd5] pt-2 font-bold text-[#14263d]"><span>Merchandise total</span><span>${order.totalAmount.toFixed(2)}</span></div></div></div>
            <p className="text-center text-[10px] leading-5 text-[#758092]">Shipping and tax were not calculated by this store preview. Carrier tracking will appear on your order lookup after the store adds it.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/account" className="rounded-lg bg-[#14263d] px-5 py-3 text-xs font-bold text-white hover:bg-[#203a5b]">Track this order</Link><Link href="/shop" className="rounded-lg border border-[#dfe3e8] px-5 py-3 text-xs font-bold text-[#33445b] hover:bg-slate-50">Continue shopping</Link></div>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center text-center"><CircleAlert className="h-10 w-10 text-amber-600" /><h1 className="mt-4 font-serif text-2xl text-[#14263d]">We couldn’t confirm this payment</h1><p role="alert" className="mt-2 max-w-md text-sm leading-6 text-[#687586]">{error}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => void confirm()} className="inline-flex items-center gap-2 rounded-lg bg-[#14263d] px-4 py-2.5 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" />Try again</button><Link href="/account" className="rounded-lg border border-[#dfe3e8] px-4 py-2.5 text-xs font-bold text-[#33445b]">Look up order</Link></div></div>
        )}
      </section>
    </main>
  );
}
