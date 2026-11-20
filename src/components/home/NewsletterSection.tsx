'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';

export default function NewsletterSection() {
  const newsletterEnabled = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const res = await apiService.subscribeNewsletter(email);
      setStatus('success');
      setMessage(res.message);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <section aria-labelledby="store-newsletter" className="bg-[#eee7da] px-4 py-9 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto grid max-w-[1344px] gap-5 lg:grid-cols-[1fr_minmax(0,560px)] lg:items-center">
        <div className="flex items-start gap-3.5">
          <Mail size={26} strokeWidth={1.55} aria-hidden="true" className="mt-1 shrink-0 text-[#806640]" />
          <div>
            <h2 id="store-newsletter" className="font-serif text-[1.65rem] leading-tight tracking-[-0.035em] text-[#14263d] sm:text-3xl">Store updates</h2>
            <p className="mt-1.5 text-sm text-[#555a62]">Occasional emails about new products and store news.</p>
          </div>
        </div>

        <div className="min-w-0">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 sm:flex-nowrap">
            <input
              type="email"
              autoComplete="email"
              aria-label="Email for store updates"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              placeholder="Your email address"
              className="min-h-12 min-w-[12rem] flex-1 rounded-md border border-[#d2c5b1] bg-[#fffdf9] px-4 text-base text-[#14263d] placeholder:text-[#686b6f] focus:border-[#a77e43] focus:outline-none focus:ring-2 focus:ring-[#a77e43]/20 disabled:bg-[#f5f1e9] sm:text-sm"
              disabled={status === 'loading' || !newsletterEnabled}
            />
            <button type="submit" disabled={status === 'loading' || !newsletterEnabled} className="min-h-12 shrink-0 rounded-md bg-[#14263d] px-5 text-sm font-semibold text-white transition hover:bg-[#203a5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] disabled:opacity-60">
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          {!newsletterEnabled && <p className="mt-2 text-xs text-[#555a62]">Email signup is currently unavailable.</p>}
          {status === 'success' && <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-800"><CheckCircle size={15} aria-hidden="true" />{message}</p>}
          {status === 'error' && <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-800"><AlertCircle size={15} aria-hidden="true" />{message}</p>}
        </div>
      </div>
    </section>
  );
}
