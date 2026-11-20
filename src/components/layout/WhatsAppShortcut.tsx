'use client';

import { useCompare } from '@/context/CompareContext';
import { getWhatsAppHref } from '@/lib/storefrontCompany';
import { WhatsAppIcon } from './WhatsAppIcon';

export function WhatsAppShortcut({ number }: { number: string }) {
  const { products } = useCompare();
  const href = getWhatsAppHref(number);
  if (!href) return null;
  const bottom = products.length > 0
    ? 'bottom-[calc(6.5rem_+_env(safe-area-inset-bottom))] lg:bottom-[calc(1rem_+_env(safe-area-inset-bottom))]'
    : 'bottom-[calc(1rem_+_env(safe-area-inset-bottom))]';

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={'Chat on WhatsApp at ' + number}
      title="Chat on WhatsApp"
      className={'fixed right-4 z-30 flex size-12 items-center justify-center rounded-full border-2 border-white bg-[#087b56] text-white shadow-lg shadow-black/15 transition hover:bg-[#076747] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087b56] sm:right-6 sm:size-14 ' + bottom}
    >
      <WhatsAppIcon className="size-6 sm:size-7" />
    </a>
  );
}
