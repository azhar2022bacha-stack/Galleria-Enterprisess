'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Edit3, ImagePlus, LoaderCircle, Package, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import type { StoreCategoryData } from '@/data/storeCategories';
import type { RetailListing } from '@/lib/retailListings';
import { AdminProductUpdateCsvPanel } from '@/components/admin/AdminProductUpdateCsvPanel';
import { processProductImageFile } from '@/lib/productImageProcessing';

const PAGE_SIZE = 20;

interface ProductUpdateForm {
  title: string;
  brand: string;
  model: string;
  sku: string;
  upc: string;
  description: string;
  price: string;
  stockQuantity: string;
  categorySlug: string;
  subcategorySlug: string;
  image: string;
  additionalImages: string[];
}

const EMPTY_FORM: ProductUpdateForm = {
  title: '', brand: '', model: '', sku: '', upc: '', description: '', price: '', stockQuantity: '0',
  categorySlug: '', subcategorySlug: '', image: '', additionalImages: [],
};

type PendingDeletion = { scope: 'one' | 'selected' | 'all'; ids: string[]; count: number; title?: string };

function isAdminCatalogProduct(product: RetailListing): boolean {
  return product.sellerSlug === 'official-store-catalog';
}

function productToForm(product: RetailListing, categories: StoreCategoryData[]): ProductUpdateForm {
  const current = product.pendingChanges ? { ...product, ...product.pendingChanges } : product;
  const category = categories.find((item) => item.slug === current.categorySlug || item.name === current.category);
  const subcategory = category?.subcategories.find((item) => item.slug === current.subcategorySlug || item.name === current.subcategory);
  return {
    title: current.title,
    brand: current.brand || '',
    model: current.model || '',
    sku: current.sku,
    upc: current.upc || '',
    description: current.description,
    price: String(current.price),
    stockQuantity: String(current.stockQuantity),
    categorySlug: category?.slug || '',
    subcategorySlug: subcategory?.slug || '',
    image: current.image,
    additionalImages: current.additionalImages || [],
  };
}

export function AdminProductUpdateView({ notify }: { notify?: (message: string) => void }) {
  const [categories, setCategories] = useState<StoreCategoryData[]>([]);
  const [listings, setListings] = useState<RetailListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<ProductUpdateForm>(EMPTY_FORM);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState('');
  const [imageProcessing, setImageProcessing] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set());
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/retail-listings?scope=admin', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load catalog products.');
      setListings(Array.isArray(result.listings) ? result.listings : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load catalog products.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/store-categories', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.categories)) throw new Error(result.error || 'Unable to load store categories.');
      setCategories(result.categories as StoreCategoryData[]);
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : 'Unable to load store categories.');
    }
  }, []);

  useEffect(() => { void loadListings(); void loadCategories(); }, [loadListings, loadCategories]);

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImageFile]);

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const current = listing.pendingChanges ? { ...listing, ...listing.pendingChanges } : listing;
      if (categoryFilter !== 'all' && current.categorySlug !== categoryFilter) return false;
      if (subcategoryFilter !== 'all' && current.subcategorySlug !== subcategoryFilter) return false;
      if (!normalized) return true;
      return [current.title, current.sku, current.upc || '', current.category, current.subcategory || '', current.brand || current.sellerName, current.model || '']
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [listings, query, categoryFilter, subcategoryFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const pageListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const adminCatalogCount = listings.filter(isAdminCatalogProduct).length;
  const selectablePageIds = pageListings.filter(isAdminCatalogProduct).map((listing) => listing.id);
  const allPageProductsSelected = selectablePageIds.length > 0 && selectablePageIds.every((id) => selectedProductIds.has(id));
  const filterCategory = categories.find((item) => item.slug === categoryFilter);
  const formCategory = categories.find((item) => item.slug === form.categorySlug);

  useEffect(() => setPage(1), [query, categoryFilter, subcategoryFilter]);

  const startEditing = (product: RetailListing) => {
    setEditingId(product.id);
    setForm(productToForm(product, categories));
    setSelectedImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setError('');
    setIsEditorOpen(true);
  };

  const startCreating = () => {
    setEditingId('');
    setForm({ ...EMPTY_FORM, categorySlug: categoryFilter === 'all' ? '' : categoryFilter, subcategorySlug: subcategoryFilter === 'all' ? '' : subcategoryFilter });
    setSelectedImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setError('');
    setIsEditorOpen(true);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const item = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        brand: form.brand,
        model: form.model,
        sku: form.sku,
        upc: form.upc,
        description: form.description,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categorySlug: form.categorySlug,
        subcategorySlug: form.subcategorySlug,
        image: selectedImageFile ? '/images/storefront/catalog-prod-01.png' : form.image,
        additionalImages: form.additionalImages,
      };
      if (selectedImageFile) {
        const imageData = new FormData();
        imageData.append('image', selectedImageFile);
        const imageResponse = await fetch('/api/admin/product-updates/image', { method: 'POST', body: imageData });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok || !imageResult.success || typeof imageResult.image !== 'string') {
          throw new Error(imageResult.error || 'Unable to upload the selected product image.');
        }
        item.image = imageResult.image;
        item.additionalImages = [...new Set([...form.additionalImages, ...(form.image.trim() ? [form.image.trim()] : [])])];
      }
      const response = await fetch('/api/admin/product-updates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', fileName: editingId ? 'Manual product update' : 'Manual product creation', items: [item] }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || result.errors?.[0]?.message || 'Unable to save this product.');
      setIsEditorOpen(false);
      setSelectedImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      setRevision((current) => current + 1);
      if (Array.isArray(result.products)) {
        const savedProducts = result.products as RetailListing[];
        const savedIds = new Set(savedProducts.map((product) => product.id));
        setListings((current) => [...savedProducts, ...current.filter((product) => !savedIds.has(product.id))]);
      } else {
        void loadListings();
      }
      notify?.(editingId ? 'Product updated and published.' : 'Product added and published.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this product.');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof ProductUpdateForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const askToDeleteProduct = (product: RetailListing) => {
    setDeleteError('');
    setPendingDeletion({ scope: 'one', ids: [product.id], count: 1, title: product.title });
  };

  const askToDeleteSelected = () => {
    const ids = [...selectedProductIds];
    if (!ids.length) return;
    setDeleteError('');
    setPendingDeletion({ scope: 'selected', ids, count: ids.length });
  };

  const askToDeleteAll = () => {
    if (!adminCatalogCount) return;
    setDeleteError('');
    setPendingDeletion({ scope: 'all', ids: [], count: adminCatalogCount });
  };

  const togglePageSelection = (checked: boolean) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      for (const id of selectablePageIds) checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleProductSelection = (id: string, checked: boolean) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const confirmDeletion = async () => {
    if (!pendingDeletion || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await fetch('/api/admin/product-updates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingDeletion.scope === 'all'
          ? { allOfficialCatalog: true }
          : { ids: pendingDeletion.ids }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to delete the selected products.');
      const deletedIds = new Set<string>(Array.isArray(result.deletedIds) ? result.deletedIds : pendingDeletion.ids);
      setListings((current) => current.filter((listing) => !deletedIds.has(listing.id)));
      setSelectedProductIds(new Set());
      setRevision((current) => current + 1);
      setPage((current) => {
        const removedFromResults = filteredListings.filter((listing) => deletedIds.has(listing.id)).length;
        const remaining = Math.max(0, filteredListings.length - removedFromResults);
        return Math.min(current, Math.max(1, Math.ceil(remaining / PAGE_SIZE)));
      });
      setPendingDeletion(null);
      notify?.(`${result.deletedCount || 0} product${result.deletedCount === 1 ? '' : 's'} permanently deleted.`);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Unable to delete the selected products.');
    } finally {
      setDeleting(false);
    }
  };

  const chooseImage = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      setError('Product images must be smaller than 5 MB.');
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    setError('');
    setSelectedImageFile(null);
    setImageProcessing(true);
    try {
      setSelectedImageFile(await processProductImageFile(file));
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Unable to prepare this transparent product image.');
    } finally {
      setImageProcessing(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const closeEditor = () => {
    if (saving) return;
    setIsEditorOpen(false);
    setSelectedImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="rounded-2xl bg-[#071324] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4ae5e]/35 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e6c77f]"><Package className="h-3.5 w-3.5" /> Catalog management</div>
            <h1 className="font-serif text-3xl sm:text-4xl">Product Update</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Add or edit products individually, or import a validated CSV. Published products appear in their selected storefront category.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3"><div className="text-2xl font-bold">{listings.length}</div><div className="text-[10px] text-slate-300">catalog listings</div></div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-base font-semibold text-slate-900">Catalog products</h2><p className="mt-0.5 text-xs text-slate-500">Filter by store category and search names, SKU, UPC, brand, or model.</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="relative block min-w-[190px] flex-1 sm:flex-none"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search catalog" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-slate-400 sm:w-52" /></label>
            <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setSubcategoryFilter('all'); }} aria-label="Filter by category" className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-slate-400"><option value="all">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
            <select value={subcategoryFilter} onChange={(event) => setSubcategoryFilter(event.target.value)} aria-label="Filter by subcategory" disabled={!filterCategory} className="max-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-slate-400 disabled:bg-slate-50"><option value="all">All subcategories</option>{filterCategory?.subcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
            <button type="button" onClick={() => void loadListings()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
            <button type="button" onClick={askToDeleteSelected} disabled={!selectedProductIds.size || deleting} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Delete selected{selectedProductIds.size ? ` (${selectedProductIds.size})` : ''}</button>
            <button type="button" onClick={askToDeleteAll} disabled={!adminCatalogCount || deleting} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Delete all ({adminCatalogCount})</button>
            <button type="button" onClick={startCreating} className="inline-flex items-center gap-1.5 rounded-lg bg-[#14263d] px-3 py-2 text-xs font-bold text-white hover:bg-[#203a5b]"><Plus className="h-3.5 w-3.5" />Add Product</button>
          </div>
        </div>

        {error && !isEditorOpen && <div role="alert" className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:mx-6"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading catalog</div>
        ) : pageListings.length === 0 ? (
          <div className="px-6 py-14 text-center"><Package className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">{query || categoryFilter !== 'all' ? 'No matching products' : 'No catalog products yet'}</p><p className="mt-1 text-xs text-slate-400">Add a product here or import a catalog CSV. New admin products are published to the selected category.</p><button type="button" onClick={startCreating} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14263d] px-4 py-2.5 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" />Add first product</button></div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5 text-[10px] text-slate-500 sm:px-6"><span>{filteredListings.length} result{filteredListings.length === 1 ? '' : 's'}</span><span>{categoryFilter === 'all' ? 'All store categories' : `${filterCategory?.name}${subcategoryFilter !== 'all' ? ` · ${filterCategory?.subcategories.find((item) => item.slug === subcategoryFilter)?.name || ''}` : ''}`}</span></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-10 px-4 py-3"><input type="checkbox" checked={allPageProductsSelected} disabled={!selectablePageIds.length} onChange={(event) => togglePageSelection(event.target.checked)} aria-label="Select all admin catalog products on this page" className="h-3.5 w-3.5 accent-rose-600 disabled:opacity-30" /></th><th className="px-5 py-3 sm:px-6">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right sm:px-6">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pageListings.map((item) => {
                    const shown = item.pendingChanges ? { ...item, ...item.pendingChanges } : item;
                    return <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">{isAdminCatalogProduct(item) && <input type="checkbox" checked={selectedProductIds.has(item.id)} onChange={(event) => toggleProductSelection(item.id, event.target.checked)} aria-label={`Select ${shown.title} for deletion`} className="h-3.5 w-3.5 accent-rose-600" />}</td>
                      <td className="px-5 py-3 sm:px-6"><div className="flex items-center gap-3"><img src={shown.image} alt="" className="h-10 w-10 rounded-lg border border-slate-100 bg-white object-contain p-1" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /><div className="min-w-0"><p className="max-w-[330px] truncate text-xs font-semibold text-slate-800">{shown.title}</p><p className="mt-0.5 text-[10px] text-slate-400">{shown.brand || shown.sellerName} · {shown.model || 'Model not set'} · SKU {shown.sku}</p></div></div></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{shown.category}<span className="block text-[10px] text-slate-400">{shown.subcategory}</span></td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">${shown.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{shown.stockQuantity}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.pendingChanges ? 'bg-amber-50 text-amber-700' : item.status === 'published' ? 'bg-emerald-50 text-emerald-700' : item.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{item.pendingChanges ? 'Update pending' : item.status}</span></td>
                      <td className="px-5 py-3 text-right sm:px-6"><div className="inline-flex items-center gap-1.5"><button type="button" onClick={() => startEditing(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-white"><Edit3 className="h-3.5 w-3.5" />Edit</button>{isAdminCatalogProduct(item) && <button type="button" onClick={() => askToDeleteProduct(item)} aria-label={`Delete ${shown.title}`} title="Permanently delete product" className="inline-flex items-center justify-center rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>}</div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && <div className="flex items-center justify-center gap-3 border-t border-slate-100 px-5 py-4"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40">Next</button></div>}
          </>
        )}
      </section>

      <AdminProductUpdateCsvPanel categories={categories} revision={revision} onImported={() => { setRevision((current) => current + 1); void loadListings(); }} />

      {pendingDeletion && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setPendingDeletion(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-products-title" aria-describedby="delete-products-warning" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 className="h-5 w-5" /></span><div><h2 id="delete-products-title" className="text-base font-semibold text-slate-900">Permanently delete products?</h2><p className="mt-1 text-xs leading-5 text-slate-500">{pendingDeletion.scope === 'one' ? `You are about to delete “${pendingDeletion.title}”.` : `You are about to permanently delete ${pendingDeletion.count} admin catalog product${pendingDeletion.count === 1 ? '' : 's'}.`}</p></div></div>
          <p id="delete-products-warning" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-800">This removes these products from the storefront and Product Update history. This action cannot be undone. Seller-submitted listings and built-in products will not be affected.</p>
          {deleteError && <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-rose-700">{deleteError}</div>}
          <footer className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPendingDeletion(null)} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" onClick={() => void confirmDeletion()} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{deleting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{deleting ? 'Deleting…' : `Permanently delete ${pendingDeletion.count}`}</button></footer>
        </section>
      </div>}

      {isEditorOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="product-update-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><div><h2 id="product-update-title" className="text-base font-semibold text-slate-900">{editingId ? 'Edit product' : 'Add product'}</h2><p className="mt-0.5 text-xs text-slate-500">{editingId ? 'Updates publish directly to the storefront catalog.' : 'New products publish to the chosen category after validation.'}</p></div><button type="button" onClick={closeEditor} disabled={saving} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></header>
          <form onSubmit={saveProduct} className="space-y-4 p-5">
            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-slate-700 sm:col-span-2">Product name<input required minLength={3} maxLength={120} value={form.title} onChange={(event) => updateForm('title', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">Brand<input required={!editingId} minLength={2} maxLength={100} value={form.brand} onChange={(event) => updateForm('brand', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">Model<input required={!editingId} maxLength={100} value={form.model} onChange={(event) => updateForm('model', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">SKU<input required maxLength={64} value={form.sku} onChange={(event) => updateForm('sku', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">UPC / GTIN (optional)<input inputMode="numeric" value={form.upc} onChange={(event) => updateForm('upc', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">Price (USD)<input required type="number" min="0.01" max="1000000" step="0.01" value={form.price} onChange={(event) => updateForm('price', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">Stock quantity<input required type="number" min="0" max="10000000" step="1" value={form.stockQuantity} onChange={(event) => updateForm('stockQuantity', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">Category<select required value={form.categorySlug} onChange={(event) => { const next = categories.find((item) => item.slug === event.target.value); setForm((current) => ({ ...current, categorySlug: event.target.value, subcategorySlug: next?.subcategories[0]?.slug || '' })); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-400"><option value="">Choose category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700">Subcategory<select required value={form.subcategorySlug} onChange={(event) => updateForm('subcategorySlug', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-400"><option value="">Choose subcategory</option>{formCategory?.subcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
              <div className="space-y-2 sm:col-span-2">
                <label className="block space-y-1.5 text-xs font-medium text-slate-700">Image URL<input required={!selectedImageFile} value={form.image} onChange={(event) => updateForm('image', event.target.value)} placeholder="Transparent image URL or /uploads/product.png" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-xs font-semibold text-slate-700">Remove background from uploaded image</p><p className="mt-1 text-[10px] text-slate-500">Plain light backgrounds are removed automatically · Uploads become tightly cropped transparent PNGs · JPG, PNG, or WebP · up to 5 MB</p></div>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose product image" onChange={(event) => chooseImage(event.target.files?.[0])} />
                    <button type="button" disabled={imageProcessing || saving} onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">{imageProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{imageProcessing ? 'Removing background…' : 'Choose from gallery'}</button>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-slate-500">Pasted image URLs must already have a transparent background. Uneven, dark, or colored upload backgrounds are rejected.</p>
                  {selectedImagePreview && <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
                    <img src={selectedImagePreview} alt="Selected gallery image preview" className="h-20 w-20 rounded-md border border-slate-100 bg-white object-contain p-1" />
                    <div className="min-w-0"><p className="text-xs font-medium text-slate-700">Background removed · transparent PNG</p><p className="mt-1 max-w-[250px] break-all text-[10px] text-slate-400">{selectedImageFile?.name} · {((selectedImageFile?.size || 0) / 1024).toFixed(0)} KB</p></div>
                  </div>}
                </div>
              </div>
              <label className="space-y-1.5 text-xs font-medium text-slate-700 sm:col-span-2">Product description<textarea required minLength={15} maxLength={3000} rows={4} value={form.description} onChange={(event) => updateForm('description', event.target.value)} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-slate-400" /></label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setIsEditorOpen(false)} disabled={saving || imageProcessing} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving || imageProcessing} className="inline-flex items-center gap-2 rounded-lg bg-[#14263d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#203a5b] disabled:opacity-50">{(saving || imageProcessing) && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{imageProcessing ? 'Preparing image…' : saving ? 'Saving…' : editingId ? 'Save product' : 'Add and publish product'}</button></footer>
          </form>
        </section>
      </div>}
    </div>
  );
}
