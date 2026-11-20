import Link from 'next/link';
import { ArrowUpRight, Headphones, PackageSearch, RotateCcw, Truck } from 'lucide-react';

const serviceLinks = [
  { href: '/about#shipping', title: 'Shipping information', icon: Truck },
  { href: '/about#returns', title: 'Returns & refunds', icon: RotateCcw },
  { href: '/account', title: 'Track an order', icon: PackageSearch },
  { href: '/contact', title: 'Contact us', icon: Headphones },
];

export default function ServiceBenefits() {
  return (
    <nav aria-label="Shopping help" className="border-y border-[#e6ded0] bg-[#fffdf9] px-4 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1344px] grid-cols-2 lg:grid-cols-4">
        {serviceLinks.map(({ href, title, icon: Icon }) => (
          <Link key={href} href={href} className="group flex min-h-[72px] items-center gap-2 px-1.5 py-3 text-[#14263d] hover:text-[#765b34] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a77e43] sm:min-h-[84px] sm:gap-3 sm:px-3">
            <Icon size={21} strokeWidth={1.55} aria-hidden="true" className="shrink-0 text-[#806640]" />
            <span className="text-sm font-semibold">{title}</span>
            <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" className="ml-auto hidden shrink-0 text-[#806640] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
