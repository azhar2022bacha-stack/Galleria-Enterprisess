'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import type { SellerPublicStoreProfile, SellerPublicStoreProduct } from '@/lib/sellerPublicStoreServer';

type PublicStoreResponse = { success?: boolean; store?: SellerPublicStoreProfile; products?: SellerPublicStoreProduct[]; error?: string };
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

export default function PublicSellerProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || '');
  const id = String(params?.id || '');
  const [store, setStore] = useState<SellerPublicStoreProfile | null>(null);
  const [product, setProduct] = useState<SellerPublicStoreProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/seller/public-store?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as PublicStoreResponse;
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load this product.');
        if (active) {
          const match = result.products?.find((item) => item.id === id) || null;
          setStore(result.store || null);
          setProduct(match);
          if (!match) setError('This product is no longer available in this store.');
        }
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load this product.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, id]);

  const buyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    router.push('/checkout');
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-4"><div className="w-full max-w-4xl animate-pulse rounded-3xl border border-[#e7e2d9] bg-white p-6 sm:p-10"><div className="grid gap-8 md:grid-cols-2"><div className="aspect-square rounded-2xl bg-[#f0eee9]" /><div className="space-y-4 py-4"><div className="h-3 w-32 rounded bg-[#f0eee9]" /><div className="h-9 w-4/5 rounded bg-[#f0eee9]" /><div className="h-6 w-1/3 rounded bg-[#f0eee9]" /><div className="h-24 rounded bg-[#f0eee9]" /></div></div></div></main>;

  if (!product) return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-4"><div className="max-w-md rounded-3xl border border-[#e7e2d9] bg-white p-8 text-center shadow-sm"><ShoppingBag className="mx-auto h-8 w-8 text-[#c5a35e]" /><h1 className="mt-4 font-serif text-2xl text-[#172a42]">Product unavailable</h1><p className="mt-2 text-sm leading-6 text-[#7c8795]">{error || 'This product may have been removed from the seller’s store.'}</p><Link href={`/stores/${slug}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#172a42] px-5 py-2.5 text-xs font-bold text-white"><ArrowLeft className="h-3.5 w-3.5" />Return to store</Link></div></main>;

  const sellerName = store?.name || product.brand || 'Seller';
  return <main className="min-h-screen bg-[#f7f6f2] text-[#172a42]">
    <div className="border-b border-[#e9e4db] bg-white"><div className="mx-auto flex h-[60px] max-w-[1320px] items-center justify-between px-4 sm:px-7 lg:px-10"><Link href="/" className="text-sm font-bold tracking-tight">Galleria <span className="font-medium text-[#a77e43]">Marketplace</span></Link><Link href="/checkout" className="inline-flex items-center gap-2 rounded-full border border-[#e8e2d7] px-3 py-2 text-xs font-semibold"><ShoppingBag className="h-4 w-4" />Cart</Link></div></div>
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-7 sm:py-9 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] text-[#858f9c]"><Link href="/" className="hover:text-[#a77e43]">Home</Link><span>/</span><Link href={`/stores/${slug}`} className="hover:text-[#a77e43]">{sellerName}</Link><span>/</span><span className="max-w-[55vw] truncate text-[#172a42]">{product.title}</span></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-10">
        <section className="relative flex aspect-square max-h-[620px] items-center justify-center overflow-hidden rounded-[22px] border border-[#e8e2d8] bg-white p-5 shadow-sm sm:p-10">
          <ProductCardImage src={product.image} alt={product.title} className="object-contain p-3 sm:p-6" sizes="(max-width: 1024px) 90vw, 50vw" priority />
          <button type="button" onClick={() => toggleWishlist(product)} aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'} className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm ${isInWishlist(product.id) ? 'border-[#c6a257] bg-[#c6a257] text-white' : 'border-[#e7e2d9] bg-white text-[#607083] hover:text-rose-600'}`}><Heart className="h-4 w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} /></button>
        </section>
        <section className="flex flex-col py-1 lg:py-3">
          <Link href={`/stores/${slug}`} className="inline-flex w-fit items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#a77e43]"><ArrowLeft className="h-3 w-3" />{sellerName}</Link>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.15em] text-[#86909d]">{product.category}</p>
          <h1 className="mt-2 font-serif text-[30px] leading-tight tracking-tight text-[#172a42] sm:text-4xl">{product.title}</h1>
          <p className="mt-2 text-xs text-[#7e8997]">Sold by <span className="font-semibold text-[#33445a]">{sellerName}</span> <BadgeCheck className="mb-0.5 inline h-3.5 w-3.5 text-emerald-700" /></p>
          <div className="mt-6 border-y border-[#e7e2d9] py-5"><p className="text-3xl font-bold tracking-tight text-[#172a42]">{money(product.price)}</p>{product.pricePerKg && <p className="mt-1 text-xs text-[#7f8a97]">{money(product.pricePerKg)} per kg{product.minOrderKg ? ` · minimum order ${product.minOrderKg} kg` : ''}</p>}</div>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#697789]">{product.description || `Available from ${sellerName}. Contact the seller for product details.`}</p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-slate-400'}`} /><span className={product.inStock ? 'text-emerald-800' : 'text-slate-500'}>{product.inStock ? `${product.stockQuantity} available` : 'Currently unavailable'}</span></div>

          {product.specifications?.length ? <div className="mt-5 rounded-2xl border border-[#e7e2d9] bg-white p-4"><h2 className="text-[10px] font-bold uppercase tracking-[.14em] text-[#172a42]">Product details</h2><dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">{product.specifications.map((specification) => <div key={specification.name} className="flex justify-between gap-3 border-b border-[#f0eee9] pb-2 text-[10px]"><dt className="text-[#87919c]">{specification.name}</dt><dd className="text-right font-medium text-[#405066]">{specification.value}</dd></div>)}</dl></div> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3"><div className="inline-flex h-11 items-center rounded-full border border-[#e3ded5] bg-white"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity" className="flex h-full w-10 items-center justify-center text-[#617083] disabled:opacity-35"><Minus className="h-3.5 w-3.5" /></button><span className="min-w-7 text-center text-xs font-semibold">{quantity}</span><button type="button" disabled={quantity >= product.stockQuantity} onClick={() => setQuantity((value) => Math.min(product.stockQuantity, value + 1))} aria-label="Increase quantity" className="flex h-full w-10 items-center justify-center text-[#617083] disabled:opacity-35"><Plus className="h-3.5 w-3.5" /></button></div><span className="text-[10px] text-[#8a929d]">{product.minOrderKg ? `lot · ${product.minOrderKg} kg minimum` : 'quantity'}</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" disabled={!product.inStock} onClick={() => addToCart(product, quantity)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[.08em] text-[#172a42] ring-1 ring-inset ring-[#d9d3c8] transition hover:bg-[#f5f2ec] disabled:cursor-not-allowed disabled:text-[#9ba1a9]"><ShoppingBag className="h-4 w-4" />Add to cart</button><button type="button" disabled={!product.inStock} onClick={buyNow} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#172a42] px-5 text-xs font-bold uppercase tracking-[.08em] text-white shadow-md transition hover:bg-[#28415f] disabled:cursor-not-allowed disabled:bg-[#c5c9ce]">Buy now<ArrowLeft className="h-3.5 w-3.5 rotate-180" /></button></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="flex items-center gap-2 rounded-xl bg-[#efede7] px-3 py-3 text-[10px] text-[#647184]"><ShieldCheck className="h-4 w-4 shrink-0 text-[#a77e43]" /><span>Secure checkout with available store payment methods</span></div><div className="flex items-center gap-2 rounded-xl bg-[#efede7] px-3 py-3 text-[10px] text-[#647184]"><Truck className="h-4 w-4 shrink-0 text-[#a77e43]" /><span>Order confirmation and status updates after checkout</span></div></div>
          <p className="mt-4 text-[9px] leading-4 text-[#969da6]">Availability and product information are provided by the seller. Shipping options and payment methods are shown during checkout.</p>
        </section>
      </div>
    </div>
  </main>;
}
