import Link from 'next/link';
import { ArrowRight, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { WhatsAppIcon } from '@/components/layout/WhatsAppIcon';
import { getStorefrontWebsiteInfo } from '@/lib/getStorefrontWebsiteInfo';
import { getStorefrontAddressLabel, getWhatsAppHref } from '@/lib/storefrontCompany';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const websiteInfo = await getStorefrontWebsiteInfo();
  const whatsAppHref = getWhatsAppHref(websiteInfo.whatsappNumber);
  const contactMethods: { label: string; value: string; href: string; icon: ReactNode; external?: boolean }[] = [
    { label: 'Email support', value: websiteInfo.supportEmail, href: 'mailto:' + websiteInfo.supportEmail, icon: <Mail className="size-5" aria-hidden="true" /> },
  ];

  if (whatsAppHref) contactMethods.push({
    label: 'Chat on WhatsApp', value: websiteInfo.whatsappNumber, href: whatsAppHref,
    icon: <WhatsAppIcon className="size-5 text-[#087b56]" />, external: true,
  });
  if (websiteInfo.contactPhone) contactMethods.push({
    label: 'Call us', value: websiteInfo.contactPhone, href: 'tel:' + websiteInfo.contactPhone, icon: <Phone className="size-5" aria-hidden="true" />,
  });

  return (
    <div className="min-h-screen bg-[#f8f6f1] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="max-w-3xl">
          <h1 className="font-serif text-4xl font-medium leading-tight tracking-[-0.04em] text-[#14263d] sm:text-5xl">Contact {websiteInfo.siteName}</h1>
          <p className="mt-3 text-sm leading-6 text-[#515963] sm:text-base">Get in touch for help with products or orders.</p>
        </header>

        <section aria-labelledby="contact-details" className="border border-[#e6ded0] bg-[#fffdf9] p-5 sm:p-8">
          <h2 id="contact-details" className="mb-5 font-serif text-2xl text-[#14263d]">Contact details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {contactMethods.map((method) => (
              <a key={method.label} href={method.href} target={method.external ? '_blank' : undefined} rel={method.external ? 'noreferrer' : undefined} className="group flex min-w-0 items-start gap-3 rounded-md border border-[#e6ded0] p-4 transition hover:border-[#bca57f] hover:bg-[#f5f0e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eee7da] text-[#806640]">{method.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#14263d]">{method.label}</span>
                  <span className="mt-1 block text-sm leading-5 text-[#515963] [overflow-wrap:anywhere]">{method.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-12 gap-y-5 border-t border-[#e6ded0] pt-5">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="mt-0.5 shrink-0 text-[#806640]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-[#14263d]">{getStorefrontAddressLabel(websiteInfo.contactAddress)}</h3>
                <address className="mt-1 whitespace-pre-line text-sm not-italic leading-6 text-[#515963]">{websiteInfo.contactAddress}</address>
                {websiteInfo.mapUrl && <a href={websiteInfo.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#14263d] hover:underline">Open map <ArrowRight size={15} aria-hidden="true" /></a>}
              </div>
            </div>
            {websiteInfo.openingHours && (
              <div className="flex items-start gap-3">
                <Clock3 size={20} className="mt-0.5 shrink-0 text-[#806640]" aria-hidden="true" />
                <div><h3 className="text-sm font-semibold text-[#14263d]">Opening hours</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#515963]">{websiteInfo.openingHours}</p></div>
              </div>
            )}
          </div>
        </section>

        <section id="faq" className="scroll-mt-36 border border-[#e6ded0] bg-[#fffdf9] p-5 sm:p-8">
          <h2 className="mb-3 font-serif text-2xl text-[#14263d]">Frequently asked questions</h2>
          {websiteInfo.faqs.length > 0 ? (
            <div className="divide-y divide-[#e6ded0]">
              {websiteInfo.faqs.map((faq) => (
                <details key={faq.id} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#14263d] marker:hidden">
                    {faq.question}<span aria-hidden="true" className="text-lg text-[#a77e43] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#515963]">{faq.answer}</p>
                </details>
              ))}
            </div>
          ) : <p className="text-sm leading-6 text-[#515963]">For questions about an item or order, email us or start a WhatsApp chat.</p>}
        </section>

        <Link href="/about" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#14263d] underline decoration-[#ad9470] underline-offset-4 hover:decoration-current">About {websiteInfo.siteName} <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
