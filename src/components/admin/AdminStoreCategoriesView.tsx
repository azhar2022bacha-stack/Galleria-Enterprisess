'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import type { StoreCategoryData } from '@/data/storeCategories';
import { AdminStoreCategoryManager } from '@/components/admin/AdminStoreCategoryManager';

export function AdminStoreCategoriesView() {
  const [categories, setCategories] = useState<StoreCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/store-categories', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.categories)) {
          throw new Error(result.error || 'Unable to load store categories.');
        }
        if (active) setCategories(result.categories as StoreCategoryData[]);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load store categories.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {loading ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading categories</div>
      ) : !error ? (
        <AdminStoreCategoryManager categories={categories} onCategoriesUpdated={setCategories} />
      ) : null}
    </div>
  );
}
