import Link from 'next/link';
import { ArrowRight, Clock3, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from 'lucide-react';
import { DEFAULT_WEBSITE_INFO } from '@/lib/websiteInfo';
import { getWebsiteInfo } from '@/lib/websiteInfoServer';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  let websiteInfo = DEFAULT_WEBSITE_INFO;
  try { websiteInfo = await getWebsiteInfo(); } catch { /* Keep contact and FAQ page available if settings storage is offline. */ }
  const contactMethods: { label: string; value: string; href: string; icon: LucideIcon }[] = [];
  if (websiteInfo.supportEmail) contactMethods.push({ label: 'Email', value: websiteInfo.supportEmail, href: `mailto:${websiteInfo.supportEmail}`, icon: Mail });
  if (websiteInfo.contactPhone) contactMethods.push({ label: 'Phone', value: websiteInfo.contactPhone, href: `tel:${websiteInfo.contactPhone}`, icon: Phone });
  if (websiteInfo.whatsappNumber) contactMethods.push({ label: 'WhatsApp', value: websiteInfo.whatsappNumber, href: `https://wa.me/${websiteInfo.whatsappNumber.replace(/\D/g, '')}`, icon: MessageCircle });

  return <main className="min-h-screen bg-[#f8f6f1] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">We are here to help</span><h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-[#14263d] sm:text-5xl">Contact {websiteInfo.siteName}</h1><p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#687586]">{websiteInfo.tagline}</p></header>

      <section className="rounded-3xl border border-[#e9e4da] bg-white p-6 shadow-sm sm:p-8"><div className="mb-6"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Get in touch</p><h2 className="mt-2 font-serif text-2xl text-[#14263d]">Contact details</h2></div>
        {contactMethods.length > 0 ? <div className="grid gap-3 sm:grid-cols-3">{contactMethods.map((method) => { const Icon = method.icon; return <a key={method.label} href={method.href} target={method.label === 'WhatsApp' ? '_blank' : undefined} rel={method.label === 'WhatsApp' ? 'noreferrer' : undefined} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#c8ad7e] hover:bg-[#fcfaf5]"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f1e8] text-[#a77e43]"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{method.label}</span><span className="mt-1 block truncate text-xs font-semibold text-slate-800">{method.value}</span></span></a>; })}</div> : <p className="rounded-xl bg-slate-50 px-4 py-5 text-xs leading-5 text-slate-600">Our contact details are being updated. Please check back shortly.</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{(websiteInfo.contactAddress || websiteInfo.mapUrl) && <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#a77e43]" /><div>{websiteInfo.contactAddress && <><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Address</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-700">{websiteInfo.contactAddress}</p></>}{websiteInfo.mapUrl && <a href={websiteInfo.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#14263d] hover:underline">Open map<ArrowRight className="h-3 w-3" /></a>}</div></div>}{websiteInfo.openingHours && <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#a77e43]" /><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Opening hours</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-700">{websiteInfo.openingHours}</p></div></div>}</div>
      </section>

      <section id="faq" className="mt-8 scroll-mt-36 rounded-3xl border border-[#e9e4da] bg-white p-6 shadow-sm sm:mt-10 sm:p-8"><div className="mb-5"><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">Helpful information</span><h2 className="mt-2 font-serif text-2xl font-medium text-[#14263d] sm:text-3xl">Frequently asked questions</h2></div>
        {websiteInfo.faqs.length > 0 ? <div className="divide-y divide-[#eee9df]">{websiteInfo.faqs.map((faq) => <details key={faq.id} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#14263d] marker:hidden">{faq.question}<span className="text-lg text-[#a77e43] transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl whitespace-pre-line text-xs leading-6 text-[#687586]">{faq.answer}</p></details>)}</div> : <p className="rounded-xl bg-slate-50 px-4 py-5 text-xs leading-5 text-slate-600">Frequently asked questions will be published here when they are added in Website Info Manage.</p>}
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5dac4] bg-[#f4f1e9] px-5 py-4"><p className="text-xs text-[#687586]">Need to learn more about our organization?</p><Link href="/about" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#14263d] hover:text-[#a77e43]">About {websiteInfo.siteName}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
    </div>
  </main>;
}
