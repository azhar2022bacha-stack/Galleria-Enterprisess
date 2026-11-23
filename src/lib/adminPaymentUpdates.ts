'use client';

export function subscribeToAdminPaymentUpdates(
  queue: 'recharges' | 'withdrawals',
  refresh: (force?: boolean) => void,
): () => void {
  let source: EventSource | undefined;
  let lastHeartbeat = 0;
  let revision = '';
  const visibleRefresh = (force = false) => {
    if (!document.hidden) refresh(force);
  };
  if (typeof EventSource !== 'undefined') {
    source = new EventSource('/api/admin/payment-updates?queue=' + queue);
    source.addEventListener('heartbeat', () => { lastHeartbeat = Date.now(); });
    source.addEventListener('payment-change', event => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data);
        if (typeof data.revision !== 'string') return;
        lastHeartbeat = Date.now();
        if (data.revision !== revision) {
          revision = data.revision;
          visibleRefresh(true);
        }
      } catch { lastHeartbeat = 0; }
    });
    source.onerror = () => { lastHeartbeat = 0; };
  }
  // Also covers proxies that buffer streaming responses or connections that reconnect.
  const timer = window.setInterval(() => {
    if (Date.now() - lastHeartbeat > 1500) visibleRefresh();
  }, 1000);
  const focus = () => visibleRefresh(true);
  window.addEventListener('focus', focus);
  window.addEventListener('online', focus);
  document.addEventListener('visibilitychange', focus);
  visibleRefresh();
  return () => {
    source?.close();
    clearInterval(timer);
    window.removeEventListener('focus', focus);
    window.removeEventListener('online', focus);
    document.removeEventListener('visibilitychange', focus);
  };
}
