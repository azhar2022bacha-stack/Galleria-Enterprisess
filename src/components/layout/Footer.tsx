import Link from 'next/link';
import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import type { WebsiteInfo } from '@/lib/websiteInfo';

const footerGroups = [
  {
    title: 'Shop',
    links: [
      { label: 'Shop all', href: '/shop' },
      { label: 'New arrivals', href: '/shop?sort=newest' },
      { label: 'Curated collections', href: '/shop?featured=true' },
      { label: 'Special deals', href: '/deals' },
    ],
  },
  {
    title: 'Customer care',
    links: [
      { label: 'Contact us', href: '/contact' },
      { label: 'Shipping information', href: '/about#shipping' },
      { label: 'Returns & refunds', href: '/about#returns' },
      { label: 'Frequently asked questions', href: '/contact#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Sell with Galleria', href: '/seller' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms', href: '/about#terms' },
    ],
  },
];

const footerLink = 'text-sm text-[#d6dce4] transition-colors hover:text-white hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c494]';

export default function Footer({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  const socialLinks = [
    ['Instagram', websiteInfo.instagramUrl],
    ['Facebook', websiteInfo.facebookUrl],
    ['TikTok', websiteInfo.tiktokUrl],
    ['YouTube', websiteInfo.youtubeUrl],
    ['LinkedIn', websiteInfo.linkedInUrl],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const whatsApp = websiteInfo.whatsappNumber.replace(/[^\d]/g, '');
  const hasContactInfo = websiteInfo.supportEmail || websiteInfo.contactPhone || websiteInfo.contactAddress || websiteInfo.openingHours || whatsApp;

  return (
    <footer className="border-t border-[#ad9470] bg-[#14263d] text-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 border-b border-white/15 pb-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-x-12 lg:pb-14">
          <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c494]">
              {websiteInfo.logoUrl ? (
                <img src={websiteInfo.logoUrl} alt={websiteInfo.siteName} className="h-12 max-w-56 object-contain object-left" />
              ) : (
                <span className="block font-serif text-3xl font-medium uppercase tracking-[0.12em] text-white [overflow-wrap:anywhere] sm:text-4xl">{websiteInfo.siteName}</span>
              )}
            </Link>
            {(websiteInfo.aboutText || websiteInfo.tagline) && (
              <p className="mt-3 max-w-[32ch] text-sm leading-6 text-[#d6dce4]">{websiteInfo.aboutText ? websiteInfo.aboutText.slice(0, 220) + (websiteInfo.aboutText.length > 220 ? '…' : '') : websiteInfo.tagline}</p>
            )}
            {hasContactInfo && (
              <address className="mt-5 space-y-2.5 text-sm not-italic text-[#d6dce4]">
                {websiteInfo.supportEmail && <a href={'mailto:' + websiteInfo.supportEmail} className={'flex items-start gap-2.5 break-all ' + footerLink}><Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />{websiteInfo.supportEmail}</a>}
                {websiteInfo.contactPhone && <a href={'tel:' + websiteInfo.contactPhone} className={'flex items-start gap-2.5 ' + footerLink}><Phone size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />{websiteInfo.contactPhone}</a>}
                {whatsApp && <a href={'https://wa.me/' + whatsApp} target="_blank" rel="noreferrer" className={'inline-flex items-center gap-2 ' + footerLink}>WhatsApp support <ArrowUpRight size={14} aria-hidden="true" /></a>}
                {websiteInfo.contactAddress && <p className="flex items-start gap-2.5"><MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />{websiteInfo.contactAddress}</p>}
                {websiteInfo.openingHours && <p className="flex items-start gap-2.5"><Clock3 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e0c494]" />{websiteInfo.openingHours}</p>}
              </address>
            )}
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.13em] text-[#ecd1a4]">{group.title}</h2>
              <ul className="mt-4 space-y-3 sm:mt-5">
                {group.links.map((link) => (
                  <li key={link.href}><Link href={link.href} className={footerLink}>{link.label.replaceAll('Galleria', websiteInfo.siteName)}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
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
