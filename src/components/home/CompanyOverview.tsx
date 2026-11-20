import Link from 'next/link';
import { ArrowUpRight, Mail } from 'lucide-react';
import { getStorefrontWebsiteInfo } from '@/lib/getStorefrontWebsiteInfo';
import { getStorefrontAddressLabel, getWhatsAppHref } from '@/lib/storefrontCompany';
import { WhatsAppIcon } from '@/components/layout/WhatsAppIcon';

export default async function CompanyOverview() {
  const websiteInfo = await getStorefrontWebsiteInfo();
  const whatsAppHref = getWhatsAppHref(websiteInfo.whatsappNumber);
  const addressLabel = getStorefrontAddressLabel(websiteInfo.contactAddress);

  return (
    <section aria-labelledby="company-overview" className="bg-[#fbfaf7] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto grid max-w-[1344px] items-center gap-7 border-y border-[#e6ded0] py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 id="company-overview" className="font-serif text-3xl tracking-[-0.045em] text-[#14263d] sm:text-4xl">About {websiteInfo.siteName}</h2>
          <p className="mt-4 max-w-[62ch] whitespace-pre-line text-sm leading-7 text-[#515963] sm:text-base">{websiteInfo.aboutText}</p>
          <Link href="/about" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-[#14263d] underline decoration-[#ad9470] underline-offset-4 hover:decoration-current">
            Company information <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="min-w-0 border border-[#e6ded0] bg-[#eee7da] px-5 py-6 sm:px-7 sm:py-8">
          <h3 className="font-serif text-xl leading-tight text-[#14263d] sm:text-2xl">{addressLabel}</h3>
          <address className="mt-3 whitespace-pre-line text-sm not-italic leading-6 text-[#515963]">{websiteInfo.contactAddress}</address>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#d9cdbb] pt-3">
            <a href={'mailto:' + websiteInfo.supportEmail} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#14263d] hover:underline hover:underline-offset-4">
              <Mail size={17} aria-hidden="true" /> Email support
            </a>
            {whatsAppHref && (
              <a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#14263d] hover:underline hover:underline-offset-4">
                <WhatsAppIcon className="size-[17px] text-[#087b56]" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
