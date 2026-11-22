'use client';

import { useEffect, useState } from 'react';

type Seller = { email: string; name: string };
type Summary = { creditScore: number; visits: number; exposure: number; schedule: { intervalMinutes: number; remaining: number; limit: number } | null };
type Action = 'add' | 'reduce' | 'clear' | 'schedule' | 'stop' | 'set-score';

export function AdminStoreExposureView() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [directoryLoaded, setDirectoryLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState<Summary>();
  const [score, setScore] = useState('');
  const [amount, setAmount] = useState(5);
  const [minutes, setMinutes] = useState(10);
  const [limit, setLimit] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/store-exposure', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load registered sellers.');
        const data = await response.json();
        setSellers(data.sellers);
        setDirectoryLoaded(true);
      })
      .catch(() => { if (!controller.signal.aborted) setError('Could not load registered sellers.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!email || busy) return;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch('/api/admin/store-exposure?email=' + encodeURIComponent(email), { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!controller.signal.aborted) setSummary(data);
      } catch {
        if (!controller.signal.aborted) setError('Could not load the selected seller’s traffic.');
      }
    };
    void refresh();
    const timer = setInterval(refresh, 15_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [email, busy]);

  const change = async (action: Action) => {
    if (!email || busy) return;
    if (action === 'clear' && !window.confirm('Clear this seller’s exposure and stop scheduled additions?')) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/store-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action, amount: action === 'set-score' ? Number(score) : action === 'schedule' ? limit : amount, intervalMinutes: minutes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update exposure.');
      setSummary(data);
      if (action === 'set-score') setScore('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update exposure.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2';
  const button = 'rounded-lg border border-slate-300 px-3 py-2 font-medium disabled:opacity-40';
  return (
    <section className="max-w-3xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-900">
      <h1 className="text-lg font-semibold">Store Visitors &amp; Exposure</h1>
      <label className="block font-medium">
        Registered seller
        <select className={input + ' w-full'} value={email} disabled={busy} onChange={(event) => {
          setSummary(undefined);
          setScore('');
          setError('');
          setEmail(event.target.value);
        }}>
          <option value="">{directoryLoaded ? 'Select a seller' : 'Loading sellers…'}</option>
          {sellers.map((seller) => <option key={seller.email} value={seller.email}>{seller.name} ({seller.email})</option>)}
        </select>
      </label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {email && !summary && !error && <p role="status">Loading store counts…</p>}
      {summary && (
        <>
          <dl className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4" aria-live="polite">
            <div><dt>Store Visits</dt><dd className="text-xl font-semibold">{summary.visits.toLocaleString()}</dd></div>
            <div><dt>Platform Exposure</dt><dd className="text-xl font-semibold">{summary.exposure.toLocaleString()}</dd></div>
          </dl>
          <fieldset disabled={busy} className="flex flex-wrap items-end gap-2">
            <legend className="font-semibold">Visitor Ranking / Credit Score</legend>
            <p className="w-full text-slate-600">Current score: {summary.creditScore.toLocaleString()}</p>
            <label>New score<input className={input + ' w-36'} type="number" min={0} step={1} value={score} onChange={(event) => setScore(event.target.value)} /></label>
            <button type="button" className={button} disabled={!score || !Number.isSafeInteger(Number(score)) || Number(score) < 0} onClick={() => void change('set-score')}>Save score</button>
          </fieldset>
          <fieldset disabled={busy} className="flex flex-wrap items-end gap-2">
            <label>Exposure amount<input className={input + ' w-32'} type="number" min={1} max={100000} value={amount} onChange={(event) => setAmount(event.target.valueAsNumber || 0)} /></label>
            <button type="button" className={button} onClick={() => void change('add')}>Add</button>
            <button type="button" className={button} onClick={() => void change('reduce')}>Reduce</button>
            <button type="button" className={button + ' text-red-700'} onClick={() => void change('clear')}>Clear exposure</button>
          </fieldset>
          <fieldset disabled={busy} className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4">
            <legend className="font-semibold">Scheduled exposure</legend>
            <label>Interval<select className={input} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
              <option value="10">1 every 10 minutes</option>
              <option value="15">1 every 15 minutes</option>
            </select></label>
            <label>Maximum additions<input className={input + ' w-32'} type="number" min={1} max={100000} value={limit} onChange={(event) => setLimit(event.target.valueAsNumber || 0)} /></label>
            <button type="button" className={button} onClick={() => void change('schedule')}>{summary.schedule?.remaining ? 'Replace schedule' : 'Start schedule'}</button>
            <button type="button" className={button} disabled={!summary.schedule?.remaining} onClick={() => void change('stop')}>Stop schedule</button>
          </fieldset>
          <p role="status" className="text-slate-600">
            {busy ? 'Saving…' : summary.schedule?.remaining
              ? summary.schedule.remaining.toLocaleString() + ' additions remaining, one every ' + summary.schedule.intervalMinutes + ' minutes.'
              : 'No active schedule.'}
          </p>
        </>
      )}
    </section>
  );
}
