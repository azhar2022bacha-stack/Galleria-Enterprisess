'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, ImagePlus, LoaderCircle, PackageCheck, Plus, RotateCcw, Send, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { CATEGORIES } from '@/services/mockData';
import type { StoreCategoryData } from '@/data/storeCategories';
import type { RetailListing } from '@/lib/retailListings';
import { processProductImageFile } from '@/lib/productImageProcessing';

type Draft = { id?: string; title: string; sellerName: string; description: string; price: string; category: string; subcategory: string; stockQuantity: string; sku: string; image: string; colors: string; sizes: string };
const EMPTY_DRAFT: Draft = { title: '', sellerName: '', description: '', price: '', category: '', subcategory: '', stockQuantity: '1', sku: '', image: '', colors: '', sizes: '' };

const STATUS_STYLE = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function SellerRetailListingsPanel() {
  const [categories, setCategories] = useState<StoreCategoryData[]>([]);
  const [listings, setListings] = useState<RetailListing[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPublished, setEditingPublished] = useState(false);
  const [stockSavingId, setStockSavingId] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedCategory = categories.find((category) => category.slug === draft.category);

  const loadListings = useCallback(async () => {
    try {
      const response = await fetch('/api/retail-listings?scope=seller', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load retail listings.');
      setListings(Array.isArray(result.listings) ? result.listings : []);
      setStockDrafts((current) => {
        const next = { ...current };
        for (const item of (Array.isArray(result.listings) ? result.listings : []) as RetailListing[]) {
          if (!(item.id in next)) next[item.id] = String(item.stockQuantity);
        }
        return next;
      });
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load retail listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadListings(); }, [loadListings]);

  useEffect(() => {
    let active = true;
    fetch('/api/store-categories', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load store categories.')))
      .then((result) => { if (active && Array.isArray(result.categories)) setCategories(result.categories); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => ({
    all: listings.length,
    pending: listings.filter((item) => item.status === 'pending' || Boolean(item.pendingChanges)).length,
    published: listings.filter((item) => item.status === 'published').length,
    rejected: listings.filter((item) => item.status === 'rejected').length,
  }), [listings]);

  const updateDraft = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setError('');
    setMessage('');
    try {
      const transparentFile = await processProductImageFile(file);
      const payload = new FormData();
      payload.append('image', transparentFile);
      const response = await fetch('/api/retail-listings/image', { method: 'POST', body: payload });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to upload this photo.');
      updateDraft('image', result.image);
      setMessage('Background removed and transparent product photo uploaded. It will be reviewed with your listing.');
    } catch (uploadError: any) {
      setError(uploadError.message || 'Unable to upload this photo.');
    } finally {
      setImageUploading(false);
      input.value = '';
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/retail-listings', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          category: selectedCategory?.name || '',
          categorySlug: selectedCategory?.slug || '',
          subcategory: selectedCategory?.subcategories.find((item) => item.slug === draft.subcategory)?.name || '',
          subcategorySlug: draft.subcategory,
          price: Number(draft.price),
          stockQuantity: Number(draft.stockQuantity),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to submit this listing.');
      setDraft(EMPTY_DRAFT);
      setEditingPublished(false);
      setMessage(editingPublished
        ? 'Listing changes submitted for admin review. The current published version stays live until approved.'
        : 'Listing submitted for admin review. It will stay off the public store until approved.');
      await loadListings();
    } catch (submitError: any) {
      setError(submitError.message || 'Unable to submit this listing.');
    } finally {
      setSaving(false);
    }
  };

  const editListing = (item: RetailListing) => {
    const listing = item.pendingChanges ? { ...item, ...item.pendingChanges } as RetailListing : item;
    const legacySlug = CATEGORIES.find((category) => category.name === listing.category)?.slug;
    const legacyCategoryMap: Record<string, string> = {
      'womens-fashion': 'fashion-clothing',
      'mens-fashion': 'fashion-clothing',
      shoes: 'shoes-footwear',
      'bags-accessories': 'bags-travel-luggage',
      electronics: 'tv-audio-video',
      'home-living': 'home-living',
      'beauty-health': 'beauty-personal-care',
      'toys-games': 'kids-toys-games',
      'sports-fitness': 'sports-outdoor',
    };
    const selected = categories.find((category) => category.slug === listing.categorySlug || category.name === listing.category)
      || categories.find((category) => category.slug === legacyCategoryMap[legacySlug || ''] || category.slug === legacySlug);
    const selectedSubcategory = selected?.subcategories.find((subcategory) => subcategory.slug === listing.subcategorySlug || subcategory.name === listing.subcategory);
    setDraft({ id: item.id, title: listing.title, sellerName: listing.sellerName, description: listing.description, price: String(listing.price), category: selected?.slug || '', subcategory: selectedSubcategory?.slug || '', stockQuantity: String(listing.stockQuantity), sku: listing.sku, image: listing.image, colors: listing.colors?.join(', ') || '', sizes: listing.sizes?.join(', ') || '' });
    setEditingPublished(item.status === 'published');
    setMessage(item.status === 'published'
      ? 'The current listing stays live while your updated details wait for admin review.'
      : 'Update the listing details below, then resubmit it for review.');
    setError('');
    document.getElementById('retail-listing-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveStock = async (item: RetailListing) => {
    const stockValue = stockDrafts[item.id] ?? String(item.stockQuantity);
    const stockQuantity = Number(stockValue);
    if (!stockValue.trim() || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError('Stock must be a whole number of 0 or more.');
      return;
    }
    setStockSavingId(item.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/retail-listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-stock', id: item.id, stockQuantity }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update stock.');
      setListings((current) => current.map((listing) => listing.id === item.id ? result.listing : listing));
      setMessage(`Stock updated for ${item.title}.`);
    } catch (stockError: any) {
      setError(stockError.message || 'Unable to update stock.');
    } finally {
      setStockSavingId('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="overflow-hidden rounded-2xl bg-[#071324] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4ae5e]/35 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c77f]"><ShieldCheck className="h-3.5 w-3.5" /> Retail marketplace</div>
            <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">Retail listings</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Create customer-ready product listings for the public store. Each new listing is reviewed by an admin before it can be published.</p>
          </div>
          <div className="grid min-w-[220px] grid-cols-3 gap-2">
            {[['Total', counts.all], ['In review', counts.pending], ['Live', counts.published]].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center"><div className="text-xl font-bold">{value}</div><div className="mt-1 text-[10px] text-slate-300">{label}</div></div>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="rounded-2xl border border-[#e8e2d6] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Listing details</p><h2 className="mt-1 text-xl font-semibold text-[#14263d]">{draft.id ? editingPublished ? 'Edit published listing' : 'Revise and resubmit' : 'Add a retail product'}</h2></div>
            {draft.id && <button type="button" onClick={() => { setDraft(EMPTY_DRAFT); setEditingPublished(false); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Cancel edit</button>}
          </div>
          <form id="retail-listing-form" onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Product name<input required minLength={3} maxLength={120} value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} placeholder="e.g. Handcrafted leather tote" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none transition focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /></label>
            <label className="block text-xs font-semibold text-slate-700">Public shop name<input required minLength={2} maxLength={80} value={draft.sellerName} onChange={(e) => updateDraft('sellerName', e.target.value)} placeholder="The name customers will see" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none transition focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /><span className="mt-1 block text-[10px] font-normal text-slate-400">This appears on your public store page. Do not enter an email address.</span></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700">Retail price (USD)<input required type="number" min="0.01" step="0.01" value={draft.price} onChange={(e) => updateDraft('price', e.target.value)} placeholder="0.00" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /><span className="mt-1 block text-[10px] font-normal text-slate-400">Enter your current selling price; it is not independently market-verified.</span></label>
              <label className="block text-xs font-semibold text-slate-700">Main category<select required value={draft.category} onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value, subcategory: '' }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10"><option value="">Choose a department</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
              <label className="block text-xs font-semibold text-slate-700">Subcategory<select required disabled={!selectedCategory} value={draft.subcategory} onChange={(e) => updateDraft('subcategory', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10 disabled:bg-slate-50 disabled:text-slate-400"><option value="">{selectedCategory ? 'Choose a collection' : 'Choose a department first'}</option>{selectedCategory?.subcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
              <label className="block text-xs font-semibold text-slate-700">Available stock<input required type="number" min="0" step="1" value={draft.stockQuantity} onChange={(e) => updateDraft('stockQuantity', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /></label>
              <label className="block text-xs font-semibold text-slate-700">SKU <span className="font-normal text-slate-400">(optional)</span><input value={draft.sku} onChange={(e) => updateDraft('sku', e.target.value)} maxLength={64} placeholder="Assigned if left blank" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /></label>
              <label className="block text-xs font-semibold text-slate-700">Colors <span className="font-normal text-slate-400">(optional)</span><input value={draft.colors} onChange={(e) => updateDraft('colors', e.target.value)} maxLength={1000} placeholder="Black, Ivory, Navy" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /></label>
              <label className="block text-xs font-semibold text-slate-700">Sizes <span className="font-normal text-slate-400">(optional)</span><input value={draft.sizes} onChange={(e) => updateDraft('sizes', e.target.value)} maxLength={1000} placeholder="XS, S, M, L" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /></label>
            </div>
            <div className="block text-xs font-semibold text-slate-700"><span>Product photo</span><div className="mt-1.5 flex flex-col gap-2 sm:flex-row"><div className="relative min-w-0 flex-1"><ImagePlus className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Product image URL" value={draft.image} onChange={(e) => updateDraft('image', e.target.value)} placeholder="Paste a transparent image URL or local path" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3.5 text-sm font-normal outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"><UploadCloud className="h-4 w-4 text-[#a77e43]" />{imageUploading ? 'Removing background…' : 'Upload photo'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={imageUploading} onChange={uploadImage} className="sr-only" /></label></div><span className="mt-1 block text-[10px] font-normal text-slate-400">Uploaded photos are automatically cropped and saved as transparent PNGs. Plain white/light backgrounds can be removed; busy, dark, or colored backgrounds are rejected · PNG, JPG, or WebP · maximum 5 MB. Image URLs must already be transparent.</span>{draft.image && <div className="mt-3 h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white p-1"><img src={draft.image} alt="Product photo preview" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /></div>}</div>
            <label className="block text-xs font-semibold text-slate-700">Description<textarea required minLength={15} maxLength={3000} rows={5} value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} placeholder="Describe materials, dimensions, care, and what customers receive." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal leading-6 outline-none focus:border-[#b99152] focus:ring-4 focus:ring-[#b99152]/10" /><span className="mt-1 block text-right text-[10px] font-normal text-slate-400">{draft.description.length}/3000</span></label>
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800">{message}</p>}
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c1b33] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#17304f] disabled:cursor-wait disabled:opacity-60"><span>{saving ? 'Submitting…' : draft.id ? 'Submit changes for review' : 'Submit listing for review'}</span>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
            <p className="text-center text-[10px] leading-5 text-slate-400">Submitting confirms the price is retail pricing. Shipping, tax, and payment terms are still awaiting store setup.</p>
          </form>
        </div>

        <div className="rounded-2xl border border-[#e8e2d6] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Your catalog</p><h2 className="mt-1 text-xl font-semibold text-[#14263d]">Listing status</h2></div><button type="button" onClick={() => { setLoading(true); void loadListings(); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />Refresh</button></div>
          {loading ? <div className="flex h-48 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading listings</div> : listings.length === 0 ? <div className="px-6 py-16 text-center"><PackageCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No retail listings yet</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">Submit your first product. It will remain private until an admin approves it.</p></div> : (
            <div className="max-h-[840px] divide-y divide-slate-100 overflow-y-auto">
              {listings.map((item) => <article key={item.id} className="flex gap-3.5 p-4 sm:p-5"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-1"><img src={item.image} alt="" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-900">{item.title}</h3><p className="mt-0.5 text-[11px] text-slate-500">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ''} · ${item.price.toFixed(2)} · {item.stockQuantity} in stock</p></div><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${item.pendingChanges ? STATUS_STYLE.pending : STATUS_STYLE[item.status]}`}>{item.pendingChanges ? <Clock3 className="h-3 w-3" /> : item.status === 'pending' ? <Clock3 className="h-3 w-3" /> : item.status === 'published' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{item.pendingChanges ? 'Update in review' : item.status}</span></div>{item.status === 'published' && <div className="mt-3 flex flex-wrap items-end gap-2"><label className="text-[10px] font-semibold text-slate-500">Live stock<input aria-label={`Available stock for ${item.title}`} type="number" min="0" step="1" value={stockDrafts[item.id] ?? String(item.stockQuantity)} onChange={(event) => setStockDrafts((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 block w-28 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-[#b99152]" /></label><button type="button" disabled={stockSavingId === item.id || Number(stockDrafts[item.id] ?? item.stockQuantity) === item.stockQuantity} onClick={() => void saveStock(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0c1b33] px-3 py-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{stockSavingId === item.id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Save stock</button><button type="button" onClick={() => editListing(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Edit details</button></div>}{item.rejectionNote && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] leading-5 text-rose-800"><strong>{item.status === 'published' ? 'Latest update rejected:' : 'Review note:'}</strong> {item.rejectionNote}{item.status === 'rejected' && <button type="button" onClick={() => editListing(item)} className="ml-2 inline-flex items-center gap-1 font-bold underline"><Plus className="h-3 w-3" />Edit and resubmit</button>}{item.status === 'published' && <button type="button" onClick={() => editListing(item)} className="ml-2 inline-flex items-center gap-1 font-bold underline"><Plus className="h-3 w-3" />Edit and try again</button>}</div>}{item.status === 'rejected' && !item.rejectionNote && <button type="button" onClick={() => editListing(item)} className="mt-3 inline-flex items-center gap-1 font-bold text-[11px] text-slate-600 underline"><Plus className="h-3 w-3" />Edit and resubmit</button>}</div></article>)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
