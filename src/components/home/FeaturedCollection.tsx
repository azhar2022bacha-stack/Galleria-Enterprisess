'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { StorefrontProductCard } from '@/components/product/StorefrontProductCard';
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
    if (slug === selectedCategory) return;
    setProducts([]);
    setPage(1);
    setSelectedCategory(slug);
  };

  const categoryName = STOREHOUSE_MAIN_CATEGORIES.find((category) => category.slug === selectedCategory)?.name;
  const hasMore = products.length < totalCount;

  return (
    <section aria-labelledby="featured-store-products" className="border-t border-[#e6ded0] bg-[#f5f0e7] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1344px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <h2 id="featured-store-products" className="font-serif text-3xl tracking-[-0.045em] text-[#14263d] sm:text-4xl lg:text-[2.65rem]">{categoryName ? 'Shop ' + categoryName : 'Explore the store'}</h2>
            <p className="mt-2 text-sm text-[#5d6571]" aria-live="polite">{totalCount.toLocaleString('en-US')} products</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <label className="sr-only" htmlFor="home-department-filter">Filter by department</label>
            <select id="home-department-filter" value={selectedCategory} onChange={(event) => selectCategory(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-md border border-[#d9cdbb] bg-[#fffdf9] px-3 text-sm text-[#14263d] focus:outline-none focus:ring-2 focus:ring-[#a77e43] sm:w-56 sm:flex-none">
              <option value="">All departments</option>
              {STOREHOUSE_MAIN_CATEGORIES.map((category) => <option key={category.id} value={category.slug}>{category.name} ({(category.catalogProductCount || 0).toLocaleString('en-US')})</option>)}
            </select>
            <Link href={selectedCategory ? '/shop?category=' + encodeURIComponent(selectedCategory) : '/shop'} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-[#bda989] px-3.5 text-sm font-semibold text-[color:var(--website-primary)] transition hover:border-[#14263d] hover:bg-[#14263d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43]">View shop <ArrowRight size={16} strokeWidth={1.75} /></Link>
          </div>
        </div>

        {products.length === 0 ? (
          <p role="status" className="border border-[#e6ded0] bg-[#fffdf9] px-5 py-12 text-center text-sm text-[#5d6571]">Loading products…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <StorefrontProductCard
                  key={product.id}
                  product={product}
                  saved={isInWishlist(product.id)}
                  onWishlist={() => toggleWishlist(product)}
                  onAdd={() => addToCart(product, 1)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[#bda989] bg-[#fffdf9] px-5 text-sm font-semibold text-[color:var(--website-primary)] transition hover:border-[#14263d] hover:bg-[#14263d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43]">
                  Load more products ({products.length.toLocaleString('en-US')} of {totalCount.toLocaleString('en-US')}) <ArrowDown size={17} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
