'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { ProductCardImage } from '@/components/product/ProductCardImage';

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-[#fcfbf9] min-h-[70vh] flex items-center justify-center py-16">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center mx-auto mb-5 text-[#c5a059]">
            <Heart className="w-10 h-10 stroke-[1.2]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0c1b33]">
            Your Wishlist is Empty
          </h1>
          <p className="text-sm text-gray-500 mt-2 mb-8 leading-relaxed">
            Save your favorite designer apparel, accessories, and tech items here to revisit or purchase later.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#0c1b33] hover:bg-[#162b4e] text-white text-xs sm:text-sm font-semibold tracking-wider rounded uppercase transition-colors shadow-md"
          >
            <span>Explore Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#0c1b33] font-medium">My Wishlist</span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-[#0c1b33] mb-8">
          My Saved Wishlist ({items.length} items)
        </h1>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex h-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md sm:p-2.5"
            >
              <div>
                <div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-[#f3f4f6]">
                  <Link href={`/product/${item.product.id}`} className="absolute inset-0 block">
                    <ProductCardImage src={item.product.image} alt={item.product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-105" />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm hover:text-red-600"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="truncate text-[8px] font-medium uppercase tracking-wider text-gray-400">
                  {item.product.category}
                </span>

                <Link
                  href={`/product/${item.product.id}`}
                  className="mt-0.5 line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-gray-900 transition-colors hover:text-[#c5a059] sm:text-xs"
                >
                  {item.product.title}
                </Link>

                <div className="mt-auto flex items-end justify-between gap-1.5 pt-2">
                  <span className="min-w-0 text-xs font-bold text-[#0c1b33] sm:text-sm">
                    ${item.product.price.toFixed(2)}
                  </span>
                  {item.product.originalPrice && (
                    <span className="shrink-0 text-[9px] text-gray-400 line-through">
                      ${item.product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className={`shrink-0 text-[8px] font-semibold ${item.product.inStock ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {item.product.inStock ? 'In stock' : 'Sold out'}
                  </span>
                </div>
              </div>

              <div className="mt-2 border-t border-gray-100 pt-2">
                <button
                  onClick={() => addToCart(item.product, 1)}
                  className="flex min-h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#0c1b33] px-2 text-[8px] font-semibold text-white transition-colors hover:bg-[#162b4e] sm:text-[9px]"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
