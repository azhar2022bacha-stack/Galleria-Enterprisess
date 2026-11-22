import { ShoppingBasket } from 'lucide-react';
import { ProductRating } from './ProductRating';
import type { Product } from '@/types';

export function StorefrontCardPurchase({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const available = product.inStock && product.stockQuantity > 0;
  const label = available ? 'Add ' + product.title + ' to cart' : product.title + ' is out of stock';
  return (
    <div className="mt-auto pt-2">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          <span className="text-sm font-bold tracking-tight text-[#14263d] sm:text-base">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price ? (
            <span className="text-[10px] text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
          ) : null}
          {!available && <span className="text-[10px] text-slate-600">Out of stock</span>}
        </div>
        <button type="button" onClick={onAdd} disabled={!available} aria-label={label} title={label}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d4b884] bg-[#fffdf9] text-[#805915] transition hover:bg-[#f5ead6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] disabled:cursor-not-allowed disabled:opacity-45">
          <ShoppingBasket size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 border-t border-[#eee7dc] pt-2">
        <ProductRating productId={product.id} rating={product.rating} count={product.reviewCount} />
      </div>
    </div>
  );
}
