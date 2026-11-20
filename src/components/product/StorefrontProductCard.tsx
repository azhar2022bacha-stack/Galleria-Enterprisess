'use client';

import Link from 'next/link';
import { Heart, Scale, ShoppingBag } from 'lucide-react';
import { ProductCardImage } from '@/components/product/ProductCardImage';
import type { Product } from '@/types';

interface StorefrontProductCardProps {
  product: Product;
  saved: boolean;
  onWishlist: () => void;
  onAdd: () => void;
  comparison?: {
    selected: boolean;
    disabled: boolean;
    limit: number;
    onToggle: () => void;
  };
}

const iconClasses = 'inline-flex h-9 items-center justify-center rounded-full border border-[#ddd4c5] bg-[#fffdf9] text-[color:var(--website-primary)] shadow-sm transition hover:border-[#a77e43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] aria-pressed:border-[#14263d] aria-pressed:bg-[#14263d] aria-pressed:text-white disabled:cursor-not-allowed disabled:opacity-50';

export function StorefrontProductCard({ product, saved, onWishlist, onAdd, comparison }: StorefrontProductCardProps) {
  const productUrl = '/product/' + product.id;
  const available = product.inStock && product.stockQuantity > 0;

  return (
    <article className="group flex min-w-0 flex-col border border-[#e4dcd0] bg-[#fffdf9] transition hover:border-[#c6b596] hover:shadow-[0_12px_24px_-20px_rgba(20,38,61,0.45)]">
      <div className="relative isolate aspect-square overflow-hidden border-b border-[#eee7dc] bg-[#f0ece5]">
        <Link href={productUrl} prefetch={false} aria-label={'View ' + product.title} className="absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a77e43]">
          <ProductCardImage src={product.image} alt={product.title} sizes="(max-width: 639px) 46vw, (max-width: 1023px) 31vw, 23vw" className="object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-[1.035] sm:p-5" />
        </Link>
        <button type="button" onClick={onWishlist} aria-pressed={saved} aria-label={saved ? 'Remove ' + product.title + ' from wishlist' : 'Save ' + product.title + ' to wishlist'} title={saved ? 'Remove from wishlist' : 'Save to wishlist'} className={'absolute right-2 top-2 w-9 sm:right-3 sm:top-3 ' + iconClasses}>
          <Heart size={17} strokeWidth={1.65} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {comparison && (
          <button type="button" onClick={comparison.onToggle} disabled={comparison.disabled} aria-pressed={comparison.selected} aria-label={comparison.selected ? 'Remove ' + product.title + ' from comparison' : 'Add ' + product.title + ' to comparison'} title={comparison.selected ? 'Remove from comparison' : 'Compare up to ' + comparison.limit + ' products'} className={'absolute bottom-2 right-2 gap-1.5 px-2 text-xs font-semibold sm:bottom-3 sm:right-3 ' + iconClasses}>
            <Scale size={15} strokeWidth={1.65} />{comparison.selected ? 'Compared' : 'Compare'}
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-[#755c37] sm:text-[11px]">{product.subcategory || product.category}</p>
        <Link href={productUrl} prefetch={false} className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#14263d] hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] sm:text-base">{product.title}</Link>
        <p className="mt-1 truncate text-xs text-[#626a73]">{comparison ? [product.brand, product.sku].filter(Boolean).join(' · ') : product.brand}</p>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 pt-3">
          <span className="text-base font-semibold tracking-tight text-[#14263d] sm:text-lg">${product.price.toFixed(2)}</span>
          {comparison && available && <span className="text-[11px] font-medium text-[#4e6651]">{product.stockQuantity} available</span>}
        </div>
        <button type="button" onClick={onAdd} disabled={!available} aria-label={available ? 'Add ' + product.title + ' to cart' : product.title + ' is out of stock'} className="mt-2.5 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-[#cdbfa8] bg-[#fffdf9] px-1.5 text-xs font-semibold text-[color:var(--website-primary)] transition hover:border-[#14263d] hover:bg-[#14263d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] disabled:cursor-not-allowed disabled:border-[#e5dfd4] disabled:bg-[#f2eee7] disabled:text-[#666d76] sm:gap-2 sm:text-sm">
          <ShoppingBag size={15} strokeWidth={1.65} />{available ? 'Add to cart' : 'Out of stock'}
        </button>
      </div>
    </article>
  );
}
