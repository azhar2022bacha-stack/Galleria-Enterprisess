'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, LoaderCircle, MessageSquareText, RefreshCw, ShieldCheck, Star, EyeOff } from 'lucide-react';
import type { ProductReviewRecord } from '@/lib/productReviews';

interface AdminReviewsViewProps {
  notify?: (msg: string) => void;
}

export function AdminReviewsView({ notify }: AdminReviewsViewProps) {
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/product-reviews?scope=admin', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load product reviews.');
      setReviews(Array.isArray(result.reviews) ? result.reviews : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load product reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => ({
    pending: reviews.filter((review) => review.status === 'pending').length,
    approved: reviews.filter((review) => review.status === 'approved').length,
    hidden: reviews.filter((review) => review.status === 'hidden').length,
  }), [reviews]);

  const moderate = async (review: ProductReviewRecord, decision: 'approved' | 'hidden') => {
    setBusyId(review.id);
    setError('');
    try {
      const response = await fetch('/api/product-reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, decision }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update this review.');
      setReviews((current) => current.map((item) => item.id === review.id ? result.review : item));
      notify?.(decision === 'approved' ? 'Product review approved and published.' : 'Product review hidden from shoppers.');
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : 'Unable to update this review.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="rounded-2xl bg-[#071324] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4ae5e]/35 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c77f]"><ShieldCheck className="h-3.5 w-3.5" /> Verified checkout match</div><h1 className="font-serif text-3xl sm:text-4xl">Product reviews</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Reviews are linked to an order and stay private until an admin approves them.</p></div>
          <div className="grid grid-cols-3 gap-2 text-center">{[['Pending', summary.pending], ['Published', summary.approved], ['Hidden', summary.hidden]].map(([label, count]) => <div key={label} className="min-w-20 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2"><div className="text-xl font-bold">{count}</div><div className="text-[9px] text-slate-300">{label}</div></div>)}</div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="text-base font-semibold text-slate-900">Moderation queue</h2><p className="mt-0.5 text-xs text-slate-500">Buyer email and order number are visible to admins for matching.</p></div><button type="button" onClick={() => { setLoading(true); void load(); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
        {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:mx-6">{error}</div>}
        {loading ? <div className="flex h-48 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading reviews</div> : reviews.length === 0 ? <div className="px-6 py-16 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No customer reviews yet</p><p className="mt-1 text-xs text-slate-400">Order linked submissions will appear here for moderation.</p></div> : <div className="divide-y divide-slate-100">{reviews.map((review) => <article key={review.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start sm:p-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{review.productTitle}</h3><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${review.status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : review.status === 'hidden' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{review.status}</span></div><div className="mt-2 flex items-center gap-2"><div className="flex text-amber-500" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? 'fill-current' : ''}`} />)}</div><span className="text-xs font-semibold text-slate-800">{review.title}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.body}</p><p className="mt-3 text-[10px] text-slate-500">{review.customerName} · {review.buyerEmail} · Order {review.orderNumber} · {new Date(review.createdAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2 lg:justify-end">{review.status !== 'approved' && <button disabled={busyId === review.id} type="button" onClick={() => void moderate(review, 'approved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-3.5 w-3.5" />Approve</button>}{review.status !== 'hidden' && <button disabled={busyId === review.id} type="button" onClick={() => void moderate(review, 'hidden')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" />Hide</button>}{busyId === review.id && <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" />}</div></article>)}</div>}
      </section>
    </div>
  );
}
