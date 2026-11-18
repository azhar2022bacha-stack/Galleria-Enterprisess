'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

type SetupStatus = { setupRequired: boolean; setupAllowed: boolean; email: string };

export default function AdminLoginPage() {
  const router = useRouter();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const checkSessionAndSetup = async () => {
      try {
        const sessionResponse = await fetch('/api/admin/auth/session', { cache: 'no-store' });
        if (sessionResponse.ok) {
          router.replace('/admin');
          return;
        }
        const response = await fetch('/api/admin/auth/setup-status', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not check admin setup.');
        if (cancelled) return;
        setSetupStatus(data);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Could not check admin setup.');
      }
    };
    void checkSessionAndSetup();
    return () => { cancelled = true; };
  }, [router]);

  const isSetup = setupStatus?.setupRequired && setupStatus.setupAllowed;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (isSetup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(isSetup ? '/api/admin/auth/setup' : '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to sign in.');
      router.replace('/admin');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f5f8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.42)] ring-1 ring-slate-200/80 md:grid md:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-[#101b2d] p-10 text-white md:flex">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#c7a756]/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7bc68] text-[#101b2d] shadow-lg shadow-black/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.16em]">GALLERIA</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Admin workspace</p>
            </div>
          </div>
          <div className="relative max-w-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7bc68]">Secure access</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">Your operations, kept in trusted hands.</h1>
            <p className="mt-5 text-sm leading-7 text-slate-300">Sign in with your administrator account to manage the back office and review account activity.</p>
          </div>
          <div className="relative flex items-center gap-2 text-[11px] text-slate-400">
            <KeyRound className="h-3.5 w-3.5 text-[#d7bc68]" />
            <span>Admin access is protected by your account credentials.</span>
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 md:hidden">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#101b2d] text-[#d7bc68]"><ShieldCheck className="h-6 w-6" /></div>
              <p className="text-xs font-bold tracking-[0.16em] text-slate-700">GALLERIA · ADMIN</p>
            </div>
            <div className="mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9c7b25]">Administrator access</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{isSetup ? 'Set up your main account' : 'Welcome back'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isSetup ? 'Create the first admin·root password to secure this admin panel.' : 'Enter your admin email and password to continue.'}
              </p>
            </div>

            {setupStatus?.setupRequired && !setupStatus.setupAllowed ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Admin sign-in has not been initialized. Set <code className="font-semibold">ADMIN_ROOT_EMAIL</code> and <code className="font-semibold">ADMIN_ROOT_PASSWORD</code> in the server environment. If no database URL is configured, also set <code className="font-semibold">ADMIN_SESSION_SECRET</code>, then restart the app.
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
                <div>
                  <label htmlFor="admin-email" className="mb-2 block text-xs font-semibold text-slate-700">Admin email</label>
                  <input id="admin-email" type="email" maxLength={255} autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b39746] focus:ring-4 focus:ring-[#d7bc68]/15" placeholder="admin@example.com" />
                </div>
                <div>
                  <label htmlFor="admin-password" className="mb-2 block text-xs font-semibold text-slate-700">{isSetup ? 'Create password' : 'Password'}</label>
                  <div className="relative">
                    <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete={isSetup ? 'new-password' : 'current-password'} required minLength={8} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#b39746] focus:ring-4 focus:ring-[#d7bc68]/15" placeholder="Enter your password" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {isSetup && <p className="mt-2 text-[11px] text-slate-500">Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.</p>}
                </div>
                {isSetup && <div>
                  <label htmlFor="admin-confirm-password" className="mb-2 block text-xs font-semibold text-slate-700">Confirm password</label>
                  <input id="admin-confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required maxLength={256} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b39746] focus:ring-4 focus:ring-[#d7bc68]/15" placeholder="Enter the password again" />
                </div>}
                <button type="submit" disabled={loading || !setupStatus} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#101b2d] px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#1a2b44] disabled:cursor-wait disabled:opacity-60">
                  {loading ? 'Please wait…' : isSetup ? 'Create main admin account' : 'Sign in'}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">Admin sessions expire after 8 hours. Never share your password with another person.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
