'use client';

import Link from 'next/link';
import { Heart, Tag } from 'lucide-react';
import { StorefrontCardPurchase } from '@/components/product/StorefrontCardPurchase';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import { useStorefrontCatalog } from '@/context/StorefrontCatalogContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function DealsPage() {
  const { products, isLoading, error } = useStorefrontCatalog();
  const dealsProducts = products.filter(
    (p) => p.isDeal || (p.originalPrice && p.originalPrice > p.price)
  );

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#0c1b33] font-medium">Deals & Promotions</span>
        </div>

        {/* Big Deal Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0c1b33] via-[#14284b] to-[#0c1b33] text-white p-8 sm:p-12 mb-10 shadow-xl border border-[#c5a059]/30">
          <div className="max-w-xl relative z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#c5a059]/20 text-[#c5a059] text-xs font-bold uppercase tracking-wider mb-3 border border-[#c5a059]/40">
              <Tag className="w-3.5 h-3.5" />
              <span>Catalog price edit</span>
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Special prices, thoughtfully selected
            </h1>
            <p className="text-sm text-gray-300 mt-3 font-light leading-relaxed">
              Browse current offers and special prices from the store.
            </p>

          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#0c1b33]">
            Special price listings ({dealsProducts.length})
          </h2>
          <Link href="/shop" className="text-xs font-semibold text-[#c5a059] hover:underline">
            View All Catalog
          </Link>
        </div>

        {dealsProducts.length === 0 ? (
          <p role="status" className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-600">{isLoading ? 'Loading offers…' : error || 'No special offers are available right now.'}</p>
        ) : <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {dealsProducts.map((product) => {
            const isWish = isInWishlist(product.id);
            const savings = product.originalPrice ? product.originalPrice - product.price : 0;
            const discountPercent = product.originalPrice
              ? Math.round((savings / product.originalPrice) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group flex h-full min-w-0 flex-col rounded-xl border border-gray-200/90 bg-white p-2 shadow-sm transition-shadow hover:shadow-md sm:p-2.5"
              >
                <div className="flex flex-1 flex-col">
                  {/* Image */}
                  <div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-white">
                    <Link href={`/product/${product.id}`} className="absolute inset-0 block">
                      <ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-105" />
                    </Link>

                    {/* Percentage Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-2 py-0.5 text-[8px] font-bold text-white shadow">
                        -{discountPercent}% OFF
                      </span>
                    )}

                    {/* Wishlist Button */}
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

                  {/* Category */}
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

                  {savings > 0 && <span className="mt-1 text-[10px] font-semibold text-emerald-700">Save ${savings.toFixed(2)}</span>}
                  <StorefrontCardPurchase product={product} onAdd={() => addToCart(product, 1)} />
                </div>
              </div>
            );
          })}
        </div>}

      </div>
    </div>
  );
}
