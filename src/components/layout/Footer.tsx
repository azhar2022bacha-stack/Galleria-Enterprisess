'use client';

import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { WebsiteInfo } from '@/lib/websiteInfo';

const footerGroups = [
  {
    title: 'Explore',
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
      { label: 'Returns and refunds', href: '/about#returns' },
      { label: 'Frequently asked questions', href: '/contact#faq' },
    ],
  },
  {
    title: 'Our marketplace',
    links: [
      { label: 'Sell with Galleria', href: '/seller' },
      { label: 'About Galleria', href: '/about' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms', href: '/about#terms' },
    ],
  },
];

export default function Footer({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  const socialLinks = [
    ['Instagram', websiteInfo.instagramUrl], ['Facebook', websiteInfo.facebookUrl],
    ['TikTok', websiteInfo.tiktokUrl], ['YouTube', websiteInfo.youtubeUrl], ['LinkedIn', websiteInfo.linkedInUrl],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <footer className="relative overflow-hidden bg-[#12243b] text-[#d7dfeb]">
      <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full border border-white/[0.06]" />
      <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border border-white/[0.06]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-7 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-12 lg:pb-12">
          <div className="max-w-sm">
            <Link href="/" className="group inline-flex flex-col">
              {websiteInfo.logoUrl ? <img src={websiteInfo.logoUrl} alt={`${websiteInfo.siteName} logo`} className="h-12 max-w-48 object-contain object-left" /> : <span className="font-serif text-3xl font-medium tracking-[0.02em] text-white">{websiteInfo.siteName.toUpperCase()}</span>}
              {websiteInfo.tagline && <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#d3b47d]">{websiteInfo.tagline}</span>}
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#adbacb]">
              {websiteInfo.aboutText ? `${websiteInfo.aboutText.slice(0, 220)}${websiteInfo.aboutText.length > 220 ? '…' : ''}` : websiteInfo.tagline}
            </p>
            {(websiteInfo.supportEmail || websiteInfo.contactPhone || websiteInfo.contactAddress) && <address className="mt-4 space-y-1.5 not-italic text-xs text-[#adbacb]">{websiteInfo.supportEmail && <a href={`mailto:${websiteInfo.supportEmail}`} className="block hover:text-white">{websiteInfo.supportEmail}</a>}{websiteInfo.contactPhone && <a href={`tel:${websiteInfo.contactPhone}`} className="block hover:text-white">{websiteInfo.contactPhone}</a>}{websiteInfo.contactAddress && <span className="block">{websiteInfo.contactAddress}</span>}</address>}
            {socialLinks.length > 0 && <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">{socialLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-[#e5d0aa] transition hover:text-white">{label}</a>)}</div>}
            <Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#e5d0aa] transition-colors hover:text-white">
              Explore the store <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">{group.title}</h2>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-xs text-[#adbacb] transition-colors hover:text-white">
                      {link.label.replaceAll('Galleria', websiteInfo.siteName)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-6 text-[10px] text-[#9eacbe] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {websiteInfo.legalCompanyName || websiteInfo.siteName}. All rights reserved.</p>
          <p className="inline-flex items-center gap-2"><Sparkles className="h-3 w-3 text-[#d3b47d]" /> {websiteInfo.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
