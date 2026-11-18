'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type MetadataValue = string | number | boolean | null;

interface StoreCurrency {
  code: string;
  name: string;
  taxInclusive: boolean;
}

interface StoreSettings {
  id: string;
  name: string;
  defaultCurrencyCode: string;
  defaultRegion: string;
  defaultSalesChannel: string;
  defaultLocation: string;
  currencies: StoreCurrency[];
  metadata: Record<string, MetadataValue>;
  createdAt: string;
  updatedAt: string;
}

interface AdminStoreSettingsViewProps {
  notify?: (message: string) => void;
}

const fieldClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

function apiShape(settings: StoreSettings) {
  return {
    id: settings.id,
    name: settings.name,
    default_currency_code: settings.defaultCurrencyCode,
    default_region: settings.defaultRegion,
    default_sales_channel: settings.defaultSalesChannel,
    default_location: settings.defaultLocation,
    currencies: settings.currencies.map((currency) => ({
      code: currency.code,
      name: currency.name,
      tax_inclusive: currency.taxInclusive,
    })),
    metadata: settings.metadata,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt,
  };
}

function jsonForSettings(settings: StoreSettings): string {
  return JSON.stringify(apiShape(settings), null, 2);
}

function currencyForForm(currency?: StoreCurrency) {
  return currency ?? { code: '', name: '', taxInclusive: false };
}

function formatValue(value: MetadataValue): string {
  if (value === null) return 'null';
  return String(value);
}

export function AdminStoreSettingsView({ notify }: AdminStoreSettingsViewProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeDraft, setStoreDraft] = useState({
    name: '',
    defaultCurrencyCode: '',
    defaultRegion: '',
    defaultSalesChannel: '',
    defaultLocation: '',
  });
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [editingCurrencyCode, setEditingCurrencyCode] = useState<string | null>(null);
  const [currencyDraft, setCurrencyDraft] = useState<StoreCurrency>(currencyForForm());
  const [currencySearch, setCurrencySearch] = useState('');
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [editingMetadataKey, setEditingMetadataKey] = useState<string | null>(null);
  const [metadataDraft, setMetadataDraft] = useState({ key: '', value: '', type: 'string' });
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonDirty, setJsonDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.trim().toLowerCase();
    if (!settings || !query) return settings?.currencies ?? [];
    return settings.currencies.filter((currency) =>
      currency.code.toLowerCase().includes(query) || currency.name.toLowerCase().includes(query)
    );
  }, [settings, currencySearch]);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/store-settings', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Store settings.');
      setSettings(result.settings as StoreSettings);
      setJsonDraft(jsonForSettings(result.settings as StoreSettings));
      setJsonDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Store settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const persist = async (patch: Record<string, unknown>, successMessage: string) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save Store settings.');
      const saved = result.settings as StoreSettings;
      setSettings(saved);
      if (!jsonDirty) setJsonDraft(jsonForSettings(saved));
      setSuccess(successMessage);
      notify?.(successMessage);
      window.dispatchEvent(new CustomEvent('galleria:store-settings-changed', { detail: { name: saved.name } }));
      return saved;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save Store settings.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const openStoreEditor = () => {
    if (!settings) return;
    setStoreDraft({
      name: settings.name,
      defaultCurrencyCode: settings.defaultCurrencyCode,
      defaultRegion: settings.defaultRegion,
      defaultSalesChannel: settings.defaultSalesChannel,
      defaultLocation: settings.defaultLocation,
    });
    setStoreModalOpen(true);
  };

  const saveStoreDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await persist({
      name: storeDraft.name,
      defaultCurrencyCode: storeDraft.defaultCurrencyCode,
      defaultRegion: storeDraft.defaultRegion,
      defaultSalesChannel: storeDraft.defaultSalesChannel,
      defaultLocation: storeDraft.defaultLocation,
    }, 'Store details saved.');
    if (saved) setStoreModalOpen(false);
  };

  const openCurrencyEditor = (currency?: StoreCurrency) => {
    setEditingCurrencyCode(currency?.code ?? null);
    setCurrencyDraft(currencyForForm(currency));
    setCurrencyModalOpen(true);
  };

  const saveCurrency = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    const code = currencyDraft.code.trim().toUpperCase();
    const name = currencyDraft.name.trim();
    const currencies = settings.currencies.filter((currency) => currency.code !== editingCurrencyCode);
    currencies.push({ code, name, taxInclusive: currencyDraft.taxInclusive });
    const saved = await persist({ currencies }, `Currency ${code} saved.`);
    if (saved) setCurrencyModalOpen(false);
  };

  const removeCurrency = async (currency: StoreCurrency) => {
    if (!settings) return;
    if (settings.currencies.length <= 1) {
      setError('Keep at least one supported currency.');
      return;
    }
    if (currency.code === settings.defaultCurrencyCode) {
      setError('Choose another default currency before removing this one.');
      return;
    }
    if (!window.confirm(`Remove ${currency.code} from supported currencies?`)) return;
    const saved = await persist({ currencies: settings.currencies.filter((item) => item.code !== currency.code) }, `${currency.code} removed.`);
    if (saved) setError('');
  };

  const openMetadataEditor = (key?: string) => {
    const value = key && settings ? settings.metadata[key] : undefined;
    const type = value === null ? 'null' : typeof value;
    setEditingMetadataKey(key ?? null);
    setMetadataDraft({ key: key ?? '', value: value === undefined || value === null ? '' : String(value), type });
    setMetadataModalOpen(true);
  };

  const saveMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    const key = metadataDraft.key.trim();
    let value: MetadataValue = metadataDraft.value;
    if (metadataDraft.type === 'number') {
      value = Number(metadataDraft.value);
      if (!metadataDraft.value.trim() || !Number.isFinite(value)) {
        setError('Enter a valid number for this metadata value.');
        return;
      }
    } else if (metadataDraft.type === 'boolean') {
      value = metadataDraft.value === 'true';
    } else if (metadataDraft.type === 'null') {
      value = null;
    }
    if (key !== editingMetadataKey && Object.prototype.hasOwnProperty.call(settings.metadata, key)) {
      setError(`Metadata key “${key}” already exists. Edit its current value instead.`);
      return;
    }
    const metadata = { ...settings.metadata };
    if (editingMetadataKey && editingMetadataKey !== key) delete metadata[editingMetadataKey];
    metadata[key] = value;
    const saved = await persist({ metadata }, 'Metadata saved.');
    if (saved) setMetadataModalOpen(false);
  };

  const removeMetadata = async (key: string) => {
    if (!settings) return;
    const metadata = { ...settings.metadata };
    delete metadata[key];
    await persist({ metadata }, `Metadata “${key}” removed.`);
  };

  const saveJson = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch {
      setError('The JSON has a syntax error. Correct it before saving.');
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError('The JSON document must be an object.');
      return;
    }
    const saved = await persist(parsed as Record<string, unknown>, 'Store JSON saved.');
    if (saved) {
      setJsonDraft(jsonForSettings(saved));
      setJsonDirty(false);
    }
  };

  if (loading) {
    return <div className="mx-auto flex min-h-64 max-w-6xl items-center justify-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading Store settings…</div>;
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error || 'Store settings are unavailable.'}</div>
        <button onClick={() => void loadSettings()} className={`${secondaryButtonClass} mt-4`}>Try again</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-8 animate-fadeIn">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Store</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your store’s details and defaults.</p>
          </div>
          <button onClick={openStoreEditor} className={secondaryButtonClass}><Edit2 className="h-4 w-4" />Edit details</button>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            ['Name', settings.name],
            ['Default currency', `${settings.defaultCurrencyCode} · ${settings.currencies.find((item) => item.code === settings.defaultCurrencyCode)?.name ?? ''}`],
            ['Default region', settings.defaultRegion || 'Not set'],
            ['Default sales channel', settings.defaultSalesChannel || 'Not set'],
            ['Default location', settings.defaultLocation || 'Not set'],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-[minmax(170px,1fr)_2fr] sm:px-6">
              <span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="font-semibold text-gray-900">Currencies</h2><p className="mt-1 text-xs text-gray-500">Choose a default and manage currencies accepted by the store.</p></div>
          <div className="flex items-center gap-2">
            <label className="relative block"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" /><input value={currencySearch} onChange={(event) => setCurrencySearch(event.target.value)} placeholder="Search currencies" className="w-44 rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-xs outline-none focus:border-indigo-400" /></label>
            <button onClick={() => openCurrencyEditor()} className={primaryButtonClass}><Plus className="h-4 w-4" />Add currency</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3 sm:px-6">Code</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Tax inclusive pricing</th><th className="px-5 py-3">Default</th><th className="px-5 py-3 text-right sm:px-6">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCurrencies.map((currency) => (
                <tr key={currency.code}>
                  <td className="px-5 py-3 font-medium text-gray-800 sm:px-6">{currency.code}</td><td className="px-5 py-3 text-gray-600">{currency.name}</td><td className="px-5 py-3 text-gray-600">{currency.taxInclusive ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3">{currency.code === settings.defaultCurrencyCode ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Default</span> : <span className="text-gray-400">—</span>}</td>
                  <td className="px-5 py-3 text-right sm:px-6"><div className="inline-flex items-center gap-1"><button title={`Edit ${currency.code}`} onClick={() => openCurrencyEditor(currency)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100"><Edit2 className="h-4 w-4" /></button><button title={`Remove ${currency.code}`} onClick={() => void removeCurrency(currency)} className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
              {filteredCurrencies.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No currencies match this search.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 sm:px-6">{settings.currencies.length} supported {settings.currencies.length === 1 ? 'currency' : 'currencies'}</div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div><h2 className="font-semibold text-gray-900">Metadata</h2><p className="mt-1 text-xs text-gray-500">Custom key/value details stored with the store.</p></div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{Object.keys(settings.metadata).length} keys</span><button onClick={() => openMetadataEditor()} className={secondaryButtonClass}><Plus className="h-4 w-4" />Add key</button></div>
        </div>
        {Object.keys(settings.metadata).length === 0 ? <p className="px-5 py-6 text-sm text-gray-500 sm:px-6">No metadata keys yet. Add one when you need to store custom information.</p> : (
          <div className="divide-y divide-gray-100">
            {Object.entries(settings.metadata).map(([key, value]) => <div key={key} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"><div className="min-w-0"><div className="truncate text-sm font-medium text-gray-800">{key}</div><div className="truncate text-xs text-gray-500">{formatValue(value)} <span className="text-gray-400">({value === null ? 'null' : typeof value})</span></div></div><div className="flex shrink-0 items-center gap-1"><button title="Edit metadata" onClick={() => openMetadataEditor(key)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100"><Edit2 className="h-4 w-4" /></button><button title="Remove metadata" onClick={() => void removeMetadata(key)} className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>)}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <button onClick={() => setJsonExpanded((value) => !value)} className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"><div><h2 className="font-semibold text-gray-900">JSON</h2><p className="mt-1 text-xs text-gray-500">Review or edit the saved Store settings document.</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{Object.keys(settings.metadata).length} metadata keys</span><ChevronDown className={`h-4 w-4 text-gray-500 transition ${jsonExpanded ? 'rotate-180' : ''}`} /></div></button>
        {jsonExpanded && <div className="border-t border-gray-100 p-4 sm:p-5"><textarea value={jsonDraft} onChange={(event) => { setJsonDraft(event.target.value); setJsonDirty(true); setError(''); }} spellCheck={false} className="min-h-80 w-full rounded-lg border border-gray-800 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300" aria-label="Store settings JSON" /><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-gray-500">Changes are validated and saved to the same Store settings.</span><div className="flex gap-2"><button onClick={() => { setJsonDraft(jsonForSettings(settings)); setJsonDirty(false); setError(''); }} className={secondaryButtonClass}>Discard edits</button><button onClick={() => void saveJson()} disabled={saving || !jsonDirty} className={primaryButtonClass}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save JSON'}</button></div></div></div>}
      </section>

      {(error || success) && <div role="status" className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}{error || success}<button onClick={() => { setError(''); setSuccess(''); }} className="ml-auto rounded p-1 opacity-70 hover:opacity-100" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}

      {storeModalOpen && <Modal title="Edit store details" onClose={() => setStoreModalOpen(false)}><form onSubmit={saveStoreDetails} className="space-y-4">{error && <ModalError message={error} />}<Field label="Store name"><input required maxLength={120} value={storeDraft.name} onChange={(event) => setStoreDraft({ ...storeDraft, name: event.target.value })} className={fieldClass} /></Field><Field label="Default currency"><select required value={storeDraft.defaultCurrencyCode} onChange={(event) => setStoreDraft({ ...storeDraft, defaultCurrencyCode: event.target.value })} className={fieldClass}>{settings.currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.name}</option>)}</select></Field><Field label="Default region"><input maxLength={255} value={storeDraft.defaultRegion} onChange={(event) => setStoreDraft({ ...storeDraft, defaultRegion: event.target.value })} placeholder="For example, United States" className={fieldClass} /></Field><Field label="Default sales channel"><input maxLength={255} value={storeDraft.defaultSalesChannel} onChange={(event) => setStoreDraft({ ...storeDraft, defaultSalesChannel: event.target.value })} placeholder="For example, Online Store" className={fieldClass} /></Field><Field label="Default location"><input maxLength={255} value={storeDraft.defaultLocation} onChange={(event) => setStoreDraft({ ...storeDraft, defaultLocation: event.target.value })} placeholder="For example, Main warehouse" className={fieldClass} /></Field><ModalActions onCancel={() => setStoreModalOpen(false)} saving={saving} /></form></Modal>}

      {currencyModalOpen && <Modal title={editingCurrencyCode ? `Edit ${editingCurrencyCode}` : 'Add currency'} onClose={() => setCurrencyModalOpen(false)}><form onSubmit={saveCurrency} className="space-y-4">{error && <ModalError message={error} />}<Field label="Currency code"><input required maxLength={3} minLength={3} pattern="[A-Za-z]{3}" value={currencyDraft.code} disabled={Boolean(editingCurrencyCode)} onChange={(event) => setCurrencyDraft({ ...currencyDraft, code: event.target.value.toUpperCase() })} placeholder="USD" className={fieldClass} /></Field><Field label="Currency name"><input required maxLength={80} value={currencyDraft.name} onChange={(event) => setCurrencyDraft({ ...currencyDraft, name: event.target.value })} placeholder="US Dollar" className={fieldClass} /></Field><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={currencyDraft.taxInclusive} onChange={(event) => setCurrencyDraft({ ...currencyDraft, taxInclusive: event.target.checked })} className="rounded border-gray-300" />Prices include tax</label><ModalActions onCancel={() => setCurrencyModalOpen(false)} saving={saving} /></form></Modal>}

      {metadataModalOpen && <Modal title={editingMetadataKey ? 'Edit metadata' : 'Add metadata'} onClose={() => setMetadataModalOpen(false)}><form onSubmit={saveMetadata} className="space-y-4">{error && <ModalError message={error} />}<Field label="Key"><input required maxLength={100} value={metadataDraft.key} onChange={(event) => setMetadataDraft({ ...metadataDraft, key: event.target.value })} placeholder="for example, environment" className={fieldClass} /></Field><Field label="Value type"><select value={metadataDraft.type} onChange={(event) => setMetadataDraft({ ...metadataDraft, type: event.target.value })} className={fieldClass}><option value="string">Text</option><option value="number">Number</option><option value="boolean">True / false</option><option value="null">Null</option></select></Field>{metadataDraft.type === 'boolean' ? <Field label="Value"><select value={metadataDraft.value || 'false'} onChange={(event) => setMetadataDraft({ ...metadataDraft, value: event.target.value })} className={fieldClass}><option value="true">true</option><option value="false">false</option></select></Field> : metadataDraft.type !== 'null' && <Field label="Value"><input required={metadataDraft.type !== 'null'} maxLength={4000} value={metadataDraft.value} onChange={(event) => setMetadataDraft({ ...metadataDraft, value: event.target.value })} className={fieldClass} /></Field>}<ModalActions onCancel={() => setMetadataModalOpen(false)} saving={saving} /></form></Modal>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="block text-sm font-medium text-gray-700">{label}</span>{children}</label>;
}

function ModalError({ message }: { message: string }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{message}</div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">{title}</h2><button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

function ModalActions({ onCancel, saving }: { onCancel: () => void; saving: boolean }) {
  return <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={onCancel} className={secondaryButtonClass}>Cancel</button><button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Save</button></div>;
}
