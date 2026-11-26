'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ConsignMerchantSummary } from '@/lib/consignMerchants';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;
const field = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-50';
const primary = 'rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';

export default function AdminUpdateAmountView() {
  const [sellers, setSellers] = useState<ConsignMerchantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState('add');
  const [pending, setPending] = useState<{ email: string; amountCents: number; reference: string } | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const seller = sellers.find(item => item.email === email);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/admin/owners?view=merchants', { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.merchants)) throw new Error();
        if (!controller.signal.aborted) setSellers(data.merchants);
      } catch {
        if (!controller.signal.aborted) setError('Could not load registered sellers. Reopen Update Amount to retry.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  function review(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const cents = Math.round(Number(amount) * 100);
    if (!seller || !/^\d+(\.\d{1,2})?$/.test(amount) || cents < 1 || cents > 1_000_000_000) {
      setError('Choose a seller and enter $0.01 to $10,000,000, with up to two decimal places.');
      return;
    }
    setPending({ email, amountCents: operation === 'add' ? cents : -cents, reference: crypto.randomUUID() });
  }

  async function confirm() {
    if (!pending || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/update-amount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending),
      });
      const data = await response.json();
      if (response.status >= 500) throw new Error();
      if (Number.isSafeInteger(data.balanceCents)) {
        setSellers(items => items.map(item => item.email === pending.email ? { ...item, balance: data.balanceCents / 100 } : item));
      }
      if (!response.ok) {
        setError(data.error || 'Unable to update the wallet.');
      } else {
        if (!data.reference || !Number.isSafeInteger(data.balanceCents)) throw new Error();
        setMessage('Wallet updated. New balance ' + usd(data.balanceCents / 100) + '.');
        setAmount('');
      }
      setPending(null);
      setUncertain(false);
    } catch {
      setUncertain(true);
      setError('The result could not be confirmed. Retry to check the same adjustment.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
    <h1 className="text-xl font-bold text-gray-900">Update Amount</h1>
    <form onSubmit={review} className="space-y-4">
      <label className="block text-sm font-semibold">Seller account
        <select required className={field} disabled={loading || !!pending} value={email}
          onChange={event => { setEmail(event.target.value); setAmount(''); setMessage(''); setError(''); }}>
          <option value="">{loading ? 'Loading sellers…' : 'Select a registered seller'}</option>
          {sellers.map(item => <option key={item.email} value={item.email}>{item.name} · {item.email}</option>)}
        </select>
      </label>
      {seller && <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-gray-600">Current wallet balance</p>
        <p className="text-2xl font-semibold text-gray-900">{usd(seller.balance)}</p>
      </div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Action
          <select className={field} value={operation} disabled={!!pending} onChange={event => setOperation(event.target.value)}>
            <option value="add">Add funds</option><option value="subtract">Subtract funds</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Amount (USD)
          <input className={field} required type="number" min="0.01" max="10000000" step="0.01" inputMode="decimal" placeholder="0.00"
            value={amount} disabled={!!pending} onChange={event => setAmount(event.target.value)} />
        </label>
      </div>
      {!pending && <button className={primary} disabled={!seller || !amount}>Review update</button>}
    </form>
    {pending && seller && <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm">{pending.amountCents > 0 ? 'Add ' : 'Subtract '}<strong>{usd(Math.abs(pending.amountCents) / 100)}</strong>
        {pending.amountCents > 0 ? ' to ' : ' from '}<strong>{seller.name}</strong> ({pending.email})?</p>
      <div className="flex gap-3"><button type="button" className={primary} disabled={saving} onClick={confirm}>
        {saving ? 'Saving…' : uncertain ? 'Retry confirmation' : 'Confirm update'}
      </button>{!uncertain && <button type="button" className="px-3 text-sm font-semibold" disabled={saving} onClick={() => setPending(null)}>Cancel</button>}</div>
    </div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-green-700">{message}</p>}
  </section>;
}
