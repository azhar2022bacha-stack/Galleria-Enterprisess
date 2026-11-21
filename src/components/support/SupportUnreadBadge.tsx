'use client';
import { useEffect, useRef, useState } from 'react';

export function SupportUnreadBadge({ admin = false }: { admin?: boolean }) {
  const [count, setCount] = useState(0);
  const seen = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unlock = () => {
      if (!audio.current && typeof AudioContext !== 'undefined') audio.current = new AudioContext();
      audio.current?.resume().catch(() => {});
    };
    document.addEventListener('pointerdown', unlock);
    let stopped = false;
    let requestInFlight = false;
    const poll = async () => {
      if (stopped || requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;
      try {
        let email = '';
        if (!admin) {
          try { email = JSON.parse(localStorage.getItem('galleria_active_seller') || '{}').email || ''; } catch {}
          if (!email) return;
        }
        const query = new URLSearchParams({ summary: '1' });
        if (!admin) query.set('email', email);
        const response = await fetch(`/api/support?${query}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (stopped) return;
        const ids = new Set<string>(Array.isArray(data.incomingIds) ? data.incomingIds : []);
        const hasNewMessage = seen.current !== null && Array.from(ids).some((id) => !seen.current?.has(id));
        setCount(Math.max(0, Number(data.unreadCount) || 0));
        if (hasNewMessage && audio.current?.state === 'running') {
          const context = audio.current;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.frequency.setValueAtTime(880, context.currentTime);
          oscillator.frequency.setValueAtTime(1175, context.currentTime + 0.1);
          gain.gain.setValueAtTime(0.08, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.35);
        }
        seen.current = ids;
      } catch {
        // Keep the last known count while support is temporarily unavailable.
      } finally {
        requestInFlight = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 15_000);
    window.addEventListener('focus', poll);
    document.addEventListener('visibilitychange', poll);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('focus', poll);
      document.removeEventListener('visibilitychange', poll);
      document.removeEventListener('pointerdown', unlock);
      audio.current?.close().catch(() => {});
    };
  }, [admin]);

  return count > 0
    ? <span aria-label={`${count} unread support messages`} className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{count}</span>
    : null;
}
