// One short-lived HTTP request watches both queues while the admin dashboard is visible.
export function watchAdminPaymentChanges() {
  let previous: { recharges: string; withdrawals: string } | undefined;
  let active: AbortController | undefined;
  let timer: number | undefined;
  let retryMs = 500;

  function stop() {
    window.clearTimeout(timer);
    active?.abort();
    active = undefined;
  }

  async function check() {
    if (document.hidden || active) return;
    const controller = new AbortController();
    active = controller;
    let nextCheckMs = 0;
    const timeout = window.setTimeout(() => controller.abort(), 16_000);
    try {
      const since = previous ? previous.recharges + ':' + previous.withdrawals : '';
      const response = await fetch('/api/admin/payment-changes?since=' + encodeURIComponent(since), {
        cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new Error('Unable to check payment requests.');
      if (response.status !== 204) {
        const next = await response.json();
        if (active !== controller) return;
        for (const queue of ['recharges', 'withdrawals'] as const) {
          if (next[queue] !== previous?.[queue]) window.dispatchEvent(new Event('galleria:' + queue + '-changed'));
        }
        window.dispatchEvent(new Event('galleria:admin-todo-changed'));
        previous = next;
      }
      retryMs = 500;
    } catch {
      if (active !== controller) return;
      // Keep the open list usable if a proxy interrupts the waiting request.
      window.dispatchEvent(new Event('galleria:recharges-changed'));
      window.dispatchEvent(new Event('galleria:withdrawals-changed'));
      nextCheckMs = retryMs;
      retryMs = Math.min(5000, retryMs * 2);
    } finally {
      window.clearTimeout(timeout);
      if (active === controller) {
        active = undefined;
        timer = window.setTimeout(check, nextCheckMs);
      }
    }
  }

  function resume() {
    stop();
    if (!document.hidden) void check();
  }
  resume();
  window.addEventListener('online', resume);
  document.addEventListener('visibilitychange', resume);
  return () => {
    stop();
    window.removeEventListener('online', resume);
    document.removeEventListener('visibilitychange', resume);
  };
}
