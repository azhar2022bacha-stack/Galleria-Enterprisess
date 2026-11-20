import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { DEFAULT_WEBSITE_INFO } from '@/lib/websiteInfo';
import { getWebsiteInfo } from '@/lib/websiteInfoServer';

export default async function HeroBanner() {
  let websiteInfo = DEFAULT_WEBSITE_INFO;
  try { websiteInfo = await getWebsiteInfo(); } catch { /* Use the homepage defaults while settings are unavailable. */ }

  const useDefaultTitle = !websiteInfo.heroTitle.trim() || websiteInfo.heroTitle === DEFAULT_WEBSITE_INFO.heroTitle;
  const subtitle = websiteInfo.heroSubtitle === DEFAULT_WEBSITE_INFO.heroSubtitle
    ? 'Discover furniture, fashion, tech, and more for the way you live.'
    : websiteInfo.heroSubtitle;
  const showBadge = websiteInfo.heroBadge.trim() && websiteInfo.heroBadge !== DEFAULT_WEBSITE_INFO.heroBadge;

  return (
    <section className="bg-[#fbfaf7] px-4 pt-4 sm:px-8 sm:pt-6 lg:px-12">
      <div className="mx-auto grid max-w-[1344px] overflow-hidden bg-[#eee7da] lg:min-h-[min(540px,46vw)] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative z-10 flex min-w-0 flex-col items-start justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-[clamp(2.5rem,4.6vw,4.75rem)] lg:py-12">
          {showBadge && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.17em] text-[#755c37]">{websiteInfo.heroBadge}</p>}
          <h1 className="font-serif text-[clamp(2.7rem,8.9vw,5rem)] font-medium leading-[1.02] tracking-[-0.065em] text-[#14263d] [overflow-wrap:anywhere] lg:text-[clamp(3rem,4.8vw,5.2rem)]">
            {useDefaultTitle ? <>Good things<span className="mt-1 block italic text-[#62503b]">for every day.</span></> : <span className="whitespace-pre-line">{websiteInfo.heroTitle}</span>}
          </h1>
          {subtitle && <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#4e5358] sm:mt-6 sm:text-base">{subtitle}</p>}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-9">
            <Link href="/shop" className="group inline-flex min-h-12 items-center gap-3 rounded-md bg-[#14263d] px-5 text-sm font-semibold text-white transition hover:bg-[#203a5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77e43]">
              Shop all products <ArrowRight size={17} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/deals" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#14263d] underline decoration-[#a89473] underline-offset-[5px] hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77e43]">
              Explore deals <ArrowUpRight size={15} strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="relative isolate aspect-[4/3] min-w-0 overflow-hidden bg-[#c7b59d] sm:aspect-[16/9] lg:aspect-auto">
          {websiteInfo.heroImageUrl ? (
            <img src={websiteInfo.heroImageUrl} alt={websiteInfo.siteName + ' homepage banner'} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />
          ) : (
            <Image
              src="/images/storefront/galleria-hero.png"
              alt="A sunlit showroom with furniture, homewares, and clothing"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, (max-width: 1440px) 56vw, 755px"
              className="object-cover object-[62%_center]"
            />
          )}
        </div>
      </div>
    </section>
  );
}
