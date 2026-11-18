'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Heart, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { STOREHOUSE_MAIN_CATEGORIES, TOTAL_MAIN_STOREHOUSE_PRODUCTS } from '@/data/storehouseMainCategories';
import { queryUniqueDemoProducts } from '@/lib/mock-products';
import { storehouseDemoToProduct } from '@/lib/storehouseProduct';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import type { Product } from '@/types';
import type { SortOption } from '@/types/product';

const PAGE_SIZE = 24;

const countLabel = (count: number) => count.toLocaleString('en-US');

export default function StorehouseShop() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || searchParams.get('catalogCategory') || '';
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') === 'newest' ? 'name-desc' : 'default');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(TOTAL_MAIN_STOREHOUSE_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { products: compareProducts, toggleProduct: toggleCompareProduct, hasProduct: isInCompare, limit: compareLimit } = useCompare();

  const selectedCategory = STOREHOUSE_MAIN_CATEGORIES.find((category) => category.slug === categorySlug);
  const sortOption: SortOption = sort === 'price-low' ? 'price-asc' : sort === 'price-high' ? 'price-desc' : sort === 'name-asc' || sort === 'name-desc' ? sort : 'default';

  useEffect(() => {
    const result = queryUniqueDemoProducts({
      searchQuery: search,
      category: selectedCategory?.name || 'All categories',
      sortBy: sortOption,
      page,
      pageSize: PAGE_SIZE,
    });
    const pageProducts = result.products.map(storehouseDemoToProduct);
    setProducts((current) => page === 1 ? pageProducts : [...current, ...pageProducts]);
    setTotalCount(result.totalCount);
    setIsLoading(false);
  }, [categorySlug, page, search, sortOption, selectedCategory?.name]);

  const visibleFrom = products.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const canLoadMore = products.length < totalCount;
  const visibleCategories = useMemo(() => STOREHOUSE_MAIN_CATEGORIES, []);

  const changeCategory = (slug: string) => {
    setCategorySlug(slug);
    setPage(1);
    setProducts([]);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setProducts([]);
  };

  const changeSort = (value: string) => {
    setSort(value);
    setPage(1);
    setProducts([]);
  };

  return (
    <main className="min-h-screen bg-[#f8f6f1] py-8 sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="mb-7 flex flex-wrap items-center gap-1.5 text-[10px] text-[#758092]">
          <Link href="/" className="transition-colors hover:text-[#a77e43]">Home</Link><span>/</span>
          <span className="font-medium text-[#14263d]">Main Store</span>
          {selectedCategory && <><span>/</span><span className="font-medium text-[#14263d]">{selectedCategory.name}</span></>}
        </div>

        <header className="mb-7 rounded-3xl border border-[#e9e4da] bg-white p-5 shadow-[0_16px_44px_-34px_rgba(20,38,61,0.5)] sm:mb-8 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">Storehouse marketplace</p>
              <h1 className="mt-2 font-serif text-3xl font-medium tracking-[-0.04em] text-[#14263d] sm:text-4xl">{selectedCategory?.name || 'Explore all departments'}</h1>
              <p className="mt-2 text-xs text-[#687586]" aria-live="polite">
                {search.trim() ? `${countLabel(totalCount)} matching products` : `${countLabel(selectedCategory?.catalogProductCount ?? TOTAL_MAIN_STOREHOUSE_PRODUCTS)} unique products in this catalog`}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <label className="relative block flex-1 sm:min-w-64 lg:w-72">
                <span className="sr-only">Search Storehouse products</span>
                <input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search products, brands, or SKU" className="h-11 w-full rounded-full border border-[#e6e1d8] bg-[#fbfaf7] pl-4 pr-10 text-xs text-[#14263d] outline-none transition focus:border-[#b99152] focus:bg-white" />
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a929e]" />
              </label>
              <label className="sr-only" htmlFor="storehouse-sort">Sort products</label>
              <select id="storehouse-sort" value={sort} onChange={(event) => changeSort(event.target.value)} className="h-11 rounded-full border border-[#e6e1d8] bg-white px-4 text-xs text-[#14263d] outline-none focus:border-[#b99152]">
                <option value="default">Catalog order</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name-asc">Name: A to Z</option><option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </header>

        <section aria-label="Browse Storehouse categories" className="mb-7 rounded-2xl border border-[#e9e4da] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#758092]"><SlidersHorizontal className="h-3.5 w-3.5 text-[#a77e43]" /> Browse by category</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => changeCategory('')} aria-pressed={!categorySlug} className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition ${!categorySlug ? 'border-[#14263d] bg-[#14263d] text-white' : 'border-[#e6e1d8] bg-white text-[#526071] hover:border-[#b99152] hover:text-[#14263d]'}`}>
              All categories <span className="ml-1 opacity-70">{countLabel(TOTAL_MAIN_STOREHOUSE_PRODUCTS)}</span>
            </button>
            {visibleCategories.map((category) => (
              <button key={category.id} type="button" onClick={() => changeCategory(category.slug)} aria-pressed={categorySlug === category.slug} className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition ${categorySlug === category.slug ? 'border-[#14263d] bg-[#14263d] text-white' : 'border-[#e6e1d8] bg-white text-[#526071] hover:border-[#b99152] hover:text-[#14263d]'}`}>
                {category.name} <span className="ml-1 opacity-70">{countLabel(category.catalogProductCount || 0)}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e9e4da] bg-white px-4 py-3 text-[10px] text-[#687586]">
          <span>Showing {visibleFrom.toLocaleString('en-US')}–{Math.min(products.length, totalCount).toLocaleString('en-US')} of {countLabel(totalCount)} products</span>
          <span>USD · Storehouse catalog</span>
        </div>

        {isLoading && products.length === 0 ? (
          <div className="rounded-2xl border border-[#e9e4da] bg-white py-20 text-center text-sm text-[#687586]">Loading Storehouse products…</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#e9e4da] bg-white py-20 text-center">
            <h2 className="font-serif text-2xl text-[#14263d]">No products found</h2><p className="mt-2 text-xs text-[#687586]">Try another search or browse a different category.</p>
            <button onClick={() => { changeSearch(''); changeCategory(''); }} className="mt-5 rounded-full bg-[#14263d] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => {
                const wished = isInWishlist(product.id);
                const compared = isInCompare(product.id);
                const canAdd = product.inStock && product.stockQuantity > 0;
                return (
                  <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e9e4da] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9c9aa] hover:shadow-md sm:p-2.5">
                    <div className="relative mx-auto aspect-square max-h-48 w-full max-w-48 overflow-hidden rounded-lg bg-white">
                      <Link href={`/product/${product.id}`} className="absolute inset-0" aria-label={`View ${product.title}`}><ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-[1.04]" /></Link>
                      <button type="button" onClick={() => toggleWishlist(product)} aria-label={`${wished ? 'Remove' : 'Add'} ${product.title} ${wished ? 'from' : 'to'} wishlist`} aria-pressed={wished} className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${wished ? 'bg-[#14263d] text-white' : 'bg-white/95 text-[#536174] hover:text-[#14263d]'}`}><Heart className="h-4 w-4" fill={wished ? 'currentColor' : 'none'} /></button>
                      <button type="button" onClick={() => toggleCompareProduct(product)} disabled={!compared && compareProducts.length >= compareLimit} aria-label={`${compared ? 'Remove' : 'Add'} ${product.title} ${compared ? 'from' : 'to'} comparison`} title={compared ? 'Remove from comparison' : `Compare up to ${compareLimit} products`} className={`absolute bottom-2 right-2 rounded-full border px-2 py-1 text-[8px] font-semibold shadow-sm ${compared ? 'border-[#14263d] bg-[#14263d] text-white' : 'border-[#e6e1d8] bg-white/95 text-[#536174]'} disabled:opacity-50`}>
                        {compared ? 'Compared' : 'Compare'}
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-2.5">
                      <p className="truncate text-[8px] font-bold uppercase tracking-[0.12em] text-[#9a8057]">{product.subcategory || product.category}</p>
                      <Link href={`/product/${product.id}`} className="mt-1 line-clamp-2 min-h-[2.4rem] text-[11px] font-semibold leading-[1.2rem] text-[#192b42] transition-colors hover:text-[#a77e43] sm:text-xs">{product.title}</Link>
                      <p className="mt-1 truncate text-[9px] text-[#8791a0]">{product.brand} · {product.sku}</p>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                        <span className="text-sm font-bold tracking-tight text-[#14263d]">${product.price.toFixed(2)}</span>
                        <span className={`text-[8px] font-semibold ${canAdd ? 'text-emerald-700' : 'text-slate-400'}`}>{canAdd ? `${product.stockQuantity} available` : 'Out of stock'}</span>
                      </div>
                      <button type="button" onClick={() => addToCart(product, 1)} disabled={!canAdd} className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#14263d] px-2 text-[8px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#203a5b] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-[9px]">
                        <ShoppingBag className="h-3 w-3" /><span>{canAdd ? 'Add to cart' : 'Unavailable'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {canLoadMore && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {page > 1 && <button type="button" onClick={() => { setPage((current) => Math.max(1, current - 1)); setProducts([]); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8cdbb] bg-white px-5 text-[10px] font-bold uppercase tracking-wide text-[#14263d]"><ArrowLeft className="h-3.5 w-3.5" /> Previous page</button>}
                <button type="button" onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#14263d] px-6 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#203a5b]">Load more products <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            )}
            {!canLoadMore && products.length > PAGE_SIZE && <div className="mt-6 text-center text-[10px] text-[#758092]">You’ve reached the end of this category.</div>}
          </>
        )}
      </div>
    </main>
  );
}
