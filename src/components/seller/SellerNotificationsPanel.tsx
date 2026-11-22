'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import {
  getOperationsMessages,
  addOperationsMessage,
  subscribeToOrders,
  OperationsMessage,
} from '@/lib/sellerOrders';
import {
  fetchSellerNotifications,
  markSellerNotificationRead,
  SELLER_NOTIFICATIONS_CHANGED,
  SellerNotification,
} from '@/lib/sellerNotifications';

interface SellerNotificationsPanelProps {
  notify?: (msg: string) => void;
}

function notificationToneClasses(tone: SellerNotification['tone']) {
  if (tone === 'rejection') return 'bg-red-50 border-red-200 text-red-700';
  if (tone === 'warning') return 'bg-amber-50 border-amber-200 text-amber-800';
  if (tone === 'success') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return 'bg-blue-50 border-blue-200 text-blue-700';
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function SellerNotificationsPanel({ notify }: SellerNotificationsPanelProps) {
  const [sellerEmail, setSellerEmail] = useState('');
  const [messages, setMessages] = useState<SellerNotification[]>([]);
  const [notificationsError, setNotificationsError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SellerNotification | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  const detailAnchorRef = useRef({ x: 0, y: 0 });

  // Message operations form state
  const [category, setCategory] = useState('Shop / account');
  const [orderNo, setOrderNo] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [imageName, setImageName] = useState<string | null>(null);

  // Operations conversation history
  const [conversations, setConversations] = useState<OperationsMessage[]>([]);

  useEffect(() => {
    let active = true;
    let activeEmail = '';
    let notificationTimer: ReturnType<typeof setInterval> | undefined;
    const refreshConversations = () => {
      setConversations(getOperationsMessages());
    };
    refreshConversations();
    const unsubscribe = subscribeToOrders(refreshConversations);

    const loadNotifications = async (email: string) => {
      try {
        const items = await fetchSellerNotifications(email);
        if (active) {
          setMessages(items);
          setNotificationsError('');
        }
      } catch (error: any) {
        if (active) setNotificationsError(error.message || 'Unable to load notifications.');
      }
    };

    const initialize = async () => {
      let email = '';
      try {
        const activeSeller = JSON.parse(localStorage.getItem('galleria_active_seller') || '{}');
        email = String(activeSeller.email || '').trim().toLowerCase();
      } catch {}
      if (!email) {
        try {
          const response = await fetch('/api/seller/current', { cache: 'no-store' });
          const data = await response.json();
          email = String(data?.seller?.email || '').trim().toLowerCase();
        } catch {}
      }
      if (!active || !email) return;
      activeEmail = email;
      setSellerEmail(email);
      await loadNotifications(email);
      if (!active) return;
      notificationTimer = setInterval(() => { void loadNotifications(email); }, 15_000);
    };

    void initialize();
    const onFocus = () => { if (activeEmail) void loadNotifications(activeEmail); };
    window.addEventListener('focus', onFocus);
    window.addEventListener(SELLER_NOTIFICATIONS_CHANGED, onFocus);
    return () => {
      active = false;
      if (notificationTimer) clearInterval(notificationTimer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(SELLER_NOTIFICATIONS_CHANGED, onFocus);
      unsubscribe();
    };
  }, []);

  const markRead = async (id?: string) => {
    if (!sellerEmail) return;
    try {
      await markSellerNotificationRead(sellerEmail, id);
      const readAt = new Date().toISOString();
      setMessages((current) => current.map((message) =>
        (!id || message.id === id) && !message.readAt ? { ...message, readAt } : message
      ));
      if (selectedMessage && (!id || selectedMessage.id === id)) {
        setSelectedMessage({ ...selectedMessage, readAt });
      }
    } catch (error: any) {
      notify?.(error.message || 'Unable to update notification status.');
    }
  };

  useLayoutEffect(() => {
    const dialog = detailDialogRef.current;
    if (!selectedMessage || !dialog) return;

    const position = () => {
      const { x, y } = detailAnchorRef.current;
      const { width, height } = dialog.getBoundingClientRect();
      const margin = 16;
      const gap = 8;
      const right = window.innerWidth - width - margin;
      const bottom = window.innerHeight - height - margin;
      dialog.style.left = Math.max(margin, Math.min(x + gap <= right ? x + gap : x - width - gap, right)) + 'px';
      dialog.style.top = Math.max(margin, Math.min(y + gap <= bottom ? y + gap : y - height - gap, bottom)) + 'px';
    };

    position();
    dialog.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position);
    observer.observe(dialog);
    window.addEventListener('resize', position);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
    };
  }, [selectedMessage]);

  const openMessage = (event: React.MouseEvent, message: SellerNotification) => {
    event.stopPropagation();
    const trigger = event.currentTarget.getBoundingClientRect();
    detailAnchorRef.current = event.detail === 0
      ? { x: trigger.left, y: trigger.bottom }
      : { x: event.clientX, y: event.clientY };
    if (!message.readAt) {
      setSelectedMessage({ ...message, readAt: new Date().toISOString() });
      void markRead(message.id);
      return;
    }
    setSelectedMessage(message);
  };

  const unreadCount = messages.filter((message) => !message.readAt).length;

  const handleSendToOperations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    const newMsg: OperationsMessage = {
      id: `op-${Date.now()}`,
      category,
      orderNo: orderNo.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      message: issueDescription.trim(),
      imageUrl: imageName || undefined,
      createdAt: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      status: 'Received',
    };

    addOperationsMessage(newMsg);
    setIssueDescription('');
    setOrderNo('');
    setImageName(null);
    notify?.('Message sent to platform operations team.');
  };

  const handleSimulateAddImage = () => {
    const fakeNames = ['screenshot_invoice.png', 'receipt_attachment.jpg', 'product_defect.png'];
    const chosen = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    setImageName(chosen);
    notify?.(`Attached image "${chosen}".`);
  };

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Header matching screenshot */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Notifications
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Important account, order, wallet, and support updates — with a direct line to platform operations.
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{unreadCount} new</span>}
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={() => void markRead()} className="text-[11px] font-semibold text-blue-700 hover:text-blue-900">
              Mark all as read
            </button>
          )}
        </div>
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
            {notificationsError || 'You’re all caught up. New account, order, and wallet updates will appear here.'}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <article key={m.id} className={`rounded-xl border p-3.5 transition-colors hover:shadow-sm ${m.readAt ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50/40'}`}>
                <button type="button" aria-label={`Open notification details: ${m.title}`} onClick={(event) => openMessage(event, m)} className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${notificationToneClasses(m.tone)}`}>
                      {m.category}
                    </span>
                    {!m.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">{m.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600 line-clamp-3">
                    {m.message.map((part, index) => (
                      <span key={`${m.id}-${index}`} className={part.emphasis === 'blue' ? 'rounded bg-blue-100 px-1 py-0.5 font-semibold text-blue-800' : part.emphasis === 'red' ? 'rounded bg-red-100 px-1 py-0.5 font-semibold text-red-700' : undefined}>
                        {part.text}
                      </span>
                    ))}
                  </p>
                </button>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[10px]">
                  <span className="text-gray-500">
                    <strong className="font-semibold text-gray-700">{m.sender}</strong> · {formatNotificationDate(m.createdAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={(event) => openMessage(event, m)} className="font-semibold text-blue-700 hover:text-blue-900">View details →</button>
                    {!m.readAt && <button type="button" onClick={() => void markRead(m.id)} className="font-semibold text-gray-500 hover:text-gray-800">Mark read</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Message operations */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Message operations</h2>
        <p className="text-xs text-gray-500 mt-1">
          Questions about orders, payouts or your shop — send them here. Operations replies show up below and in your messages.
        </p>

        <form onSubmit={handleSendToOperations} className="mt-3.5 space-y-3">
          {/* Row 1: Dropdown + Order no + Contact email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 pr-8 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:outline-none focus:border-[#2563eb] appearance-none cursor-pointer"
              >
                <option value="Shop / account">Shop / account</option>
                <option value="Orders / shipping">Orders / shipping</option>
                <option value="Payouts / wallet">Payouts / wallet</option>
                <option value="Product listing">Product listing</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Order no. (optional)"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb]"
            />

            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Contact email (optional)"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Row 2: Textarea */}
          <textarea
            rows={3}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the issue... (required)"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb]"
            required
          />

          {imageName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 w-fit">
              <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>{imageName}</span>
              <button
                type="button"
                onClick={() => setImageName(null)}
                className="text-gray-400 hover:text-gray-700 ml-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Row 3: Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Send to operations
            </button>
            <button
              type="button"
              onClick={handleSimulateAddImage}
              className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>Add image</span>
            </button>
          </div>
        </form>

        {/* Conversation history */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-900 mb-2">Conversation history</h3>
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400">No conversations yet.</p>
          ) : (
            <div className="space-y-3">
              {conversations.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{c.category}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{c.createdAt}</span>
                  </div>
                  {c.orderNo && (
                    <span className="text-[10.5px] text-gray-500 block">
                      Order: <strong className="font-mono">{c.orderNo}</strong>
                    </span>
                  )}
                  <p className="text-gray-700 mt-1">{c.message}</p>
                  {c.imageUrl && (
                    <span className="text-[10.5px] text-blue-600 font-medium flex items-center gap-1 mt-1">
                      <ImageIcon className="w-3 h-3" /> Attached: {c.imageUrl}
                    </span>
                  )}
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="seller-notification-dialog-title"
            ref={detailDialogRef}
            onKeyDown={(event) => { if (event.key === 'Escape') setSelectedMessage(null); }}
            className="fixed w-[calc(100vw-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
          >
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Close notification details"
            >
              <X className="w-4 h-4" />
            </button>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${notificationToneClasses(selectedMessage.tone)}`}>
              {selectedMessage.category}
            </span>

            <h3 id="seller-notification-dialog-title" className="text-base font-bold text-gray-900 mt-2">{selectedMessage.title}</h3>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{selectedMessage.sender} · {formatNotificationDate(selectedMessage.createdAt)}</p>

            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 font-semibold text-gray-600">
                {selectedMessage.readAt ? 'Read' : 'Unread'}
              </span>
              <span className={`rounded-full border px-2 py-0.5 font-semibold ${notificationToneClasses(selectedMessage.tone)}`}>
                {selectedMessage.tone === 'rejection' ? 'Action required' : selectedMessage.tone === 'success' ? 'Completed' : selectedMessage.tone === 'warning' ? 'Attention' : 'Information'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 mt-4 text-xs text-gray-700 leading-relaxed">
              {selectedMessage.message.map((part, index) => (
                <span key={`${selectedMessage.id}-detail-${index}`} className={part.emphasis === 'blue' ? 'rounded bg-blue-100 px-1 py-0.5 font-semibold text-blue-800' : part.emphasis === 'red' ? 'rounded bg-red-100 px-1 py-0.5 font-semibold text-red-700' : undefined}>
                  {part.text}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {selectedMessage.href && (
                <Link
                  href={selectedMessage.href}
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors"
                >
                  Open related details
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
