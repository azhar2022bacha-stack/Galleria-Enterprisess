'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, X } from 'lucide-react';

type Suspension = { status: 'suspended'; reason: string; updatedAt: string };
type SellerOption = { email: string; name: string; fullName: string; suspension: Suspension | null };

const field = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-50';
const primary = 'rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminSuspendAccountView() {
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const seller = useMemo(() => sellers.find((item) => item.email === selectedEmail) || null, [sellers, selectedEmail]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch('/api/admin/suspend-account', { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.sellers)) throw new Error(data.error || 'Could not load seller accounts.');
        if (!controller.signal.aborted) setSellers(data.sellers);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : 'Could not load seller accounts.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  async function updateSuspension(action: 'suspend' | 'restore') {
    if (!seller || saving) return;
    const cleanReason = reason.trim();
    if (action === 'suspend' && !cleanReason) {
      setError('Enter the reason for suspending this account.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/suspend-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: seller.email, ...(action === 'suspend' ? { reason: cleanReason } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not update this seller account.');
      setSellers((current) => current.map((item) => item.email === seller.email
        ? { ...item, suspension: data.suspension || null }
        : item));
      setMessage(action === 'suspend' ? `${seller.name} is suspended. Support remains available.` : `${seller.name} has been restored.`);
      setReason('');
      setDialogOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update this seller account.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
    <header className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><ShieldAlert size={22} /></span>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Suspend Account</h1>
        <p className="mt-1 text-sm text-gray-600">Choose any registered seller. A suspended seller can use Support, while other seller features are restricted.</p>
      </div>
    </header>

    <label className="block text-sm font-semibold text-gray-800">Seller account
      <select className={field} disabled={loading || saving} value={selectedEmail}
        onChange={(event) => { setSelectedEmail(event.target.value); setError(''); setMessage(''); }}>
        <option value="">{loading ? 'Loading seller accounts…' : 'Select a seller account'}</option>
        {sellers.map((item) => <option key={item.email} value={item.email}>{item.name}{item.fullName ? ` · ${item.fullName}` : ''} · {item.email}</option>)}
      </select>
    </label>

    {seller && <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-gray-900">{seller.name}</h2>
          <p className="mt-0.5 break-all text-xs text-gray-500">{seller.email}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${seller.suspension ? 'border-rose-200 bg-rose-100 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {seller.suspension ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
          {seller.suspension ? 'Suspended' : 'Active'}
        </span>
      </div>

      {seller.suspension ? <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-950">
        <p className="text-xs font-bold uppercase tracking-wide">Suspension reason shown to seller</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{seller.suspension.reason}</p>
        {seller.suspension.updatedAt && <p className="mt-2 text-xs text-rose-700">Suspended {new Date(seller.suspension.updatedAt).toLocaleString()}</p>}
        <button type="button" className="mt-4 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50" disabled={saving} onClick={() => void updateSuspension('restore')}>
          {saving ? 'Updating…' : 'Restore account'}
        </button>
      </div> : <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-950">Suspending disables seller features, except Support, until the account is restored.</p>
        <button type="button" className={primary} disabled={saving} onClick={() => { setError(''); setDialogOpen(true); }}>Suspend account</button>
      </div>}
    </div>}

    {!loading && !sellers.length && !error && <p className="rounded-lg bg-slate-50 p-4 text-sm text-gray-600">No seller accounts were found.</p>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}

    {dialogOpen && seller && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setDialogOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="suspend-account-title" className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="suspend-account-title" className="text-lg font-bold text-gray-900">Suspend {seller.name}?</h2>
            <p className="mt-1 text-sm text-gray-600">The seller will see this reason at the top of their account. Support will remain available.</p>
          </div>
          <button type="button" aria-label="Close suspension dialog" disabled={saving} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50" onClick={() => setDialogOpen(false)}><X size={20} /></button>
        </header>
        <label className="block text-sm font-semibold text-gray-800">Reason for suspension
          <textarea autoFocus required maxLength={2000} rows={5} className={`${field} resize-y`} value={reason} disabled={saving}
            placeholder="Explain why this seller account is being suspended."
            onChange={(event) => setReason(event.target.value)} />
        </label>
        <p className="text-right text-xs text-gray-400">{reason.length}/2,000</p>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</button>
          <button type="button" className={primary} disabled={saving || !reason.trim()} onClick={() => void updateSuspension('suspend')}>
            {saving ? 'Suspending…' : 'Confirm suspension'}
          </button>
        </div>
      </section>
    </div>}
  </section>;
}
