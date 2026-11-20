import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { companyResearchDossier, type DossierBlock } from '@/data/companyResearchDossier';

function ResearchBlock({ block }: { block: DossierBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p>{block.text}</p>;
    case 'note':
      return <p className="border-l-2 border-[#a77e43] bg-[#f5f0e7] px-4 py-3 text-[#414a53]">{block.text}</p>;
    case 'heading':
      return <h4 className="font-semibold text-[#14263d]">{block.text}</h4>;
    case 'list':
    case 'ordered': {
      const List = block.type === 'ordered' ? 'ol' : 'ul';
      return (
        <List className={'space-y-2 pl-5 ' + (block.type === 'ordered' ? 'list-decimal' : 'list-disc')}>
          {block.items.map((item) => <li key={item} className="pl-1">{item}</li>)}
        </List>
      );
    }
    case 'table':
      return (
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-[#f3ede3] text-[#14263d]">
            <tr>
              {block.headers.map((header, index) => (
                <th key={header} scope="col" className={'p-2 font-semibold sm:p-3 ' + (index === 0 ? 'w-[38%]' : '')}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6ded0]">
            {block.rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className="p-2 align-top font-semibold text-[#14263d] sm:p-3">{label}</th>
                <td className="p-2 align-top [overflow-wrap:anywhere] sm:p-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default function CompanyResearchDossier() {
  const dossier = companyResearchDossier;

  return (
    <section id="company-research-dossier" aria-labelledby="research-dossier-title" className="scroll-mt-36 border border-[#e6ded0] bg-[#fffdf9] p-5 sm:p-8">
      <div className="max-w-3xl">
        <h2 id="research-dossier-title" className="font-serif text-3xl tracking-tight text-[#14263d] sm:text-4xl">Company Research Dossier</h2>
        <p className="mt-2 text-sm font-semibold text-[#414a53]">{dossier.company} · {dossier.location}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#755c37]">Research date</dt>
            <dd className="mt-1 text-sm text-[#414a53]"><time dateTime="2026-11-16">{dossier.researchDate}</time></dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#755c37]">Primary website in the report</dt>
            <dd className="mt-1 text-sm text-[#414a53]">{dossier.primaryWebsite}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm leading-6 text-[#515963]"><strong className="text-[#14263d]">Scope</strong> {dossier.scope}</p>
        <p className="mt-3 text-sm leading-6 text-[#515963]">
          The report reproduces contacts and wholesale terms from the website it cites. For orders placed on this storefront, use our <Link href="/contact" className="font-semibold text-[#14263d] underline decoration-[#ad9470] underline-offset-4">Contact page</Link> and <Link href="#shipping" className="font-semibold text-[#14263d] underline decoration-[#ad9470] underline-offset-4">store policies</Link>.
        </p>
      </div>
      <p className="mt-5 border-l-2 border-[#a77e43] bg-[#f5f0e7] px-4 py-3 text-sm leading-6 text-[#414a53]">{dossier.notice}</p>

      <div className="mt-6 divide-y divide-[#e6ded0] border-y border-[#e6ded0]">
        {dossier.sections.map(({ title, blocks }, index) => (
          <details key={title} className="group" open={index === 0}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-[#14263d] hover:text-[#755c37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77e43] sm:text-base [&::-webkit-details-marker]:hidden">
              <span>{index + 1}. {title}</span>
              <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-[#755c37] transition-transform group-open:rotate-180" />
            </summary>
            <div className="max-w-4xl space-y-4 pb-5 text-sm leading-7 text-[#515963]">
              {blocks.map((block, blockIndex) => <ResearchBlock key={blockIndex} block={block} />)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
