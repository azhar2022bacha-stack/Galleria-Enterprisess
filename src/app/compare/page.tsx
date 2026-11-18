'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Scale, ShoppingBag, X } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';

export default function CompareProductsPage() {
  const { products, removeProduct, clear, limit } = useCompare();
  const { addToCart } = useCart();
  const specificationNames = useMemo(() => Array.from(new Set(products.flatMap((product) => product.specifications?.map((specification) => specification.name) || []))), [products]);

  if (products.length === 0) {
    return <main className="min-h-[70vh] bg-[#f8f6f1] px-4 py-20"><div className="mx-auto max-w-xl rounded-3xl border border-[#e9e4da] bg-white p-8 text-center shadow-sm sm:p-12"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3eee4] text-[#9a7542]"><Scale className="h-7 w-7" /></span><h1 className="mt-5 font-serif text-3xl text-[#14263d]">Compare products</h1><p className="mt-2 text-sm leading-6 text-[#687586]">Add up to four products from the shop to compare price, stock, options, and specifications side by side.</p><Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#14263d] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#203a5b]">Browse products<ArrowRight className="h-4 w-4" /></Link></div></main>;
  }

  const rows: { label: string; value: (product: typeof products[number]) => React.ReactNode }[] = [
    { label: 'Price', value: (product) => <span className="text-lg font-bold text-[#14263d]">${product.price.toFixed(2)}</span> },
    { label: 'Availability', value: (product) => <span className={product.stockQuantity > 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-400'}>{product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Out of stock'}</span> },
    { label: 'Category', value: (product) => product.category },
    { label: 'Seller', value: (product) => product.brand || 'Galleria catalog' },
    { label: 'SKU', value: (product) => <span className="font-mono text-[11px]">{product.sku}</span> },
    { label: 'Colors', value: (product) => product.colors?.join(', ') || '—' },
    { label: 'Sizes', value: (product) => product.sizes?.join(', ') || '—' },
    { label: 'Description', value: (product) => <span className="block max-w-[260px] whitespace-normal leading-5">{product.shortDescription || product.description}</span> },
    ...specificationNames.map((name) => ({ label: name, value: (product: typeof products[number]) => product.specifications?.find((specification) => specification.name === name)?.value || '—' })),
  ];

  return <main className="min-h-screen bg-[#f8f6f1] py-10 sm:py-14">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">Shopping tools</p><h1 className="mt-2 font-serif text-4xl text-[#14263d]">Compare products</h1><p className="mt-2 text-sm text-[#687586]">Compare up to {limit} items side by side. {products.length < 2 ? 'Add another item to see the differences.' : `${products.length} items selected.`}</p></div><div className="flex gap-2"><Link href="/shop" className="rounded-full border border-[#d8d1c4] bg-white px-4 py-2.5 text-xs font-semibold text-[#14263d] hover:bg-[#f6f2eb]">Add more</Link><button type="button" onClick={clear} className="rounded-full px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-rose-600">Clear all</button></div></div>
      <div className="overflow-x-auto rounded-2xl border border-[#e9e4da] bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead><tr><th className="sticky left-0 z-10 w-40 border-b border-r border-slate-100 bg-[#fbfaf7] p-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Details</th>{products.map((product) => <th key={product.id} className="w-[280px] border-b border-slate-100 p-4 align-top"><div className="flex justify-end"><button type="button" onClick={() => removeProduct(product.id)} aria-label={`Remove ${product.title} from comparison`} className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button></div><Link href={`/product/${product.id}`} className="mx-auto block max-w-[210px]"><div className="relative aspect-square overflow-hidden rounded-xl bg-[#f5f3ee]"><Image src={product.image} alt={product.title} fill className="object-contain p-4 mix-blend-multiply" sizes="210px" /></div><span className="mt-3 block text-sm font-semibold leading-5 text-[#14263d] hover:text-[#a77e43]">{product.title}</span></Link></th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.label} className="border-b border-slate-100 last:border-0"><th className="sticky left-0 z-10 border-r border-slate-100 bg-[#fbfaf7] p-4 align-top text-[10px] font-bold uppercase tracking-wider text-slate-500">{row.label}</th>{products.map((product) => <td key={product.id} className="p-4 align-top text-xs text-slate-700">{row.value(product)}</td>)}</tr>)}
            <tr><th className="sticky left-0 z-10 border-r border-slate-100 bg-[#fbfaf7] p-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>{products.map((product) => <td key={product.id} className="p-4"><button type="button" disabled={!product.inStock || product.stockQuantity < 1} onClick={() => addToCart(product)} className="inline-flex items-center gap-2 rounded-full bg-[#14263d] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-[#203a5b] disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingBag className="h-3.5 w-3.5" />{product.inStock ? 'Add to bag' : 'Sold out'}</button></td>)}</tr>
          </tbody>
        </table>
      </div>
      {products.length >= limit && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Check className="h-3.5 w-3.5 text-emerald-600" />All {limit} comparison slots are in use. Remove an item to compare another.</p>}
    </div>
  </main>;
}
