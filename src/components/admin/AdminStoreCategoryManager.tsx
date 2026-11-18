'use client';

import React, { useState } from 'react';
import { ChevronDown, FolderPlus, LoaderCircle, Trash2 } from 'lucide-react';
import type { StoreCategoryData } from '@/data/storeCategories';

type CategoryDeletionTarget = {
  kind: 'category' | 'subcategory';
  categorySlug: string;
  subcategorySlug?: string;
  categoryName: string;
  subcategoryName?: string;
};

export function AdminStoreCategoryManager({
  categories,
  onCategoriesUpdated,
}: {
  categories: StoreCategoryData[];
  onCategoriesUpdated: (categories: StoreCategoryData[]) => void;
}) {
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [parentCategorySlug, setParentCategorySlug] = useState('');
  const [saving, setSaving] = useState<'category' | 'subcategory' | ''>('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDeletionTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const selectedParentSlug = parentCategorySlug;

  const addTaxonomy = async (kind: 'category' | 'subcategory') => {
    const name = kind === 'category' ? categoryName.trim() : subcategoryName.trim();
    if (!name) {
      setError(kind === 'category' ? 'Enter a main category name.' : 'Enter a subcategory name.');
      return;
    }
    if (kind === 'subcategory' && !selectedParentSlug) {
      setError('Add a main category before adding a subcategory.');
      return;
    }
    setSaving(kind);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/store-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name, ...(kind === 'subcategory' ? { categorySlug: selectedParentSlug } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.categories)) {
        throw new Error(result.error || 'Unable to save this category.');
      }
      const updatedCategories = result.categories as StoreCategoryData[];
      onCategoriesUpdated(updatedCategories);
      if (kind === 'category') {
        setCategoryName('');
        const normalizedName = name.replace(/\s+/g, ' ').toLowerCase();
        const createdCategory = updatedCategories.find((category) => category.name.replace(/\s+/g, ' ').toLowerCase() === normalizedName);
        if (createdCategory) setParentCategorySlug(createdCategory.slug);
      } else {
        setSubcategoryName('');
        setExpandedCategories((current) => current.includes(selectedParentSlug) ? current : [...current, selectedParentSlug]);
      }
      setMessage(kind === 'category' ? 'Main category added.' : 'Subcategory added.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this category.');
    } finally {
      setSaving('');
    }
  };

  const confirmDeletion = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/store-categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: deleteTarget.kind,
          categorySlug: deleteTarget.categorySlug,
          ...(deleteTarget.subcategorySlug ? { subcategorySlug: deleteTarget.subcategorySlug } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.categories)) {
        throw new Error(result.error || 'Unable to delete this category.');
      }
      const updatedCategories = result.categories as StoreCategoryData[];
      onCategoriesUpdated(updatedCategories);
      if (deleteTarget.categorySlug === parentCategorySlug) setParentCategorySlug('');
      setMessage(`${deleteTarget.kind === 'category' ? 'Main category' : 'Subcategory'} deleted. ${Number(result.deletedProducts) || 0} product listing(s) were permanently removed.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this category.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleCategory = (slug: string) => setExpandedCategories((current) => current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug]);

  const subcategoryCount = categories.reduce((total, category) => total + category.subcategories.length, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14263d] text-white"><FolderPlus className="h-5 w-5" /></span>
          <div><h2 className="text-base font-semibold text-slate-900">Manage store categories</h2><p className="mt-1 text-xs text-slate-500">Add departments and collections. New categories become available in product forms and on the storefront.</p></div>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">{categories.length} departments · {subcategoryCount} collections</span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4" onSubmit={(event) => { event.preventDefault(); void addTaxonomy('category'); }}>
          <div><h3 className="text-xs font-semibold text-slate-800">Add a main category</h3><p className="mt-1 text-[10px] text-slate-500">Example: Pet Supplies</p></div>
          <label className="sr-only" htmlFor="new-store-category">Main category name</label>
          <input id="new-store-category" required minLength={2} maxLength={60} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Main category name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-slate-400" />
          <button type="submit" disabled={Boolean(saving)} className="inline-flex items-center gap-2 rounded-lg bg-[#14263d] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#203a5b] disabled:opacity-50">{saving === 'category' && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}Add main category</button>
        </form>

        <form className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4" onSubmit={(event) => { event.preventDefault(); void addTaxonomy('subcategory'); }}>
          <div><h3 className="text-xs font-semibold text-slate-800">Add a subcategory</h3><p className="mt-1 text-[10px] text-slate-500">Choose the department where it belongs.</p></div>
          <label className="sr-only" htmlFor="subcategory-parent">Main category for new subcategory</label>
          <select id="subcategory-parent" required disabled={!categories.length || Boolean(saving)} value={selectedParentSlug} onChange={(event) => setParentCategorySlug(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-slate-400 disabled:bg-slate-100"><option value="">Choose main category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
          <label className="sr-only" htmlFor="new-store-subcategory">Subcategory name</label>
          <input id="new-store-subcategory" required minLength={2} maxLength={60} value={subcategoryName} onChange={(event) => setSubcategoryName(event.target.value)} placeholder="Subcategory name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-slate-400" />
          <button type="submit" disabled={!selectedParentSlug || Boolean(saving)} className="inline-flex items-center gap-2 rounded-lg bg-[#14263d] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#203a5b] disabled:opacity-50">{saving === 'subcategory' && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}Add subcategory</button>
        </form>
      </div>

      <section className="mt-5 rounded-xl border border-rose-100 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div><h3 className="text-xs font-semibold text-slate-800">Delete categories or subcategories</h3><p className="mt-1 text-[10px] leading-5 text-slate-500">Delete any main category or subcategory. Matching products and product-update rollback data are permanently removed too.</p></div>
          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-700">Permanent action</span>
        </div>
        <div className="max-h-[440px] space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2">
          {categories.map((category) => {
            const expanded = expandedCategories.includes(category.slug);
            return <div key={category.slug} className="rounded-lg border border-slate-100 bg-white">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button type="button" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`} aria-expanded={expanded} disabled={!category.subcategories.length} onClick={() => toggleCategory(category.slug)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-default disabled:text-transparent"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
                <button type="button" onClick={() => toggleCategory(category.slug)} className="min-w-0 flex-1 py-1 text-left text-xs font-semibold text-slate-700"><span className="truncate">{category.name}</span><span className="ml-2 text-[10px] font-normal text-slate-400">{category.subcategories.length} subcategories</span></button>
                <button type="button" onClick={() => setDeleteTarget({ kind: 'category', categorySlug: category.slug, categoryName: category.name })} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3 w-3" /><span className="hidden sm:inline">Delete</span></button>
              </div>
              {expanded && category.subcategories.length > 0 && <div className="mb-2 ml-8 mr-2 space-y-1 border-l border-slate-200 pl-3">
                {category.subcategories.map((subcategory) => {
                  return <div key={subcategory.slug} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600">{subcategory.name}</span>
                    <button type="button" onClick={() => setDeleteTarget({ kind: 'subcategory', categorySlug: category.slug, subcategorySlug: subcategory.slug, categoryName: category.name, subcategoryName: subcategory.name })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3 w-3" />Delete</button>
                  </div>;
                })}
              </div>}
            </div>;
          })}
        </div>
      </section>

      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p>}
      {message && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">{message}</p>}

      {deleteTarget && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteTarget(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 className="h-5 w-5" /></span><div><h3 id="delete-category-title" className="text-sm font-semibold text-slate-900">Permanently delete {deleteTarget.kind === 'category' ? 'main category' : 'subcategory'}?</h3><p className="mt-1 text-xs font-semibold text-slate-700">{deleteTarget.categoryName}{deleteTarget.subcategoryName ? ` / ${deleteTarget.subcategoryName}` : ''}</p></div></div>
          <p className="mt-4 text-xs leading-5 text-slate-600">This removes it from the storefront and permanently deletes all product listings assigned to it, including their prices, image references, and related import rollback records. Unused uploaded product images are deleted too. This action cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" disabled={deleting} onClick={() => void confirmDeletion()} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{deleting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{deleting ? 'Deleting…' : 'Delete permanently'}</button></div>
        </section>
      </div>}
    </section>
  );
}
