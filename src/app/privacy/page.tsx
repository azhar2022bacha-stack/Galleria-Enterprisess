import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { getStorefrontWebsiteInfo } from '@/lib/getStorefrontWebsiteInfo';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const websiteInfo = await getStorefrontWebsiteInfo();
  return <main className="min-h-screen bg-[#f8f6f1] px-4 py-12 sm:px-6 sm:py-16">
    <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#e9e4da] bg-white shadow-sm">
      <header className="bg-[#14263d] px-6 py-9 text-white sm:px-10 sm:py-12"><Link href="/" className="inline-flex items-center gap-2 text-[10px] font-semibold text-white/70 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Back to {websiteInfo.siteName}</Link><div className="mt-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#e6cc98]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#e6cc98]">Visitor information</p><h1 className="mt-1 font-serif text-3xl sm:text-4xl">Privacy Policy</h1></div></div><p className="mt-4 text-xs text-white/60">{websiteInfo.siteName}</p></header>
      <div className="px-6 py-8 sm:px-10 sm:py-10">{websiteInfo.privacyPolicy ? <div className="whitespace-pre-line text-sm leading-7 text-slate-700">{websiteInfo.privacyPolicy}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><p className="text-sm font-semibold text-slate-800">Privacy information is being prepared.</p><p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500">The website administrator can publish the Privacy Policy from Website Info Manage.</p></div>}<div className="mt-8 border-t border-slate-100 pt-5"><p className="text-xs text-slate-500">Questions about this policy?</p><Link href="/contact" className="mt-2 inline-flex text-xs font-semibold text-[#14263d] hover:underline">Contact {websiteInfo.siteName}</Link></div></div>
    </article>
  </main>;
}
