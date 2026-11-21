'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Key,
  Package,
  RefreshCw,
  Search,
  Shield,
  Wrench,
  X,
} from 'lucide-react';

type AuditCategory = 'Money' | 'Logins' | 'Sensitive' | 'Other';
type AuditFilter = 'All' | AuditCategory;

interface AuditLogEntry {
  id: string;
  actionText: string;
  details?: string;
  category: AuditCategory;
  actor: string;
  ip: string;
  endpoint: string;
  workflowId?: string;
  targetId?: string;
  method: string;
  status: number;
  success: boolean;
  createdAt: string;
}

const FILTERS: AuditFilter[] = ['All', 'Money', 'Logins', 'Sensitive', 'Other'];

const LEGACY_STORAGE_LABELS: Record<string, string> = {
  galleria_consign_orders_v3: 'Consign orders',
  galleria_seller_orders: 'seller order records',
  buyxoco_admin_accounts_list_v1: 'administrator accounts',
  buyxoco_admin_campaigns_v2: 'marketing campaigns',
  buyxoco_admin_collections_list: 'product collections',
  buyxoco_admin_categories_list: 'product categories',
  buyxoco_admin_customer_groups_v2: 'customer groups',
  buyxoco_admin_customers_list: 'customer records',
  buyxoco_admin_disputes: 'customer disputes',
  buyxoco_admin_draft_orders: 'draft orders',
  buyxoco_admin_handover_tasks: 'handover tasks',
  buyxoco_admin_inventory_list: 'inventory',
  buyxoco_admin_price_lists_v1: 'price lists',
  buyxoco_admin_products_list: 'product catalog',
  buyxoco_admin_promotions_list: 'promotions',
  buyxoco_admin_reservations_list: 'reservations',
  buyxoco_admin_product_reviews: 'product reviews',
  buyxoco_admin_verifications: 'seller verification records',
  buyxoco_admin_site_settings: 'store settings',
};

function normalizeLegacyEntries(entries: AuditLogEntry[]): AuditLogEntry[] {
  return entries.flatMap((entry) => {
    if (/^(Updated|Removed) admin data:\s*galleria_(?:cart|wishlist)$/i.test(entry.actionText || '')) return [];
    if (/^Created or updated a consignment order$/i.test(entry.actionText || '')) {
      return [{
        ...entry,
        actionText: 'Updated Consign order records',
        details: 'Earlier event. The previous logger did not save the seller, product, or shopper details.',
      }];
    }
    const match = /^(Updated|Removed) admin data:\s*(.+)$/i.exec(entry.actionText || '');
    if (!match) return [entry];
    const key = match[2].trim();
    if (/(?:^|[_-])wishlist(?:$|[_-])|(?:^|[_-])cart(?:$|[_-])|shopping.?cart|shortcuts_order|confirmations_read|active_seller/i.test(key)) return [];
    const label = LEGACY_STORAGE_LABELS[key] || key
      .replace(/^buyxoco_admin_|^galleria_admin_/i, '')
      .replace(/_v\d+$/i, '')
      .replace(/[_-]/g, ' ')
      .trim();
    const verb = match[1].toLowerCase() === 'removed' ? 'Removed' : 'Updated';
    return [{
      ...entry,
      actionText: `${verb} ${label}`,
      details: entry.details || 'Earlier event. The previous logger did not save the changed record details.',
    }];
  });
}

function dayGroup(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Earlier';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfEntryDay = new Date(date);
  startOfEntryDay.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - startOfEntryDay.getTime()) / 86400000);
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : 'Earlier';
}

function displayTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
}

interface AdminAuditLogViewProps {
  notify?: (msg: string) => void;
}

export function AdminAuditLogView({ notify }: AdminAuditLogViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AuditFilter>('All');
  const [userFilter, setUserFilter] = useState('Everyone');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadLogs(showRefresh = false, showLoading = false) {
    if (showRefresh) setIsRefreshing(true);
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/audit-log?limit=500', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load the audit log.');
      setLogs(normalizeLegacyEntries(Array.isArray(data.entries) ? data.entries : []));
      if (showRefresh) notify?.('Audit log refreshed.');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the audit log.');
    } finally {
      if (showLoading) setIsLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let inFlight = false;
    const poll = async () => {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      await loadLogs();
      inFlight = false;
    };
    inFlight = true;
    void loadLogs(false, true).finally(() => { inFlight = false; });
    const interval = window.setInterval(() => void poll(), 15_000);
    document.addEventListener('visibilitychange', poll);
    window.addEventListener('focus', poll);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
      window.removeEventListener('focus', poll);
    };
  }, []);

  const users = useMemo(() => Array.from(new Set(logs.map((entry) => entry.actor))).sort(), [logs]);
  const categoryCounts = useMemo(() => ({
    All: logs.length,
    Money: logs.filter((entry) => entry.category === 'Money').length,
    Logins: logs.filter((entry) => entry.category === 'Logins').length,
    Sensitive: logs.filter((entry) => entry.category === 'Sensitive').length,
    Other: logs.filter((entry) => entry.category === 'Other').length,
  }), [logs]);
  const todaysCount = useMemo(() => logs.filter((entry) => dayGroup(entry.createdAt) === 'Today').length, [logs]);
  const failedCount = useMemo(() => logs.filter((entry) => !entry.success).length, [logs]);

  const filteredLogs = useMemo(() => logs.filter((entry) => {
    if (activeTab !== 'All' && entry.category !== activeTab) return false;
    if (userFilter !== 'Everyone' && entry.actor !== userFilter) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [entry.actionText, entry.details, entry.workflowId, entry.targetId, entry.actor, entry.ip, entry.endpoint, entry.method, String(entry.status)]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [logs, activeTab, userFilter, searchQuery]);

  const groupedLogs = useMemo(() => {
    const groups = new Map<string, AuditLogEntry[]>();
    for (const entry of filteredLogs) {
      const group = dayGroup(entry.createdAt);
      groups.set(group, [...(groups.get(group) || []), entry]);
    }
    return Array.from(groups.entries());
  }, [filteredLogs]);

  const renderIcon = (entry: AuditLogEntry) => {
    const iconClass = 'w-3.5 h-3.5';
    if (entry.category === 'Money') return <CreditCard className={`${iconClass} text-emerald-700`} />;
    if (entry.category === 'Logins') return <Key className={`${iconClass} text-amber-700`} />;
    if (entry.category === 'Sensitive') return <Shield className={`${iconClass} text-rose-700`} />;
    if (/order|product|consign/i.test(entry.actionText)) return <Package className={`${iconClass} text-blue-700`} />;
    return <Wrench className={`${iconClass} text-gray-600`} />;
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Audit log</h1>
              <p className="text-xs text-gray-500 mt-0.5">Live activity with clear actions, affected records, and source IP addresses.</p>
              <p className="text-[10px] text-gray-500 mt-1">Actions use the signed-in admin identity; failed sign-ins include the submitted email and source IP.</p>
            </div>
            <button
              onClick={() => void loadLogs(true)}
              disabled={isRefreshing}
              className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-gray-500' : 'text-gray-600'}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3.5 flex-wrap">
            <div className="bg-gray-100 text-gray-800 font-medium px-2.5 py-1 rounded-full text-xs">Today · {todaysCount} events</div>
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> {categoryCounts.Money} money events
            </div>
            <div className="bg-rose-50 text-rose-700 border border-rose-200 font-medium px-2.5 py-1 rounded-full text-xs">{failedCount} failed actions</div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveTab(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${activeTab === filter ? 'bg-slate-800 text-white font-semibold' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  {filter} ({categoryCounts[filter]})
                </button>
              ))}
              <select
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                className="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="Everyone">Everyone</option>
                {users.map((user) => <option value={user} key={user}>{user}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search action / account / IP"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-8 pl-8 pr-8 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-56 sm:w-64"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200" />
        {error && <div role="alert" className="px-6 py-3 text-xs text-rose-700 bg-rose-50 border-b border-rose-100">{error}</div>}
        {isLoading ? (
          <div className="py-16 text-center text-gray-400 text-xs">Loading audit events…</div>
        ) : groupedLogs.length === 0 ? (
          <div className="py-16 px-6 text-center text-gray-500 text-xs">
            {logs.length === 0 ? 'No admin activity has been recorded yet.' : 'No audit events match your filters.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {groupedLogs.map(([group, entries]) => (
              <section key={group}>
                <h2 className="px-5 sm:px-6 pt-3.5 pb-1.5 text-xs font-semibold text-gray-900">{group}</h2>
                {entries.map((entry) => (
                  <div key={entry.id} className={`px-5 sm:px-6 py-3.5 flex items-start gap-3 border-l-[3.5px] ${entry.success ? 'border-transparent' : 'border-rose-500'} hover:bg-gray-50/60`}>
                    <div className="w-6 h-6 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">{renderIcon(entry)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900 leading-relaxed flex items-center flex-wrap gap-1.5">
                        <span>{entry.actionText}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${entry.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{entry.success ? 'Success' : `Failed · ${entry.status || 'no response'}`}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-1 break-all">
                        {entry.actor} · {displayTime(entry.createdAt)} · IP {entry.ip}
                      </div>
                      {entry.details && <div className="text-[11px] text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{entry.details}</div>}
                      {(entry.workflowId || entry.targetId) && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {entry.workflowId && <span>Workflow {entry.workflowId}</span>}
                          {entry.workflowId && entry.targetId && <span> · </span>}
                          {entry.targetId && <span>Record {entry.targetId}</span>}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 mt-0.5">{entry.method} · {entry.endpoint}</div>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-2 px-1">Latest 500 events · new activity appears automatically every 2 seconds.</p>
    </div>
  );
}
