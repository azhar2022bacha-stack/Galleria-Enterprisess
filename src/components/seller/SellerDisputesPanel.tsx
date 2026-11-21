'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Loader2, MessageSquare, RotateCw, ShieldCheck } from 'lucide-react';
import { DisputeOrderDetails, type DisputeOrderProduct } from '@/components/DisputeOrderDetails';

interface DisputeMessage {
  id: string;
  authorRole: 'admin' | 'seller';
  author: string;
  text: string;
  createdAt: string;
}

interface SellerDispute {
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
  unreadSellerCount?: number;
  reason: string;
  amount: string;
  openedAt: string;
  updatedAt: string;
  status: 'open' | 'refunded' | 'rejected';
  messages: DisputeMessage[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || '—' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

async function markDisputeRead(id: string): Promise<boolean> {
  try {
    const response = await fetch('/api/consign/disputes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', role: 'seller', id }),
    });
    const result = await response.json();
    return response.ok && Boolean(result?.success);
  } catch {
    return false;
  }
}

export function SellerDisputesPanel() {
  const [disputes, setDisputes] = useState<SellerDispute[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadDisputes = async () => {
    try {
      const response = await fetch('/api/consign/disputes?scope=seller', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Disputes.');
      setDisputes(Array.isArray(result.disputes) ? result.disputes : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Disputes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDisputes();
    const refresh = () => { setRefreshing(true); void loadDisputes(); };
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const sendReply = async (dispute: SellerDispute) => {
    const text = (drafts[dispute.id] || '').trim();
    if (!text) return;
    setReplyingId(dispute.id);
    setError('');
    try {
      const response = await fetch('/api/consign/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', id: dispute.id, text }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to send your reply.');
      setDrafts((current) => ({ ...current, [dispute.id]: '' }));
      await loadDisputes();
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : 'Unable to send your reply.');
    } finally {
      setReplyingId(null);
    }
  };

  const statusLabel = (status: SellerDispute['status']) => status === 'open' ? 'Under review' : status === 'refunded' ? 'Refunded' : 'Rejected';

  const markThreadRead = async (dispute: SellerDispute) => {
    if (!Number(dispute.unreadSellerCount)) return;
    if (await markDisputeRead(dispute.id)) {
      setDisputes((current) => current.map((item) => item.id === dispute.id ? { ...item, unreadSellerCount: 0 } : item));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fadeIn pb-10">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-7">
          <div><h1 className="text-xl font-bold tracking-tight text-gray-900">Disputes</h1><p className="mt-1 text-sm text-gray-500">Review the admin’s decision and discuss each order here.</p></div>
          <div className="flex items-center gap-2"><span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">{disputes.length} orders</span><button type="button" onClick={() => { setRefreshing(true); void loadDisputes(); }} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div>
        </div>
        {error && <div role="alert" className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-7"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <div className="divide-y divide-gray-100">
          {loading ? <div className="flex justify-center py-14 text-sm text-gray-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading disputes…</span></div> : disputes.length === 0 ? <div className="flex flex-col items-center gap-2 py-14 text-gray-500"><ShieldCheck className="h-9 w-9 text-gray-300" /><p className="font-medium text-gray-700">No disputes for your orders.</p><p className="text-xs">If an admin reviews an order, its status and messages will appear here.</p></div> : disputes.map((dispute) => (
            <article key={dispute.id} className="space-y-4 px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-mono text-sm font-bold text-gray-900">Order {dispute.orderNumber}</p><p className="mt-1 text-sm font-medium text-gray-800">{dispute.productName}</p><p className="mt-1 text-xs text-gray-500">{dispute.shop} · {dispute.amount} · {formatDate(dispute.openedAt)}</p><p className="mt-2 text-sm text-gray-700">{dispute.reason}</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${dispute.status === 'refunded' ? 'border-blue-200 bg-blue-50 text-blue-700' : dispute.status === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{statusLabel(dispute.status)}</span>
              </div>

              <DisputeOrderDetails sellerName={dispute.sellerName} sellerEmail={dispute.sellerEmail} products={dispute.products} />

              <details onToggle={(event) => { if (event.currentTarget.open) void markThreadRead(dispute); }} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-xs font-semibold text-gray-800 sm:px-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-gray-500" />Order discussion</span>
                  <span className="ml-auto inline-flex items-center gap-1.5">{Number(dispute.unreadSellerCount) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-blue-200"><MessageSquare className="h-3 w-3 text-white" />{dispute.unreadSellerCount} unread</span>}<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{dispute.messages?.length || 0} messages</span></span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4">
                {dispute.messages?.length ? <div className="mb-3 space-y-2">{dispute.messages.map((message) => <div key={message.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2"><div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500"><span className="font-semibold text-gray-700">{message.authorRole === 'admin' ? (dispute.shopperName || 'Admin') : `You · ${dispute.shop || dispute.sellerName || 'Seller'}`}</span><time>{formatDate(message.createdAt)}</time></div><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">{message.text}</p></div>)}</div> : <p className="mb-3 text-xs text-gray-500">No messages yet. You can reply to the admin here.</p>}
                <div className="flex flex-col gap-2 sm:flex-row"><textarea value={drafts[dispute.id] || ''} onChange={(event) => setDrafts((current) => ({ ...current, [dispute.id]: event.target.value }))} maxLength={2000} rows={2} placeholder="Write a reply about this order…" className="min-h-16 flex-1 resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /><button type="button" onClick={() => void sendReply(dispute)} disabled={replyingId === dispute.id || !(drafts[dispute.id] || '').trim()} className="inline-flex items-center justify-center gap-1.5 self-end rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">{replyingId === dispute.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}Send reply</button></div>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
