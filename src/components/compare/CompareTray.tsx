'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Scale, X } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';

export function CompareTray() {
  const { products, removeProduct, clear } = useCompare();
  if (products.length === 0) return null;

  return <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#d8c9aa] bg-white/95 p-3 shadow-[0_18px_55px_-24px_rgba(20,38,61,0.55)] backdrop-blur sm:bottom-6 sm:p-4">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eee4] text-[#9a7542]"><Scale className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#14263d]">Compare products <span className="ml-1 text-[#a77e43]">{products.length}/4</span></p><div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-[#758092]">{products.slice(0, 3).map((product) => <span key={product.id} className="inline-flex max-w-[115px] items-center gap-0.5 truncate">{product.title}<button type="button" onClick={() => removeProduct(product.id)} aria-label={`Remove ${product.title} from compare`} className="shrink-0 text-slate-400 hover:text-rose-600"><X className="h-3 w-3" /></button></span>)}{products.length > 3 && <span>+{products.length - 3} more</span>}</div></div>
      <button type="button" onClick={clear} className="hidden shrink-0 text-[10px] font-semibold text-slate-500 hover:text-rose-600 sm:block">Clear</button>
      <Link href="/compare" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#14263d] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-[#203a5b]">Compare<ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  </div>;
}
