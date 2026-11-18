'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import { STOREHOUSE_MAIN_CATEGORIES, TOTAL_MAIN_STOREHOUSE_PRODUCTS } from '@/data/storehouseMainCategories';
import { queryUniqueDemoProducts } from '@/lib/mock-products';
import { storehouseDemoToProduct } from '@/lib/storehouseProduct';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const PAGE_SIZE = 24;

export default function FeaturedCollection() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(TOTAL_MAIN_STOREHOUSE_PRODUCTS);

  useEffect(() => {
    const category = STOREHOUSE_MAIN_CATEGORIES.find((item) => item.slug === selectedCategory);
    const result = queryUniqueDemoProducts({
      searchQuery: '',
      category: category?.name || 'All categories',
      sortBy: 'default',
      page,
      pageSize: PAGE_SIZE,
    });
    const nextProducts = result.products.map(storehouseDemoToProduct);
    setProducts((current) => page === 1 ? nextProducts : [...current, ...nextProducts]);
    setTotalCount(result.totalCount);
  }, [selectedCategory, page]);

  const selectCategory = (slug: string) => {
    setProducts([]);
    setPage(1);
    setSelectedCategory(slug);
  };

  const categoryName = STOREHOUSE_MAIN_CATEGORIES.find((category) => category.slug === selectedCategory)?.name;
  const hasMore = products.length < totalCount;

  return (
    <section className="relative overflow-hidden bg-[#fbfaf7] py-10 sm:py-14">
      <div className="pointer-events-none absolute -right-28 top-0 h-80 w-80 rounded-full bg-[#eee7d9]/55 blur-3xl" />
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#e9e4da] bg-white p-4 shadow-sm sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div>
            <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]"><span className="h-px w-6 bg-[#b99152]" /> Main store catalog</span>
            <h2 className="mt-1.5 font-serif text-2xl font-medium tracking-[-0.04em] text-[#14263d] sm:text-3xl">{categoryName ? `Shop ${categoryName}` : 'Shop products across departments'}</h2>
            <p className="mt-1 text-[11px] text-[#758092]" aria-live="polite">{totalCount.toLocaleString('en-US')} products from the same Storehouse catalog</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="home-department-filter">Filter by department</label>
            <select id="home-department-filter" value={selectedCategory} onChange={(event) => selectCategory(event.target.value)} className="min-h-10 w-full rounded-full border border-[#e6e1d8] bg-[#fbfaf7] px-4 text-xs text-[#526071] outline-none focus:border-[#b99152] sm:w-64">
              <option value="">All departments</option>
              {STOREHOUSE_MAIN_CATEGORIES.map((category) => <option key={category.id} value={category.slug}>{category.name} ({(category.catalogProductCount || 0).toLocaleString('en-US')})</option>)}
            </select>
            <Link href={selectedCategory ? `/shop?category=${encodeURIComponent(selectedCategory)}` : '/shop'} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#14263d] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#203a5b]">View shop <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9d2c5] bg-white px-5 py-12 text-center"><p className="text-xs text-[#758092]">Loading products…</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => {
                const wished = isInWishlist(product.id);
                const canAdd = product.inStock && product.stockQuantity > 0;
                return (
                  <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e9e4da] bg-white p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9c9aa] hover:shadow-md sm:p-2.5">
                    <div className="relative mx-auto aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-white">
                      <Link href={`/product/${product.id}`} className="absolute inset-0" aria-label={`View ${product.title}`}><ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-[1.04]" /></Link>
                      <button type="button" onClick={() => toggleWishlist(product)} aria-label={`${wished ? 'Remove' : 'Save'} ${product.title} ${wished ? 'from' : 'to'} wishlist`} aria-pressed={wished} className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${wished ? 'bg-[#14263d] text-white' : 'bg-white/95 text-[#536174] hover:text-[#14263d]'}`}><Heart className="h-4 w-4" fill={wished ? 'currentColor' : 'none'} /></button>
                    </div>
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-2.5">
                      <p className="truncate text-[8px] font-bold uppercase tracking-[0.12em] text-[#9a8057]">{product.subcategory || product.category}</p>
                      <Link href={`/product/${product.id}`} className="mt-1 line-clamp-2 min-h-[2.35rem] text-[11px] font-semibold leading-[1.15rem] text-[#192b42] transition-colors hover:text-[#a77e43] sm:text-xs">{product.title}</Link>
                      <p className="mt-1 truncate text-[9px] text-[#8791a0]">{product.brand}</p>
                      <div className="mt-auto flex min-h-9 items-end justify-between gap-1.5 pt-2">
                        <span className="text-sm font-bold tracking-tight text-[#14263d]">${product.price.toFixed(2)}</span>
                        <button type="button" onClick={() => addToCart(product, 1)} disabled={!canAdd} aria-label={`Add ${product.title} to cart`} className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-[#14263d] px-3 text-[8px] font-bold uppercase tracking-wide text-white transition hover:bg-[#203a5b] disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingBag className="h-3 w-3" /><span>Add</span></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {hasMore && <div className="mt-6 flex justify-center"><button type="button" onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8cdbb] bg-white px-6 text-[10px] font-bold uppercase tracking-[0.12em] text-[#14263d] shadow-sm transition hover:border-[#14263d] hover:bg-[#14263d] hover:text-white">Load more products ({products.length.toLocaleString('en-US')} of {totalCount.toLocaleString('en-US')}) <ArrowRight className="h-3.5 w-3.5" /></button></div>}
          </>
        )}
      </div>
    </section>
  );
}
