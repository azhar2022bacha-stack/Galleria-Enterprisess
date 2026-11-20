import { storefrontCompany } from '@/lib/storefrontCompany';

export function BrandMark({ logoUrl, className = '' }: { logoUrl: string; className?: string }) {
  return (
    <span className={'relative block shrink-0 overflow-hidden rounded-md ' + className} aria-hidden="true">
      {logoUrl === storefrontCompany.logoUrl ? (
        <img src={logoUrl} alt="" width={640} height={640} className="absolute left-[-89%] top-[-46%] w-[278%] max-w-none" />
      ) : (
        <img src={logoUrl} alt="" className="h-full w-full object-contain" />
      )}
    </span>
  );
}
