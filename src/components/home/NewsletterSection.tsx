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
    <section className="bg-[#fbfaf7] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Card Container */}
        <div className="relative overflow-hidden rounded-3xl border border-[#e9e2d5] bg-[#f4f1ea] p-6 shadow-[0_22px_70px_-55px_rgba(20,38,61,0.55)] sm:p-8 md:p-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            
            {/* Left & Center: Gold Icon + Text */}
            <div className="flex items-center gap-5 w-full lg:w-auto">
              
              {/* Circular Gold Line Envelope Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#dfd2bb] bg-white sm:h-16 sm:w-16">
                <Mail className="h-6 w-6 text-[#a77e43] stroke-[1.4] sm:h-7 sm:w-7" />
              </div>

              {/* Headings */}
              <div>
                <h3 className="font-serif text-xl font-medium tracking-tight text-[#14263d] sm:text-2xl">
                  A note from us
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">
                  Occasional updates on new finds and store news.
                </p>
              </div>

            </div>

            {/* Right: Input & Subscribe Button */}
            <div className="w-full lg:w-auto lg:min-w-[460px]">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle') setStatus('idle');
                  }}
                  placeholder="Enter your email address"
                  className="min-h-12 flex-1 rounded-full border border-[#e1dacd] bg-white px-5 text-xs text-[#17283e] placeholder-[#8b929b] transition-colors focus:border-[#b99152] focus:outline-none sm:text-sm"
                  disabled={status === 'loading' || !newsletterEnabled}
                />

                <button
                  type="submit"
                  disabled={status === 'loading' || !newsletterEnabled}
                  className="min-h-12 shrink-0 rounded-full bg-[#14263d] px-7 text-[10px] font-semibold tracking-[0.12em] text-white transition-colors hover:bg-[#203a5b] disabled:opacity-75 sm:text-xs"
                >
                  {status === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
                </button>
              </form>

              {!newsletterEnabled && (
                <p className="mt-2 text-[10px] text-[#758092]">Newsletter signup is not connected in this preview.</p>
              )}

              {/* Status messages */}
              {status === 'success' && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs mt-2 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{message}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs mt-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{message}</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
