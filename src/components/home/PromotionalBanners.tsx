'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function PromotionalBanners() {
  return (
    <section className="bg-[#fbfaf7] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">Find your next favorite</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-[#14263d] sm:text-3xl">Explore the edits</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          
          {/* Banner 1: Men's Fashion */}
          <div className="group relative flex h-[250px] flex-col justify-between overflow-hidden rounded-2xl bg-[#e8e4dc] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:h-[280px] sm:p-7">
            {/* Background Image Composition */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-7/12 pointer-events-none">
              <Image
                src="/images/storefront/catalog-prod-05.png"
                alt="Men's Fashion"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#e8e4dc] via-[#e8e4dc]/80 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-[200px]">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0c1b33] leading-snug">
                Men&apos;s Fashion
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 mt-1 font-normal">
                Everyday style, thoughtfully selected.
              </p>
            </div>

            <div className="relative z-10">
              <Link
                href="/category/mens-fashion"
                className="inline-flex items-center gap-2 rounded-full bg-[#14263d] px-4 py-2.5 text-[9px] font-semibold tracking-[0.1em] text-white shadow-sm transition-all hover:bg-[#203a5b]"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Banner 2: Luxury Bags */}
          <div className="group relative flex h-[250px] flex-col justify-between overflow-hidden rounded-2xl bg-[#14263d] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:h-[280px] sm:p-7">
            {/* Background Image Composition */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-7/12 pointer-events-none">
              <Image
                src="/images/storefront/catalog-prod-01.png"
                alt="Luxury Bags"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c1b33] via-[#0c1b33]/80 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-[200px]">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug">
                Luxury Bags
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 font-light">
                New Arrivals
              </p>
            </div>

            <div className="relative z-10">
              <Link
                href="/category/bags-accessories"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-[9px] font-semibold tracking-[0.1em] text-white backdrop-blur transition-all hover:bg-white/20"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Banner 3: Sports & Fitness */}
          <div className="group relative flex h-[250px] flex-col justify-between overflow-hidden rounded-2xl bg-[#eee9df] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:h-[280px] sm:p-7">
            {/* Background Image Composition */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-7/12 pointer-events-none">
              <Image
                src="/images/storefront/catalog-prod-09.png"
                alt="Sports & Fitness"
                fill
                className="object-contain object-right group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f1f3f6] via-[#f1f3f6]/70 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-[200px]">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0c1b33] leading-snug">
                Sports & Fitness
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 mt-1 font-normal">
                Gear for your everyday movement.
              </p>
            </div>

            <div className="relative z-10">
              <Link
                href="/category/sports-fitness"
                className="inline-flex items-center gap-2 rounded-full bg-[#14263d] px-4 py-2.5 text-[9px] font-semibold tracking-[0.1em] text-white shadow-sm transition-all hover:bg-[#203a5b]"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
