'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import type { Product } from '@/types';
import { retailListingToProduct } from '@/lib/retailListingProduct';
import { useCart } from '@/context/CartContext';

export default function SellerSpotlightCollection() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    let active = true;
    fetch('/api/retail-listings?scope=public', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load seller listings.')))
      .then((result) => { if (active && Array.isArray(result.listings)) setProducts(result.listings.map(retailListingToProduct).slice(0, 4)); })
      .catch(() => { if (active) setProducts([]); });
    return () => { active = false; };
  }, []);

  if (products.length === 0) return null;

  return <section className="bg-[#f5f2ec] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77e43]"><span className="h-px w-7 bg-[#b99152]" />Independent shops</span><h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.04em] text-[#14263d] sm:text-4xl">New from our sellers</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#687586]">Discover approved products from independent storefronts in the marketplace.</p></div>
        <Link href="/shop" className="group inline-flex w-fit items-center gap-2 border-b border-[#b99152] pb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#14263d] transition-colors hover:text-[#a77e43]">Explore the marketplace<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {products.map((product) => <article key={product.id} className="group flex h-full min-w-0 flex-col rounded-xl border border-[#e9e4da] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-2.5"><div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-white"><Link href={`/product/${product.id}`} className="absolute inset-0" aria-label={`View ${product.title}`}><ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-[1.04]" /></Link><span className="absolute left-1.5 top-1.5 rounded-full border border-white/75 bg-white/90 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-[#526071]">Independent shop</span></div><div className="flex flex-1 flex-col px-0.5 pb-0.5 pt-1"><p className="truncate text-[9px] font-medium text-[#8a7350]">{product.sellerStoreSlug ? <Link href={`/stores/${product.sellerStoreSlug}`} className="hover:text-[#14263d]">{product.brand}</Link> : product.brand}</p><Link href={`/product/${product.id}`} className="mt-0.5 line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-[#192b42] hover:text-[#a77e43] sm:text-xs">{product.title}</Link><div className="mt-auto flex items-center justify-between gap-1.5 pt-2"><span className="truncate text-xs font-bold text-[#14263d] sm:text-sm">${product.price.toFixed(2)}</span><span className={`shrink-0 text-[8px] font-semibold ${product.inStock ? 'text-emerald-700' : 'text-slate-400'}`}>{product.inStock ? `${product.stockQuantity} left` : 'Sold out'}</span></div><button type="button" onClick={() => addToCart(product)} disabled={!product.inStock || product.stockQuantity < 1} className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-full border border-[#dfe3e8] px-2 text-[8px] font-bold uppercase tracking-wide text-[#192b42] transition-all hover:border-[#14263d] hover:bg-[#14263d] hover:text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"><ShoppingBag className="h-3 w-3" />{product.inStock ? 'Add to bag' : 'Out of stock'}</button></div></article>)}
      </div>
    </div>
  </section>;
}
