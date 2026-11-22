'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

type Seller = { email: string; name: string };
type Payment = { seller: Seller; amountCents: number; paymentId: string };

const formatUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;
const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-50';
const actionClass = 'rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';

export function AdminManualPaymentView() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [awaitingResult, setAwaitingResult] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSellers() {
      try {
        const response = await fetch('/api/admin/manual-payment', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load verified sellers. Reopen this page to retry.');
        const data = await response.json();
        if (!controller.signal.aborted) setSellers(data.sellers);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load verified sellers.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSellers();
    return () => controller.abort();
  }, []);

  function reviewPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const seller = sellers.find((item) => item.email === email);
    const amountCents = Math.round(Number(amount) * 100);
    if (!seller || !/^\d+(\.\d{1,2})?$/.test(amount) || amountCents < 1 || amountCents > 1_000_000_000) {
      setError('Select a verified seller and enter a USD amount from $0.01 to $10,000,000.');
      return;
    }
    setError('');
    setSuccess('');
    setPayment({ seller, amountCents, paymentId: crypto.randomUUID() });
  }

  async function confirmPayment() {
    if (!payment || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payment.seller.email,
          amountCents: payment.amountCents,
          paymentId: payment.paymentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status < 500) {
          setError(data.error || 'Unable to save the payment.');
          return;
        }
        throw new Error(data.error);
      }
      setSuccess(formatUsd(data.amount) + ' credited to ' + payment.seller.name + '. Reference ' + data.reference + '.');
      setAmount('');
      setPayment(null);
      setAwaitingResult(false);
    } catch {
      setAwaitingResult(true);
      setError('The payment result could not be confirmed. Use Retry confirmation to check and finish the same payment.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Manual Payment</h1>
        <p className="mt-1 text-sm text-gray-600">Credit a verified seller’s available wallet balance.</p>
      </header>
      <form onSubmit={reviewPayment} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="manual-payment-seller" className="block text-sm font-semibold text-gray-800">Verified seller</label>
          <select id="manual-payment-seller" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading || sellers.length === 0 || Boolean(payment)} required>
            <option value="">{loading ? 'Loading verified sellers…' : 'Select a seller'}</option>
            {sellers.map((seller) => <option key={seller.email} value={seller.email}>{seller.name} ({seller.email})</option>)}
          </select>
          {!loading && !error && sellers.length === 0 && <p className="text-sm text-gray-600">No verified sellers are available.</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="manual-payment-amount" className="block text-sm font-semibold text-gray-800">Amount (USD)</label>
          <input id="manual-payment-amount" className={fieldClass} type="number" inputMode="decimal" min="0.01" max="10000000" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={Boolean(payment)} required />
        </div>
        {!payment && <button type="submit" className={actionClass} disabled={!email || !amount}>Review payment</button>}
      </form>
      {payment && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="break-words text-sm text-blue-950">
            Credit <strong>{formatUsd(payment.amountCents / 100)}</strong> to <strong>{payment.seller.name}</strong> ({payment.seller.email})?
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={actionClass} disabled={saving} onClick={confirmPayment}>
              {saving ? 'Saving…' : awaitingResult ? 'Retry confirmation' : 'Confirm payment'}
            </button>
            {!awaitingResult && (
              <button type="button" className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-950 disabled:opacity-50" disabled={saving} onClick={() => { setPayment(null); setError(''); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {success && <p role="status" className="break-words rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>}
    </section>
  );
}
