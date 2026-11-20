import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Armchair, Baby, BookOpen, CarFront, CookingPot, Dumbbell, Footprints, Gamepad2, Laptop, Luggage, PawPrint, Shirt, ShoppingBag, Smartphone, Sprout, Watch, type LucideIcon } from 'lucide-react';
import { STOREHOUSE_MAIN_CATEGORIES } from '@/data/storehouseMainCategories';

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

const departmentPhotos: Record<string, string> = {
  'clothing-apparel': '/images/storefront/catalog-prod-07.png',
  'bags-accessories': '/images/storefront/catalog-prod-01.png',
  'computers-technology': '/images/storefront/catalog-prod-06.png',
  'shoes-footwear': '/images/storefront/catalog-prod-02.png',
};

const focusClasses = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77e43]';

export default function CategoryIcons() {
  const photoDepartments = STOREHOUSE_MAIN_CATEGORIES.filter(({ slug }) => departmentPhotos[slug]);
  const otherDepartments = STOREHOUSE_MAIN_CATEGORIES.filter(({ slug }) => !departmentPhotos[slug]);

  return (
    <section aria-labelledby="store-departments" className="bg-[#fbfaf7] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1344px]">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 sm:mb-8">
          <h2 id="store-departments" className="font-serif text-3xl tracking-[-0.045em] text-[#14263d] sm:text-4xl lg:text-[2.65rem]">Shop by department</h2>
          <Link href="/shop" className={'group inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#14263d] underline decoration-[#b1a183] underline-offset-[5px] hover:decoration-current ' + focusClasses}>
            View all products <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-6 lg:grid-cols-4">
          {photoDepartments.map((department) => (
            <Link key={department.id} prefetch={false} href={'/shop?category=' + encodeURIComponent(department.slug)} className={'group min-w-0 ' + focusClasses}>
              <div className="relative aspect-[5/4] overflow-hidden bg-[#ece4d7]">
                <Image src={departmentPhotos[department.slug]} alt="" fill sizes="(max-width: 1023px) 47vw, 23vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-3">
                <span className="text-sm font-semibold text-[#14263d] sm:text-base">{department.name}</span>
                <ArrowUpRight size={17} strokeWidth={1.65} className="shrink-0 text-[#755c37] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-[#e9e1d5] bg-[#e9e1d5] sm:grid-cols-3 lg:mt-10 lg:grid-cols-6">
          {otherDepartments.map((department) => {
            const Icon = departmentIcons[department.slug] || ShoppingBag;
            return (
              <Link key={department.id} prefetch={false} href={'/shop?category=' + encodeURIComponent(department.slug)} className="group flex min-h-[65px] items-center gap-2.5 bg-[#fffdf9] px-2.5 py-2 text-[#14263d] transition hover:bg-[#f2ece0] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a77e43] sm:gap-3 sm:px-3">
                <Icon size={19} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-[#806640]" />
                <span className="text-xs font-medium leading-snug sm:text-[13px]">{department.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
