'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, RefreshCw, ShieldCheck, Store, Wallet } from 'lucide-react';
import {
  CRYPTO_RECEIVING_NETWORKS,
  type CryptoReceivingAddressMap,
  type CryptoReceivingNetworkId,
  validateCryptoReceivingAddress,
} from '@/lib/cryptoReceivingAddresses';

interface OwnerRecord {
  id: string;
  email: string;
  name?: string;
  shopName?: string;
  fullName?: string;
}

interface RechargeRecord {
  id: string;
  reference?: string;
  handle?: string;
  depositor?: string;
  network?: string;
  amount?: number;
  creditedAmount?: number;
  submittedAt?: string;
  reviewedAt?: string;
  status?: string;
}

interface AdminReceivingAddressViewProps {
  notify?: (msg: string) => void;
}

const EMPTY_ADDRESSES: CryptoReceivingAddressMap = {};
const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

export function AdminReceivingAddressView({ notify }: AdminReceivingAddressViewProps) {
  const [addresses, setAddresses] = useState<CryptoReceivingAddressMap>(EMPTY_ADDRESSES);
  const [sellerOverrides, setSellerOverrides] = useState<Record<string, CryptoReceivingAddressMap>>({});
  const [drafts, setDrafts] = useState<Partial<Record<CryptoReceivingNetworkId, string>>>({});
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [targetEmail, setTargetEmail] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [savingNetwork, setSavingNetwork] = useState<CryptoReceivingNetworkId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedNetwork, setCopiedNetwork] = useState<CryptoReceivingNetworkId | null>(null);
  const targetEmailRef = useRef(targetEmail);
  targetEmailRef.current = targetEmail;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [addressResponse, ownersResponse, rechargeResponse] = await Promise.all([
        fetch('/api/receiving-addresses?scope=admin', { cache: 'no-store' }),
        fetch('/api/admin/owners', { cache: 'no-store' }),
        fetch('/api/recharges', { cache: 'no-store' }),
      ]);
      const [addressPayload, ownersPayload, rechargePayload] = await Promise.all([
        addressResponse.json(), ownersResponse.json(), rechargeResponse.json(),
      ]);
      if (!addressResponse.ok || addressPayload?.success === false) throw new Error(addressPayload?.error || 'Could not load receiving addresses.');
      if (!ownersResponse.ok || ownersPayload?.success === false) throw new Error(ownersPayload?.error || 'Could not load the seller list.');
      if (!rechargeResponse.ok) throw new Error(rechargePayload?.error || 'Could not load top-up activity.');

      const nextAddresses = addressPayload?.addresses && typeof addressPayload.addresses === 'object' ? addressPayload.addresses : {};
      const nextOverrides = addressPayload?.sellerOverrides && typeof addressPayload.sellerOverrides === 'object' ? addressPayload.sellerOverrides : {};
      setAddresses(nextAddresses);
      setSellerOverrides(nextOverrides);
      const currentSeller = targetEmailRef.current;
      setDrafts(Object.fromEntries(CRYPTO_RECEIVING_NETWORKS.map(({ id }) => [
        id,
        currentSeller ? nextOverrides[currentSeller]?.[id] || nextAddresses[id] || '' : nextAddresses[id] || '',
      ])) as Partial<Record<CryptoReceivingNetworkId, string>>);
      setOwners(Array.isArray(ownersPayload?.owners) ? ownersPayload.owners : []);
      setRecharges(Array.isArray(rechargePayload?.recharges) ? rechargePayload.recharges : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load receiving address data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const selectedSeller = useMemo(
    () => owners.find((owner) => owner.email.trim().toLowerCase() === targetEmail),
    [owners, targetEmail]
  );

  const effectiveAddress = (networkId: CryptoReceivingNetworkId) =>
    sellerOverrides[targetEmail]?.[networkId] || addresses[networkId] || '';

  const chooseTarget = (email: string) => {
    setTargetEmail(email);
    setDrafts(Object.fromEntries(CRYPTO_RECEIVING_NETWORKS.map(({ id }) => [
      id,
      email ? sellerOverrides[email]?.[id] || addresses[id] || '' : addresses[id] || '',
    ])) as Partial<Record<CryptoReceivingNetworkId, string>>);
    setError('');
  };

  const persistAddress = async (networkId: CryptoReceivingNetworkId, address: string, useGlobal = false) => {
    const target = targetEmail ? 'seller' : 'all';
    const sellerEmail = target === 'seller' ? targetEmail : '';
    if (target === 'all' || (target === 'seller' && !useGlobal && address)) {
      const validationError = validateCryptoReceivingAddress(networkId, address);
      if (validationError) { setError(validationError); return; }
    }

    setSavingNetwork(networkId);
    setError('');
    try {
      const response = await fetch('/api/receiving-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, sellerEmail, networkId, address: useGlobal ? '' : address }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) throw new Error(payload?.error || 'Unable to save this receiving address.');
      setAddresses(payload.addresses || {});
      setSellerOverrides(payload.sellerOverrides || {});
      const nextAddress = targetEmail && !useGlobal
        ? address
        : (payload.addresses?.[networkId] || '');
      setDrafts((current) => ({ ...current, [networkId]: nextAddress }));
      notify?.(`${CRYPTO_RECEIVING_NETWORKS.find((item) => item.id === networkId)?.name} address saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this receiving address.');
    } finally {
      setSavingNetwork(null);
    }
  };

  const networkActivity = useMemo(() => {
    return CRYPTO_RECEIVING_NETWORKS.map((network) => {
      const rows = recharges
        .filter((recharge) => String(recharge.network || '').trim().toLowerCase() === network.name.toLowerCase())
        .sort((left, right) => Date.parse(String(right.reviewedAt || right.submittedAt || '')) - Date.parse(String(left.reviewedAt || left.submittedAt || '')));
      const confirmed = rows.filter((row) => String(row.status || '').toLowerCase() === 'confirmed');
      return {
        ...network,
        rows,
        confirmedCount: confirmed.length,
        totalCount: rows.length,
        confirmedAmount: confirmed.reduce((total, row) => total + Number(row.creditedAmount ?? row.amount ?? 0), 0),
      };
    });
  }, [recharges]);

  const handleCopyAddress = async (networkId: CryptoReceivingNetworkId, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedNetwork(networkId);
      window.setTimeout(() => setCopiedNetwork(null), 1800);
      notify?.('Receiving address copied.');
    } catch {
      setError('Could not copy the address. Select and copy it manually.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl animate-fadeIn space-y-5 pb-12">
      <section className="overflow-hidden rounded-2xl bg-[#101d34] px-5 py-6 text-white shadow-lg sm:px-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-100">
              <Wallet className="h-3.5 w-3.5 text-[#e1bd62]" /> Crypto deposit setup
            </span>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Receiving Addresses</h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Set verified deposit addresses for all sellers or assign a different address to one seller. Seller wallets use these saved addresses.
            </p>
          </div>
          <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-60">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Store className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <label htmlFor="receiving-address-target" className="block text-xs font-bold text-slate-900">Apply addresses to</label>
            <p className="mt-1 text-[11px] text-slate-500">Saving “All sellers” updates the shared address and clears seller-specific overrides for that network.</p>
            <select id="receiving-address-target" value={targetEmail} onChange={(event) => chooseTarget(event.target.value)} className="mt-3 w-full max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option value="">All sellers</option>
              {owners.map((owner) => <option key={owner.email} value={owner.email.trim().toLowerCase()}>{owner.shopName || owner.name || owner.fullName || owner.email} · {owner.email}</option>)}
            </select>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" /> Server-saved</span>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-2">
        {CRYPTO_RECEIVING_NETWORKS.map((network) => {
          const address = drafts[network.id] ?? effectiveAddress(network.id);
          const override = Boolean(targetEmail && sellerOverrides[targetEmail]?.[network.id]);
          const validation = address ? validateCryptoReceivingAddress(network.id, address) : null;
          const isSaving = savingNetwork === network.id;
          return (
            <article key={network.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{network.name}</h2>
                  <p className="mt-1 text-[11px] text-slate-500">{network.chain} network</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${override ? 'bg-violet-50 text-violet-700' : address ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {override ? 'Seller override' : address ? targetEmail ? 'Using shared address' : 'Configured for all' : 'Not configured'}
                </span>
              </div>
              <label htmlFor={`address-${network.id}`} className="mt-4 block text-[10px] font-semibold text-slate-600">{selectedSeller ? `Deposit address for ${selectedSeller.shopName || selectedSeller.name || selectedSeller.email}` : 'Shared deposit address'}</label>
              <input id={`address-${network.id}`} type="text" autoComplete="off" spellCheck={false} value={address} onChange={(event) => setDrafts((current) => ({ ...current, [network.id]: event.target.value }))} placeholder={network.format === 'tron' ? 'T… (34 characters)' : '0x… (42 characters)'} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
              <p className={`mt-1.5 min-h-4 text-[10px] ${validation ? 'text-rose-600' : 'text-slate-400'}`}>{validation || (address ? 'Address format looks valid. Verify it belongs to the selected network before saving.' : 'Enter an address to enable crypto deposits for this network.')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void persistAddress(network.id, address)} disabled={isSaving || loading || !address || Boolean(validation)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#101d34] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#1c2d49] disabled:cursor-not-allowed disabled:opacity-45">
                  {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{isSaving ? 'Saving…' : 'Save address'}
                </button>
                {targetEmail && override && <button type="button" onClick={() => void persistAddress(network.id, '', true)} disabled={isSaving} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Use shared address</button>}
                {address && <button type="button" onClick={() => void handleCopyAddress(network.id, address)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                  {copiedNetwork === network.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copiedNetwork === network.id ? 'Copied' : 'Copy'}
                </button>}
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-bold text-slate-900">Top-ups by network</h2>
          <p className="mt-1 text-[11px] text-slate-500">Live recharge requests recorded by the platform. Confirmed totals use the credited amount.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {networkActivity.map((group) => {
            const expanded = Boolean(expandedGroups[group.id]);
            return (
              <div key={group.id}>
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{group.totalCount} request(s) · {group.confirmedCount} confirmed · {money(group.confirmedAmount)} credited</p>
                  </div>
                  <button type="button" onClick={() => setExpandedGroups((current) => ({ ...current, [group.id]: !current[group.id] }))} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 sm:self-auto">
                    {expanded ? 'Hide requests' : 'View requests'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {expanded && <div className="overflow-x-auto border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                  {group.rows.length ? <table className="w-full min-w-[650px] text-left text-[10px]">
                    <thead><tr className="text-slate-500"><th className="py-2 pr-4">Reference</th><th className="py-2 pr-4">Seller</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Submitted</th><th className="py-2 text-right">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-200/70">{group.rows.map((row) => <tr key={row.id} className="text-slate-700">
                      <td className="py-2.5 pr-4 font-mono">{row.reference || row.id}</td><td className="py-2.5 pr-4">{row.handle || row.depositor || '—'}</td><td className="py-2.5 pr-4 font-semibold">{money(Number(row.creditedAmount ?? row.amount ?? 0))}</td><td className="py-2.5 pr-4">{formatDate(row.reviewedAt || row.submittedAt)}</td><td className="py-2.5 text-right"><span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${statusClass(row.status || 'Pending')}`}>{row.status || 'Pending'}</span></td>
                    </tr>)}</tbody>
                  </table> : <p className="py-3 text-[11px] text-slate-500">No top-up requests recorded for this network.</p>}
                </div>}
              </div>
            );
          })}
        </div>
        {!loading && networkActivity.every((group) => group.totalCount === 0) && <p className="border-t border-slate-100 px-5 py-4 text-[11px] text-slate-500">No crypto top-up records are available.</p>}
      </section>
      <p className="text-[10px] leading-relaxed text-slate-400">Only an address saved here is shown for crypto deposits. The form checks the network address format; verify the address and network before enabling deposits.</p>
    </div>
  );
}
