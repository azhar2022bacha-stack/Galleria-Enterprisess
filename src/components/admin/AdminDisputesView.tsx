'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Loader2, MessageSquare, RotateCw, ShieldCheck } from 'lucide-react';
import { sendSellerNotification } from '@/lib/sellerNotifications';
import { DisputeOrderDetails, type DisputeOrderProduct } from '@/components/DisputeOrderDetails';

interface DisputeMessage {
  id: string;
  authorRole: 'admin' | 'seller';
  author: string;
  text: string;
  createdAt: string;
}

interface DisputeItem {
  id: string;
  orderId?: string;
  orderNumber: string;
  productName: string;
  shop: string;
  shopperName?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerStreetAddress?: string;
  products?: DisputeOrderProduct[];
  unreadAdminCount?: number;
  reason: string;
  amount: string;
  openedAt: string;
  updatedAt: string;
  status: 'open' | 'refunded' | 'rejected';
  messages: DisputeMessage[];
}

const INITIAL_DISPUTES: DisputeItem[] = [{
  id: 'disp-19',
  orderNumber: '#19',
  productName: 'Vitamin C 1000mg',
  shop: 'Platform',
  reason: 'qa test',
  amount: '$0.00',
  openedAt: '8/13/2026, 9:52:02 AM',
  updatedAt: '8/13/2026, 9:52:02 AM',
  status: 'open',
  messages: [],
}];

const STORAGE_KEY = 'buyxoco_admin_disputes';
const buttonClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

async function requestDisputes(): Promise<DisputeItem[]> {
  const response = await fetch('/api/consign/disputes', { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load disputes.');
  return Array.isArray(result.disputes) ? result.disputes : [];
}

async function markDisputesRead(role: 'admin' | 'seller', id: string): Promise<boolean> {
  try {
    const response = await fetch('/api/consign/disputes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', role, id }),
    });
    const result = await response.json();
    return response.ok && Boolean(result?.success);
  } catch {
    return false;
  }
}

function localDisputes(): DisputeItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DISPUTES));
      return INITIAL_DISPUTES;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : INITIAL_DISPUTES;
  } catch {
    return INITIAL_DISPUTES;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || '—' : date.toLocaleString();
}

function Conversation({
  dispute,
  draft,
  saving,
  onDraftChange,
  onSend,
}: {
  dispute: DisputeItem;
  draft: string;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700"><MessageSquare className="h-3.5 w-3.5" />Messages and reply</div>
      {dispute.messages?.length ? (
        <div className="mb-3 space-y-2">
          {dispute.messages.map((message) => (
            <div key={message.id} className="rounded-md border border-gray-100 bg-white px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
                <span className="font-semibold text-gray-700">{message.authorRole === 'admin' ? `Shopper Name: ${dispute.shopperName || 'Not provided'}` : `Seller · ${dispute.shop || dispute.sellerName || 'Seller'}`}</span>
                <time>{formatDate(message.createdAt)}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">{message.text}</p>
            </div>
          ))}
        </div>
      ) : <p className="mb-3 text-xs text-gray-500">No messages yet. Add the reason or a note for the seller.</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} maxLength={2000} rows={2} placeholder="Write an admin note or explain the decision…" className="min-h-16 flex-1 resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        <button type="button" onClick={onSend} disabled={saving || !draft.trim()} className={`${buttonClass} self-end bg-gray-900 text-white hover:bg-gray-700`}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}Send note
        </button>
      </div>
    </div>
  );
}

export function AdminDisputesView({ notify }: { notify?: (message: string) => void }) {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [messageSavingId, setMessageSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDisputes = async () => {
    setError('');
    try {
      const legacy = localDisputes();
      const syncResponse = await fetch('/api/consign/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', disputes: legacy }),
      });
      const syncResult = await syncResponse.json();
      if (!syncResponse.ok || !syncResult.success) throw new Error(syncResult.error || 'Unable to sync dispute records.');
      const loaded = await requestDisputes();
      setDisputes(loaded);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded)); } catch {}
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load disputes.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { void loadDisputes(); }, []);

  useEffect(() => {
    let active = true;
    const refreshSharedDisputes = async () => {
      try {
        const loaded = await requestDisputes();
        if (active) {
          setDisputes(loaded);
        }
      } catch (refreshError) {
        if (active) setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh disputes.');
      }
    };
    const intervalId = window.setInterval(() => void refreshSharedDisputes(), 5000);
    window.addEventListener('focus', refreshSharedDisputes);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSharedDisputes);
    };
  }, []);

  const updateStatus = async (dispute: DisputeItem, status: 'refunded' | 'rejected') => {
    setProcessingId(dispute.id);
    setError('');
    try {
      if (status === 'refunded') {
        if (!dispute.orderId) throw new Error('This dispute is not linked to a Consign order, so it cannot be refunded from this screen.');
        const refundResponse = await fetch('/api/consign/refunds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: dispute.orderId, auditContext: { orderNumber: dispute.orderNumber, merchantName: dispute.shop } }),
        });
        const refundResult = await refundResponse.json();
        if (!refundResponse.ok || !refundResult.success) throw new Error(refundResult.error || 'The order refund could not be completed.');
      }

      const response = await fetch('/api/consign/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', id: dispute.id, status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update this dispute.');
      await loadDisputes();
      notify?.(status === 'refunded' ? `Order ${dispute.orderNumber} was refunded.` : `Dispute for ${dispute.orderNumber} was rejected.`);
      if (status === 'rejected' && dispute.sellerEmail) {
        void sendSellerNotification({
          sellerEmail: dispute.sellerEmail,
          orderNumber: dispute.orderNumber,
          category: 'Refunds & Disputes',
          title: `Dispute rejected for order ${dispute.orderNumber}`,
          message: [{ text: `The dispute for order ${dispute.orderNumber} was rejected. Open Disputes to see the decision and reply to the admin.` }],
          tone: 'rejection',
          href: '/seller/dashboard?tab=disputes',
          dedupeKey: `admin-dispute-rejected:${dispute.id}`,
        });
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to complete this action.');
    } finally {
      setProcessingId(null);
    }
  };

  const sendAdminNote = async (dispute: DisputeItem) => {
    const text = (drafts[dispute.id] || '').trim();
    if (!text) return;
    setMessageSavingId(dispute.id);
    setError('');
    try {
      const response = await fetch('/api/consign/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', id: dispute.id, text }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to send the admin note.');
      setDrafts((current) => ({ ...current, [dispute.id]: '' }));
      await loadDisputes();
      notify?.(`Note added to order ${dispute.orderNumber}.`);
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : 'Unable to send the admin note.');
    } finally {
      setMessageSavingId(null);
    }
  };

  const markThreadRead = async (dispute: DisputeItem) => {
    if (!Number(dispute.unreadAdminCount)) return;
    if (await markDisputesRead('admin', dispute.id)) {
      setDisputes((current) => current.map((item) => item.id === dispute.id ? { ...item, unreadAdminCount: 0 } : item));
    }
  };

  const openDisputes = disputes.filter((item) => item.status === 'open');
  const resolvedDisputes = disputes.filter((item) => item.status !== 'open');

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 animate-fadeIn pb-12">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-8">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900"><span>Disputes</span><span className="font-normal text-gray-400">·</span><span>Arbitration</span></h1>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-gray-200 bg-gray-100/80 px-2.5 py-1 text-xs font-medium text-gray-600">Open: {openDisputes.length}</span>
            <button type="button" onClick={() => { setIsRefreshing(true); void loadDisputes(); }} disabled={isRefreshing || loading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><RotateCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh</button>
          </div>
        </div>
        <div className="border-y border-gray-100 bg-gray-50/80 px-6 py-3.5 text-xs leading-relaxed text-gray-600 sm:px-8">Refund records the full Consign order amount and marks the order refunded. Reject closes the dispute without issuing a refund. Add a note below an order so the seller can respond.</div>
        {error && <div role="alert" className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-8"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead><tr className="border-b border-gray-100 text-xs font-semibold text-gray-700"><th className="px-6 py-3 sm:px-8">Order</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Shop</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Opened</th><th className="px-6 py-3 sm:px-8">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading disputes…</span></td></tr> : openDisputes.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500"><div className="flex flex-col items-center gap-2"><ShieldCheck className="h-8 w-8 text-gray-300" /><p className="font-medium text-gray-700">No open disputes currently escalated to platform arbitration.</p></div></td></tr> : openDisputes.map((item) => (
                <Fragment key={item.id}>
                  <tr className="hover:bg-gray-50/60">
                    <td className="px-6 py-4 sm:px-8"><div className="font-mono font-semibold text-gray-800">{item.orderNumber}</div>{item.shopperName && <div className="mt-1 text-xs font-sans font-normal text-gray-500">Shopper: {item.shopperName}</div>}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{item.productName}</td>
                    <td className="px-4 py-4 text-gray-700">{item.shop}</td>
                    <td className="px-4 py-4 text-gray-600">{item.reason}</td>
                    <td className="px-4 py-4 font-mono font-bold text-gray-900">{item.amount}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">{formatDate(item.openedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap sm:px-8"><div className="inline-flex items-center gap-2"><button type="button" onClick={() => void updateStatus(item, 'refunded')} disabled={processingId === item.id} title={!item.orderId ? 'This dispute is not linked to a Consign order' : 'Issue the full order refund'} className={`${buttonClass} bg-gray-900 text-white hover:bg-black`}>{processingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}Refund</button><button type="button" onClick={() => void updateStatus(item, 'rejected')} disabled={processingId === item.id} className={`${buttonClass} bg-rose-600 text-white hover:bg-rose-700`}>Reject</button></div></td>
                  </tr>
                  <tr><td colSpan={7} className="px-5 pb-4 sm:px-8"><div className="space-y-3"><DisputeOrderDetails sellerName={item.sellerName} sellerEmail={item.sellerEmail} products={item.products} /><details onToggle={(event) => { if (event.currentTarget.open) void markThreadRead(item); }} className="group rounded-lg border border-gray-200 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold text-gray-800 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-gray-500" />Order discussion</span><span className="inline-flex items-center gap-1.5">{Number(item.unreadAdminCount) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-blue-200"><MessageSquare className="h-3 w-3 text-white" />{item.unreadAdminCount} unread</span>}<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{item.messages?.length || 0} messages</span></span><ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" /></summary><div className="border-t border-gray-100 p-3"><Conversation dispute={item} draft={drafts[item.id] || ''} saving={messageSavingId === item.id} onDraftChange={(value) => setDrafts((current) => ({ ...current, [item.id]: value }))} onSend={() => void sendAdminNote(item)} /></div></details></div></td></tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5 sm:px-8"><div><h2 className="text-base font-bold text-gray-900">Resolved disputes</h2><p className="mt-1 text-xs text-gray-500">Refunded and rejected decisions, including messages from the seller.</p></div><span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600">{resolvedDisputes.length} resolved</span></div>
        {resolvedDisputes.length === 0 ? <p className="px-6 py-8 text-xs text-gray-500 sm:px-8">No resolved disputes yet.</p> : (
          <div className="divide-y divide-gray-100">
            {resolvedDisputes.map((item) => (
              <div key={item.id} className="space-y-3 px-5 py-4 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="font-mono text-sm font-semibold text-gray-900">{item.orderNumber} <span className="ml-2 font-sans text-xs font-medium text-gray-500">{item.productName}</span></div>{item.shopperName && <p className="mt-1 text-xs text-gray-500">Shopper: {item.shopperName}</p>}<p className="mt-1 text-xs text-gray-500">{item.shop} · {item.amount} · {item.reason}</p></div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${item.status === 'refunded' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{item.status === 'refunded' ? 'Refunded' : 'Rejected'}</span>
                </div>
                <DisputeOrderDetails sellerName={item.sellerName} sellerEmail={item.sellerEmail} products={item.products} />
                <details onToggle={(event) => { if (event.currentTarget.open) void markThreadRead(item); }} className="group rounded-lg border border-gray-200 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold text-gray-800 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-gray-500" />Order discussion</span><span className="inline-flex items-center gap-1.5">{Number(item.unreadAdminCount) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-blue-200"><MessageSquare className="h-3 w-3 text-white" />{item.unreadAdminCount} unread</span>}<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{item.messages?.length || 0} messages</span></span><ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" /></summary><div className="border-t border-gray-100 p-3"><Conversation dispute={item} draft={drafts[item.id] || ''} saving={messageSavingId === item.id} onDraftChange={(value) => setDrafts((current) => ({ ...current, [item.id]: value }))} onSend={() => void sendAdminNote(item)} /></div></details>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
