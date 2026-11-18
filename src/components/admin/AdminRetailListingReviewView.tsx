'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, LoaderCircle, PackageCheck, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { RetailListing } from '@/lib/retailListings';

export function AdminRetailListingReviewView({ notify }: { notify?: (message: string) => void }) {
  const [listings, setListings] = useState<RetailListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/retail-listings?scope=admin', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load retail listings.');
      setListings(Array.isArray(result.listings) ? result.listings : []);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load retail listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pending = useMemo(() => listings.filter((item) => item.status === 'pending' || Boolean(item.pendingChanges)), [listings]);

  const decide = async (item: RetailListing, decision: 'published' | 'rejected') => {
    const rejectionNote = decision === 'rejected'
      ? window.prompt('What should the seller revise?', 'Please review the product details and submit again.')
      : undefined;
    if (decision === 'rejected' && rejectionNote === null) return;
    setBusyId(item.id);
    setError('');
    try {
      const response = await fetch('/api/retail-listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, decision, rejectionNote }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save review decision.');
      setListings((current) => current.map((listing) => listing.id === item.id ? result.listing : listing));
      notify?.(decision === 'published' ? `${item.title} approved and published.` : `${item.title} rejected with revision feedback.`);
    } catch (decisionError: any) {
      setError(decisionError.message || 'Unable to save review decision.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="rounded-2xl bg-[#071324] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4ae5e]/35 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c77f]"><ShieldCheck className="h-3.5 w-3.5" /> Marketplace governance</div>
            <h1 className="font-serif text-3xl sm:text-4xl">Retail listing review</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review seller-created customer listings. Approved products can enter the public catalog; rejected products stay private and return to the seller for edits.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3"><div className="text-2xl font-bold">{pending.length}</div><div className="text-[10px] text-slate-300">awaiting review</div></div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="text-base font-semibold text-slate-900">Submission queue</h2><p className="mt-0.5 text-xs text-slate-500">{pending.length} pending listing{pending.length === 1 ? '' : 's'}</p></div>
          <button type="button" onClick={() => { setLoading(true); void load(); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
        </div>
        {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:mx-6">{error}</div>}
        {loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading review queue</div>
        ) : pending.length === 0 ? (
          <div className="px-6 py-16 text-center"><PackageCheck className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Review queue is clear</p><p className="mt-1 text-xs text-slate-400">New retail submissions will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((item) => {
              const reviewItem: RetailListing = item.pendingChanges ? { ...item, ...item.pendingChanges } as RetailListing : item;
              return (
              <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[96px_minmax(0,1fr)_220px] lg:items-start sm:p-6">
                <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-100 bg-slate-50"><img src={reviewItem.image} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold text-slate-900">{reviewItem.title}</h3><span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800"><Clock3 className="h-3 w-3" />{item.pendingChanges ? 'Update review' : 'Pending'}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{reviewItem.category} · SKU {reviewItem.sku} · {reviewItem.stockQuantity} units in stock · Submitted {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{reviewItem.description}</p>
                  {(reviewItem.colors?.length || reviewItem.sizes?.length) ? <p className="mt-2 text-xs text-slate-600"><span className="font-semibold">Variants:</span> {reviewItem.colors?.length ? `Colors: ${reviewItem.colors.join(', ')}` : ''}{reviewItem.colors?.length && reviewItem.sizes?.length ? ' · ' : ''}{reviewItem.sizes?.length ? `Sizes: ${reviewItem.sizes.join(', ')}` : ''}</p> : null}
                  <p className="mt-3 text-xs text-slate-500">Shop: <span className="font-semibold text-slate-700">{reviewItem.sellerName}</span> <span className="text-slate-400">({item.sellerEmail})</span></p>
                </div>
                <div className="flex flex-col gap-2 lg:pt-1">
                  <div className="mb-1 text-xl font-bold text-slate-900">${reviewItem.price.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span></div>
                  <button type="button" disabled={busyId === item.id} onClick={() => void decide(item, 'published')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" />Approve and publish</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => void decide(item, 'rejected')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X className="h-4 w-4" />Reject with revision note</button>
                  {busyId === item.id && <span className="text-center text-[10px] text-slate-400">Saving decision…</span>}
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
