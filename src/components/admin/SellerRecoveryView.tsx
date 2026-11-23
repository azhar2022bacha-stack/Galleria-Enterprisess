'use client';
import { useEffect, useState } from 'react';

type Seller = { id: string; shopName: string; email: string };
const button = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

export default function SellerRecoveryView() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [account, select] = useState('');
  const [link, setLink] = useState('');
  const [destination, setDestination] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/seller-recovery', {cache:'no-store',signal:controller.signal})
      .then(async r => { if (!r.ok) throw Error(); setSellers((await r.json()).sellers); })
      .catch(() => { if (!controller.signal.aborted) setMessage('Could not load the seller list. Reopen this menu to retry.'); });
    return () => controller.abort();
  }, []);
  async function generate() {
    setBusy(true); setMessage(''); setLink('');
    try {
      const response = await fetch('/api/admin/seller-recovery', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({account,action:'issue',email:destination})});
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Please sign in again.');
      const url = new URL('/seller/recovery', window.location.origin);
      url.hash = new URLSearchParams({reset:data.token}).toString();
      setLink(url.href);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Request failed.'); }
    finally { setBusy(false); }
  }
  return <section className="max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold">Seller Account Recovery</h2>
    <p className="text-sm text-slate-600">Verify the seller’s identity and send the link privately to the new sign-in email entered below. Each link expires within 30 minutes. Generating a new recovery link replaces the previous request.</p>
    <label className="block text-sm font-semibold">Seller
      <select disabled={busy} value={account} onChange={e=>{select(e.target.value);setLink('');setDestination('');setMessage('');}} className="mt-1 block w-full rounded-lg border p-2">
        <option value="">Select a shop</option>{sellers.map(s=><option key={s.id} value={s.email}>{s.shopName} · {s.id} · {s.email}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold">New sign-in email
      <input type="email" disabled={busy} value={destination} onChange={e=>{setDestination(e.target.value);setLink('');setMessage('');}} className="mt-1 block w-full rounded-lg border p-2" />
    </label>
    <button className={button} disabled={!account || !destination.trim() || busy} onClick={generate}>Generate recovery link</button>
    {link && <div className="flex gap-2"><input aria-label="Recovery link" readOnly value={link} onFocus={e=>e.target.select()} className="min-w-0 flex-1 rounded border p-2" /><button className={button} onClick={()=>navigator.clipboard?.writeText(link).then(()=>setMessage('Recovery link copied.')).catch(()=>setMessage('Select the link and copy it manually.'))}>Copy link</button></div>}
    {link && <a className="block font-semibold text-blue-700 underline" href={'mailto:' + encodeURIComponent(destination.trim()) + '?subject=Recover%20your%20seller%20account&body=' + encodeURIComponent('Open this link to set your seller sign-in credentials: ' + link)}>Email this link to {destination.trim()}</a>}
    <p role="status" className="text-sm">{message}</p>
  </section>;
}
