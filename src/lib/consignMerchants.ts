export interface ConsignMerchantSummary {
  id: string;
  name: string;
  fullName: string;
  email: string;
  balance: number;
  productsCount: number;
  verified: boolean;
}

let cache: { adminEmail: string; merchants?: ConsignMerchantSummary[]; loadedAt: number; request?: Promise<ConsignMerchantSummary[]> } | undefined;

export function getCachedConsignMerchants(adminEmail: string) {
  return cache?.adminEmail === adminEmail ? cache.merchants : undefined;
}

export function fetchConsignMerchants(adminEmail: string, force = false) {
  if (!cache || cache.adminEmail !== adminEmail) cache = { adminEmail, loadedAt: 0 };
  const entry = cache;
  if (entry.request) return entry.request;
  if (!force && entry.merchants && Date.now() - entry.loadedAt < 5_000) return Promise.resolve(entry.merchants);

  entry.request = fetch('/api/admin/owners?view=merchants', { cache: 'no-store' })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.merchants)) {
        throw new Error('Could not load registered sellers.');
      }
      entry.merchants = data.merchants as ConsignMerchantSummary[];
      entry.loadedAt = Date.now();
      return entry.merchants;
    })
    .finally(() => { entry.request = undefined; });
  return entry.request;
}
