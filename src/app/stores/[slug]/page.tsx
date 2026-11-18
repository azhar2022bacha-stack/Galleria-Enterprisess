'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownWideNarrow, ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronDown,
  Heart, Search, ShieldCheck, ShoppingBag, Truck,
} from 'lucide-react';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import type { Product } from '@/types';
import type { SellerPublicStoreProfile, SellerPublicStoreProduct } from '@/lib/sellerPublicStoreServer';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

type StoreProduct = Product & Partial<Pick<SellerPublicStoreProduct, 'pricePerKg' | 'minOrderKg' | 'originalSellerProductId'>>;
type StoreApiResult = { success?: boolean; store?: SellerPublicStoreProfile; products?: SellerPublicStoreProduct[]; error?: string };
const PAGE_SIZE = 24;

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

function productHref(slug: string, product: StoreProduct) {
  return product.id.startsWith('seller-')
    ? `/stores/${slug}/product/${encodeURIComponent(product.id)}`
    : `/product/${encodeURIComponent(product.id)}`;
}

export default function PublicSellerStorePage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [store, setStore] = useState<SellerPublicStoreProfile | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const loadStore = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch(`/api/seller/public-store?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const data = await response.json() as StoreApiResult;
      if (!response.ok || !data.success) throw new Error(data.error || 'We could not load this storefront. Please refresh and try again.');
      setStore(data.store || null);
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      setStore(null);
      setProducts([]);
      setLoadError(error instanceof Error ? error.message : 'We could not load this storefront. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void loadStore(); }, [loadStore]);
  useEffect(() => {
    const refresh = () => { void loadStore(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [loadStore]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch = !query || [product.title, product.brand, product.category, product.sku, product.description]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return matchesSearch;
    });
    if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'name') filtered.sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [products, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const sellerName = store?.name || products[0]?.brand || 'Seller storefront';
  const firstLetter = sellerName.trim().charAt(0).toUpperCase() || 'S';

  useEffect(() => { setPage(1); }, [search, sort]);

  return <main className="min-h-screen bg-[#f7f6f2] text-[#172a42]">
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 sm:px-7 sm:pt-7 lg:px-10">
      <div className="mb-4 flex items-center gap-2 text-[10px] font-medium text-[#8a929d]">
        <Link href="/" className="hover:text-[#a77e43]">Home</Link><span>/</span><Link href="/shop" className="hover:text-[#a77e43]">Marketplace</Link><span>/</span><span className="truncate text-[#172a42]">{sellerName}</span>
      </div>

      <header className="relative isolate overflow-hidden rounded-[28px] bg-[#0d1d32] shadow-[0_24px_70px_-38px_rgba(15,31,52,.85)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_88%_16%,rgba(201,164,89,.25),transparent_30%),radial-gradient(ellipse_at_66%_100%,rgba(36,76,113,.45),transparent_42%),linear-gradient(115deg,#0b192b_30%,#142b46)]" />
        <div className="absolute -right-20 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border border-white/[0.07]" />
        <div className="absolute right-10 -top-20 -z-10 h-72 w-72 rounded-full border border-[#d8ba79]/15" />
        <div className="absolute bottom-0 right-[18%] -z-10 h-px w-2/5 bg-gradient-to-r from-transparent via-[#d8ba79]/35 to-transparent" />
        <div className="flex flex-col gap-8 p-5 sm:p-8 lg:min-h-[340px] lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-11">
          <div className="flex min-w-0 items-start gap-4 sm:gap-6">
            <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/20 bg-white text-xl font-bold text-[#172a42] shadow-[0_12px_35px_-14px_rgba(0,0,0,.7)] sm:h-24 sm:w-24 sm:text-3xl">
              {store?.logoUrl ? <img src={store.logoUrl} alt={`${sellerName} logo`} className="h-full w-full object-cover" /> : firstLetter}
            </div>
            <div className="min-w-0 pt-0.5 sm:pt-1">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#d8ba79]/35 bg-[#d8ba79]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-[#e7cb8e]"><BadgeCheck className="h-3.5 w-3.5" /> Independent seller</div>
              <h1 className="font-serif text-[32px] leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[58px]">{loading ? 'Loading store…' : sellerName}</h1>
              <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-300 sm:mt-4 sm:text-sm sm:leading-7">{store?.description || `A collection selected by ${sellerName}. Discover available pieces and order securely through Galleria.`}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[10px] font-medium text-slate-300 sm:text-[11px]">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#d8ba79]" /> Seller-managed collection</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d8ba79]" /> Secure checkout</span>
                <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[#d8ba79]" /> Order updates</span>
              </div>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-4 rounded-[22px] border border-white/10 bg-white/[0.065] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between lg:w-[290px] lg:flex-col lg:items-stretch lg:p-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d8ba79]">The collection</p>
              <p className="mt-2 font-serif text-3xl tracking-tight">{loading ? '—' : products.length.toLocaleString('en-US')} <span className="font-sans text-xs font-medium tracking-normal text-slate-300">pieces to explore</span></p>
              <p className="mt-2 text-[10px] leading-5 text-slate-400">Thoughtfully presented by {sellerName}</p>
            </div>
            <Link href="#collection" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#d2ad63] px-5 text-[10px] font-bold uppercase tracking-[.12em] text-[#10213a] transition hover:bg-[#e4c77f]">Explore collection <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>

      <section id="collection" className="scroll-mt-6 pt-8 sm:pt-10">
        <div className="mb-5 flex flex-col gap-4 border-b border-[#e6e1d8] pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#a77e43]">The seller edit</p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="font-serif text-[27px] tracking-tight text-[#172a42] sm:text-4xl">Shop the collection</h2><span className="text-[11px] font-medium text-[#8992a0]">{loading ? 'Loading collection…' : `${filteredProducts.length.toLocaleString('en-US')} ${filteredProducts.length === 1 ? 'piece' : 'pieces'}`}</span></div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] sm:gap-2.5 lg:w-[520px]">
            <label className="flex h-11 items-center gap-2.5 rounded-full border border-[#e7e2d9] bg-white px-4 shadow-[0_3px_12px_rgba(23,42,66,.035)] transition focus-within:border-[#c6a257] focus-within:shadow-[0_0_0_3px_rgba(198,162,87,.12)]">
              <Search className="h-4 w-4 shrink-0 text-[#8e98a4]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this store" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#a5acb5]" />
            </label>
            <div className="flex">
              <label className="relative flex h-11 min-w-0 flex-1 items-center rounded-full border border-[#e7e2d9] bg-white px-4 shadow-[0_3px_12px_rgba(23,42,66,.035)] sm:w-48 sm:flex-none">
                <ArrowDownWideNarrow className="mr-2 h-3.5 w-3.5 shrink-0 text-[#8e98a4]" /><select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full appearance-none bg-transparent pr-5 text-xs text-[#293950] outline-none"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select><ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#8e98a4]" />
              </label>
            </div>
          </div>
        </div>

        {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <div key={index} className="animate-pulse rounded-[21px] border border-[#e8e3da] bg-white p-3 sm:rounded-[24px]"><div className="aspect-square rounded-[16px] bg-[#f0eee9] sm:rounded-[19px]" /><div className="mt-4 h-2.5 w-1/3 rounded bg-[#f0eee9]" /><div className="mt-2 h-3 w-4/5 rounded bg-[#f0eee9]" /><div className="mt-5 h-10 rounded-full bg-[#f0eee9]" /></div>)}</div>
        : loadError ? <div className="rounded-2xl border border-[#e8e3da] bg-white px-5 py-16 text-center"><p className="text-sm font-semibold">{loadError}</p><button type="button" onClick={() => void loadStore()} className="mt-4 rounded-full bg-[#172a42] px-5 py-2.5 text-xs font-bold text-white">Try again</button></div>
        : visibleProducts.length === 0 ? <div className="rounded-[24px] border border-[#e8e3da] bg-white px-5 py-20 text-center shadow-[0_8px_30px_-24px_rgba(23,42,66,.3)]"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3ec]"><ShoppingBag className="h-6 w-6 text-[#a77e43]" /></span><p className="mt-4 text-base font-semibold text-[#172a42]">{products.length ? 'No pieces found' : 'The collection is being prepared'}</p><p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#8390a0]">{products.length ? 'Try a different search to explore this seller’s collection.' : 'Please check back soon for new listings from this seller.'}</p>{search && <button type="button" onClick={() => setSearch('')} className="mt-4 text-xs font-semibold text-[#a77e43] hover:underline">Clear search</button>}</div>
        : <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleProducts.map((product) => {
              const href = productHref(slug, product);
              const sellerProduct = product.id.startsWith('seller-');
              return <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[21px] border border-[#e8e3da] bg-white p-2.5 shadow-[0_3px_14px_rgba(23,42,66,.035)] transition duration-300 hover:-translate-y-1 hover:border-[#d9c798] hover:shadow-[0_18px_38px_-23px_rgba(23,42,66,.28)] sm:rounded-[24px] sm:p-3">
                <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-[16px] bg-[#f7f6f2] sm:rounded-[19px]">
                  <Link href={href} aria-label={`View ${product.title}`} className="absolute inset-0"><ProductCardImage src={product.image} alt={product.title} className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.055] sm:p-4" sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw" /></Link>
                  <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] shadow-sm ${product.inStock ? 'bg-white/95 text-emerald-800' : 'bg-white/95 text-slate-500'}`}>{product.inStock ? 'Available' : 'Sold out'}</span>
                  <button type="button" onClick={() => toggleWishlist(product)} aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Save to wishlist'} className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition ${isInWishlist(product.id) ? 'bg-[#c6a257] text-white' : 'bg-white/95 text-[#607083] hover:text-rose-600'}`}><Heart className="h-3.5 w-3.5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} /></button>
                </div>
                <div className="flex flex-1 flex-col px-1 sm:px-1.5">
                  {product.brand && <p className="truncate text-[9px] font-semibold uppercase tracking-[.13em] text-[#a77e43]">{product.brand}</p>}
                  <Link href={href} className="mt-1.5 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-[#172a42] hover:text-[#9b7438] sm:text-[13px]">{product.title}</Link>
                  <div className="mt-auto flex items-end justify-between gap-1.5 border-t border-[#f0ede7] pt-3.5">
                    <div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#8b95a2]">{sellerProduct && product.pricePerKg ? `${money(product.pricePerKg)} / kg` : 'Price'}</p><p className="mt-1 truncate text-base font-bold tracking-tight text-[#172a42] sm:text-lg">{money(product.price)}</p>{sellerProduct && product.minOrderKg && <p className="mt-1 text-[8px] text-[#818b97]">Minimum {product.minOrderKg} kg</p>}</div>
                    {sellerProduct && <span className={`shrink-0 pb-0.5 text-[8px] font-medium ${product.inStock ? 'text-[#7c8794]' : 'text-[#a5aab0]'}`}>{product.inStock ? `${product.stockQuantity} in stock` : ''}</span>}
                  </div>
                  <button type="button" disabled={!product.inStock || product.stockQuantity < 1} onClick={() => addToCart(product)} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#172a42] px-3 text-[9px] font-bold uppercase tracking-[.12em] text-white transition hover:bg-[#28415f] disabled:cursor-not-allowed disabled:bg-[#c5c9ce]"><ShoppingBag className="h-3.5 w-3.5" />Add to cart</button>
                </div>
              </article>;
            })}
          </div>
          {pageCount > 1 && <nav aria-label="Store product pages" className="mt-8 flex items-center justify-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => { setPage((value) => Math.max(1, value - 1)); window.scrollTo({ top: document.getElementById('collection')?.offsetTop || 0, behavior: 'smooth' }); }} className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e3ded5] bg-white px-3 text-[10px] font-semibold disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" />Previous</button>
            <span className="px-2 text-[10px] font-semibold text-[#788391]">Page {currentPage} of {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => { setPage((value) => Math.min(pageCount, value + 1)); window.scrollTo({ top: document.getElementById('collection')?.offsetTop || 0, behavior: 'smooth' }); }} className="inline-flex h-9 items-center gap-1 rounded-full border border-[#e3ded5] bg-white px-3 text-[10px] font-semibold disabled:opacity-40">Next<ArrowRight className="h-3.5 w-3.5" /></button>
          </nav>}
          <p className="mt-3 text-center text-[9px] text-[#9aa1a9]">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length.toLocaleString('en-US')} products</p>
        </>}
      </section>
      <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#e6e1d8] pt-5 text-center text-[10px] text-[#8a929d] sm:flex-row sm:text-left"><span>Storefront by Galleria Marketplace</span><Link href="/shop" className="inline-flex items-center gap-1 font-semibold text-[#6d7887] hover:text-[#a77e43]"><ArrowLeft className="h-3 w-3" /> Back to marketplace</Link></footer>
    </div>
  </main>;
}
