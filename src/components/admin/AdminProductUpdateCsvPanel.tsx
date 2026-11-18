'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowDownToLine, CheckCircle2, FileSpreadsheet, History, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import type { StoreCategoryData } from '@/data/storeCategories';

type CsvProductRow = {
  rowNumber: number;
  sku: string;
  upc?: string;
  title?: string;
  brand?: string;
  model?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  price?: string;
  stockQuantity?: string;
  description?: string;
  image?: string;
  specifications?: Record<string, unknown>;
  priceSourceUrl?: string;
  priceCheckedAt?: string;
};

interface ImportReport {
  success: boolean;
  totalRows: number;
  validRows: number;
  createCount: number;
  updateCount: number;
  categories: { category: string; subcategory: string; created: number; updated: number; totalBefore?: number; totalAfter?: number }[];
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
}

interface ImportHistoryItem {
  id: string;
  fileName: string;
  createdAt: string;
  createdBy: string;
  status: 'committed' | 'rolled_back';
  createdCount: number;
  updatedCount: number;
  categoryCounts: { category: string; subcategory: string; created: number; updated: number; totalBefore?: number; totalAfter?: number }[];
  rolledBackAt?: string;
}

const REQUIRED_HEADERS = [
  'sku', 'title', 'brand', 'model', 'price_usd', 'stock_quantity', 'description', 'image_url',
];

function parseCsvMatrix(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(field); field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows.filter((entry) => entry.some((value) => value.trim().length > 0));
}

function parseProductCsv(source: string, categorySlug: string, subcategorySlug: string): { items: CsvProductRow[]; skippedExampleRows: number } {
  const matrix = parseCsvMatrix(source.replace(/^\uFEFF/, ''));
  if (matrix.length < 2) throw new Error('Add at least one product row below the CSV header.');
  const headers = matrix[0].map((header) => header.trim().toLowerCase());
  const duplicates = headers.filter((header, index) => header && headers.indexOf(header) !== index);
  if (duplicates.length) throw new Error(`Duplicate CSV header: ${duplicates[0]}.`);
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new Error(`Missing CSV columns: ${missingHeaders.join(', ')}.`);
  const column = (values: string[], key: string) => values[headers.indexOf(key)]?.trim() || '';
  const items: CsvProductRow[] = [];
  let skippedExampleRows = 0;

  matrix.slice(1).forEach((values, index) => {
    const rowNumber = index + 2;
    const sku = column(values, 'sku');
    if (sku.trim().toUpperCase() === 'EXAMPLE_ONLY') { skippedExampleRows += 1; return; }
    if (!sku && values.every((value) => !value.trim())) return;
    const specsText = column(values, 'specifications_json');
    let parsedSpecifications: Record<string, unknown> | undefined;
    if (specsText) {
      try {
        const parsed = JSON.parse(specsText);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
        parsedSpecifications = parsed as Record<string, unknown>;
      } catch {
        throw new Error(`Row ${rowNumber}: specifications_json must be a JSON object.`);
      }
    }
    items.push({
      rowNumber,
      sku,
      upc: column(values, 'upc') || undefined,
      title: column(values, 'title') || undefined,
      brand: column(values, 'brand') || undefined,
      model: column(values, 'model') || undefined,
      categorySlug,
      subcategorySlug,
      price: column(values, 'price_usd') || undefined,
      stockQuantity: column(values, 'stock_quantity') || undefined,
      description: column(values, 'description') || undefined,
      image: column(values, 'image_url') || undefined,
      specifications: parsedSpecifications,
      priceSourceUrl: column(values, 'price_source_url') || undefined,
      priceCheckedAt: column(values, 'price_checked_at') || undefined,
    });
  });
  if (!items.length) throw new Error('The CSV contains no product rows to import.');
  return { items, skippedExampleRows };
}

export function AdminProductUpdateCsvPanel({ categories, revision = 0, onImported }: { categories: StoreCategoryData[]; revision?: number; onImported?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [categorySlug, setCategorySlug] = useState('');
  const [subcategorySlug, setSubcategorySlug] = useState('');
  const [fileName, setFileName] = useState('');
  const [items, setItems] = useState<CsvProductRow[]>([]);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [skippedExamples, setSkippedExamples] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rollbackId, setRollbackId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [storefrontHref, setStorefrontHref] = useState('');
  const selectedCategory = categories.find((category) => category.slug === categorySlug);

  const clearSelectedCsv = () => {
    setFileName(''); setItems([]); setReport(null); setSkippedExamples(0); setError(''); setMessage(''); setStorefrontHref('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/product-updates', { cache: 'no-store' });
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.history)) setHistory(result.history);
    } catch { /* History is optional when the local service is restarting. */ }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory, revision]);

  const chooseFile = async (file?: File) => {
    setError(''); setMessage(''); setStorefrontHref(''); setReport(null); setItems([]); setFileName(''); setSkippedExamples(0);
    if (!file) return;
    if (!categorySlug || !subcategorySlug) { setError('Select a category and subcategory before choosing the CSV file.'); return; }
    if (!file.name.toLowerCase().endsWith('.csv')) { setError('Choose a .csv file.'); return; }
    if (file.size > 30 * 1024 * 1024) { setError('Choose a CSV smaller than 30 MB.'); return; }
    setLoadingPreview(true);
    try {
      const parsed = parseProductCsv(await file.text(), categorySlug, subcategorySlug);
      setFileName(file.name); setItems(parsed.items); setSkippedExamples(parsed.skippedExampleRows);
      const response = await fetch('/api/admin/product-updates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', fileName: file.name, items: parsed.items }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to preview this file.');
      setReport(result as ImportReport);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Unable to read this CSV.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const downloadErrorReport = () => {
    if (!report?.errors.length) return;
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const content = ['row,error', ...report.errors.map((item) => `${item.row},${quote(item.message)}`)].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${fileName.replace(/\.csv$/i, '')}-errors.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async () => {
    if (!report?.success || !items.length) return;
    const warningNote = report.warnings.length ? ` There are ${report.warnings.length} similar-title warning(s); review them before continuing.` : '';
    if (!window.confirm(`Import ${report.validRows} product row(s)? ${report.createCount} new and ${report.updateCount} updates will be published to the storefront.${warningNote}`)) return;
    setImporting(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/product-updates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', fileName, items }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Import failed. No rows were applied.');
      setMessage(`Import complete: ${result.createdCount} created, ${result.updatedCount} updated. Batch ${result.batch.id}.`);
      setStorefrontHref(`/category/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subcategorySlug)}`);
      setReport(null); setItems([]); setFileName(''); setSkippedExamples(0);
      if (inputRef.current) inputRef.current.value = '';
      await loadHistory(); onImported?.();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const rollback = async (batch: ImportHistoryItem) => {
    if (batch.status !== 'committed') return;
    if (!window.confirm(`Roll back batch ${batch.id}? This removes products created by that batch and restores its previous product values.`)) return;
    setRollbackId(batch.id); setError(''); setMessage(''); setStorefrontHref('');
    try {
      const response = await fetch('/api/admin/product-updates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', batchId: batch.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Rollback failed.');
      setMessage(`Batch rolled back: ${result.removedCount} created product(s) removed and ${result.restoredCount} product(s) restored.`);
      await loadHistory(); onImported?.();
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : 'Rollback failed.');
    } finally {
      setRollbackId('');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14263d] text-white"><FileSpreadsheet className="h-5 w-5" /></div><div><h2 className="text-base font-semibold text-slate-900">Bulk CSV product update</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Use one file to add new products or update existing catalog entries. Rows match by SKU, and blank fields keep existing values.</p></div></div>
          <a href="/templates/product-update-template.csv" download className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowDownToLine className="h-3.5 w-3.5" />Download CSV example</a>
        </div>

        <div className="mt-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-slate-700">Category<select required disabled={loadingPreview || importing} value={categorySlug} onChange={(event) => { setCategorySlug(event.target.value); setSubcategorySlug(''); clearSelectedCsv(); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-400 disabled:bg-slate-50"><option value="">Select category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-700">Subcategory<select required disabled={!selectedCategory || loadingPreview || importing} value={subcategorySlug} onChange={(event) => { setSubcategorySlug(event.target.value); clearSelectedCsv(); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-400 disabled:bg-slate-50"><option value="">Select subcategory</option>{selectedCategory?.subcategories.map((subcategory) => <option key={subcategory.slug} value={subcategory.slug}>{subcategory.name}</option>)}</select></label>
          </div>
          <p className="mb-3 text-[10px] text-slate-500">The selected category and subcategory apply to every row in this file, including existing products being updated. Changing either selection clears the current CSV preview.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <label className={`flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition ${categorySlug && subcategorySlug ? 'cursor-pointer hover:border-slate-400 hover:bg-slate-100/60' : 'cursor-not-allowed opacity-60'}`}>
            <input ref={inputRef} type="file" accept=".csv,text/csv" disabled={!categorySlug || !subcategorySlug || loadingPreview || importing} className="sr-only" onChange={(event) => void chooseFile(event.target.files?.[0])} />
            {loadingPreview ? <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" /> : <Upload className="h-6 w-6 text-slate-500" />}
            <span className="mt-2 text-xs font-semibold text-slate-800">{loadingPreview ? 'Reading and validating…' : fileName || (categorySlug && subcategorySlug ? 'Choose a CSV file' : 'Choose category and subcategory first')}</span>
            <span className="mt-1 text-[10px] text-slate-500">Up to 5,000 product rows · one preview before import</span>
          </label>
          <div className="rounded-xl border border-[#e8e1d4] bg-[#fbfaf7] p-4 text-[10px] leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">CSV columns</p>
            <p className="mt-1">sku, title, brand, model, price_usd, stock_quantity, description, image_url</p>
            <p className="mt-2">Category and subcategory are selected above. Required CSV fields: SKU, title, brand, model, USD price, stock, description, and image URL. UPC is optional. Leave a field blank when updating to keep its current value. Use an HTTPS image URL or a local /uploads/ path.</p>
            <p className="mt-2">The downloaded example row uses SKU <code className="rounded bg-white px-1">EXAMPLE_ONLY</code> and is skipped by import. Replace all placeholders before adding real rows.</p>
          </div>
        </div>

        {skippedExamples > 0 && <p className="mt-3 text-[10px] text-slate-500">Skipped {skippedExamples} placeholder example row(s).</p>}
        {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {message && <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><div>{message}{storefrontHref && <a href={storefrontHref} target="_blank" rel="noreferrer" className="ml-2 inline-flex font-semibold underline underline-offset-2">View storefront collection</a>}</div></div>}

        {report && <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900">Import preview · {fileName}</h3><p className="mt-1 text-xs text-slate-500">{report.validRows} valid rows · {report.createCount} new · {report.updateCount} updates · {report.errors.length} errors · {report.warnings.length} warnings</p></div><button type="button" onClick={() => void importFile()} disabled={!report.success || importing || loadingPreview} className="inline-flex items-center gap-2 rounded-lg bg-[#14263d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#203a5b] disabled:cursor-not-allowed disabled:opacity-40">{importing && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{importing ? 'Importing…' : 'Import products'}</button></div>
          {report.categories.length > 0 && <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100"><table className="w-full min-w-[530px] text-left text-xs"><thead className="bg-slate-50 text-[9px] uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Category / subcategory</th><th className="px-3 py-2">New</th><th className="px-3 py-2">Updates</th><th className="px-3 py-2">Products after</th></tr></thead><tbody className="divide-y divide-slate-100">{report.categories.map((item) => <tr key={`${item.category}-${item.subcategory}`}><td className="px-3 py-2 text-slate-700">{item.category} / {item.subcategory}</td><td className="px-3 py-2 text-slate-600">{item.created}</td><td className="px-3 py-2 text-slate-600">{item.updated}</td><td className="px-3 py-2 font-semibold text-slate-800">{item.totalAfter ?? '—'} / 300</td></tr>)}</tbody></table></div>}
          {items.length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Image preview · first {Math.min(8, items.length)} rows</p><div className="flex gap-2 overflow-x-auto pb-1">{items.slice(0, 8).map((item) => <div key={`${item.rowNumber}-${item.sku}`} className="w-24 shrink-0"><div className="h-20 overflow-hidden rounded-lg border border-slate-200 bg-white"><img src={item.image} alt={item.title || 'Product preview'} className="h-full w-full object-contain p-1" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('bg-rose-50'); }} /></div><p className="mt-1 truncate text-[9px] text-slate-500" title={item.title}>{item.title || item.sku}</p></div>)}</div></div>}
          {report.errors.length > 0 && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50/60 p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-rose-800">Fix these rows before import</p><button type="button" onClick={downloadErrorReport} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1.5 text-[9px] font-semibold text-rose-700"><ArrowDownToLine className="h-3 w-3" />Download errors</button></div><ul className="mt-2 max-h-48 space-y-1 overflow-auto text-[10px] text-rose-700">{report.errors.slice(0, 100).map((item, index) => <li key={`${item.row}-${index}`}>Row {item.row}: {item.message}</li>)}</ul>{report.errors.length > 100 && <p className="mt-2 text-[10px] text-rose-700">Showing the first 100 errors; download the report for all errors.</p>}</div>}
          {report.warnings.length > 0 && <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 p-3"><p className="text-xs font-semibold text-amber-800">Review similar product names</p><ul className="mt-2 max-h-40 space-y-1 overflow-auto text-[10px] text-amber-700">{report.warnings.slice(0, 30).map((item, index) => <li key={`${item.row}-${index}`}>Row {item.row}: {item.message}</li>)}</ul></div>}
        </div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><History className="h-4 w-4 text-slate-500" /><div><h2 className="text-sm font-semibold text-slate-900">Import history and rollback</h2><p className="mt-0.5 text-[10px] text-slate-500">Recent product imports and manual changes are recorded here.</p></div></div>
        {history.length === 0 ? <p className="px-5 py-8 text-center text-xs text-slate-400">No product update batches yet.</p> : <div className="divide-y divide-slate-100">{history.map((batch) => <article key={batch.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{batch.fileName}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(batch.createdAt).toLocaleString()} · {batch.createdBy} · {batch.createdCount} added · {batch.updatedCount} updated</p><p className="mt-1 text-[10px] text-slate-400">Batch {batch.id} · {batch.status === 'rolled_back' ? `Rolled back ${batch.rolledBackAt ? new Date(batch.rolledBackAt).toLocaleString() : ''}` : 'Committed'}</p></div>{batch.status === 'committed' && <button type="button" onClick={() => void rollback(batch)} disabled={Boolean(rollbackId)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><RotateCcw className={`h-3.5 w-3.5 ${rollbackId === batch.id ? 'animate-spin' : ''}`} />{rollbackId === batch.id ? 'Rolling back…' : 'Rollback batch'}</button>}</article>)}</div>}
      </section>
    </div>
  );
}
