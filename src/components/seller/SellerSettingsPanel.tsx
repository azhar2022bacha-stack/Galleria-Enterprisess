'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  Store,
  Trash2,
} from 'lucide-react';
import {
  getShopSettings,
  hasSavedShopSettings,
  saveShopSettings,
} from '@/lib/sellerOrders';
import type { ShopSettings } from '@/lib/sellerOrders';

interface SellerSettingsPanelProps {
  onOpenNotifications: () => void;
  notify?: (msg: string) => void;
}

const MAX_LOGO_SIZE = 8 * 1024 * 1024;

async function getResponseData(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export function SellerSettingsPanel({ onOpenNotifications, notify }: SellerSettingsPanelProps) {
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const applySettings = (settings: ShopSettings) => {
      setShopName(settings.shopName || 'Ansar collection');
      setDescription(settings.description || '');
      setLogoUrl(settings.logoUrl || null);
    };

    fetch('/api/seller/shop-settings', { cache: 'no-store' })
      .then(getResponseData)
      .then((data) => {
        if (data.hasSavedSettings) {
          setShopName('');
          setDescription('');
          setLogoUrl(null);
          return;
        }

        if (hasSavedShopSettings()) {
          applySettings(getShopSettings());
        } else {
          applySettings(data.settings);
          saveShopSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      notify?.('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      notify?.('The logo must be 8 MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        notify?.('Logo ready. Save your shop settings to publish it.');
      }
    };
    reader.onerror = () => notify?.('Could not read that image. Please choose another file.');
    reader.readAsDataURL(file);
  };

  const handleSaveBasicInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingBasicInfo(true);
    try {
      const response = await fetch('/api/seller/shop-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shopName.trim(),
          description: description.trim(),
          logoUrl: logoUrl || '',
        }),
      });
      const data = await getResponseData(response);
      const saved = data.settings as ShopSettings;
      saveShopSettings(saved);
      setShopName('');
      setDescription('');
      setLogoUrl(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      notify?.('Shop settings saved. The form is clear for your next update.');
    } catch (error: any) {
      notify?.(error?.message || 'Could not save shop settings.');
    } finally {
      setSavingBasicInfo(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setUpdatingPassword(true);
    try {
      const response = await fetch('/api/seller/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await getResponseData(response);
      notify?.(data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      notify?.(error?.message || 'Could not update your password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl animate-fadeIn space-y-6 pb-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 shadow-sm sm:p-7">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/15">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Seller workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Shop settings</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Manage the details shoppers see and keep your sign-in password up to date.
            </p>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Store className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Basic information</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">These details appear on your public store.</p>
          </div>
        </div>

        <form onSubmit={handleSaveBasicInfo} className="space-y-5 px-5 py-6 sm:px-7">
          <div className="max-w-2xl">
            <label htmlFor="seller-shop-name" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Shop name <span className="text-rose-500">*</span>
            </label>
            <input
              id="seller-shop-name"
              type="text"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              maxLength={80}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Shop logo</label>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-[11px] text-slate-400 shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt="Shop logo preview" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  onChange={handleLogoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/15"
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload image
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
                <p className="w-full text-[11px] text-slate-500">JPG, PNG, or WebP · up to 8 MB</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="seller-shop-description" className="block text-xs font-semibold text-slate-700">
                Description
              </label>
              <span className="text-[11px] text-slate-400">{description.length}/2,000</span>
            </div>
            <textarea
              id="seller-shop-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              placeholder="Tell shoppers what makes your shop special"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={savingBasicInfo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingBasicInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingBasicInfo ? 'Saving…' : 'Save changes'}
            </button>
            <span className="text-[11px] text-slate-500">Your changes are saved to your seller account.</span>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Notifications &amp; verification</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              New-order alerts, settlement notices, and your account verification status are in the Notifications inbox.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenNotifications}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
        >
          Open notifications
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <LockKeyhole className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Login &amp; security</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Verify your current password before setting a new one.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5 px-5 py-6 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="seller-current-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Current password
              </label>
              <input
                id="seller-current-password"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your current password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label htmlFor="seller-new-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                New password
              </label>
              <input
                id="seller-new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="8+ characters with upper/lowercase, a number, and a symbol"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            Show password
          </label>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={updatingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              {updatingPassword ? 'Updating…' : 'Update password'}
            </button>
            <span className="text-[11px] text-slate-500">You will stay signed in on this device.</span>
          </div>
        </form>
      </section>
    </div>
  );
}
