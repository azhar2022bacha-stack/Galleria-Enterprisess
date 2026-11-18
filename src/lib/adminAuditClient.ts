export type AuditCategory = 'Money' | 'Logins' | 'Sensitive' | 'Other';

const AUDIT_ENDPOINT = '/api/admin/audit-log';

export interface AdminActivityInput {
  actionText: string;
  details?: string;
  category?: AuditCategory;
  workflowId?: string;
  targetId?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  success?: boolean;
}

const STORAGE_ENTITIES: Array<{ match: RegExp; label: string; category: AuditCategory }> = [
  { match: /buyxoco_admin_accounts_list/i, label: 'administrator accounts', category: 'Sensitive' },
  { match: /buyxoco_admin_campaigns/i, label: 'marketing campaigns', category: 'Other' },
  { match: /buyxoco_admin_collections/i, label: 'product collections', category: 'Other' },
  { match: /buyxoco_admin_categories/i, label: 'product categories', category: 'Other' },
  { match: /buyxoco_admin_customer_groups/i, label: 'customer groups', category: 'Other' },
  { match: /buyxoco_admin_customers/i, label: 'customer records', category: 'Sensitive' },
  { match: /buyxoco_admin_disputes/i, label: 'customer disputes', category: 'Sensitive' },
  { match: /buyxoco_admin_draft_orders/i, label: 'draft orders', category: 'Other' },
  { match: /buyxoco_admin_handover_tasks/i, label: 'handover tasks', category: 'Other' },
  { match: /buyxoco_admin_inventory/i, label: 'inventory', category: 'Other' },
  { match: /buyxoco_admin_price_lists/i, label: 'price lists', category: 'Money' },
  { match: /buyxoco_admin_products/i, label: 'product catalog', category: 'Other' },
  { match: /buyxoco_admin_promotions/i, label: 'promotions', category: 'Other' },
  { match: /buyxoco_admin_receiving_addresses/i, label: 'payment receiving addresses', category: 'Sensitive' },
  { match: /buyxoco_admin_reservations/i, label: 'reservations', category: 'Other' },
  { match: /buyxoco_admin_product_reviews/i, label: 'product reviews', category: 'Other' },
  { match: /buyxoco_admin_verifications/i, label: 'seller verification records', category: 'Sensitive' },
  { match: /galleria_admin_seller_tracker_progress/i, label: 'seller follow-up progress', category: 'Other' },
  { match: /buyxoco_admin_site_settings/i, label: 'store settings', category: 'Sensitive' },
  { match: /galleria_admin_seller_confirmations_read/i, label: 'order review status', category: 'Other' },
  { match: /wallet|recharge|withdrawal|payout|commission/i, label: 'wallet and payout records', category: 'Money' },
];

function categoryForEndpoint(pathname: string): AuditCategory {
  if (/recharges|wallet-adjustments/.test(pathname)) return 'Money';
  if (/kyc|owners|invites/.test(pathname)) return 'Sensitive';
  return 'Other';
}

function storageEntity(key: string) {
  return STORAGE_ENTITIES.find((item) => item.match.test(key)) || null;
}

function parseStoredValue(value: string | null): unknown {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

function recordIdentity(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  return String(row.id || row.orderNumber || row.reference || row.code || row.sku || row.email || '');
}

function safeRecordName(value: unknown, entityLabel: string): string {
  if (!value || typeof value !== 'object') return entityLabel;
  const row = value as Record<string, unknown>;
  if (/administrator accounts/i.test(entityLabel)) return String(row.email || row.name || row.id || entityLabel).slice(0, 100);
  return String(row.orderNumber ? `order #${row.orderNumber}` : row.name || row.title || row.shopName || row.label || row.sku || row.id || entityLabel).slice(0, 100);
}

const PRIVATE_FIELDS = /password|secret|token|address|phone|email|receipt|document|image|payment|walletaddress/i;

function changedFieldNames(before: unknown, after: unknown): string[] {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return [];
  const left = before as Record<string, unknown>;
  const right = after as Record<string, unknown>;
  return Array.from(new Set([...Object.keys(left), ...Object.keys(right)]))
    .filter((key) => !PRIVATE_FIELDS.test(key) && JSON.stringify(left[key]) !== JSON.stringify(right[key]))
    .slice(0, 6)
    .map((key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').toLowerCase());
}

function describeStorageChange(key: string, beforeText: string | null, afterText: string | null): AdminActivityInput | null {
  const entity = storageEntity(key);
  if (!entity || /galleria_admin_seller_confirmations_read/i.test(key)) return null;

  const before = parseStoredValue(beforeText);
  const after = parseStoredValue(afterText);
  if (before === null && after === null) return null;

  // These two views write their demo seed into storage when first opened; that is not an admin action.
  if (before === null && /buyxoco_admin_(disputes|product_reviews)/i.test(key)) return null;

  if (Array.isArray(before) || Array.isArray(after)) {
    const previousRows = Array.isArray(before) ? before : [];
    const nextRows = Array.isArray(after) ? after : [];
    const oldById = new Map<string, unknown>();
    const newById = new Map<string, unknown>();
    for (const row of previousRows) {
      const id = recordIdentity(row);
      if (id) oldById.set(id, row);
    }
    for (const row of nextRows) {
      const id = recordIdentity(row);
      if (id) newById.set(id, row);
    }
    if (before === null && nextRows.length === 0) return null;
    if (oldById.size || newById.size) {
      const added = [...newById.entries()].filter(([id]) => !oldById.has(id));
      const removed = [...oldById.entries()].filter(([id]) => !newById.has(id));
      const updated = [...newById.entries()].filter(([id, row]) => oldById.has(id) && JSON.stringify(oldById.get(id)) !== JSON.stringify(row));
      if (!added.length && !removed.length && !updated.length) return null;

      let actionText = '';
      let details = '';
      if (added.length && !removed.length && !updated.length) {
        actionText = `Added ${added.length} record${added.length === 1 ? '' : 's'} to ${entity.label}`;
        details = added.slice(0, 4).map(([, row]) => safeRecordName(row, entity.label)).join(', ');
      } else if (removed.length && !added.length && !updated.length) {
        actionText = `Removed ${removed.length} record${removed.length === 1 ? '' : 's'} from ${entity.label}`;
        details = removed.slice(0, 4).map(([, row]) => safeRecordName(row, entity.label)).join(', ');
      } else {
        actionText = `Updated ${entity.label}`;
        const summaries = updated.slice(0, 4).map(([id, row]) => {
          const fields = changedFieldNames(oldById.get(id), row);
          return `${safeRecordName(row, entity.label)}${fields.length ? ` · changed ${fields.join(', ')}` : ''}`;
        });
        if (added.length) summaries.push(`${added.length} item${added.length === 1 ? '' : 's'} added`);
        if (removed.length) summaries.push(`${removed.length} item${removed.length === 1 ? '' : 's'} removed`);
        details = summaries.join('; ').slice(0, 1800);
      }
      return { actionText, details, category: entity.category, endpoint: 'Admin panel', method: 'DATA_CHANGE' };
    }

    return {
      actionText: `Saved ${entity.label}`,
      details: `${nextRows.length} records are now saved.`,
      category: entity.category,
      endpoint: 'Admin panel',
      method: 'DATA_CHANGE',
    };
  }

  if (after && typeof after === 'object') {
    const fields = changedFieldNames(before, after);
    if (!fields.length && before !== null) return null;
    return {
      actionText: `Updated ${entity.label}`,
      details: fields.length ? `Changed settings: ${fields.join(', ')}.` : 'Saved updated settings.',
      category: entity.category,
      endpoint: 'Admin panel',
      method: 'DATA_CHANGE',
    };
  }

  return {
    actionText: afterText === null ? `Removed ${entity.label}` : `Updated ${entity.label}`,
    details: 'A saved admin setting changed.',
    category: entity.category,
    endpoint: 'Admin panel',
    method: 'DATA_CHANGE',
  };
}

function actionTarget(data: Record<string, unknown>): string {
  const email = data.sellerEmail || data.email || data.seller_email;
  if (typeof email === 'string' && email.trim()) return `Seller: ${email.trim().slice(0, 120)}`;
  const id = data.orderId || data.productId || data.queryId || data.reference || data.id;
  if (typeof id === 'string' && id.trim()) return `Record: ${id.trim().slice(0, 120)}`;
  return '';
}

function amountLabel(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function consignApiAction(method: string, data: Record<string, unknown>): Pick<AdminActivityInput, 'actionText' | 'details' | 'workflowId' | 'targetId'> | null {
  const context = data.auditContext && typeof data.auditContext === 'object'
    ? data.auditContext as Record<string, unknown>
    : {};
  const workflowId = String(context.workflowId || '').slice(0, 120);

  if (context.action === 'dispatch' && Array.isArray(data.orders) && data.orders.length > 0) {
    const orders = data.orders as Array<Record<string, unknown>>;
    const merchant = String(context.merchantName || orders[0]?.shopName || 'the selected seller').slice(0, 100);
    const products = Array.isArray(context.products)
      ? (context.products as Array<Record<string, unknown>>).map((product) => {
          const name = String(product.name || product.title || 'Product').slice(0, 100);
          const sku = product.sku ? ` (SKU ${String(product.sku).slice(0, 40)})` : '';
          const quantity = Number(product.quantity || 1);
          const price = amountLabel(product.price);
          return `${name}${sku} × ${quantity}${price ? ` at ${price}` : ''}`;
        }).join('; ')
      : orders.flatMap((order) => Array.isArray(order.products) ? order.products as Array<Record<string, unknown>> : [])
          .map((product) => `${String(product.title || 'Product').slice(0, 100)} × ${Number(product.quantity || 1)}`)
          .join('; ');
    const shoppers = Array.isArray(context.shoppers)
      ? (context.shoppers as Array<Record<string, unknown>>).map((shopper) => `${String(shopper.name || 'Shopper')} (${String(shopper.id || 'ID unavailable')}, ${String(shopper.country || 'country unavailable')})`).join('; ')
      : orders.map((order) => `${String(order.shopperName || 'Shopper')} (${String(order.shopName || merchant)})`).join('; ');
    const orderNumbers = orders.map((order) => `#${String(order.orderNumber || order.id || 'unknown')}`).join(', ');
    const total = amountLabel(context.totalCost || orders.reduce((sum, order) => sum + Number(order.amount || order.cost || 0), 0));
    const details = [
      'Step 1 · Selected seller: ' + merchant,
      'Step 2 · Selected products: ' + (products || 'Product details unavailable'),
      'Step 3 · Assigned shopper(s): ' + (shoppers || 'Shopper details unavailable'),
      'Step 4 · Dispatched order(s): ' + orderNumbers,
      total ? 'Total dispatched: ' + total : '',
    ].filter(Boolean).join('\n');
    return {
      actionText: `Step 4 · Dispatched ${orders.length} Consign order${orders.length === 1 ? '' : 's'} to ${merchant}`,
      details,
      workflowId,
      targetId: orderNumbers.slice(0, 160),
    };
  }

  if (method === 'PATCH') {
    const orderNumber = String(context.orderNumber || data.id || 'Consign order').slice(0, 80);
    const nextStatus = String(data.status || context.nextStatus || 'updated').slice(0, 80);
    const details = [
      context.merchantName ? `Seller: ${String(context.merchantName).slice(0, 100)}` : '',
      context.shopperName ? `Assigned shopper: ${String(context.shopperName).slice(0, 100)}` : '',
      context.previousStatus ? `Previous status: ${String(context.previousStatus).slice(0, 80)}` : '',
      `New status: ${nextStatus}`,
    ].filter(Boolean).join('\n');
    return { actionText: `Changed Consign order ${orderNumber} to ${nextStatus}`, details, workflowId, targetId: orderNumber };
  }

  if (method === 'DELETE') return { actionText: 'Removed a Consign order', details: actionTarget(data), workflowId, targetId: String(data.id || '') };
  return null;
}

function describeApiAction(pathname: string, method: string, body: unknown): Pick<AdminActivityInput, 'actionText' | 'details' | 'category' | 'workflowId' | 'targetId'> {
  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const status = typeof data.status === 'string' ? data.status : '';
  const target = actionTarget(data);

  if (pathname === '/api/consign/orders') {
    return consignApiAction(method, data) || {
      actionText: `Updated Consign order records${target ? ` · ${target}` : ''}`,
      details: status ? `New status: ${status}` : 'Consign order information was saved.',
      category: 'Other',
      targetId: String(data.id || ''),
    };
  }
  if (pathname === '/api/admin/owners') {
    return {
      actionText: method === 'POST' ? `Created seller account${target ? ` · ${target}` : ''}` : `Changed seller account status${status ? ` to ${status}` : ''}${target ? ` · ${target}` : ''}`,
      details: method === 'POST'
        ? [`Seller name: ${String(data.fullName || 'not provided')}`, `Shop: ${String(data.shopName || 'not provided')}`, `Package: ${String(data.packageTier || 'not provided')}`, status ? `Account status: ${status}` : ''].filter(Boolean).join('\n')
        : status ? `New account status: ${status}.` : '',
      category: 'Sensitive',
      targetId: String(data.email || data.id || ''),
    };
  }
  if (pathname === '/api/admin/accounts') {
    const accountEmail = String(data.email || data.targetEmail || '').trim().slice(0, 120);
    if (method === 'POST') {
      return { actionText: `Created admin account${accountEmail ? ` for ${accountEmail}` : ''}`, details: 'Added a new back-office administrator.', category: 'Sensitive', targetId: accountEmail };
    }
    if (method === 'DELETE') {
      return { actionText: `Removed admin account${accountEmail ? ` for ${accountEmail}` : ''}`, details: 'Removed the administrator sign-in account.', category: 'Sensitive', targetId: String(data.id || accountEmail) };
    }
    if (data.action === 'change-password') {
      return { actionText: `Changed the password for ${accountEmail || 'the signed-in admin'}`, details: 'The password was changed after the current password was verified.', category: 'Sensitive', targetId: accountEmail };
    }
    const nextStatus = String(data.status || 'updated');
    return { actionText: `${nextStatus === 'Suspended' ? 'Suspended' : 'Reactivated'} admin account${accountEmail ? ` for ${accountEmail}` : ''}`, details: 'Updated the administrator sign-in access.', category: 'Sensitive', targetId: String(data.id || accountEmail) };
  }
  if (pathname === '/api/admin/wallet-adjustments') {
    const account = data.accountType === 'guarantee' ? 'guarantee balance' : 'wallet balance';
    return { actionText: `Adjusted seller ${account}${target ? ` · ${target}` : ''}`, details: `Adjustment: ${amountLabel(data.amount) || 'amount unavailable'}${data.reason ? ` · Reason: ${String(data.reason).slice(0, 500)}` : ''}`, category: 'Money', targetId: String(data.sellerEmail || '') };
  }
  if (pathname === '/api/recharges') {
    const rechargeReference = data.rechargeReference ? `Reference: ${String(data.rechargeReference).slice(0, 80)}` : '';
    const requestedAmount = data.requestedAmount ? `Requested: ${amountLabel(data.requestedAmount)}` : '';
    const creditedAmount = data.creditedAmount ? `Credited: ${amountLabel(data.creditedAmount)}` : '';
    return {
      actionText: data.action === 'review' ? `Reviewed wallet recharge${status ? ` · ${status}` : ''}${target ? ` · ${target}` : ''}` : `Updated wallet recharge${target ? ` · ${target}` : ''}`,
      details: data.action === 'review' ? [rechargeReference, requestedAmount, creditedAmount || (status === 'Confirmed' ? `Credited: ${amountLabel(data.requestedAmount) || 'not provided'}` : ''), data.reason ? `Reason: ${String(data.reason).slice(0, 500)}` : ''].filter(Boolean).join('\n') : '',
      category: 'Money',
      targetId: String(data.id || data.email || ''),
    };
  }
  if (pathname === '/api/kyc') return { actionText: `Reviewed seller identity documents${target ? ` · ${target}` : ''}${status ? ` · ${status}` : ''}`, details: data.reason ? `Review note: ${String(data.reason).slice(0, 500)}` : '', category: 'Sensitive', targetId: String(data.id || '') };
  if (pathname === '/api/invites') {
    const actionText = data.action === 'generate' ? `Generated ${Number(data.howMany || 1)} invitation code(s)` : data.action === 'toggle' ? `Changed invitation code status${target ? ` · ${target}` : ''}` : data.action === 'clear' ? 'Cleared invitation codes' : 'Updated invitation codes';
    return { actionText, details: data.note ? `Note: ${String(data.note).slice(0, 200)}` : '', category: 'Sensitive', targetId: String(data.id || '') };
  }
  if (pathname === '/api/consign/refunds') {
    const context = data.auditContext && typeof data.auditContext === 'object' ? data.auditContext as Record<string, unknown> : {};
    const orderNumber = String(context.orderNumber || data.orderId || 'Consign order');
    return { actionText: `Processed refund for Consign order ${orderNumber}`, details: [context.merchantName ? `Seller: ${String(context.merchantName)}` : '', context.shopperName ? `Shopper: ${String(context.shopperName)}` : '', 'Refund was recorded for this order.'].filter(Boolean).join('\n'), category: 'Money', workflowId: String(context.workflowId || ''), targetId: orderNumber };
  }
  if (pathname === '/api/consign/product-queries') {
    const seller = String(data.sellerName || data.sellerEmail || 'seller');
    const product = String(data.productName || 'selected product');
    const order = data.orderCode ? `Order: #${String(data.orderCode).replace(/^#/, '')}` : '';
    const subject = data.subject ? `Subject: ${String(data.subject).slice(0, 160)}` : '';
    return { actionText: method === 'POST' ? `Asked ${seller} about ${product}` : `Updated the reply to ${seller}'s product question`, details: [order, data.topic ? `Topic: ${String(data.topic)}` : '', subject].filter(Boolean).join('\n'), category: 'Other', targetId: String(data.orderId || data.productId || data.id || '') };
  }
  if (pathname === '/api/support') {
    const action = String(data.action || 'update');
    const target = String(data.name || data.email || 'seller');
    const messageId = String(data.messageId || '');
    if (action === 'send') {
      const preview = String(data.text || '').trim().slice(0, 180);
      return { actionText: `Sent a support message to ${target}`, details: preview ? `Message preview: ${preview}${String(data.text || '').length > 180 ? '…' : ''}` : 'Sent an attachment in the support conversation.', category: 'Other', targetId: String(data.email || '') };
    }
    if (action === 'status') return { actionText: `Changed the support case for ${target}`, details: 'Changed the case between open and resolved.', category: 'Other', targetId: String(data.email || '') };
    if (action === 'pin') return { actionText: `Pinned or unpinned a support message for ${target}`, details: `Message ID: ${messageId}`, category: 'Other', targetId: messageId };
    if (action === 'delete' || action === 'deleteForMe') return { actionText: `Removed a support message for ${target}`, details: `Action: ${action === 'delete' ? 'deleted' : 'hidden from this account'} · Message ID: ${messageId}`, category: 'Other', targetId: messageId };
    if (action === 'edit') return { actionText: `Edited a support message for ${target}`, details: `Message ID: ${messageId}`, category: 'Other', targetId: messageId };
    if (action === 'profile') return { actionText: 'Updated a support profile photo', details: `Profile: ${target}`, category: 'Sensitive', targetId: String(data.email || '') };
    if (action === 'read') return { actionText: `Marked the support conversation for ${target} as read`, details: '', category: 'Other', targetId: String(data.email || '') };
    return { actionText: `Updated the support conversation for ${target}`, details: `Action: ${action}`, category: 'Other', targetId: String(data.email || '') };
  }
  if (pathname === '/api/seller/products') {
    const products = Array.isArray(data.products) ? data.products as Array<Record<string, unknown>> : [];
    const statusCounts = products.reduce<Record<string, number>>((counts, product) => {
      const productStatus = String(product.status || 'pending').toLowerCase();
      counts[productStatus] = (counts[productStatus] || 0) + 1;
      return counts;
    }, {});
    const summary = Object.entries(statusCounts).map(([productStatus, count]) => `${count} ${productStatus}`).join(', ');
    const names = products.slice(0, 6).map((product) => String(product.name || product.title || 'Product').slice(0, 80)).join(', ');
    return { actionText: `Reviewed ${products.length} seller product${products.length === 1 ? '' : 's'}${target ? ` · ${target}` : ''}`, details: [summary ? `Results: ${summary}` : '', names ? `Products: ${names}` : ''].filter(Boolean).join('\n'), category: 'Other', targetId: String(data.email || '') };
  }

  const routeName = pathname.replace(/^\/api\//, '').split('/').filter(Boolean).map((part) => part.replace(/[-_]/g, ' ')).join(' ');
  return { actionText: `${method === 'DELETE' ? 'Removed' : method === 'POST' ? 'Created or updated' : 'Updated'} ${routeName || 'admin data'}`, details: target, category: categoryForEndpoint(pathname), targetId: String(data.id || data.email || '') };
}

async function submitAuditEvent(send: typeof window.fetch, event: AdminActivityInput): Promise<void> {
  const payload = {
    actionText: event.actionText.slice(0, 300),
    details: (event.details || '').slice(0, 2000),
    category: event.category || 'Other',
    endpoint: event.endpoint || 'Admin panel',
    method: event.method || 'ACTION',
    status: event.status ?? 200,
    success: event.success ?? true,
    workflowId: event.workflowId || '',
    targetId: event.targetId || '',
  };
  try {
    const response = await send(AUDIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok) console.warn('Unable to record admin audit event:', response.status);
  } catch (error) {
    console.warn('Unable to record admin audit event:', error);
  }
}

export function recordAdminActivity(event: AdminActivityInput): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return submitAuditEvent(window.fetch.bind(window), event);
}

/** Records admin API changes and human-readable summaries of admin data edits. */
export function installAdminAuditTracking(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const originalFetch = window.fetch.bind(window);
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const inputUrl = input instanceof Request ? input.url : String(input);
    const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let parsedUrl: URL | null = null;
    try { parsedUrl = new URL(inputUrl, window.location.href); } catch { /* Pass non-URL inputs through. */ }

    const shouldTrack = Boolean(
      parsedUrl &&
      parsedUrl.origin === window.location.origin &&
      parsedUrl.pathname.startsWith('/api/') &&
      parsedUrl.pathname !== AUDIT_ENDPOINT &&
      !parsedUrl.pathname.startsWith('/api/admin/auth/') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(method)
    );
    if (!shouldTrack || !parsedUrl) return originalFetch(input, init);

    let body: unknown;
    if (typeof init?.body === 'string') {
      try { body = JSON.parse(init.body); } catch { /* Ignore non-JSON bodies. */ }
    }
    if (
      parsedUrl.pathname === '/api/support' &&
      body && typeof body === 'object' &&
      (body as Record<string, unknown>).action === 'presence'
    ) return originalFetch(input, init);
    const description = describeApiAction(parsedUrl.pathname, method, body);
    try {
      const response = await originalFetch(input, init);
      void submitAuditEvent(originalFetch, {
        ...description,
        endpoint: parsedUrl.pathname,
        method,
        status: response.status,
        success: response.ok,
      });
      return response;
    } catch (error) {
      void submitAuditEvent(originalFetch, {
        ...description,
        endpoint: parsedUrl.pathname,
        method,
        status: 0,
        success: false,
        details: `${description.details ? description.details + '\n' : ''}The request failed before the server returned a response.`,
      });
      throw error;
    }
  };

  Storage.prototype.setItem = function (key: string, value: string): void {
    const isLocalStorage = this === window.localStorage;
    const before = isLocalStorage ? this.getItem(key) : null;
    originalSetItem.call(this, key, value);
    if (isLocalStorage) {
      const event = describeStorageChange(String(key), before, value);
      if (event) void submitAuditEvent(originalFetch, event);
    }
  };

  Storage.prototype.removeItem = function (key: string): void {
    const isLocalStorage = this === window.localStorage;
    const before = isLocalStorage ? this.getItem(key) : null;
    originalRemoveItem.call(this, key);
    if (isLocalStorage && before !== null) {
      const event = describeStorageChange(String(key), before, null);
      if (event) void submitAuditEvent(originalFetch, event);
    }
  };

  Storage.prototype.clear = function (): void {
    const isLocalStorage = this === window.localStorage;
    const hadItems = isLocalStorage && this.length > 0;
    originalClear.call(this);
    if (hadItems) {
      void submitAuditEvent(originalFetch, {
        actionText: 'Cleared saved admin data from this browser',
        details: 'The browser storage area was cleared. This does not delete server-side records.',
        category: 'Sensitive',
        endpoint: 'Admin panel',
        method: 'DATA_CLEAR',
      });
    }
  };

  return () => {
    window.fetch = originalFetch;
    Storage.prototype.setItem = originalSetItem;
    Storage.prototype.removeItem = originalRemoveItem;
    Storage.prototype.clear = originalClear;
  };
}
