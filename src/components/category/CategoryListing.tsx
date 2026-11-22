'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StorefrontCardPurchase } from '@/components/product/StorefrontCardPurchase';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useStorefrontCatalog } from '@/context/StorefrontCatalogContext';
import { catalogCategorySlug } from '@/data/catalogCategoryReplacements';

const PAGE_SIZE = 24;

export default function CategoryListing({ categorySlug: requestedCategory, subcategorySlug }: { categorySlug: string; subcategorySlug?: string }) {
  const categorySlug = catalogCategorySlug(requestedCategory);
  const { categories, products: catalogProducts, isLoading, error } = useStorefrontCatalog();
  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = category?.subcategories.find((item) => item.slug === subcategorySlug);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const categoryProducts = useMemo(
    () => catalogProducts.filter((product) => product.storeCategorySlug === categorySlug),
    [catalogProducts, categorySlug],
  );

  const products = useMemo(() => {
    const selected = subcategorySlug ? categoryProducts.filter((product) => product.subcategorySlug === subcategorySlug) : categoryProducts;
    const normalizedSearch = search.trim().toLowerCase();
    const searched = normalizedSearch
      ? selected.filter((product) => `${product.title} ${product.brand || ''} ${product.description} ${product.sku}`.toLowerCase().includes(normalizedSearch))
      : selected;
    return [...searched].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      return Number(Boolean(b.isFeatured || b.isBestSeller)) - Number(Boolean(a.isFeatured || a.isBestSeller));
    });
  }, [categoryProducts, subcategorySlug, search, sort]);
  const subcategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { subcategorySlug } of categoryProducts) {
      if (subcategorySlug) counts.set(subcategorySlug, (counts.get(subcategorySlug) ?? 0) + 1);
    }
    return counts;
  }, [categoryProducts]);

  useEffect(() => setPage(1), [categorySlug, subcategorySlug, search, sort]);

  if (!category && (isLoading || error)) return <div role="status" className="min-h-[55vh] bg-[#f8f6f1] px-4 py-24 text-center text-sm text-[#687586]">{isLoading ? 'Loading collections…' : error}</div>;
  if (!category || (subcategorySlug && !subcategory)) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center"><h1 className="font-serif text-3xl text-[#14263d]">Collection not found</h1><Link href="/shop" className="mt-5 inline-flex rounded-full bg-[#14263d] px-5 py-3 text-xs font-bold text-white">Explore the store</Link></div>;
  }

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <div className="min-h-screen bg-[#f8f6f1] py-8 sm:py-12">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] text-[#758092]"><Link href="/" className="hover:text-[#a77e43]">Home</Link><span>/</span><Link href={`/category/${category.slug}`} className="hover:text-[#a77e43]">{category.name}</Link>{subcategory && <><span>/</span><span className="font-semibold text-[#14263d]">{subcategory.name}</span></>}</div>
      <section className="relative overflow-hidden rounded-[28px] bg-[#0c1b33] px-6 py-9 text-white shadow-xl sm:px-10 sm:py-12">
        <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-[#c5a059]/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight sm:text-5xl">{subcategory?.name || category.name}</h1>
          <div className="mt-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/85">{products.length.toLocaleString()} listed products</div>
        </div>
      </section>

      {!subcategory && category.subcategories.length > 0 && <section className="mt-7">
        <h2 className="mb-3 font-serif text-xl text-[#14263d]">Browse collections</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {category.subcategories.map((item) => (
            <Link key={item.slug} href={`/category/${category.slug}/${item.slug}`} className="group flex min-h-[82px] items-center justify-between gap-3 rounded-2xl border border-[#e9e4da] bg-white px-4 py-3 text-xs font-semibold text-[#405066] shadow-sm transition hover:-translate-y-0.5 hover:border-[#d5c29f] hover:text-[#14263d] hover:shadow-md">
              <span className="min-w-0">
                <span className="block">{item.name}</span>
                <span className="mt-1 block text-[9px] font-normal text-[#929baa]">{subcategoryCounts.get(item.slug) ?? 0} products</span>
              </span>
              <span className="text-[#b99152] transition group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </div>
      </section>}

      {subcategory && <nav aria-label={`${category.name} collections`} className="mt-6 flex gap-2 overflow-x-auto pb-2">{category.subcategories.map((item) => <Link key={item.slug} href={`/category/${category.slug}/${item.slug}`} className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition ${item.slug === subcategory.slug ? 'border-[#14263d] bg-[#14263d] text-white' : 'border-[#e6e1d8] bg-white text-[#5c6879] hover:border-[#b99152] hover:text-[#14263d]'}`}>{item.name}</Link>)}</nav>}

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#e9e4da] bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <h2 className="text-sm font-semibold text-[#14263d]">{subcategory?.name || category.name}<span className="ml-2 font-normal text-[#8993a0]">({products.length})</span></h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="category-search">Search this collection</label><input id="category-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this collection" className="w-full rounded-full border border-[#e6e1d8] bg-[#fbfaf7] px-4 py-2.5 text-xs outline-none focus:border-[#b99152] sm:w-64" />
            <label className="sr-only" htmlFor="category-sort">Sort products</label><select id="category-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full border border-[#e6e1d8] bg-white px-4 py-2.5 text-xs text-[#526071] outline-none focus:border-[#b99152]"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select>
          </div>
        </div>

        {pageProducts.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d9d2c5] bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-xl">✦</div><h3 className="mt-4 font-serif text-xl text-[#14263d]">This collection is ready for listings</h3><p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-[#758092]">No products have been published to this collection yet. Products added through the admin catalog or approved seller listings appear here automatically.</p><Link href="/shop" className="mt-5 inline-flex rounded-full border border-[#14263d] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#14263d] transition hover:bg-[#14263d] hover:text-white">Browse available products</Link></div> : <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{pageProducts.map((product) => {
            const wished = isInWishlist(product.id);
            return <article key={product.id} className="group flex h-full min-w-0 flex-col rounded-xl border border-[#e9e4da] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-2.5">
              <div className="relative mx-auto mb-2 aspect-square max-h-44 w-full max-w-44 overflow-hidden rounded-lg bg-white">
                <Link href={`/product/${product.id}`} className="absolute inset-0"><ProductCardImage src={product.image} alt={product.title} className="object-contain p-0 transition-transform duration-300 group-hover:scale-[1.04]" /></Link>
                <button type="button" onClick={() => toggleWishlist(product)} aria-label={`${wished ? 'Remove' : 'Add'} ${product.title} ${wished ? 'from' : 'to'} wishlist`} className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm ${wished ? 'bg-[#b99152] text-white' : 'bg-white text-[#667386] hover:text-[#14263d]'}`}><span aria-hidden="true" className="text-sm">{wished ? '♥' : '♡'}</span></button>
                {product.isCatalogSample && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#6b7280] shadow-sm">Sample listing</span>}
              </div>
              <div className="flex flex-1 flex-col px-0.5 pb-0.5 pt-1"><p className="truncate text-[8px] font-bold uppercase tracking-[0.1em] text-[#a77e43]">{product.subcategory || category.name}</p><Link href={`/product/${product.id}`} className="mt-0.5 line-clamp-2 min-h-9 text-[11px] font-semibold leading-4 text-[#14263d] hover:text-[#a77e43] sm:text-xs">{product.title}</Link>{product.brand && <p className="mt-0.5 truncate text-[9px] text-[#8791a0]">{product.brand}</p>}<StorefrontCardPurchase product={product} onAdd={() => addToCart(product, 1)} /></div>
            </article>;
          })}</div>
          {pageCount > 1 && <div className="mt-7 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-full border border-[#e6e1d8] bg-white px-4 py-2 text-xs font-semibold text-[#526071] disabled:opacity-40">Previous</button><span className="text-xs text-[#758092]">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-full border border-[#e6e1d8] bg-white px-4 py-2 text-xs font-semibold text-[#526071] disabled:opacity-40">Next</button></div>}
        </>}
      </section>
    </div>
  </div>;
}
