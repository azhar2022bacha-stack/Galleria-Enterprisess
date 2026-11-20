'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { STOREHOUSE_MAIN_CATEGORIES, TOTAL_MAIN_STOREHOUSE_PRODUCTS } from '@/data/storehouseMainCategories';
import { queryUniqueDemoProducts } from '@/lib/mock-products';
import { storehouseDemoToProduct } from '@/lib/storehouseProduct';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { StorefrontProductCard } from '@/components/product/StorefrontProductCard';
import type { Product } from '@/types';
import type { SortOption } from '@/types/product';

const PAGE_SIZE = 24;

const countLabel = (count: number) => count.toLocaleString('en-US');
const categoryClass = 'shrink-0 rounded-md border border-[#ded3c2] bg-[#fffdf9] px-3 py-2 text-xs font-semibold text-[color:var(--website-primary)] transition hover:border-[#ab9471] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] aria-pressed:border-[#14263d] aria-pressed:bg-[#14263d] aria-pressed:text-white';

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

  const canLoadMore = products.length < totalCount;

  const changeCategory = (slug: string) => {
    if (slug === categorySlug) return;
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
    <div className="min-h-screen bg-[#fbfaf7] px-4 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-8 lg:px-12">
      <div className="mx-auto max-w-[1344px]">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#626a73] sm:mb-7">
          <Link href="/" className="underline decoration-transparent underline-offset-4 hover:text-[#14263d] hover:decoration-current">Home</Link>
          <ChevronRight size={12} aria-hidden="true" />
          {selectedCategory ? <><Link href="/shop" className="hover:underline hover:underline-offset-4">Shop</Link><ChevronRight size={12} aria-hidden="true" /><span aria-current="page" className="font-semibold text-[#14263d]">{selectedCategory.name}</span></> : <span aria-current="page" className="font-semibold text-[#14263d]">Shop</span>}
        </nav>

        <section aria-labelledby="shop-title" className="border border-[#e5dac8] bg-[#eee7da] px-4 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="shop-title" className="font-serif text-3xl leading-tight tracking-[-0.055em] text-[#14263d] sm:text-4xl lg:text-5xl">{selectedCategory?.name || 'Shop all products'}</h1>
              <p className="mt-2 text-sm text-[#525b65]" aria-live="polite">
                {search.trim() ? countLabel(totalCount) + ' matching products' : countLabel(selectedCategory?.catalogProductCount ?? TOTAL_MAIN_STOREHOUSE_PRODUCTS) + ' products'}
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2.5 sm:flex-nowrap lg:w-auto">
              <label className="relative block min-w-[12rem] flex-1 lg:w-72">
                <span className="sr-only">Search Storehouse products</span>
                <Search size={17} strokeWidth={1.7} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#626a73]" />
                <input value={search} onChange={(event) => changeSearch(event.target.value)} type="search" placeholder="Name, brand, or SKU" className="h-11 w-full rounded-md border border-[#d3c6b1] bg-[#fffdf9] pl-9 pr-2 text-base text-[#14263d] placeholder:text-[#666d76] focus:outline-none focus:ring-2 focus:ring-[#a77e43] sm:text-sm" />
              </label>
              <label className="sr-only" htmlFor="storehouse-sort">Sort products</label>
              <select id="storehouse-sort" value={sort} onChange={(event) => changeSort(event.target.value)} className="h-11 rounded-md border border-[#d3c6b1] bg-[#fffdf9] px-3 text-sm text-[#14263d] focus:outline-none focus:ring-2 focus:ring-[#a77e43]">
                <option value="default">Catalog order</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </section>

        <section aria-label="Browse Storehouse categories" className="border-b border-[#e6ded0] py-5 sm:py-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#14263d]"><SlidersHorizontal size={16} strokeWidth={1.7} aria-hidden="true" className="text-[#806640]" /> Filter by department</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => changeCategory('')} aria-pressed={!categorySlug} className={categoryClass}>
              All departments <span className="ml-1 opacity-75">{countLabel(TOTAL_MAIN_STOREHOUSE_PRODUCTS)}</span>
            </button>
            {STOREHOUSE_MAIN_CATEGORIES.map((category) => (
              <button key={category.id} type="button" onClick={() => changeCategory(category.slug)} aria-pressed={categorySlug === category.slug} className={categoryClass}>
                {category.name} <span className="ml-1 opacity-75">{countLabel(category.catalogProductCount || 0)}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 py-4 text-xs text-[#626a73]" aria-live="polite">
          <span>Showing {countLabel(products.length)} of {countLabel(totalCount)} products</span>
          <span>Prices in USD</span>
        </div>

        {isLoading && products.length === 0 ? (
          <p role="status" className="border border-[#e6ded0] bg-[#fffdf9] px-4 py-16 text-center text-sm text-[#626a73]">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="border border-[#e6ded0] bg-[#fffdf9] px-4 py-16 text-center">
            <h2 className="font-serif text-2xl text-[#14263d]">No products found</h2>
            <p className="mt-2 text-sm text-[#626a73]">Try another search or browse a different department.</p>
            <button type="button" onClick={() => { changeSearch(''); changeCategory(''); }} className="mt-5 min-h-11 rounded-md bg-[#14263d] px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77e43]">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => {
                const compared = isInCompare(product.id);
                return (
                  <StorefrontProductCard
                    key={product.id}
                    product={product}
                    saved={isInWishlist(product.id)}
                    onWishlist={() => toggleWishlist(product)}
                    onAdd={() => addToCart(product, 1)}
                    comparison={{
                      selected: compared,
                      disabled: !compared && compareProducts.length >= compareLimit,
                      limit: compareLimit,
                      onToggle: () => toggleCompareProduct(product),
                    }}
                  />
                );
              })}
            </div>
            {canLoadMore && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {page > 1 && <button type="button" onClick={() => { setPage((current) => Math.max(1, current - 1)); setProducts([]); }} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[#bda989] bg-[#fffdf9] px-5 text-sm font-semibold text-[#14263d] hover:border-[#14263d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43]"><ArrowLeft size={16} /> Previous page</button>}
                <button type="button" onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#14263d] px-5 text-sm font-semibold text-white transition hover:bg-[#203a5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43]">Load more products <ArrowDown size={16} /></button>
              </div>
            )}
            {!canLoadMore && products.length > PAGE_SIZE && <p className="mt-6 text-center text-sm text-[#626a73]">You’ve reached the end of this department.</p>}
          </>
        )}
      </div>
    </div>
  );
}
