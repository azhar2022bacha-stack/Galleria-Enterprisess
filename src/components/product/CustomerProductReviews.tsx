'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, ShieldCheck, Star } from 'lucide-react';
import { ProductRating } from './ProductRating';
type PublicReview = {
  id: string;
  productId: string;
  publicName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  purchaseMatched: boolean;
};
type ReviewSummary = { productId: string; count: number; average: number };

export function CustomerProductReviews({
  productId,
  productTitle,
  onSummary,
}: {
  productId: string;
  productTitle: string;
  onSummary: (summary: ReviewSummary) => void;
}) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(5);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ scope: 'public', productId });
      const response = await fetch(`/api/product-reviews?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load reviews.');
      const nextReviews = Array.isArray(result.reviews) ? result.reviews : [];
      setReviews(nextReviews);
      setRatingAverage(Number(result.ratingAverage) || 0);
      onSummary({ productId, count: Number(result.count) || 0, average: Number(result.ratingAverage) || 0 });
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [onSummary, productId]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/product-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderNumber, email, rating, title, body }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to submit your review.');
      setMessage('Thank you. Your review is linked to the order and is waiting for admin moderation.');
      setOrderNumber('');
      setTitle('');
      setBody('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit your review.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
      <section aria-label="Customer reviews" className="space-y-4">
        <div className="flex items-end justify-between border-b border-[#e9e4da] pb-3">
          <div><h3 className="font-serif text-xl text-[#14263d]">Customer feedback</h3><p className="mt-1 text-xs text-[#758092]">Reviews are published after moderation.</p></div>
          {reviews.length > 0 && !loadError && <ProductRating productId={productId} rating={ratingAverage} count={reviews.length} />}
        </div>
        {loading ? <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#758092]"><LoaderCircle className="h-4 w-4 animate-spin" />Loading reviews</div> : loadError ? <div role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800">Unable to load reviews. <button type="button" onClick={() => void loadReviews()} className="font-semibold underline">Try again</button></div> : reviews.length === 0 ? <div className="rounded-xl border border-dashed border-[#e0ddd6] bg-white/70 px-4 py-10 text-center"><Star className="mx-auto h-6 w-6 text-[#bd9957]" /><p className="mt-2 text-sm font-semibold text-[#33445b]">Share your experience</p><p className="mt-1 text-xs text-[#758092]">Be the first customer to share feedback on this product.</p></div> : reviews.map((review) => <article key={review.id} className="rounded-xl border border-[#e9e4da] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#24364d]">{review.publicName}</p><p className="mt-0.5 text-[10px] text-[#758092]">{new Date(review.createdAt).toLocaleDateString()}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800"><ShieldCheck className="h-3 w-3" />Order matched</span></div><div className="mt-3 flex gap-0.5 text-[#bd9957]" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? 'fill-current' : ''}`} />)}</div><h4 className="mt-2 text-sm font-semibold text-[#24364d]">{review.title}</h4><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#687586]">{review.body}</p></article>)}
      </section>

      <section className="h-fit rounded-2xl border border-[#e9e4da] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a27d3b]">Share your experience</p><h3 className="mt-1 font-serif text-xl text-[#14263d]">Review this product</h3><p className="mt-1 text-xs leading-5 text-[#758092]">Submit the order number and email used at checkout. The product must be in that order.</p></div>
        <form onSubmit={submit} className="space-y-3.5">
          <fieldset><legend className="mb-1.5 text-xs font-semibold text-[#33445b]">Your rating</legend><div className="flex gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value > 1 ? 's' : ''}`} onClick={() => setRating(value)} className="rounded p-1 text-[#bd9957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bd9957]"><Star className={`h-5 w-5 ${value <= rating ? 'fill-current' : ''}`} /></button>)}</div></fieldset>
          <label className="block text-xs font-semibold text-[#33445b]">Order number<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.toUpperCase())} placeholder="GAL-..." autoComplete="off" className="mt-1 block w-full rounded-lg border border-[#dfe3e8] px-3 py-2.5 font-mono text-xs uppercase outline-none focus:border-[#bd9957]" /></label>
          <label className="block text-xs font-semibold text-[#33445b]">Checkout email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1 block w-full rounded-lg border border-[#dfe3e8] px-3 py-2.5 text-xs outline-none focus:border-[#bd9957]" /></label>
          <label className="block text-xs font-semibold text-[#33445b]">Review title<input required minLength={3} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`How was the ${productTitle}?`} className="mt-1 block w-full rounded-lg border border-[#dfe3e8] px-3 py-2.5 text-xs outline-none focus:border-[#bd9957]" /></label>
          <label className="block text-xs font-semibold text-[#33445b]">Your review<textarea required minLength={10} maxLength={1500} rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share useful details with other shoppers…" className="mt-1 block w-full resize-y rounded-lg border border-[#dfe3e8] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#bd9957]" /></label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">{error}</p>}
          {message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">{message}</p>}
          <button disabled={sending} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#14263d] px-4 text-xs font-bold text-white transition hover:bg-[#203a5b] disabled:opacity-60">{sending && <LoaderCircle className="h-4 w-4 animate-spin" />}Submit for review</button>
        </form>
      </section>
    </div>
  );
}
