'use client';

import { useEffect, useState } from 'react';

export type DisputeProductUnreadCounts = Record<string, number>;

export function useDisputeProductUnread(role: 'admin' | 'seller'): DisputeProductUnreadCounts {
  const [counts, setCounts] = useState<DisputeProductUnreadCounts>({});

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/consign/disputes?scope=${role}&summary=1`, { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        if (!active || !result?.success) return;
        const next: DisputeProductUnreadCounts = {};
        for (const product of Array.isArray(result.unreadProducts) ? result.unreadProducts : []) {
          const count = Math.max(0, Number(product?.count) || 0);
          if (!count) continue;
          if (product.id) next[`id:${String(product.id)}`] = (next[`id:${String(product.id)}`] || 0) + count;
          const normalizedName = String(product.name || '').trim().toLowerCase();
          if (normalizedName) next[`name:${normalizedName}`] = (next[`name:${normalizedName}`] || 0) + count;
        }
        setCounts(next);
      } catch {
        // Keep the last known counts if the request temporarily fails.
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [role]);

  return counts;
}

export function getDisputeProductUnreadCount(counts: DisputeProductUnreadCounts, id?: string, name?: string): number {
  const byId = id ? counts[`id:${id}`] || 0 : 0;
  const byName = name ? counts[`name:${name.trim().toLowerCase()}`] || 0 : 0;
  return byId || byName;
}

export function DisputeProductUnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span aria-label={`${count} unread dispute messages for this product`} className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 px-1 text-[9px] font-bold leading-none text-rose-700">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function DisputeUnreadBadge({ role }: { role: 'admin' | 'seller' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/consign/disputes?scope=${role}&summary=1`, { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        if (active && result?.success) setCount(Math.max(0, Number(result.unreadCount) || 0));
      } catch {
        // Keep the last known unread count if the request temporarily fails.
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [role]);

  if (!count) return null;
  return (
    <span
      aria-label={`${count} unread dispute messages`}
      className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
