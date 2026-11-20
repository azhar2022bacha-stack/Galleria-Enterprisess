'use client';

import Link from 'next/link';
import { ArrowRight, Armchair, Baby, BookOpen, CarFront, CookingPot, Dumbbell, Footprints, Gamepad2, Laptop, Luggage, PawPrint, Shirt, ShoppingBag, Smartphone, Sprout, Watch, type LucideIcon } from 'lucide-react';
import { useStorefrontCatalog } from '@/context/StorefrontCatalogContext';

const departmentIcons: Record<string, LucideIcon> = {
  'furniture-decor': Armchair,
  'home-kitchen': CookingPot,
  'computers-technology': Laptop,
  'clothing-apparel': Shirt,
  'shoes-footwear': Footprints,
  'watches-jewelry': Watch,
  'smartphones-mobile': Smartphone,
  'automotive-tools': CarFront,
  'sports-outdoors': Dumbbell,
  'bags-accessories': ShoppingBag,
  'books-stationery': BookOpen,
  'pet-supplies': PawPrint,
  'garden-tools': Sprout,
  'baby-products': Baby,
  'toys-games': Gamepad2,
  'travel-accessories': Luggage,
};

const focusClasses = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77e43]';

export default function CategoryIcons() {
  const { categories } = useStorefrontCatalog();
  if (!categories.length) return null;

  return (
    <section aria-labelledby="store-categories" className="bg-[#fbfaf7] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1344px]">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 sm:mb-8">
          <h2 id="store-categories" className="font-serif text-3xl tracking-[-0.045em] text-[#14263d] sm:text-4xl lg:text-[2.65rem]">Shop by category</h2>
          <Link href="/shop" className={'group inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#14263d] underline decoration-[#b1a183] underline-offset-[5px] hover:decoration-current ' + focusClasses}>
            View all products <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#e9e1d5] bg-[#e9e1d5] sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = departmentIcons[category.slug] || ShoppingBag;
            return (
              <Link key={category.id} prefetch={false} href={'/shop?category=' + encodeURIComponent(category.slug)} className="group flex min-h-[65px] items-center gap-2.5 bg-[#fffdf9] px-2.5 py-2 text-[#14263d] transition hover:bg-[#f2ece0] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a77e43] sm:gap-3 sm:px-3">
                <Icon size={19} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-[#806640]" />
                <span className="text-xs font-medium leading-snug sm:text-[13px]">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
