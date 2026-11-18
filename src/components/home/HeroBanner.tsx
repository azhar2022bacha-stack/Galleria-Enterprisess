import Link from 'next/link';
import Image from 'next/image';
import { ArrowDownRight, ArrowRight, Sparkles } from 'lucide-react';
import { DEFAULT_WEBSITE_INFO } from '@/lib/websiteInfo';
import { getWebsiteInfo } from '@/lib/websiteInfoServer';

export default async function HeroBanner() {
  let websiteInfo = DEFAULT_WEBSITE_INFO;
  try { websiteInfo = await getWebsiteInfo(); } catch { /* Use the default homepage banner if settings are unavailable. */ }
  return (
    <section className="relative isolate overflow-hidden bg-[#f4f1ea]">
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full border border-[#d8c9aa]/45" />
      <div className="absolute -left-12 top-24 h-48 w-48 rounded-full border border-[#d8c9aa]/35" />

      <div className="relative mx-auto grid min-h-[520px] max-w-[1600px] grid-cols-1 sm:min-h-[620px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col justify-center px-4 py-10 sm:px-10 sm:py-14 lg:pl-16 lg:pr-8 xl:pl-24">
          <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-[#d9ccb4] bg-white/65 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#82683d] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{websiteInfo.heroBadge}</span>
          </div>

          <h1 className="max-w-[680px] font-serif text-[clamp(2.5rem,6.2vw,6rem)] font-medium leading-[0.98] tracking-[-0.055em] text-[#14263d]">
            <span className="whitespace-pre-line">{websiteInfo.heroTitle}</span>
          </h1>

          <p className="mt-7 max-w-[440px] text-sm leading-7 text-[#596579] sm:text-base">
            {websiteInfo.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#14263d] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_12px_28px_-16px_rgba(20,38,61,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#203a5b] hover:shadow-lg"
            >
              <span>Shop all products</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/deals"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d4c9b5] bg-white/55 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-[#14263d] transition-colors hover:border-[#a77e43] hover:bg-white"
            >
              Discover the deals
              <ArrowDownRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#7b8491]">
            <span>70 departments</span><span className="h-1 w-1 rounded-full bg-[#b99152]" />
            <span>703 collections</span><span className="h-1 w-1 rounded-full bg-[#b99152]" />
            <span>Secure checkout</span>
          </div>
        </div>

        <div className="relative min-h-[300px] overflow-hidden sm:min-h-[500px] lg:min-h-[680px]">
          {websiteInfo.heroImageUrl ? <img src={websiteInfo.heroImageUrl} alt={`${websiteInfo.siteName} homepage banner`} className="absolute inset-0 h-full w-full object-cover object-center" /> : <Image
            src="/images/storefront/galleria-hero.png"
            alt={`${websiteInfo.siteName} homepage banner`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover object-center"
          />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f1ea] via-[#f4f1ea]/20 to-transparent lg:from-[#f4f1ea]/80 lg:via-transparent lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101d2d]/30 via-transparent to-transparent" />

          <div className="absolute bottom-6 left-5 right-5 sm:bottom-10 sm:left-10 sm:right-auto sm:w-[300px]">
            <div className="rounded-2xl border border-white/65 bg-white/90 p-5 shadow-[0_24px_65px_-30px_rgba(15,30,48,0.5)] backdrop-blur-md sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">A considered edit</span>
                <span className="h-7 w-7 rounded-full border border-[#e7dece] bg-[#f7f4ed]" />
              </div>
              <p className="font-serif text-xl leading-snug text-[#14263d] sm:text-2xl">
                Find your next<br />favorite product.
              </p>
              <Link href="/shop" className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#14263d] hover:text-[#a77e43]">
                Start exploring <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <span className="absolute right-5 top-6 hidden rounded-full border border-white/50 bg-[#14263d]/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm sm:block lg:right-10 lg:top-10">
            {websiteInfo.siteName} / 01
          </span>
        </div>
      </div>
    </section>
  );
}
