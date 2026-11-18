'use client';

import React from 'react';
import { Bell, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  onOpenNotifications?: () => void;
  waitingCount?: number;
  activeTab?: string;
  settingsSubTab?: string;
  adminEmail?: string;
  onSignOut?: () => void;
}

export function AdminHeader({
  title,
  onOpenNotifications,
  waitingCount = 0,
  activeTab,
  settingsSubTab,
  adminEmail,
  onSignOut,
}: AdminHeaderProps) {
  return (
    <header className="h-12 border-b border-gray-200 bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30 shadow-2xs">
      {/* Breadcrumb Left */}
      <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-800">
        <svg
          className="w-4 h-4 text-gray-500"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2.5" width="12" height="11" rx="2" />
          <line x1="5.5" y1="2.5" x2="5.5" y2="13.5" />
        </svg>

        {activeTab === 'admin_settings' ? (
          <div className="flex items-center gap-2 font-medium">
            <span className="text-gray-600">Settings</span>
            <svg className="w-2.5 h-2.5 text-gray-400" viewBox="0 0 8 8" fill="currentColor">
              <path d="M2 1.5l4 2.5-4 2.5z" />
            </svg>
            <span className="text-gray-900 font-semibold capitalize">
              {settingsSubTab === 'store'
                ? 'Store'
                : settingsSubTab === 'tax_regions'
                ? 'Tax Regions'
                : settingsSubTab === 'return_reasons'
                ? 'Return Reasons'
                : settingsSubTab === 'refund_reasons'
                ? 'Refund Reasons'
                : settingsSubTab === 'sales_channels'
                ? 'Sales Channels'
                : settingsSubTab === 'product_types'
                ? 'Product Types'
                : settingsSubTab === 'product_tags'
                ? 'Product Tags'
                : settingsSubTab === 'locations_shipping'
                ? 'Locations & Shipping'
                : settingsSubTab === 'publishable_api_keys'
                ? 'Publishable API Keys'
                : settingsSubTab === 'secret_api_keys'
                ? 'Secret API Keys'
                : settingsSubTab === 'workflows'
                ? 'Workflows'
                : settingsSubTab === 'regions'
                ? 'Regions'
                : settingsSubTab === 'users'
                ? 'Users'
                : 'Store'}
            </span>
          </div>
        ) : (
          title !== 'Shortcuts' &&
          title !== 'Live' &&
          title !== 'Payouts' &&
          title !== 'Site Settings' &&
          title !== 'Ledger' &&
          title !== 'Receiving' &&
          title !== 'Restock' &&
          title !== 'Refunds' &&
          title !== 'Logins' &&
          title !== 'Product Review' &&
          title !== 'Review' &&
          title !== 'Videos' &&
          title !== 'Recharges' &&
          title !== 'Commission Ledger' &&
          title !== 'Withdrawals' && <span>{title}</span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {adminEmail && <span className="hidden max-w-48 truncate text-[11px] text-slate-500 sm:block">{adminEmail}</span>}
        {onSignOut && <button type="button" onClick={onSignOut} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900" title="Sign out of admin panel"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign out</span></button>}
        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4 stroke-[1.6]" />
          {waitingCount > 0 && activeTab !== 'admin_settings' && title !== 'Draft Orders' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ef4444]"></span>
          )}
        </button>
      </div>
    </header>
  );
}
