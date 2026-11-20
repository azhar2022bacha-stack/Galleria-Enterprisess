import { storefrontCompany } from '@/lib/storefrontCompany';
import type { StorefrontCryptoPayment } from '@/lib/storefrontCrypto';

export function CryptoPaymentInstructions({ payment, orderNumber }: { payment: StorefrontCryptoPayment; orderNumber: string }) {
  const subject = encodeURIComponent(`Crypto payment for ${orderNumber}`);
  const body = encodeURIComponent(`Order: ${orderNumber}\nNetwork: ${payment.networkName}\nTransaction ID: `);

  return (
    <section aria-label="Crypto payment instructions" className="my-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-5 text-slate-700">
      <h2 className="text-sm font-bold text-[#14263d]">Complete your crypto payment</h2>
      <p>Send exactly <strong>{payment.amount} {payment.token}</strong> on <strong>{payment.chain}</strong> using <strong>{payment.networkName}</strong>. Pay network fees separately.</p>
      <label className="block font-semibold text-[#14263d]">
        Receiving address
        <input readOnly value={payment.address} onFocus={(event) => event.target.select()} className="mt-1 block w-full rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs" />
      </label>
      <p>After sending, email your transaction ID and order number for verification.</p>
      <a className="font-bold text-[#14263d] underline" href={`mailto:${storefrontCompany.supportEmail}?subject=${subject}&body=${body}`}>Email payment details</a>
    </section>
  );
}
