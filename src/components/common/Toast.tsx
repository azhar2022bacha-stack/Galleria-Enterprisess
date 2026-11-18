'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Toast() {
  const { toastMessage, clearToast } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className="flex items-center gap-3 bg-[#0c1b33] text-white px-5 py-3.5 rounded-lg shadow-2xl border border-[#c5a059]/40">
        <CheckCircle2 className="w-5 h-5 text-[#c5a059] shrink-0" />
        <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        <button
          onClick={clearToast}
          className="ml-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
