'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { validatePasswordComplexity } from '@/lib/passwordValidation';

interface AdminAccount {
  id: string;
  email: string;
  role: 'admin·root' | 'Admin';
  isRoot: boolean;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLogin?: string;
}

interface AdminAccountsViewProps {
  notify?: (msg: string) => void;
}

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#b89b43] focus:ring-4 focus:ring-[#d6bd6b]/15';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={256} required className={`${inputClass} pr-12`} placeholder={placeholder} />
        <button type="button" onClick={onToggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Notice({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  if (!message) return null;
  const success = tone === 'success';
  return (
    <div role={success ? 'status' : 'alert'} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
      {success ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

export function AdminAccountsView({ notify }: AdminAccountsViewProps) {
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirm, setNewAdminConfirm] = useState('');
  const [newAdminPasswordsVisible, setNewAdminPasswordsVisible] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [pendingId, setPendingId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const sessionResponse = await fetch('/api/admin/auth/session', { cache: 'no-store' });
        const sessionData = await readResponse(sessionResponse);
        if (cancelled) return;
        setAccount(sessionData.account);
        if (sessionData.account.isRoot) {
          const accountsResponse = await fetch('/api/admin/accounts', { cache: 'no-store' });
          const accountsData = await readResponse(accountsResponse);
          if (!cancelled) setAdmins(accountsData.accounts || []);
        }
      } catch (error) {
        if (!cancelled) setPasswordError(error instanceof Error ? error.message : 'Could not load admin account details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const passwordRules = useMemo(() => validatePasswordComplexity(newPassword), [newPassword]);
  const activeCount = admins.filter((admin) => admin.status === 'Active').length;

  const handlePasswordUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('The new password and confirmation do not match.');
      return;
    }
    if (!passwordRules.isValid) {
      setPasswordError(passwordRules.errors[0]);
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', currentPassword, newPassword, confirmPassword, email: account?.email }),
      });
      await readResponse(response);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordVisible(false);
      setPasswordSuccess('Your password has been updated. Use it the next time you sign in.');
      notify?.('Admin password updated successfully.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not update the password.');
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleCreateAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    if (newAdminPassword !== newAdminConfirm) {
      setAdminError('The password and confirmation do not match.');
      return;
    }
    const complexity = validatePasswordComplexity(newAdminPassword);
    if (!complexity.isValid) {
      setAdminError(complexity.errors[0]);
      return;
    }
    setCreateBusy(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, confirmPassword: newAdminConfirm }),
      });
      const data = await readResponse(response);
      setAdmins((current) => [...current, data.account]);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminConfirm('');
      setNewAdminPasswordsVisible(false);
      setAdminSuccess(`Admin access created for ${data.account.email}. Share the initial password with them securely.`);
      notify?.(`Admin account created for ${data.account.email}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not create the admin account.');
    } finally {
      setCreateBusy(false);
    }
  };

  const handleStatusChange = async (target: AdminAccount) => {
    setAdminError('');
    setAdminSuccess('');
    setPendingId(target.id);
    const status = target.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, email: target.email, status }),
      });
      await readResponse(response);
      setAdmins((current) => current.map((admin) => admin.id === target.id ? { ...admin, status } : admin));
      setAdminSuccess(`${target.email} is now ${status.toLowerCase()}.`);
      notify?.(`Admin ${target.email} ${status.toLowerCase()}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not update this account.');
    } finally {
      setPendingId('');
    }
  };

  const handleRemoveAdmin = async (target: AdminAccount) => {
    if (!window.confirm(`Permanently remove admin access for ${target.email}? Their account will no longer be able to sign in.`)) return;
    setAdminError('');
    setAdminSuccess('');
    setPendingId(target.id);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, email: target.email }),
      });
      await readResponse(response);
      setAdmins((current) => current.filter((admin) => admin.id !== target.id));
      setAdminSuccess(`Admin access for ${target.email} was removed.`);
      notify?.(`Admin ${target.email} removed.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not remove this account.');
    } finally {
      setPendingId('');
    }
  };

  if (loading) {
    return <div className="mx-auto flex min-h-72 max-w-7xl items-center justify-center text-sm text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading admin accounts…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8 animate-fadeIn">
      <section className="relative overflow-hidden rounded-3xl bg-[#101b2d] px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-9">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -right-2 -top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#e2c766]"><ShieldCheck className="h-5 w-5" /></div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e2c766]">Access & security</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Admin accounts</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Manage your sign-in security and give trusted teammates controlled access to the back office.</p>
          </div>
          <div className="flex gap-3">
            <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Administrators</p>
              <p className="mt-1 text-xl font-semibold">{account?.isRoot ? admins.length : '—'}</p>
            </div>
            <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Active access</p>
              <p className="mt-1 text-xl font-semibold">{account?.isRoot ? activeCount : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {!account?.isRoot && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          You are signed in as <strong>{account?.email}</strong>. You can change your own password below. Only <strong>admin·root</strong> can add, suspend, reactivate, or remove administrator accounts.
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><KeyRound className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Your password</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Confirm your current password before choosing a new one.</p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101b2d] text-xs font-semibold text-white">{account?.email?.slice(0, 1).toUpperCase() || 'A'}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{account?.email || 'Admin account'}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500"><BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />{account?.role || 'Admin'}</p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Notice message={passwordError} tone="error" />
            <Notice message={passwordSuccess} tone="success" />
            <PasswordField id="current-admin-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Enter current password" visible={passwordVisible} onToggle={() => setPasswordVisible((value) => !value)} />
            <PasswordField id="new-admin-password" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" placeholder="Create a strong password" visible={passwordVisible} onToggle={() => setPasswordVisible((value) => !value)} />
            {newPassword && <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 sm:grid-cols-3">
              {[
                ['8+ characters', passwordRules.hasMinLength],
                ['Uppercase letter', passwordRules.hasUppercase],
                ['Lowercase letter', passwordRules.hasLowercase],
                ['Number', passwordRules.hasNumber],
                ['Symbol', passwordRules.hasSpecialChar],
              ].map(([label, valid]) => <span key={String(label)} className={`flex items-center gap-1.5 ${valid ? 'text-emerald-700' : ''}`}><span className={`h-1.5 w-1.5 rounded-full ${valid ? 'bg-emerald-500' : 'bg-slate-300'}`} />{String(label)}</span>)}
            </div>}
            <PasswordField id="confirm-admin-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Enter the new password again" visible={passwordVisible} onToggle={() => setPasswordVisible((value) => !value)} />
            <button type="submit" disabled={passwordBusy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#101b2d] px-4 text-sm font-semibold text-white transition hover:bg-[#1a2b44] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {passwordBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {passwordBusy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        {account?.isRoot ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserPlus className="h-5 w-5" /></div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add an administrator</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Create a separate sign-in for a trusted back-office teammate.</p>
              </div>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <Notice message={adminError} tone="error" />
              <Notice message={adminSuccess} tone="success" />
              <div>
                <label htmlFor="new-admin-email" className={labelClass}>Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="new-admin-email" type="email" maxLength={255} autoComplete="email" required value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} className={`${inputClass} pl-10`} placeholder="name@company.com" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField id="new-team-admin-password" label="Initial password" value={newAdminPassword} onChange={setNewAdminPassword} autoComplete="new-password" placeholder="Create a strong password" visible={newAdminPasswordsVisible} onToggle={() => setNewAdminPasswordsVisible((value) => !value)} />
                <PasswordField id="new-team-admin-confirm" label="Confirm password" value={newAdminConfirm} onChange={setNewAdminConfirm} autoComplete="new-password" placeholder="Enter it again" visible={newAdminPasswordsVisible} onToggle={() => setNewAdminPasswordsVisible((value) => !value)} />
              </div>
              <p className="text-[11px] leading-5 text-slate-500">Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.</p>
              <button type="submit" disabled={createBusy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d6bd6b] px-4 text-sm font-semibold text-slate-950 transition hover:bg-[#c9ad53] disabled:cursor-wait disabled:opacity-60">
                {createBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {createBusy ? 'Creating…' : 'Create admin account'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-sm font-semibold text-slate-800">Admin management is restricted</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">Only the protected main administrator can manage other admin accounts.</p>
          </div>
        )}
      </section>

      {account?.isRoot && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Users className="h-4 w-4" /></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Administrator access</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Suspend access temporarily or remove an account permanently.</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{activeCount} active</span>
        </div>
        <div className="divide-y divide-slate-100">
          {admins.map((admin) => (
            <div key={admin.id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${admin.isRoot ? 'bg-[#101b2d] text-[#e2c766]' : 'bg-slate-100 text-slate-700'}`}>{admin.email.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{admin.email}</p>
                    {admin.isRoot && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"><ShieldCheck className="h-3 w-3" />admin·root</span>}
                    {!admin.isRoot && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">Admin</span>}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className={`inline-flex items-center gap-1.5 ${admin.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${admin.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{admin.status}</span>
                    <span>Created {new Date(admin.createdAt).toLocaleDateString()}</span>
                    {admin.lastLogin && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />Last sign-in {new Date(admin.lastLogin).toLocaleString()}</span>}
                  </p>
                </div>
              </div>
              {admin.isRoot ? <span className="w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500">Protected account</span> : <div className="flex items-center gap-2 sm:justify-end">
                <button type="button" onClick={() => void handleStatusChange(admin)} disabled={pendingId === admin.id} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${admin.status === 'Active' ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
                  {pendingId === admin.id ? 'Saving…' : admin.status === 'Active' ? 'Suspend access' : 'Reactivate'}
                </button>
                <button type="button" onClick={() => void handleRemoveAdmin(admin)} disabled={pendingId === admin.id} aria-label={`Remove ${admin.email}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50" title="Remove admin access">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>}
            </div>
          ))}
          {admins.length === 0 && <div className="px-6 py-12 text-center text-sm text-slate-500">No admin accounts found.</div>}
        </div>
      </section>}
    </div>
  );
}
