'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function SellerRecoveryPage() {
  const [token,setToken] = useState('');
  const [verify,setVerify] = useState(false);
  const [busy,setBusy] = useState(false);
  const [done,setDone] = useState(false);
  const [message,setMessage] = useState('');
  useEffect(()=>{
    const params = new URLSearchParams(window.location.hash.slice(1));
    setVerify(params.has('verify'));
    const value = params.get('verify') || params.get('reset') || '';
    if (/^[a-f0-9]{64}$/.test(value)) setToken(value);
    else setMessage('Invalid link. Ask the admin for a new recovery link.');
  },[]);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!verify && form.get('password') !== form.get('confirm')) {setMessage('Passwords must match.');return;}
    setBusy(true);setMessage('');
    try {
      const response = await fetch('/api/seller/recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action:verify?'verify':'request',email:form.get('email'),password:form.get('password')})});
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Request failed.');
      setDone(true);setToken('');
      window.history.replaceState(null,'',window.location.pathname);
      setMessage(verify?'Your sign-in details have been updated.':'Your new credentials are pending. Ask the admin to send the verification email, then open it to finish.');
    } catch(err) {setMessage(err instanceof Error ? err.message : 'Request failed.');}
    finally {setBusy(false);}
  }
  const field='mt-1 block w-full rounded-lg border p-2';
  return <main className="mx-auto max-w-md px-5 py-16"><h1 className="text-2xl font-bold">{verify?'Verify your new email':'Recover your seller account'}</h1>
    {!done && token && <form onSubmit={submit} className="mt-6 space-y-4">
      {!verify && <><label className="block">New sign-in email<input className={field} type="email" name="email" required autoComplete="email" /></label>
      <label className="block">New password<input className={field} type="password" name="password" required maxLength={256} autoComplete="new-password" /></label>
      <label className="block">Confirm new password<input className={field} type="password" name="confirm" required autoComplete="new-password" /></label></>}
      {verify && <p>Confirm this email address to activate your new seller sign-in details.</p>}
      <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy?'Saving…':verify?'Verify email and save credentials':'Continue to email verification'}</button>
    </form>}
    <p role="status" className="mt-4 text-sm">{message}</p>
    {done && verify && <Link href="/seller?mode=signin" className="mt-4 inline-block text-blue-700 underline">Sign in to your store</Link>}
  </main>;
}
