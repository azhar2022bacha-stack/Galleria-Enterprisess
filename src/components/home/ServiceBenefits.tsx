import React from 'react';
import { PackageCheck, HeartHandshake, BadgeCheck, MessageCircle } from 'lucide-react';

const BENEFITS = [
  {
    icon: PackageCheck,
    title: 'Product details up front',
    description: 'Review item information before ordering.',
  },
  {
    icon: HeartHandshake,
    title: 'A considered selection',
    description: 'Browse fashion, home, and everyday finds.',
  },
  {
    icon: BadgeCheck,
    title: 'Clear order status',
    description: 'See when a new order is still pending.',
  },
  {
    icon: MessageCircle,
    title: 'Need a hand?',
    description: 'Reach the store through the contact page.',
  },
];

export default function ServiceBenefits() {
  return (
    <section className="border-b border-[#eee9df] bg-white py-7 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 divide-y divide-[#eee9df] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {BENEFITS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3.5 py-4 sm:px-4 sm:py-2 lg:px-6 first:lg:pl-0 last:lg:pr-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f1e8] text-[#a77e43]">
                  <Icon className="h-5 w-5 stroke-[1.6]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold leading-snug text-[#14263d] sm:text-xs">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-[10px] font-normal leading-relaxed text-[#758092] sm:text-[11px]">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
