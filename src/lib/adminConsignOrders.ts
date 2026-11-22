let inFlight: Promise<{ success?: boolean; orders?: unknown[] }> | undefined;

export function fetchAdminConsignOrders() {
  if (!inFlight) {
    inFlight = fetch('/api/consign/orders', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Could not load Consign orders.');
      return response.json();
    }).finally(() => { inFlight = undefined; });
  }
  return inFlight;
}
