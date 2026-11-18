'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  Percent,
  Scale,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import type { WebsiteInfo } from '@/lib/websiteInfo';
import { STOREHOUSE_MAIN_CATEGORIES, TOTAL_MAIN_STOREHOUSE_PRODUCTS } from '@/data/storehouseMainCategories';

export default function Navbar({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSellerStorefront = pathname?.startsWith('/stores/') || false;
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { products: compareProducts } = useCompare();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoryMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [categoryMenuOpen]);

  useEffect(() => {
    if (isSellerStorefront) setCategoryMenuOpen(false);
  }, [isSellerStorefront]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-[#e9e5dd] bg-[#fbfaf7]/95 shadow-[0_8px_30px_-26px_rgba(18,36,59,0.45)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-10">
        <div className="flex h-[68px] items-center justify-between gap-2 sm:h-[76px] sm:gap-4">

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            {!isSellerStorefront && <button
              type="button"
              onClick={() => setCategoryMenuOpen(true)}
              aria-label="Open browse by category menu"
              aria-expanded={categoryMenuOpen}
              aria-controls="store-category-drawer"
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#e6e1d8] bg-white px-2 py-2 text-[#14263d] shadow-sm transition hover:border-[#b99152] hover:bg-[#f8f6f1] sm:px-3"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.1em] sm:inline">Categories</span>
            </button>}
            {/* Brand Logo */}
            <Link href="/" className="flex min-w-0 flex-col items-start select-none group">
              {websiteInfo.logoUrl ? <img src={websiteInfo.logoUrl} alt={`${websiteInfo.siteName} logo`} className="h-9 max-w-28 object-contain object-left sm:h-12 sm:max-w-40" /> : <span className="font-serif text-xl font-semibold tracking-[0.04em] leading-tight text-[#14263d] sm:text-[27px]">{websiteInfo.siteName.toUpperCase()}</span>}
              {websiteInfo.tagline && <span className="mt-1.5 hidden text-[8px] font-semibold uppercase leading-none tracking-[0.2em] text-[#a77e43] transition-colors min-[375px]:inline sm:text-[9px]">{websiteInfo.tagline}</span>}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav ref={dropdownRef} className="hidden xl:flex items-center space-x-5 text-[12px] font-medium tracking-wide text-[#14263d]">
            {/* Home */}
            <Link
              href="/"
              className={`py-2 border-b transition-colors ${pathname === '/' ? 'border-[#b99152] text-[#14263d]' : 'border-transparent text-[#617083] hover:border-[#b99152] hover:text-[#14263d]'}`}
            >
              Home
            </Link>

            {/* Shop Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('shop')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'shop' ? null : 'shop')}
                className="flex items-center gap-1 hover:text-[#c5a059] py-2 transition-colors cursor-pointer"
              >
                <span>Shop</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {activeDropdown === 'shop' && (
                <div className="absolute top-full left-0 z-50 w-64 rounded-2xl border border-[#e9e5dd] bg-white py-3 shadow-[0_22px_55px_-28px_rgba(18,36,59,0.45)] animate-fadeIn">
                  <Link
                    href="/shop"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-[#0c1b33] hover:text-[#c5a059] font-medium"
                  >
                    All Products
                  </Link>
                  <Link
                    href="/shop?sort=newest"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-[#c5a059]"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    href="/shop?featured=true"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-[#c5a059]"
                  >
                    Best Sellers
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link
                    href="/deals"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 text-[#c5a059] font-medium hover:bg-amber-50/50 flex items-center justify-between"
                  >
                    <span>Special Deals</span>
                    <Percent className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Deals Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('deals')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'deals' ? null : 'deals')}
                className="flex items-center gap-1 hover:text-[#c5a059] py-2 transition-colors cursor-pointer"
              >
                <span>Deals</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {activeDropdown === 'deals' && (
                <div className="absolute top-full left-0 z-50 w-56 rounded-2xl border border-[#e9e5dd] bg-white py-2 shadow-[0_22px_55px_-28px_rgba(18,36,59,0.45)]">
                  <Link
                    href="/deals"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-[#0c1b33] font-medium"
                  >
                    All Promotions
                  </Link>
                  <Link
                    href="/category/mens-fashion"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-xs text-gray-600"
                  >
                    Men&apos;s Fashion Edit
                  </Link>
                  <Link
                    href="/category/bags-accessories"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-xs text-gray-600"
                  >
                    Luxury Bags New Arrivals
                  </Link>
                  <Link
                    href="/category/sports-fitness"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2 hover:bg-gray-50 text-xs text-gray-600"
                  >
                    Sports & Fitness Deals
                  </Link>
                </div>
              )}
            </div>

            {/* About Us */}
            <Link
              href="/about"
              className="hover:text-[#c5a059] transition-colors py-1"
            >
              About Us
            </Link>

            {/* Contact */}
            <Link
              href="/contact"
              className="hover:text-[#c5a059] transition-colors py-1"
            >
              Contact
            </Link>

          </nav>

          {/* Right Controls: Search, Account, Wishlist, Cart */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} role="search" className="relative hidden xl:block">
              <input
                type="text"
                aria-label="Search the store"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 rounded-full border border-[#e6e1d8] bg-[#f3f1eb] py-2 pl-4 pr-10 text-xs text-[#14263d] placeholder-[#8a929e] transition-all focus:border-[#b99152] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b99152]/15 lg:w-64"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0c1b33]"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Account Icon */}
            <Link
              href="/account"
              aria-label="Account"
              className="rounded-full p-1 text-[#536174] transition-colors hover:bg-[#f0ede6] hover:text-[#14263d] sm:p-2"
            >
              <User className="h-4 w-4 stroke-[1.7] sm:h-5 sm:w-5" />
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative rounded-full p-1 text-[#536174] transition-colors hover:bg-[#f0ede6] hover:text-[#14263d] sm:p-2"
            >
              <Heart className="h-4 w-4 stroke-[1.7] sm:h-5 sm:w-5" />
              {totalWishlistItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b99152] px-1 text-[9px] font-bold text-white">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            <Link href="/compare" aria-label={`Compare products (${compareProducts.length})`} className="relative rounded-full p-1 text-[#536174] transition-colors hover:bg-[#f0ede6] hover:text-[#14263d] sm:p-2">
              <Scale className="h-4 w-4 stroke-[1.7] sm:h-5 sm:w-5" />
              {compareProducts.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b99152] px-1 text-[9px] font-bold text-white">{compareProducts.length}</span>}
            </Link>

            {/* Shopping Cart Icon with Item Count */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative rounded-full p-1 text-[#536174] transition-colors hover:bg-[#f0ede6] hover:text-[#14263d] sm:p-2"
            >
              <ShoppingBag className="h-4 w-4 stroke-[1.7] sm:h-5 sm:w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#14263d] px-1 text-[9px] font-bold text-white ring-2 ring-[#fbfaf7]">
                {totalItems}
              </span>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-1 text-[#14263d] transition-colors hover:bg-[#f0ede6] xl:hidden sm:p-2"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="animate-fadeIn border-t border-[#e9e5dd] bg-[#fbfaf7] px-4 pb-6 pt-4 shadow-lg xl:hidden">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search the store"
              className="w-full rounded-full border border-[#e6e1d8] bg-white py-3 pl-4 pr-10 text-sm focus:border-[#b99152] focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <nav className="flex flex-col space-y-2 text-sm font-medium text-[#14263d]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-gray-50 text-[#c5a059]"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-gray-50"
            >
              Shop All Products
            </Link>
            <Link
              href="/deals"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-gray-50 text-red-600 font-semibold"
            >
              Special Deals %
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-gray-50"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-gray-50"
            >
              Contact
            </Link>

            
          </nav>
        </div>
      )}
    </header>
    {categoryMenuOpen && !isSellerStorefront && (
      <div className="fixed inset-0 z-[80]" role="presentation">
        <button type="button" aria-label="Close category menu" onClick={() => setCategoryMenuOpen(false)} className="absolute inset-0 h-full w-full cursor-default bg-[#0c1b33]/45 backdrop-blur-[2px]" />
        <aside id="store-category-drawer" role="dialog" aria-modal="true" aria-labelledby="store-category-title" className="absolute inset-y-0 left-0 flex w-[min(88vw,380px)] flex-col border-r border-[#e9e4da] bg-[#fbfaf7] shadow-[20px_0_60px_-28px_rgba(12,27,51,0.45)] animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#e9e4da] px-5 py-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Main store</p>
              <h2 id="store-category-title" className="mt-1 font-serif text-2xl text-[#14263d]">Browse by category</h2>
            </div>
            <button type="button" onClick={() => setCategoryMenuOpen(false)} aria-label="Close category menu" className="rounded-full p-2 text-[#526071] transition hover:bg-white hover:text-[#14263d]"><X className="h-5 w-5" /></button>
          </div>
          <div className="border-b border-[#e9e4da] p-4">
            <Link href="/shop" onClick={() => setCategoryMenuOpen(false)} className="flex items-center justify-between rounded-xl bg-[#14263d] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#203a5b]">
              <span>All categories</span><span className="text-[10px] text-white/75">{TOTAL_MAIN_STOREHOUSE_PRODUCTS.toLocaleString('en-US')} products</span>
            </Link>
          </div>
          <nav aria-label="Store categories" className="flex-1 overflow-y-auto px-3 py-3">
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8791a0]">All departments</p>
            {STOREHOUSE_MAIN_CATEGORIES.map((category) => (
              <Link key={category.id} href={`/shop?category=${encodeURIComponent(category.slug)}`} onClick={() => setCategoryMenuOpen(false)} className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm text-[#526071] transition hover:bg-white hover:text-[#14263d] hover:shadow-sm">
                <span className="font-medium">{category.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-[10px] text-[#8791a0]">{(category.catalogProductCount || 0).toLocaleString('en-US')} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-[#e9e4da] px-5 py-3 text-[9px] text-[#8791a0]">{STOREHOUSE_MAIN_CATEGORIES.length} departments · USD catalog</div>
        </aside>
      </div>
    )}
    </>
  );
}
