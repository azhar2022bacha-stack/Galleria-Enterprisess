'use client';

import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Filter,
  SlidersHorizontal,
  Star,
  Heart,
  Scale,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { StorefrontCatalogProvider, useStorefrontCatalog } from '@/context/StorefrontCatalogContext';
import { getStoreCategory } from '@/lib/storeCatalog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import { StorefrontCardPurchase } from '@/components/product/StorefrontCardPurchase';
import StorehouseShop, { type InitialShopPage } from '@/components/storehouse/StorehouseShop';

const PRICE_FILTER_MAX = 300;
function LegacyShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialFeatured = searchParams.get('featured') === 'true';

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { products: compareProducts, toggleProduct: toggleCompareProduct, hasProduct: isInCompare, limit: compareLimit } = useCompare();
  const { products, categories: storeCategories, isLoading, error } = useStorefrontCatalog();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const categorySlug = storeCategories.some((category) => category.slug === selectedCategory)
    ? selectedCategory : getStoreCategory(selectedCategory)?.slug || selectedCategory;
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [priceRange, setPriceRange] = useState<number>(PRICE_FILTER_MAX);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>(initialFeatured ? 'featured' : 'default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filtersMenuId = useDismissMenusOnOutsideClick(mobileFiltersOpen, () => setMobileFiltersOpen(false));

  const priceFilterMax = Math.max(PRICE_FILTER_MAX, Math.ceil(products.reduce((max, product) => Math.max(max, product.price), 0) / 50) * 50);
  const searchSuggestions = React.useMemo(() => Array.from(new Set(
    products.flatMap((product) => [product.title, product.brand || '', product.category, product.sku]).filter(Boolean)
  )), [products]);
  useEffect(() => {
    setPriceRange((current) => current === PRICE_FILTER_MAX ? priceFilterMax : current);
  }, [priceFilterMax]);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialCategory, initialSearch]);

  const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (categorySlug && product.storeCategorySlug !== categorySlug) {
      return false;
    }
    // Search query
    if (searchTerms.length > 0) {
      const searchableText = [
        product.title,
        product.description,
        product.shortDescription,
        product.category,
        product.categorySlug,
        product.brand,
        product.sku,
        product.slug,
        ...(product.tags || []),
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchTerms.every((term) => searchableText.includes(term))) return false;
    }
    // Price range
    if (product.price > priceRange) {
      return false;
    }
    // In stock
    if (inStockOnly && !product.inStock) {
      return false;
    }
    // Min rating
    if (minRating > 0 && product.rating < minRating) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
    if (sortBy === 'featured') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    return 0;
  });

  const resetFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setPriceRange(priceFilterMax);
    setInStockOnly(false);
    setMinRating(0);
    setSortBy('default');
  };

  const activeFilterCount = [
    selectedCategory,
    searchQuery.trim(),
    priceRange < priceFilterMax,
    inStockOnly,
    minRating > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f8f6f1] py-10 sm:py-14">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">

        {/* Breadcrumb & Header */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] text-[#758092]">
            <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#0c1b33] font-medium">Shop</span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">A thoughtful edit</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-[-0.04em] text-[#14263d] sm:text-5xl">
            Explore the collection
          </h1>
          <p className="mt-3 text-sm text-[#687586]" aria-live="polite">
            {searchQuery.trim()
              ? `${filteredProducts.length} results for “${searchQuery.trim()}”`
              : `${filteredProducts.length} products in the collection`}
          </p>
        </div>

        {/* Top Controls Bar */}
        <div className="mb-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e9e4da] bg-white p-3 shadow-[0_12px_34px_-30px_rgba(20,38,61,0.45)] sm:mb-8 sm:flex-row sm:p-4">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            aria-expanded={mobileFiltersOpen}
            aria-controls="shop-filters"
            data-click-away-menu={mobileFiltersOpen ? filtersMenuId : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e3ddcf] px-4 py-2.5 text-xs font-semibold text-[#14263d] sm:w-auto lg:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters{activeFilterCount ? ` (${activeFilterCount} active)` : ''}</span>
          </button>

          {/* Search bar inside shop */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              list="shop-product-suggestions"
              aria-label="Search products by name, brand, category, or SKU"
              placeholder="Search products, brands, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#e6e1d8] bg-[#f8f6f1] py-3 pl-4 pr-10 text-xs text-[#14263d] placeholder-[#8a929e] focus:border-[#b99152] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b99152]/10"
            />
            <datalist id="shop-product-suggestions">
              {searchSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear product search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#0c1b33]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#758092]">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-[#e6e1d8] bg-white px-4 py-2.5 text-xs text-[#14263d] focus:border-[#b99152] focus:outline-none"
            >
              <option value="default">Default</option>
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Filters */}
          <aside
            id="shop-filters"
            data-click-away-menu={mobileFiltersOpen ? filtersMenuId : undefined}
            className={`${
              mobileFiltersOpen ? 'block' : 'hidden'
            } sticky top-28 h-fit space-y-6 rounded-2xl border border-[#e9e4da] bg-white p-5 shadow-[0_12px_34px_-30px_rgba(20,38,61,0.45)] lg:col-span-1 lg:block`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-sm text-[#0c1b33]">
                <Filter className="w-4 h-4 text-[#c5a059]" />
                <span>Filters</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-[#c5a059] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Categories Filter */}
            <div>
              <h3 className="text-xs font-bold text-[#0c1b33] uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${
                    selectedCategory === ''
                      ? 'bg-[#0c1b33] text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {storeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded transition-colors flex items-center justify-between ${
                      categorySlug === cat.slug
                        ? 'bg-[#0c1b33] text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">
                      {cat.catalogProductCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#0c1b33] uppercase tracking-wider">
                  Max Price
                </h3>
                <span className="text-xs font-bold text-[#c5a059]">${priceRange}</span>
              </div>
              <input
                type="range"
                min="0"
                max={priceFilterMax}
                step="10"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#c5a059] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>$0</span>
                <span>${priceFilterMax}</span>
              </div>
            </div>

            {/* In-Stock Filter */}
            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#0c1b33] focus:ring-[#c5a059] w-4 h-4 accent-[#0c1b33]"
                />
                <span className="text-xs text-gray-700 font-medium">In-Stock Only</span>
              </label>
            </div>

            {/* Rating Filter */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-[#0c1b33] uppercase tracking-wider mb-2">
                Minimum Rating
              </h3>
              <div className="space-y-1.5">
                {[5, 4, 0].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded flex items-center justify-between ${
                      minRating === rating
                        ? 'bg-amber-50 text-[#0c1b33] font-semibold border border-[#c5a059]/30'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{rating === 0 ? 'Any Rating' : `${rating} Stars & Above`}</span>
                    {rating > 0 && (
                      <div className="flex text-[#c5a059]">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            {isLoading || error ? (
              <p role="status" className="rounded-3xl border border-[#e9e4da] bg-white px-6 py-16 text-center text-sm text-[#626a73]">{isLoading ? 'Loading products…' : error}</p>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-[#e9e4da] bg-white px-6 py-16 text-center shadow-sm sm:px-12">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Search className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-[#0c1b33]">{products.length ? 'No matching products' : 'No products available yet'}</h2>
                <p className="text-gray-500 text-sm mt-2 mb-5">
                  {searchQuery.trim()
                    ? `We could not find “${searchQuery.trim()}” with these filters. Try another name, brand, category, or SKU.`
                    : 'Try broadening your filters or exploring another category.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 border border-gray-300 text-[#0c1b33] text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2 bg-[#0c1b33] text-white text-xs font-semibold rounded hover:bg-[#162b4e] transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {storeCategories.slice(0, 5).map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-600 hover:border-[#c5a059] hover:text-[#0c1b33]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredProducts.map((product) => {
                  const isWish = isInWishlist(product.id);

                  return (
                    <div
                      key={product.id}
                      className="group flex h-full min-w-0 flex-col rounded-xl border border-[#e9e4da] bg-white p-2 shadow-[0_8px_24px_-22px_rgba(20,38,61,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9c9aa] hover:shadow-md sm:p-2.5"
                    >
                      <div className="flex flex-1 flex-col">
                        {/* Image Container */}
                        <div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-white">
                          <Link href={`/product/${product.id}`} className="absolute inset-0 block">
                            <ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-[1.04]" />
                          </Link>

                          {/* Wishlist toggle */}
                          <button
                            onClick={() => toggleWishlist(product)}
                            aria-label="Save to Wishlist"
                              className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all ${
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

                          {/* Discount badge */}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-[#9a463d] px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
                              Special price
                            </span>
                          )}
                          <button type="button" onClick={() => toggleCompareProduct(product)} disabled={!isInCompare(product.id) && compareProducts.length >= compareLimit} aria-label={`${isInCompare(product.id) ? 'Remove' : 'Add'} ${product.title} ${isInCompare(product.id) ? 'from' : 'to'} comparison`} aria-pressed={isInCompare(product.id)} title={compareProducts.length >= compareLimit && !isInCompare(product.id) ? `Compare up to ${compareLimit} products` : isInCompare(product.id) ? 'Remove from comparison' : 'Add to comparison'} className={`absolute bottom-1.5 right-1.5 flex h-7 items-center gap-1 rounded-full border px-2 text-[8px] font-bold shadow-sm transition ${isInCompare(product.id) ? 'border-[#14263d] bg-[#14263d] text-white' : 'border-white/80 bg-white/90 text-[#536174] hover:text-[#14263d]'} disabled:cursor-not-allowed disabled:opacity-50`}><Scale className="h-3 w-3" />{isInCompare(product.id) ? 'Added' : 'Compare'}</button>
                        </div>

                        {/* Category */}
                        <span className="truncate text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9a8057]">
                          {product.category}
                        </span>

                        {/* Title */}
                        <Link
                          href={`/product/${product.id}`}
                          className="mt-0.5 line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-[#192b42] transition-colors hover:text-[#a77e43] sm:text-xs"
                        >
                          {product.title}
                        </Link>
                        {product.sellerStoreSlug && <Link href={`/stores/${product.sellerStoreSlug}`} className="mt-0.5 block truncate text-[9px] font-medium text-[#8a7350] hover:text-[#14263d]">Sold by {product.brand}</Link>}

                        <StorefrontCardPurchase product={product} onAdd={() => addToCart(product, 1)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

        </div>

      </div>
    </div>
  );
}

function ShopContent({ initialPage }: { initialPage?: InitialShopPage }) {
  const searchParams = useSearchParams();
  return searchParams.get('catalog') === 'legacy' ? <StorefrontCatalogProvider forceFull><LegacyShopContent /></StorefrontCatalogProvider> : <StorehouseShop key={searchParams.toString()} initialPage={initialPage} />;
}

export default function ShopPageClient({ initialPage }: { initialPage?: InitialShopPage }) {
  return (
    <Suspense fallback={<div className="min-h-screen p-12 text-center text-gray-500">Loading the store...</div>}>
      <ShopContent initialPage={initialPage} />
    </Suspense>
  );
}
