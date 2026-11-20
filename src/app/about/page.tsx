import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, FileBadge, ShieldCheck } from 'lucide-react';
import CompanyResearchDossier from '@/components/about/CompanyResearchDossier';
import { getStorefrontWebsiteInfo } from '@/lib/getStorefrontWebsiteInfo';
import { getStorefrontAddressLabel, storefrontCompany } from '@/lib/storefrontCompany';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const websiteInfo = await getStorefrontWebsiteInfo();
  const companyDetails = [
    ['Legal company', websiteInfo.legalCompanyName],
    ['Country', storefrontCompany.country],
    ['Business location', storefrontCompany.location],
    ['Business category', storefrontCompany.category],
    ['Business activity', storefrontCompany.activity],
    [getStorefrontAddressLabel(websiteInfo.contactAddress), websiteInfo.contactAddress],
    ['Jurisdiction', websiteInfo.jurisdiction],
    ['Registration number', websiteInfo.companyRegNumber],
    ['Registered address', websiteInfo.registeredAddress],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const publicPolicies: [string, string, string][] = [
    ['Shipping information', 'shipping', websiteInfo.shippingText || 'Shipping information is being prepared. Please contact us if you need help.'],
    ['Returns and refunds', 'returns', websiteInfo.returnsText || 'Returns information is being prepared. Please contact us if you need help.'],
    ['Website terms', 'terms', websiteInfo.termsText || 'Website terms are being prepared. Please check back soon.'],
  ];

  return <main className="min-h-screen bg-[#f8f6f1]">
    <section className="relative overflow-hidden bg-[#14263d] px-4 py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full border border-white/[0.08]" /><div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/[0.08]" />
      <div className="relative mx-auto max-w-4xl text-center"><span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#d3b47d]">About {websiteInfo.siteName}</span><h1 className="mt-4 whitespace-pre-line font-serif text-4xl font-medium tracking-tight sm:text-6xl">{websiteInfo.aboutHeadline}</h1><p className="mx-auto mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-white/75 sm:text-base">{websiteInfo.aboutText || `We are putting together the story of ${websiteInfo.siteName}. Please check back soon.`}</p></div>
    </section>

    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {websiteInfo.aboutImageUrl && <div className="overflow-hidden rounded-3xl border border-[#e9e4da] bg-white shadow-sm"><img src={websiteInfo.aboutImageUrl} alt={`${websiteInfo.siteName} about us`} className="max-h-[520px] w-full object-cover" /></div>}

      {companyDetails.length > 0 && <section className="rounded-3xl border border-[#e9e4da] bg-white p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#a77e43]"><Building2 className="h-5 w-5" /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Organization</p><h2 className="mt-1 font-serif text-2xl text-[#14263d]">Company information</h2></div></div><dl className="grid gap-4 sm:grid-cols-2">{companyDetails.map(([label, value]) => <div key={label} className="border-t border-slate-100 pt-3"><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-800">{value}</dd></div>)}</dl></section>}

      {websiteInfo.certificates.length > 0 && <section className="rounded-3xl border border-[#e9e4da] bg-white p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#a77e43]"><BadgeCheck className="h-5 w-5" /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Credentials</p><h2 className="mt-1 font-serif text-2xl text-[#14263d]">Certificates &amp; credentials</h2></div></div><div className="grid gap-3 sm:grid-cols-2">{websiteInfo.certificates.map((certificate) => <a key={certificate.id} href={certificate.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#c8ad7e] hover:bg-[#fcfaf5]"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f1e8] text-[#a77e43]"><FileBadge className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{certificate.name}</span><span className="mt-1 block truncate text-[10px] text-slate-500">{certificate.fileName}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-slate-400" /></a>)}</div></section>}

      <CompanyResearchDossier />

      <section className="rounded-3xl border border-[#e9e4da] bg-white p-6 shadow-sm sm:p-8"><div className="mb-6"><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a77e43]">Visitor information</span><h2 className="mt-2 font-serif text-3xl text-[#14263d]">Policies</h2></div><div className="grid gap-6 sm:grid-cols-2">{publicPolicies.map(([title, id, text]) => <article key={id} id={id} className="scroll-mt-36 border-t border-[#eee9df] pt-4"><h3 className="font-serif text-xl text-[#14263d]">{title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#687586]">{text}</p></article>)}</div></section>

      <section className="flex flex-col gap-5 rounded-3xl border border-[#e5dac4] bg-[#f4f1e9] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#a77e43]" /><div><h2 className="font-serif text-xl text-[#14263d]">Privacy and visitor support</h2><p className="mt-1 text-xs leading-5 text-[#687586]">Read our privacy information or contact the team with a question.</p></div></div><div className="flex flex-wrap gap-2"><Link href="/privacy" className="inline-flex items-center gap-2 rounded-full border border-[#14263d] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#14263d] transition hover:bg-[#14263d] hover:text-white">Privacy Policy<ArrowRight className="h-3.5 w-3.5" /></Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#14263d] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#203a5b]">Contact us<ArrowRight className="h-3.5 w-3.5" /></Link></div></section>
    </div>
  </main>;
}
