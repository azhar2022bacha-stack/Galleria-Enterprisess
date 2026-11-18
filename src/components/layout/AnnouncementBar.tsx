'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { WebsiteInfo } from '@/lib/websiteInfo';

export default function AnnouncementBar({ websiteInfo }: { websiteInfo: WebsiteInfo }) {
  if (!websiteInfo.announcement.trim()) return null;
  return (
    <div className="bg-[#14263d] px-4 py-2 text-[#f7f3eb]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-[10px] sm:text-[11px]">
        <div className="flex min-w-0 items-center gap-2.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#d3b47d]" />
          <span className="truncate tracking-wide text-white/85">{websiteInfo.announcement}</span>
        </div>
        <Link
          href="/seller"
          className="inline-flex shrink-0 items-center gap-1.5 font-semibold tracking-wide text-[#e5d0aa] transition-colors hover:text-white"
        >
          Sell with {websiteInfo.siteName} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
