'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductRating } from '@/components/product/ProductRating';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { ALL_PRODUCTS } from '@/services/mockData';
import { STORE_CATEGORIES, type StoreCategoryData } from '@/data/storeCategories';
import { filterProductsByActiveStoreTaxonomy } from '@/lib/storeCatalog';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

type TabKey = 'featured' | 'fashion' | 'accessories' | 'specialprices';

export default function ExtraShoppingSections() {
  const [activeTab, setActiveTab] = useState<TabKey>('featured');
  const [storeCategories, setStoreCategories] = useState<StoreCategoryData[]>(STORE_CATEGORIES as unknown as StoreCategoryData[]);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    let active = true;
    fetch('/api/store-categories', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load store categories.')))
      .then((result) => { if (active && Array.isArray(result.categories)) setStoreCategories(result.categories); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const activeProducts = filterProductsByActiveStoreTaxonomy(ALL_PRODUCTS, storeCategories);

  const getFilteredProducts = () => {
    switch (activeTab) {
      case 'featured':
        return activeProducts.filter((p) => p.isFeatured).slice(0, 4);
      case 'fashion':
        return activeProducts.filter((p) => p.categorySlug === 'mens-fashion' || p.categorySlug === 'womens-fashion').slice(0, 4);
      case 'accessories':
        return activeProducts.filter((p) => p.categorySlug === 'bags-accessories').slice(0, 4);
      case 'specialprices':
        return activeProducts.filter((p) => p.isDeal || p.originalPrice).slice(0, 4);
    }
  };

  const products = getFilteredProducts();

  return (
    <section className="py-12 bg-[#faf9f6] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#c5a059] uppercase block mb-1">
              CURATED SELECTIONS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0c1b33]">
              Discover more
            </h2>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { key: 'featured', label: 'Featured' },
              { key: 'fashion', label: 'Fashion' },
              { key: 'accessories', label: 'Accessories' },
              { key: 'specialprices', label: 'Special prices' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#0c1b33] text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:text-[#0c1b33] border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Item Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {products.map((product) => {
            const isWish = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="group flex h-full min-w-0 flex-col rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md sm:p-3"
              >
                <div className="flex flex-1 flex-col">
                  {/* Image container */}
                  <div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-white">
                    <Link href={`/product/${product.id}`} className="absolute inset-0 block">
                      <ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-105" />
                    </Link>

                    {/* Discount badge if deal */}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        SALE
                      </span>
                    )}

                    {/* Wishlist toggle */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      aria-label="Save to Wishlist"
                      className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                        isWish
                          ? 'bg-[#c5a059] text-white'
                          : 'bg-white/90 text-gray-500 hover:text-[#0c1b33] shadow-sm'
                      }`}
                    >
                      <Heart
                        className="h-3.5 w-3.5"
                        fill={isWish ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  {/* Category tag */}
                  <span className="truncate text-[8px] font-medium uppercase tracking-wider text-gray-400">
                    {product.category}
                  </span>

                  {/* Title */}
                  <Link
                    href={`/product/${product.id}`}
                    className="mt-0.5 line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-gray-900 transition-colors hover:text-[#c5a059] sm:text-xs"
                  >
                    {product.title}
                  </Link>

                  {/* Price */}
                  <div className="mt-auto flex items-center gap-1.5 pt-2">
                    <span className="text-xs font-bold text-[#0c1b33] sm:text-sm">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex min-h-4 items-center gap-1 text-[9px] text-[#758092]">
                    <ProductRating productId={product.id} rating={product.rating} count={product.reviewCount} />
                  </div>
                </div>

                {/* Add to Cart button */}
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="flex min-h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#0c1b33] px-2 py-1.5 text-[8px] font-semibold text-white transition-colors hover:bg-[#162b4e] sm:text-[9px]"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View full collection link */}
        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0c1b33] hover:text-[#c5a059] transition-colors"
          >
            <span>Explore All Marketplace Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
