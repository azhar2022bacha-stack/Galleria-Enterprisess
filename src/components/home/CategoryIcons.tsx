'use client';

import Link from 'next/link';
import {
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Dumbbell,
  Footprints,
  Gamepad2,
  House,
  Laptop,
  Luggage,
  PawPrint,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sprout,
  Watch,
} from 'lucide-react';
import { STOREHOUSE_MAIN_CATEGORIES } from '@/data/storehouseMainCategories';

const CATEGORY_ICONS = [House, House, Laptop, Shirt, Footprints, Watch, Smartphone, Car, Dumbbell, Briefcase, BookOpen, PawPrint, Sprout, Baby, Gamepad2, Luggage];

export default function CategoryIcons() {
  return (
    <section className="border-y border-[#eee9df] bg-[#fbfaf7] py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">Browse the marketplace</p>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[#14263d] sm:text-3xl">Shop by department</h2>
          </div>
          <Link href="/shop" className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#526071] transition-colors hover:text-[#a77e43] sm:block">View all products →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
          {STOREHOUSE_MAIN_CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[index] || ShoppingBag;
            return (
              <Link key={category.id} href={`/shop?category=${encodeURIComponent(category.slug)}`} className="group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#eee9df] bg-white px-2 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#d6c5a5] hover:shadow-[0_14px_34px_-24px_rgba(20,38,61,0.38)] sm:min-h-[126px]">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f1e8] text-[#14263d] transition-colors duration-300 group-hover:bg-[#14263d] group-hover:text-[#f4dfba]">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium leading-snug text-[#526071] transition-colors group-hover:text-[#14263d] sm:text-[11px]">{category.name}</span>
                <span className="mt-1 text-[9px] text-[#9a8057]">{(category.catalogProductCount || 0).toLocaleString('en-US')} products</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
