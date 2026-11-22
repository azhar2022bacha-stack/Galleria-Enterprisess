'use client';

import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronRight, Grid2X2, Heart, Menu, Scale, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { useStorefrontCatalog } from '@/context/StorefrontCatalogContext';
import type { WebsiteInfo } from '@/lib/websiteInfo';
import { BrandMark } from './BrandMark';

const shopLinks = [
  { href: '/shop', label: 'All products' },
  { href: '/shop?sort=newest', label: 'New arrivals' },
  { href: '/shop?featured=true', label: 'Best sellers' },
  { href: '/deals', label: 'Special deals' },
];

const dealLinks = [
  { href: '/deals', label: 'All promotions' },
];

const mainLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
];

const iconButton = 'relative inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-[#14263d] transition hover:bg-[#eee8dd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] min-[380px]:w-9 sm:w-11';
const navLink = 'inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[#414a53] transition hover:text-[#14263d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77e43]';

export default function Navbar({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSellerStorefront = pathname?.startsWith('/stores/') || false;
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { products: compareProducts } = useCompare();
  const { categories, total, isLoading, error } = useStorefrontCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'shop' | 'deals' | null>(null);
  const desktopMenuId = useDismissMenusOnOutsideClick(activeDropdown !== null, () => setActiveDropdown(null));
  const mobileMenuId = useDismissMenusOnOutsideClick(mobileMenuOpen, () => setMobileMenuOpen(false));
  const categoryDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    setCategoryMenuOpen(false);
    categoryDialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [categoryMenuOpen]);

  const openCategories = () => {
    const dialog = categoryDialogRef.current;
    if (!dialog || dialog.open) return;
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    dialog.showModal();
    setCategoryMenuOpen(true);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push('/shop?search=' + encodeURIComponent(query));
    setSearchQuery('');
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const accountLinks = [
    { href: '/account', label: 'Account', icon: UserRound, count: 0 },
    { href: '/wishlist', label: 'Wishlist', icon: Heart, count: totalWishlistItems },
    { href: '/compare', label: 'Compare products', icon: Scale, count: compareProducts.length },
    { href: '/cart', label: 'Shopping Cart', icon: ShoppingBag, count: totalItems },
  ];

  const departmentsButton = 'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-[#e2d9ca] bg-[#f4efe6] px-3 text-xs font-semibold text-[#14263d] transition hover:bg-[#eae0d0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] sm:px-4';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#e6ded0] bg-[#fffdf9]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 pb-3 pt-2 sm:gap-x-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)_minmax(0,1fr)] lg:py-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={iconButton + ' lg:hidden'}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="store-mobile-navigation"
              data-click-away-menu={mobileMenuOpen ? mobileMenuId : undefined}
            >
              {mobileMenuOpen ? <X size={21} strokeWidth={1.65} /> : <Menu size={21} strokeWidth={1.65} />}
            </button>

            <Link href="/" aria-label={websiteInfo.siteName + ' home'} className="flex min-w-0 items-center gap-1.5 justify-self-start rounded-sm py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] sm:gap-3">
              <BrandMark logoUrl={websiteInfo.logoUrl} className="size-8 sm:size-11 lg:size-12" />
              <span className="font-serif text-xs font-semibold leading-[1.08] text-[#14263d] [overflow-wrap:anywhere] min-[365px]:text-sm sm:text-xl lg:text-[clamp(1.2rem,1.8vw,1.75rem)]">{websiteInfo.siteName}</span>
            </Link>

            <div className="order-last col-span-3 mt-2 flex min-w-0 gap-2 lg:order-none lg:col-span-1 lg:mt-0">
              {!isSellerStorefront && (
                <button type="button" onClick={openCategories} aria-haspopup="dialog" aria-expanded={categoryMenuOpen} aria-controls="store-category-drawer" className={departmentsButton + ' lg:hidden'}>
                  <Grid2X2 size={15} strokeWidth={1.75} /> All Categories
                </button>
              )}
              <form onSubmit={handleSearchSubmit} role="search" className="relative min-w-0 flex-1">
                <button type="submit" aria-label="Search" className="absolute inset-y-0 left-0 flex w-10 items-center justify-center rounded-l-md text-[#526071] hover:text-[#14263d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a77e43]">
                  <Search size={18} strokeWidth={1.7} />
                </button>
                <input
                  type="search"
                  aria-label="Search the store"
                  placeholder="Search products"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-11 w-full rounded-md border border-[#e2d9ca] bg-white pl-10 pr-2 text-base text-[#14263d] placeholder:text-[#6b7075] transition focus:border-[#a77e43] focus:outline-none focus:ring-2 focus:ring-[#a77e43]/15 sm:pr-3 sm:text-sm"
                />
              </form>
            </div>

            <div className="flex items-center gap-0.5 justify-self-end sm:gap-1.5">
              {accountLinks.map(({ href, label, icon: Icon, count }) => (
                <Link key={href} href={href} aria-label={count > 0 || href === '/compare' ? label + ' (' + count + ')' : label} title={label} className={iconButton}>
                  <Icon size={20} strokeWidth={1.65} aria-hidden="true" />
                  {count > 0 && <span className="absolute right-0 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#14263d] px-1 text-[9px] font-semibold text-white ring-2 ring-[#fffdf9]">{count}</span>}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-[1fr_auto_1fr] items-center border-t border-[#eee7dc] lg:grid">
            {!isSellerStorefront && (
              <button type="button" onClick={openCategories} aria-haspopup="dialog" aria-expanded={categoryMenuOpen} aria-controls="store-category-drawer" className={departmentsButton + ' my-2 mr-auto min-h-9'}>
                <Grid2X2 size={15} strokeWidth={1.75} /> All Categories
              </button>
            )}
            <nav aria-label="Main navigation" className="col-start-2 flex items-center gap-8 xl:gap-10">
              <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={navLink}>Home</Link>
              {([{ id: 'shop', label: 'Shop', links: shopLinks }, { id: 'deals', label: 'Deals', links: dealLinks }] as const).map(({ id, label, links }) => (
                <div key={id} data-click-away-menu={activeDropdown === id ? desktopMenuId : undefined} className="relative">
                  <button
                    type="button"
                    aria-expanded={activeDropdown === id}
                    aria-controls={'store-nav-' + id}
                    onClick={() => setActiveDropdown((current) => current === id ? null : id)}
                    className={navLink}
                  >
                    {label} <ChevronDown size={14} strokeWidth={1.7} className={activeDropdown === id ? 'rotate-180' : ''} />
                  </button>
                  {activeDropdown === id && (
                    <ul id={'store-nav-' + id} className="absolute left-1/2 top-full z-10 min-w-56 -translate-x-1/2 rounded-b-md border border-[#e6ded0] bg-[#fffdf9] p-2 shadow-[0_18px_40px_-15px_rgba(22,29,38,0.28)]">
                      {links.map(({ href, label: itemLabel }) => (
                        <li key={href}><Link href={href} className="block rounded-sm px-3 py-2.5 text-sm text-[#414a53] transition hover:bg-[#f4efe6] hover:text-[#14263d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a77e43]" onClick={() => setActiveDropdown(null)}>{itemLabel}</Link></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {mainLinks.slice(1).map(({ href, label }) => (
                <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={navLink}>{label}</Link>
              ))}
            </nav>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav data-click-away-menu={mobileMenuId} id="store-mobile-navigation" aria-label="Mobile navigation" className="max-h-[60dvh] overflow-y-auto border-t border-[#e6ded0] bg-[#fffdf9] px-4 py-3 shadow-lg sm:px-8 lg:hidden">
            {[mainLinks[0], ...shopLinks, ...mainLinks.slice(1)].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center justify-between rounded-sm px-2 text-sm font-medium text-[#14263d] hover:bg-[#f4efe6]">
                {label} <ChevronRight size={16} strokeWidth={1.6} />
              </Link>
            ))}
          </nav>
        )}
      </header>

      {!isSellerStorefront && (
        <dialog
          ref={categoryDialogRef}
          id="store-category-drawer"
          aria-labelledby="store-category-title"
          onClose={() => setCategoryMenuOpen(false)}
          onClick={(event) => { if (event.target === event.currentTarget) categoryDialogRef.current?.close(); }}
          className="fixed inset-y-0 left-0 right-auto m-0 h-[100dvh] max-h-none w-[min(100%,410px)] max-w-none overflow-hidden bg-[#fffdf9] p-0 text-[#14263d] shadow-2xl backdrop:bg-[#101b2b]/55 backdrop:backdrop-blur-[2px]"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-[#e6ded0] px-5 py-4 sm:px-6">
              <h2 id="store-category-title" className="font-serif text-2xl tracking-tight">All Categories</h2>
              <button type="button" onClick={() => categoryDialogRef.current?.close()} aria-label="Close category menu" className={iconButton}><X size={21} strokeWidth={1.65} /></button>
            </div>
            <nav aria-label="Store categories" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <Link href="/shop" onClick={() => categoryDialogRef.current?.close()} className="mb-3 flex min-h-12 items-center justify-between rounded-md bg-[#14263d] px-4 text-sm font-semibold text-white transition hover:bg-[#203a5b]">
                <span>All products</span><span className="flex items-center gap-2 text-xs text-white/80">{!isLoading && !error && total.toLocaleString('en-US')} <ArrowRight size={15} /></span>
              </Link>
              {!categories.length && <p role="status" className="px-2 py-3 text-sm text-[#656f7a]">{isLoading ? 'Loading categories…' : error || 'No categories yet.'}</p>}
              <ul className="divide-y divide-[#eee7dc]">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={'/shop?category=' + encodeURIComponent(category.slug)} prefetch={false} onClick={() => categoryDialogRef.current?.close()} className="group flex min-h-12 items-center justify-between gap-3 rounded-sm px-2 text-sm transition hover:bg-[#f4efe6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a77e43]">
                      <span>{category.name}</span><span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-[#656f7a]">{category.catalogProductCount.toLocaleString('en-US')} <ChevronRight size={15} strokeWidth={1.65} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </dialog>
      )}
    </>
  );
}
