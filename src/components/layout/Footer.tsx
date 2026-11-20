import Link from 'next/link';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { getStorefrontAddressLabel, getWhatsAppHref } from '@/lib/storefrontCompany';
import type { WebsiteInfo } from '@/lib/websiteInfo';
import { BrandMark } from './BrandMark';
import { WhatsAppIcon } from './WhatsAppIcon';

const footerGroups = [
  {
    title: 'Store',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/shop' },
      { label: 'Deals', href: '/deals' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Customer care',
    links: [
      { label: 'Shipping', href: '/about#shipping' },
      { label: 'Returns & Refunds', href: '/about#returns' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms', href: '/about#terms' },
    ],
  },
];

const footerLink = 'text-sm text-[#d6dce4] transition-colors hover:text-white hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c494]';

export default function Footer({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  const socialLinks = [
    ['Instagram', websiteInfo.instagramUrl], ['Facebook', websiteInfo.facebookUrl],
    ['TikTok', websiteInfo.tiktokUrl], ['YouTube', websiteInfo.youtubeUrl], ['LinkedIn', websiteInfo.linkedInUrl],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const whatsAppHref = getWhatsAppHref(websiteInfo.whatsappNumber);
  const hasContactInfo = websiteInfo.supportEmail || websiteInfo.contactPhone || websiteInfo.contactAddress || websiteInfo.openingHours || whatsAppHref;

  return (
    <footer className="border-t border-[#ad9470] bg-[#14263d] text-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-12 sm:px-8 sm:pb-8 sm:pt-16 lg:px-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 border-b border-white/15 pb-10 sm:gap-x-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.65fr)_minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-x-7 lg:pb-12 xl:gap-x-10">
          <div className="col-span-2 min-w-0 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c494]">
              <BrandMark logoUrl={websiteInfo.logoUrl} className="size-12 sm:size-14" />
              <span className="font-serif text-xl font-medium leading-tight text-white [overflow-wrap:anywhere] sm:text-2xl">{websiteInfo.siteName}</span>
            </Link>
            {(websiteInfo.aboutText || websiteInfo.tagline) && (
              <p className="mt-3 max-w-[34ch] text-sm leading-6 text-[#d6dce4]">{websiteInfo.aboutText ? websiteInfo.aboutText.slice(0, 220) + (websiteInfo.aboutText.length > 220 ? '…' : '') : websiteInfo.tagline}</p>
            )}
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.13em] text-[#ecd1a4]">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map(({ href, label }) => <li key={href}><Link href={href} className={footerLink}>{label}</Link></li>)}
              </ul>
            </nav>
          ))}

          {hasContactInfo && (
            <section aria-labelledby="footer-headquarters" className="col-span-2 min-w-0 border-t border-white/15 pt-6 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 xl:pl-7">
              <h2 id="footer-headquarters" className="text-sm font-semibold leading-snug text-[#ecd1a4]">{websiteInfo.contactAddress ? getStorefrontAddressLabel(websiteInfo.contactAddress) : 'Contact details'}</h2>
              <address className="mt-4 space-y-3 text-sm not-italic text-[#d6dce4]">
                {websiteInfo.contactAddress && (
                  <p className="flex items-start gap-2.5">
                    <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />
                    <span className="whitespace-pre-line leading-6">{websiteInfo.contactAddress}</span>
                  </p>
                )}
                {websiteInfo.supportEmail && <a href={'mailto:' + websiteInfo.supportEmail} className={'flex items-start gap-2.5 ' + footerLink}><Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" /><span className="min-w-0 [overflow-wrap:anywhere]">{websiteInfo.supportEmail}</span></a>}
                {whatsAppHref && <a href={whatsAppHref} target="_blank" rel="noreferrer" className={'flex items-start gap-2.5 ' + footerLink}><WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-[#e0c494]" /><span>WhatsApp {websiteInfo.whatsappNumber}</span></a>}
                {websiteInfo.contactPhone && <a href={'tel:' + websiteInfo.contactPhone} className={'flex items-start gap-2.5 ' + footerLink}><Phone size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />{websiteInfo.contactPhone}</a>}
                {websiteInfo.openingHours && <p className="flex items-start gap-2.5"><Clock3 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />{websiteInfo.openingHours}</p>}
              </address>
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-5">
          <p className="text-xs text-[#c5cfdd]">© {new Date().getFullYear()} {websiteInfo.legalCompanyName || websiteInfo.siteName}. All rights reserved.</p>
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {socialLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className={footerLink}>{label}</a>)}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
