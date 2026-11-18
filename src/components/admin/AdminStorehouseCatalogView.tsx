'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Download, FolderOpen, LoaderCircle, Play, RefreshCw } from 'lucide-react';
import { STOREHOUSE_IMPORT_CATEGORIES, STOREHOUSE_IMPORT_TARGET_TOTAL } from '@/data/storehouseImportCategories';

interface ImportBatch {
  id: string;
  status: string;
  expected_products: number;
  uploaded_products: number;
  published_products: number;
  category_counts: Record<string, number>;
  errors: Array<{ stage?: string; message?: string }>;
  source_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

interface ImportSummary {
  success: boolean;
  processActive: boolean;
  batches: ImportBatch[];
  expectedTotal: number;
  error?: string;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function statusStyle(status: string): string {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'failed') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function AdminStorehouseCatalogView() {
  const [csvPath, setCsvPath] = useState('product-imports/supplier-catalog.csv');
  const [imagesPath, setImagesPath] = useState('product-imports/images');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/storehouse/import', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not load catalog import status.');
      setSummary(payload as ImportSummary);
      setError('');
    } catch (caught: any) {
      setError(caught?.message || 'Could not load catalog import status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!summary?.processActive) return;
    const timer = window.setInterval(() => { void refresh(); }, 3000);
    return () => window.clearInterval(timer);
  }, [refresh, summary?.processActive]);

  const latestBatch = summary?.batches?.[0];
  const latestCategoryCounts = latestBatch?.category_counts || {};
  const publishedCount = useMemo(
    () => summary?.batches?.filter((batch) => batch.status === 'completed')
      .reduce((sum, batch) => sum + Number(batch.published_products || 0), 0) ?? 0,
    [summary?.batches]
  );
  const currentProgress = latestBatch?.status === 'publishing'
    ? Number(latestBatch.published_products || 0)
    : Number(latestBatch?.uploaded_products || 0);
  const progressPercent = latestBatch?.expected_products
    ? Math.min(100, Math.round((currentProgress / latestBatch.expected_products) * 100))
    : 0;

  const startImport = async () => {
    setStarting(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch('/api/admin/storehouse/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvPath, imagesPath }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not start the import.');
      setNotice(`Import started. Progress will update here; log: ${payload.logFile}`);
      await refresh();
    } catch (caught: any) {
      setError(caught?.message || 'Could not start the import.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Central seller catalog</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Storehouse catalog import</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Import 300 sourced products for each of the 29 categories. Sellers see a batch only after all 8,700 products and images pass validation.
            </p>
          </div>
          <a
            href="/templates/storehouse-catalog-import-template.csv"
            download
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Download CSV template
          </a>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Import target</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{STOREHOUSE_IMPORT_TARGET_TOTAL.toLocaleString()}</p>
            <p className="text-xs text-slate-500">300 per category × 29 categories</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Published products</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{publishedCount.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Only completed imports count here</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Latest import</p>
            <p className="mt-1 text-lg font-bold capitalize text-slate-900">{latestBatch?.status || 'Not started'}</p>
            <p className="text-xs text-slate-500">{latestBatch ? formatDate(latestBatch.updated_at) : 'No import history yet'}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FolderOpen className="h-4 w-4 text-slate-500" /> Supplier source files in the local workspace
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-xs font-medium text-slate-600">
              CSV file path
              <input value={csvPath} onChange={(event) => setCsvPath(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500" />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Matching image folder
              <input value={imagesPath} onChange={(event) => setImagesPath(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500" />
            </label>
            <button onClick={startImport} disabled={starting || summary?.processActive} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {starting || summary?.processActive ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {summary?.processActive ? 'Import running' : starting ? 'Starting…' : 'Validate and import'}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Place the supplier CSV and image folder inside <code className="rounded bg-white px-1 py-0.5">product-imports</code>. The CSV must reference each image by a relative path. The importer validates unique SKUs, product names, and image file hashes; it keeps the source files unchanged.
          </p>
        </div>

        {latestBatch && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {latestBatch.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : latestBatch.status === 'failed' ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}
                {latestBatch.source_name || latestBatch.id}
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(latestBatch.status)}`}>{latestBatch.status}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-slate-500">
              <span>{currentProgress.toLocaleString()} / {latestBatch.expected_products.toLocaleString()} {latestBatch.status === 'publishing' ? 'published' : 'validated and staged'}</span>
              <span>{progressPercent}%</span>
            </div>
            {latestBatch.errors?.length > 0 && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{latestBatch.errors.at(-1)?.message || 'Import reported an error.'}</p>}
          </div>
        )}
        {(notice || error) && <div className={`mt-4 rounded-lg px-3.5 py-3 text-sm ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category coverage</h3>
            <p className="mt-0.5 text-xs text-slate-500">Each category needs exactly 300 distinct products and image files.</p>
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
          {STOREHOUSE_IMPORT_CATEGORIES.map((category) => {
            const count = Number(latestCategoryCounts[category.slug] || 0);
            const complete = count === 300;
            return (
              <div key={category.slug} className="flex items-center justify-between gap-3 bg-white px-5 py-3.5">
                <span className="min-w-0 truncate text-xs font-medium text-slate-700">{category.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${complete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {count} / 300
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
