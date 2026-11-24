import Link from 'next/link';
import { ArrowLeft, ArrowUp, Mail } from 'lucide-react';
import { getStorefrontWebsiteInfo } from '@/lib/getStorefrontWebsiteInfo';
import sections from './policy.json';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy Policy | Galleria Enterprises' };

const supportEmail = 'support@galleriaenterprisess.com';
const website = 'https://galleriaenterprisess.com/';
const sectionId = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|support@galleriaenterprisess\.com|https:\/\/galleriaenterprisess\.com\/)/g).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    if (part === supportEmail || part === website) {
      return <a key={index} className="break-words text-[#25496c] underline underline-offset-4" href={part === website ? website : 'mailto:' + part}>{part}</a>;
    }
    return part;
  });
}

function PolicyBody({ body }: { body: string }) {
  return body.split(/\n\s*\n/).map((block, index) => {
    if (block.startsWith('### ')) return <h3 key={index} className="pt-3 text-lg font-semibold text-slate-900">{block.slice(4)}</h3>;
    if (block.startsWith('- ')) return <ul key={index} className="list-disc space-y-1 pl-5 marker:text-[#93713d]">
      {block.split('\n').map(item => <li key={item}>{inline(item.slice(2))}</li>)}
    </ul>;
    return <p key={index}>{inline(block)}</p>;
  });
}

function Contents() {
  return <nav aria-label="Policy sections"><ol className="space-y-1">
    {sections.map(({ title }, index) => <li key={title}>
      <a href={'#' + sectionId(title)} className="flex gap-3 rounded px-2 py-1.5 text-sm leading-5 text-slate-700 hover:bg-[#f4f1eb] hover:text-slate-950">
        <span aria-hidden="true" className="w-5 shrink-0 font-mono text-xs leading-5 text-[#80643a]">{String(index + 1).padStart(2, '0')}</span>{title}
      </a>
    </li>)}
  </ol></nav>;
}

export default async function PrivacyPage() {
  const info = await getStorefrontWebsiteInfo();
  const custom = info.privacyPolicy.trim();
  return <main id="policy-top" className="min-h-screen bg-[#faf9f6] text-[#182b40]">
    <header className="border-b-4 border-[#ba9a60] bg-[#14263d] text-white">
      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-200 hover:underline"><ArrowLeft size={16} /> Back to {info.siteName}</Link>
        <h1 className="mt-8 font-serif text-5xl tracking-tight sm:text-6xl">Privacy Policy</h1>
        {!custom && <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-200">
          <p>Effective <time dateTime="2026-11-25">November 25, 2026</time></p>
          <p>Last updated <time dateTime="2026-11-25">November 25, 2026</time></p>
        </div>}
      </div>
    </header>
    <div className="mx-auto max-w-6xl gap-10 px-5 py-8 sm:px-8 lg:flex lg:py-12">
      {!custom && <aside className="mb-6 lg:w-64 lg:shrink-0">
        <details className="rounded-lg border bg-white p-4 lg:hidden">
          <summary className="cursor-pointer font-semibold">On this page</summary><div className="mt-3"><Contents /></div>
        </details>
        <div className="sticky top-24 hidden max-h-[75vh] overflow-y-auto pr-3 lg:block">
          <h2 className="mb-3 px-2 font-serif text-xl">On this page</h2><Contents />
        </div>
      </aside>}
      <article className="min-w-0 flex-1 rounded-xl border border-[#e5dfd4] bg-white px-5 sm:px-9">
        {custom ? <div className="whitespace-pre-line py-8 leading-7 text-slate-700">{custom}</div> : <>
          <div className="border-b border-[#e5dfd4] py-6 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">Galleria Enterprises, Inc.</p>
            <p>24 Commerce Road, Fairfield, New Jersey 07004, United States</p>
            <a className="mt-2 inline-flex items-center gap-2 break-all text-[#25496c] hover:underline" href={'mailto:' + supportEmail}><Mail size={15} />{supportEmail}</a>
          </div>
          {sections.map(({ title, body }, index) => <section key={title} id={sectionId(title)} className="scroll-mt-28 border-b border-[#e5dfd4] py-8">
            <h2 className="mb-5 font-serif text-2xl leading-tight sm:text-3xl"><span className="mr-2 text-[#81653b]">{index + 1}.</span>{title}</h2>
            <div className="space-y-4 text-[15px] leading-7 text-slate-700"><PolicyBody body={body} /></div>
          </section>)}
        </>}
        <footer className="flex flex-wrap justify-between gap-3 py-6 text-sm font-semibold">
          <Link href="/contact" className="hover:underline">Contact {info.siteName}</Link>
          <a href="#policy-top" className="inline-flex items-center gap-2 hover:underline">Back to top <ArrowUp size={14} /></a>
        </footer>
      </article>
    </div>
  </main>;
}
