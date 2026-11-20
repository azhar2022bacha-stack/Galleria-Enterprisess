import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { WebsiteInfo } from '@/lib/websiteInfo';

export default function AnnouncementBar({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  if (!websiteInfo.announcement.trim()) return null;

  return (
    <div className="bg-[#14263d] text-[#f7f3eb]">
      <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between gap-3 px-4 py-2 text-[11px] leading-snug sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <p className="min-w-0 text-white/90 lg:col-start-2 lg:text-center">{websiteInfo.announcement}</p>
        <Link href="/seller" className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-[#f0d7ad] hover:text-white lg:justify-self-end">
          Sell with <span className="hidden sm:inline">{websiteInfo.siteName}</span><span className="sm:hidden">us</span> <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
