'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingBag,
  Info,
  Minus,
  Plus,
  ArrowLeft,
  Scale,
} from 'lucide-react';
import type { CatalogProduct } from '@/lib/storefrontCatalogServer';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { CustomerProductReviews } from '@/components/product/CustomerProductReviews';
import { ProductRating } from '@/components/product/ProductRating';
import { ProductCardImage } from '@/components/product/ProductCardImage';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [retry, setRetry] = useState(0);
  const [details, setDetails] = useState<{ id: string; retry: number; product?: CatalogProduct; related?: CatalogProduct[]; error?: string }>();
  const loaded = details?.id === id && details.retry === retry ? details : undefined;
  const product = loaded?.product;
  const error = loaded?.error;

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { products: compareProducts, toggleProduct: toggleCompareProduct, hasProduct: isInCompare, limit: compareLimit } = useCompare();

  const [quantity, setQuantity] = useState(1);
  const [activeGalleryImage, setActiveGalleryImage] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || '');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [reviewSummary, setReviewSummary] = useState({ productId: '', count: 0, average: 0 });
  const updateReviewSummary = useCallback((summary: { productId: string; count: number; average: number }) => setReviewSummary(summary), []);
  useEffect(() => {
    setSelectedColor(product?.colors?.[0] || '');
    setSelectedSize(product?.sizes?.[0] || '');
    setActiveGalleryImage(product?.image || '');
  }, [product?.id]);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    async function load() {
      try {
        const response = await fetch('/api/storefront-catalog?scope=detail&id=' + encodeURIComponent(id), { cache: 'no-store', signal: controller.signal });
        if (!response.ok && response.status !== 404) throw new Error('Catalog request failed.');
        const data = await response.json();
        if (active) setDetails({ id, retry, product: data.product ?? undefined, related: data.related });
      } catch {
        if (active) setDetails({ id, retry, error: 'Could not load the product. Please try again.' });
      } finally {
        clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [id, retry]);

  if (!product) {
    if (!loaded) return <div className="min-h-[55vh] bg-[#f8f6f1] px-4 py-24 text-center text-sm text-[#687586]">Loading product details…</div>;
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#0c1b33]">{error ? 'Catalog unavailable' : 'Product Not Found'}</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'The product you are looking for does not exist.'}</p>
        {error && <button type="button" className="mx-auto mt-3 block text-sm underline" onClick={() => setRetry((value) => value + 1)}>Retry loading product</button>}
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c1b33] text-white rounded text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shop</span>
        </Link>
      </div>
    );
  }

  const isWish = isInWishlist(product.id);
  const reviewCount = reviewSummary.productId === product.id ? reviewSummary.count : product.reviewCount;
  const reviewRating = reviewSummary.productId === product.id ? reviewSummary.average : product.rating;
  const canAddToCart = product.inStock && product.stockQuantity > 0;
  const productImages = [...new Set([product.image, ...(product.additionalImages || [])].filter(Boolean))];
  const relatedProducts = loaded?.related ?? [];

  return (
    <div className="min-h-screen bg-[#f8f6f1] py-8 sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-1.5 text-[10px] text-[#758092] sm:mb-8">
          <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#c5a059] transition-colors">Shop</Link>
          <span>/</span>
          <Link href={product.storeCategorySlug ? `/category/${encodeURIComponent(product.storeCategorySlug)}` : '/shop'} className="hover:text-[#c5a059] transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[#0c1b33] font-medium truncate max-w-[200px]">{product.title}</span>
        </div>

        {/* Product Main Section */}
        <div id="product-reviews" className="mb-10 scroll-mt-28 rounded-3xl border border-[#e9e4da] bg-white p-4 shadow-[0_24px_70px_-54px_rgba(20,38,61,0.5)] sm:mb-14 sm:p-7 lg:p-10">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-12">
            
            {/* Gallery Left (6 cols) */}
            <div className="lg:col-span-6">
              {/* Primary Large Image */}
              <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-2xl border border-[#eee9df] bg-[#f5f3ee] p-5 sm:p-8">
                <ProductCardImage
                  src={activeGalleryImage || product.image}
                  alt={product.title}
                  className="object-contain p-4 mix-blend-multiply"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* In Stock Badge */}
                <div className={`absolute left-4 top-4 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] backdrop-blur ${product.inStock && product.stockQuantity > 0 ? 'border-emerald-200 bg-white/90 text-emerald-800' : 'border-[#e5dac4] bg-white/90 text-[#687586]'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${product.inStock && product.stockQuantity > 0 ? 'bg-emerald-500' : 'bg-[#a7adb6]'}`}></span>
                  <span>{product.inStock && product.stockQuantity > 0 ? 'Available' : 'Currently unavailable'}</span>
                </div>

                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(product)}
                  aria-label="Wishlist"
                  className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 shadow-sm backdrop-blur transition-all ${
                    isWish
                      ? 'bg-[#c5a059] text-white shadow'
                      : 'bg-white text-gray-500 hover:text-[#0c1b33] shadow-md'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={isWish ? 'currentColor' : 'none'} />
                </button>
              </div>
              {productImages.length > 1 && <div className="mt-3 flex flex-wrap gap-2">
                {productImages.map((imageUrl, index) => <button key={`${imageUrl}-${index}`} type="button" onClick={() => setActiveGalleryImage(imageUrl)} aria-label={`View product image ${index + 1}`} aria-pressed={(activeGalleryImage || product.image) === imageUrl} className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-white p-1 ${((activeGalleryImage || product.image) === imageUrl) ? 'border-[#a77e43] ring-1 ring-[#a77e43]' : 'border-[#e9e4da]'}`}>
                  <Image src={imageUrl} alt={`${product.title} image ${index + 1}`} fill unoptimized sizes="64px" className="object-contain p-1" onError={(event) => event.currentTarget.parentElement?.setAttribute('hidden', 'true')} />
                </button>)}
              </div>}
            </div>

            {/* Details Right (6 cols) */}
            <div className="flex flex-col justify-between lg:col-span-6 lg:py-2">
              <div>
                {/* Brand & Category */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">
                    {product.category}
                  </span>
                  {product.sellerStoreSlug && <Link href={`/stores/${product.sellerStoreSlug}`} className="text-[10px] text-[#758092] hover:text-[#a77e43]">· Sold by {product.brand}</Link>}
                  <span className="text-gray-300">•</span>
                  <span className="font-mono text-[10px] text-[#87909c]">SKU {product.sku}</span>
                  {product.model && <span className="text-[10px] text-[#87909c]">Model {product.model}</span>}
                </div>

                {/* Title */}
                <h1 className="font-serif text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-[#14263d] sm:text-4xl lg:text-[46px]">
                  {product.title}
                </h1>

                <a href="#product-reviews" onClick={() => setActiveTab('reviews')}
                  className="mt-4 inline-flex rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43]">
                  <ProductRating rating={reviewRating} count={reviewCount} />
                </a>

                {/* Price */}
                <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#eee9df] pb-6">
                  <span className="text-3xl font-semibold tracking-tight text-[#14263d] sm:text-4xl">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-[#87909c] line-through sm:text-base">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="rounded-full border border-[#efd6d0] bg-[#fbefec] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#9a463d]">
                      Save ${(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>
                {product.priceSourceUrl && <p className="mt-2 text-[10px] text-[#87909c]">{product.priceCheckedAt ? `Price checked ${product.priceCheckedAt} · ` : ''}<a href={product.priceSourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#a77e43]">Price source</a></p>}

                {/* Short Description */}
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#687586]">
                  {product.description}
                </p>

                {/* Color Variants (if applicable) */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-6">
                    <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#14263d]">
                      Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`rounded-full border px-4 py-2 text-[11px] transition-all ${
                            selectedColor === color
                              ? 'border-[#0c1b33] bg-[#0c1b33] text-white font-medium shadow-sm'
                              : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Variants (if applicable) */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-5">
                    <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#14263d]">
                      Size: <span className="font-normal text-gray-600">{selectedSize}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-2 text-[11px] font-semibold transition-all ${
                            selectedSize === size
                              ? 'border-[#0c1b33] bg-[#0c1b33] text-white shadow-sm'
                              : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity and Add to Cart Buttons */}
                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                  {/* Quantity selector */}
                  <div className="flex min-h-12 w-fit items-center overflow-hidden rounded-full border border-[#e2ddd3] bg-[#fbfaf7]">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3 text-[#526071] transition-colors hover:bg-[#f0ede6]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-xs font-semibold text-[#14263d]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                      disabled={quantity >= product.stockQuantity}
                      className="p-3 text-[#526071] transition-colors hover:bg-[#f0ede6]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={() => addToCart(product, quantity, selectedColor, selectedSize)}
                    disabled={!canAddToCart}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#14263d] px-6 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_28px_-16px_rgba(20,38,61,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#203a5b] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:text-xs"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{canAddToCart ? 'Add to Shopping Cart' : 'Currently Unavailable'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompareProduct(product)}
                    disabled={!isInCompare(product.id) && compareProducts.length >= compareLimit}
                    aria-pressed={isInCompare(product.id)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d8d1c4] bg-white px-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#14263d] transition hover:bg-[#f6f2eb] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Scale className="h-4 w-4" />{isInCompare(product.id) ? 'Compared' : 'Compare'}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-3 rounded-2xl border border-[#e9e2d5] bg-[#f8f6f1] p-4 sm:p-5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#a77e43]" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#14263d]">Before you order</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#687586]">
                    This preview uses sample catalog details. Payment processing is not connected; checkout creates a pending order. Shipping, tax, and return terms still need to be confirmed.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Specifications & Reviews Tabs */}
        <div className="mb-10 rounded-3xl border border-[#e9e4da] bg-white p-5 shadow-sm sm:mb-14 sm:p-9">
          {/* Tab headers */}
          <div className="flex gap-6 overflow-x-auto border-b border-[#eee9df] sm:gap-8">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                activeTab === 'desc'
                  ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Description & Craftsmanship
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                activeTab === 'specs'
                  ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                activeTab === 'reviews'
                  ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Customer Reviews ({reviewCount})
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'desc' && (
              <div className="max-w-3xl space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>{product.description}</p>
                {product.isCatalogSample && <p className="rounded-xl bg-[#f8f6f1] p-4 text-xs text-[#687586]">
                  Listing descriptions and specifications are sample content until a seller listing is connected.
                </p>}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-xl">
                {product.specifications ? (
                  <dl className="divide-y divide-gray-100 text-xs">
                    {product.specifications.map((s, idx) => (
                      <div key={idx} className="py-2.5 grid grid-cols-2">
                        <dt className="font-semibold text-gray-500">{s.name}</dt>
                        <dd className="text-gray-900 font-medium">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-xs text-gray-500">Specifications have not been provided for this listing.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <CustomerProductReviews key={product.id} productId={product.id} productTitle={product.title} onSummary={updateReviewSummary} />
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
              <h2 className="mb-6 font-serif text-3xl font-medium tracking-tight text-[#14263d]">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="group flex h-full min-w-0 flex-col rounded-xl border border-[#e9e4da] bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-2.5"
                >
                  <div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-[#f5f3ee]">
                    <Link href={`/product/${p.id}`} className="absolute inset-0 block">
                      <ProductCardImage src={p.image} alt={p.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-[1.04]" />
                    </Link>
                  </div>
                  <Link
                    href={`/product/${p.id}`}
                    className="line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-gray-900 transition-colors hover:text-[#c5a059] sm:text-xs"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-auto flex items-center justify-between gap-1.5 pt-2">
                    <span className="truncate text-xs font-bold text-[#0c1b33] sm:text-sm">${p.price.toFixed(2)}</span>
                    <span className="shrink-0 text-[8px] text-[#758092]">{p.reviewCount > 0 ? `${p.rating.toFixed(1)} stars` : 'No reviews yet'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
