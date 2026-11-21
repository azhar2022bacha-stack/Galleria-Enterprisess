'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import {
  ProductQuery,
  getProductQueries,
  replyToQuery,
  subscribeToOrders,
} from '@/lib/sellerOrders';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

interface SellerQueriesPanelProps {
  notify?: (msg: string) => void;
}

export function SellerQueriesPanel({ notify }: SellerQueriesPanelProps) {
  const [queries, setQueries] = useState<ProductQuery[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const localQueries = getProductQueries();
      try {
        const response = await fetch('/api/consign/product-queries', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load saved product queries.');
        const data = await response.json();
        const serverQueries = Array.isArray(data.queries) ? (data.queries as ProductQuery[]) : [];
        const uniqueQueries = new Map<string, ProductQuery>();
        [...serverQueries, ...localQueries].forEach((query) => {
          if (!uniqueQueries.has(query.id)) uniqueQueries.set(query.id, query);
        });
        if (active) {
          setQueries(Array.from(uniqueQueries.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        }
      } catch {
        if (active) setQueries(localQueries);
      }
    };

    const refreshQueries = () => void refresh();
    void refresh();
    const unsubscribe = subscribeToOrders(refreshQueries);
    const intervalId = window.setInterval(refreshQueries, 15_000);
    window.addEventListener('focus', refreshQueries);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshQueries);
    };
  }, []);

  const openCount = queries.filter((q) => q.status === 'Open').length;

  const handleOpenReply = (q: ProductQuery) => {
    setActiveReplyId(q.id);
    setReplyInput(q.reply || '');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyId || !replyInput.trim() || isSendingReply) return;
    const selected = queries.find((query) => query.id === activeReplyId);
    if (!selected) return;

    setIsSendingReply(true);
    try {
      if (selected.source === 'admin-consign') {
        const response = await fetch('/api/consign/product-queries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeReplyId, reply: replyInput.trim() }),
        });
        const data = await response.json();
        if (!response.ok || !data?.success || !data.query) {
          throw new Error(data?.error || 'Unable to send the reply. Please try again.');
        }
        setQueries((current) => current.map((query) => query.id === activeReplyId ? data.query : query));
      } else {
        replyToQuery(activeReplyId, replyInput.trim());
        setQueries(getProductQueries());
      }
      notify?.('Reply sent successfully.');
      setActiveReplyId(null);
      setReplyInput('');
    } catch (error) {
      notify?.(error instanceof Error ? error.message : 'Unable to send the reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const selectedQuery = activeReplyId ? queries.find((q) => q.id === activeReplyId) : null;

  return (
    <div className="animate-fadeIn">
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Product Queries
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Product questions from Admin and shoppers. Reply here to keep the conversation attached to the product.
          </p>
        </div>

        {/* Open: 0 badge matching screenshot */}
        <div>
          <span className="inline-block px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-xs font-semibold whitespace-nowrap shadow-sm">
            Open: {openCount}
          </span>
        </div>
      </div>

      {/* Table Card matching screenshot */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-transparent">
                <th className="py-4 px-5 font-bold w-12">#</th>
                <th className="py-4 px-5 font-bold">FROM</th>
                <th className="py-4 px-5 font-bold">PRODUCT NAME</th>
                <th className="py-4 px-5 font-bold">QUESTION</th>
                <th className="py-4 px-5 font-bold">REPLY</th>
                <th className="py-4 px-5 font-bold">STATUS</th>
                <th className="py-4 px-5 font-bold text-right">OPTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {queries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-gray-400 text-xs sm:text-sm font-normal"
                  >
                    Nothing found
                  </td>
                </tr>
              ) : (
                queries.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5 font-semibold text-gray-500">{idx + 1}</td>
                    <td className="py-4 px-5 font-semibold text-gray-800">{item.userName}</td>
                    <td className="py-4 px-5 text-gray-700 max-w-[160px] truncate">{item.productName}</td>
                    <td className="py-4 px-5 text-gray-800 max-w-[240px]">
                      {item.subject && <div className="mb-0.5 truncate text-[10px] font-semibold text-gray-500">{item.subject}</div>}
                      <div className="line-clamp-3 whitespace-pre-wrap">{item.question}</div>
                      {item.orderCode && <div className="mt-1 font-mono text-[10px] text-gray-400">Order #{item.orderCode}</div>}
                    </td>
                    <td className="py-4 px-5 text-gray-500 max-w-[180px] truncate">
                      {item.reply ? (
                        <span className="text-gray-900">{item.reply}</span>
                      ) : (
                        <span className="text-gray-400 italic">No reply yet</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === 'Replied'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleOpenReply(item)}
                        className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded text-[10.5px] font-semibold transition-colors shadow-sm"
                      >
                        {item.reply ? 'Edit Reply' : 'Reply'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedQuery && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveReplyId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-slideUp relative"
          >
            <button
              onClick={() => setActiveReplyId(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Reply to Product Query</h3>
                <p className="text-[11px] text-gray-500">From {selectedQuery.source === 'admin-consign' ? 'Admin' : selectedQuery.userName}</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2 mb-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Product</span>
                <p className="font-semibold text-gray-800">{selectedQuery.productName}</p>
              </div>
              {selectedQuery.orderCode && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Related order</span>
                  <p className="font-mono text-gray-800">#{selectedQuery.orderCode}</p>
                </div>
              )}
              {selectedQuery.topic && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Topic</span>
                  <p className="text-gray-800">{selectedQuery.topic}</p>
                </div>
              )}
              {selectedQuery.subject && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Subject</span>
                  <p className="font-semibold text-gray-800">{selectedQuery.subject}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Question</span>
                <p className="text-gray-700 mt-0.5">{selectedQuery.question}</p>
              </div>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Your Reply <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  maxLength={3000}
                  placeholder="Type your reply to Admin or the shopper..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSendingReply || !replyInput.trim()}
                  className="flex-1 py-2.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingReply ? 'Sending…' : 'Send Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReplyId(null)}
                  className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
