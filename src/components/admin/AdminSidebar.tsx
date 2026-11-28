'use client';

import React, { useEffect, useState } from 'react';
import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import Link from 'next/link';
import { SupportUnreadBadge } from '@/components/support/SupportUnreadBadge';
import { DisputeUnreadBadge } from '@/components/disputes/DisputeUnreadBadge';
import { ADMIN_STORE_NAME, getAdminStoreDisplayName } from './adminStoreName';
import {
  Search,
  ShoppingCart,
  Tag,
  Archive,
  Users,
  Percent,
  CircleDollarSign,
  Minus,
  Plus,
  AlertCircle,
  ShieldCheck,
  Download,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Store as StoreIcon,
  ShoppingBag,
  Settings,
  ArrowLeft,
} from 'lucide-react';

export type AdminTab =
  | 'orders'
  | 'drafts'
  | 'products'
  | 'product_feed'
  | 'storehouse_catalog'
  | 'collections'
  | 'categories'
  | 'inventory'
  | 'reservations'
  | 'customers'
  | 'customer_groups'
  | 'promotions'
  | 'campaigns'
  | 'price_lists'
  | 'product_update'
  | 'store_categories'
  | 'todo'
  | 'confirm_order_by_seller'
  | 'store_exposure'
  | 'manual_payment'
  | 'seller_recovery'
  | 'update_amount'
  | 'suspend_account'
  | 'audit_log'
  | 'accounts'
  | 'consign'
  | 'consign_product_queries'
  | 'owners'
  | 'support'
  | 'recharges'
  | 'withdrawals'
  | 'invites'
  | 'verification'
  | 'reviews'
  | 'disputes'
  | 'handover'
  | 'analytics'
  | 'shortcuts'
  | 'live'
  | 'payouts'
  | 'site_settings'
  | 'wallet_ledger'
  | 'receiving_address'
  | 'restock'
  | 'refund_governance'
  | 'logins'
  | 'product_review'
  | 'retail_listings'
  | 'storefront_orders'
  | 'videos'
  | 'commission_ledger'
  | 'admin_withdrawals'
  | 'admin_settings';

export type SettingsSubTab =
  | 'store'
  | 'users'
  | 'regions'
  | 'tax_regions'
  | 'return_reasons'
  | 'refund_reasons'
  | 'sales_channels'
  | 'product_types'
  | 'product_tags'
  | 'locations_shipping'
  | 'publishable_api_keys'
  | 'secret_api_keys'
  | 'workflows';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenSearch: () => void;
  waitingCount?: number;
  withdrawalsCount?: number;
  sellerConfirmedOrdersCount?: number;
  settingsSubTab?: SettingsSubTab;
  onSelectSettingsSubTab?: (sub: SettingsSubTab) => void;
  onBackToMain?: () => void;
}

/**
 * 4-square grid with plus icon at bottom-right, matching the screenshot's extension icon
 */
function ExtensionGridIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <rect x="2" y="2" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="2" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="10" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 9v5M9.5 11.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  onOpenSearch,
  waitingCount = 0,
  withdrawalsCount = 0,
  sellerConfirmedOrdersCount = 0,
  settingsSubTab = 'store',
  onSelectSettingsSubTab,
  onBackToMain,
}: AdminSidebarProps) {
  const [isExtensionsOpen, setIsExtensionsOpen] = useState(true);
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(true);
  const [isCustomersExpanded, setIsCustomersExpanded] = useState(true);
  const [isPromotionsExpanded, setIsPromotionsExpanded] = useState(true);
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(true);
  const [storeDisplayName, setStoreDisplayName] = useState(ADMIN_STORE_NAME);

  useEffect(() => {
    let mounted = true;
    const loadStoreName = async () => {
      try {
        const response = await fetch('/api/admin/store-settings', { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        if (mounted && result.success && typeof result.settings?.name === 'string' && result.settings.name.trim()) {
          setStoreDisplayName(getAdminStoreDisplayName(result.settings.name));
        }
      } catch {
        // Keep the current label if Store settings cannot be reached.
      }
    };
    const handleStoreSettingsChanged = (event: Event) => {
      const name = (event as CustomEvent<{ name?: string }>).detail?.name;
      if (typeof name === 'string' && name.trim()) setStoreDisplayName(getAdminStoreDisplayName(name));
    };
    void loadStoreName();
    window.addEventListener('galleria:store-settings-changed', handleStoreSettingsChanged);
    return () => {
      mounted = false;
      window.removeEventListener('galleria:store-settings-changed', handleStoreSettingsChanged);
    };
  }, []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useDismissMenusOnOutsideClick(isMenuOpen, () => setIsMenuOpen(false));

  // Settings: General Sub-items strictly matching uploaded screenshot
  const generalSettingsItems: { id: SettingsSubTab; label: string }[] = [
    { id: 'store', label: 'Store' },
    { id: 'users', label: 'Users' },
    { id: 'regions', label: 'Regions' },
    { id: 'tax_regions', label: 'Tax Regions' },
    { id: 'return_reasons', label: 'Return Reasons' },
    { id: 'refund_reasons', label: 'Refund Reasons' },
    { id: 'sales_channels', label: 'Sales Channels' },
    { id: 'product_types', label: 'Product Types' },
    { id: 'product_tags', label: 'Product Tags' },
    { id: 'locations_shipping', label: 'Locations & Shipping' },
  ];

  // Settings: Developer Sub-items strictly matching uploaded screenshot
  const developerSettingsItems: { id: SettingsSubTab; label: string }[] = [
    { id: 'publishable_api_keys', label: 'Publishable API Keys' },
    { id: 'secret_api_keys', label: 'Secret API Keys' },
    { id: 'workflows', label: 'Workflows' },
  ];

  // The complete list of Extension items strictly matching the uploaded screenshots
  const extensionItems: {
    id: AdminTab;
    label: string;
    iconType: 'todo' | 'grid' | 'shield' | 'dollar' | 'download' | 'dispute' | 'bag' | 'gear';
    badge?: number;
    indent?: boolean;
  }[] = [
    // --- Screenshot 1 items ---
    { id: 'todo', label: 'To-do', iconType: 'todo' },
    { id: 'confirm_order_by_seller', label: 'Confirm Order by Seller', iconType: 'bag' },
    { id: 'store_exposure', label: 'Store Visitors & Exposure', iconType: 'bag' },
    { id: 'manual_payment', label: 'Manual Payment', iconType: 'dollar' },
    { id: 'seller_recovery', label: 'Seller Account Recovery', iconType: 'shield' },
    { id: 'update_amount', label: 'Update Amount', iconType: 'dollar' },
    { id: 'suspend_account', label: 'Suspend Account', iconType: 'shield' },
    { id: 'audit_log', label: 'Audit log', iconType: 'grid' },
    { id: 'accounts', label: 'Accounts', iconType: 'grid' },
    { id: 'consign', label: 'Consign', iconType: 'shield' },
    { id: 'consign_product_queries', label: 'Product Queries', iconType: 'grid' },
    { id: 'owners', label: 'Owners', iconType: 'grid' },
    { id: 'support', label: 'Support', iconType: 'grid' },
    { id: 'withdrawals', label: 'Withdrawals', iconType: 'download' },
    { id: 'invites', label: 'Invites', iconType: 'grid' },
    { id: 'verification', label: 'Verification', iconType: 'grid' },
    { id: 'reviews', label: 'Reviews', iconType: 'grid' },
    { id: 'disputes', label: 'Disputes', iconType: 'dispute' },

    // --- Screenshot 2 items (below Disputes) ---
    { id: 'handover', label: 'Handover', iconType: 'grid' },
    { id: 'analytics', label: 'Analytics', iconType: 'grid' },
    { id: 'shortcuts', label: 'Shortcuts', iconType: 'grid' },
    { id: 'live', label: 'Live', iconType: 'grid' },
    { id: 'payouts', label: 'Payouts', iconType: 'dollar' },
    { id: 'wallet_ledger', label: 'Ledger', iconType: 'dollar' },
    { id: 'receiving_address', label: 'Receiving', iconType: 'dollar' },
    { id: 'restock', label: 'Restock', iconType: 'shield' },
    { id: 'refund_governance', label: 'Refunds', iconType: 'grid' },
    { id: 'logins', label: 'Logins', iconType: 'grid' },
    { id: 'storefront_orders', label: 'Store Orders', iconType: 'bag' },
    { id: 'videos', label: 'Videos', iconType: 'grid' },
    { id: 'recharges', label: 'Recharges', iconType: 'dollar' },
    { id: 'commission_ledger', label: 'Commission Ledger', iconType: 'grid' },

    // --- Items below Ledger ---
    { id: 'admin_withdrawals', label: 'Withdrawals', iconType: 'download' },
    { id: 'admin_settings', label: 'Settings', iconType: 'gear' },
  ];

  const renderExtensionIcon = (type: string) => {
    switch (type) {
      case 'todo':
        return <AlertCircle className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'shield':
        return <ShieldCheck className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'dollar':
        return <CircleDollarSign className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'download':
        return <Download className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'dispute':
        return <AlertCircle className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'bag':
        return <ShoppingBag className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'gear':
        return <Settings className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />;
      case 'grid':
      default:
        return <ExtensionGridIcon className="w-3.5 h-3.5 text-gray-700" />;
    }
  };

  // ==============================================================
  // VIEW: SETTINGS SUB-MENU (ACTIVE WHEN USER CLICKS SETTINGS)
  // ==============================================================
  if (activeTab === 'admin_settings') {
    return (
      <aside data-admin-sidebar className="w-64 sm:w-68 bg-[#fbfbfc] border-r border-gray-200 text-gray-700 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto select-none animate-fadeIn">
        <div>
          {/* Back to main menu header */}
          <div className="p-3.5 pb-3 border-b border-gray-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (onBackToMain) onBackToMain();
                else onSelectTab('orders');
              }}
              className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              <span>Back to Store</span>
            </button>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Settings
            </span>
          </div>

          <div className="p-2.5 space-y-3 text-xs">
            {/* General Section */}
            <div>
              <div className="flex items-center justify-between px-2 py-0.5 text-gray-500">
                <span className="text-xs font-semibold">General</span>
                <button
                  onClick={() => setIsGeneralOpen(!isGeneralOpen)}
                  className="hover:text-gray-700 p-0.5 rounded"
                  title="Toggle General"
                >
                  {isGeneralOpen ? (
                    <Minus className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
              </div>

              {isGeneralOpen && (
                <div className="space-y-0.5 mt-0.5">
                  {generalSettingsItems.map((item) => {
                    const isSelected = settingsSubTab === item.id;
                    return (
                      <button
                        key={item.id}
                        data-prefetch-tab="admin_settings"
                        onClick={() => onSelectSettingsSubTab?.(item.id)}
                        className={`w-full text-left px-2 py-1 rounded-md text-xs transition-all ${
                          isSelected
                            ? 'bg-white text-gray-900 font-semibold border border-gray-200 shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border border-transparent'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dotted Divider Line */}
            <div className="border-t border-dashed border-gray-200 my-1.5" />

            {/* Developer Section */}
            <div>
              <div className="flex items-center justify-between px-2 py-0.5 text-gray-500">
                <span className="text-xs font-semibold">Developer</span>
                <button
                  onClick={() => setIsDeveloperOpen(!isDeveloperOpen)}
                  className="hover:text-gray-700 p-0.5 rounded"
                  title="Toggle Developer"
                >
                  {isDeveloperOpen ? (
                    <Minus className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
              </div>

              {isDeveloperOpen && (
                <div className="space-y-0.5 mt-0.5">
                  {developerSettingsItems.map((item) => {
                    const isSelected = settingsSubTab === item.id;
                    return (
                      <button
                        key={item.id}
                        data-prefetch-tab="admin_settings"
                        onClick={() => onSelectSettingsSubTab?.(item.id)}
                        className={`w-full text-left px-2 py-1 rounded-md text-xs transition-all ${
                          isSelected
                            ? 'bg-white text-gray-900 font-semibold border border-gray-200 shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border border-transparent'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Link back */}
        <div className="p-3 border-t border-gray-200 text-xs">
          <button
            onClick={() => {
              if (onBackToMain) onBackToMain();
              else onSelectTab('orders');
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <span>Exit Settings</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </aside>
    );
  }

  // ==============================================================
  // VIEW: MAIN STORE & EXTENSIONS NAVIGATION
  // ==============================================================
  return (
    <aside data-admin-sidebar className="w-64 sm:w-70 bg-[#fbfbfc] border-r border-gray-200 text-gray-700 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto select-none">
      <div>
        {/* Top Store Selector Header */}
        <div className="p-3.5 pb-2 border-b border-gray-100 relative" data-click-away-menu={isMenuOpen ? menuId : undefined}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-800 shadow-xs">
                {storeDisplayName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-sm text-gray-900 tracking-tight">
                {storeDisplayName}
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Store options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-12 right-3 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 text-xs animate-fadeIn">
              <button
                data-prefetch-tab="admin_settings"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSelectTab('admin_settings');
                  onSelectSettingsSubTab?.('store');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-gray-500" />
                <span>Store Settings</span>
              </button>
              <Link
                href="/seller/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <StoreIcon className="w-3.5 h-3.5 text-gray-500" />
                <span>Switch to Seller Portal</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span>Visit Storefront</span>
              </Link>
            </div>
          )}
        </div>

        {/* Search Bar / Command K */}
        <div className="p-2.5">
          <button
            data-prefetch-search="true"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>Search</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-200 rounded text-gray-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="px-2 space-y-0.5 text-xs">
          {/* Orders + Drafts */}
          <div>
            <button
              data-prefetch-tab="orders"
              onClick={() => onSelectTab('orders')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-gray-200/80 text-gray-900 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[12px]">Orders</span>
              </div>
            </button>

            {/* Indented Sub-item: Drafts */}
            <button
              data-prefetch-tab="drafts"
              onClick={() => onSelectTab('drafts')}
              className={`w-full flex items-center pl-7 py-0.5 rounded-md text-[11.5px] transition-colors ${
                activeTab === 'drafts'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Drafts
            </button>
          </div>

          {/* Products + Collections + Categories */}
          <div>
            <button
              data-prefetch-tab="products"
              onClick={() => {
                onSelectTab('products');
                setIsProductsExpanded(true);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-white border border-gray-200 shadow-2xs text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />
                <span className="text-[12px]">Products</span>
              </div>
            </button>

            {/* Sub-nav: Collections & Categories (strictly matching screenshot) */}
            {(isProductsExpanded ||
              activeTab === 'products' ||
              activeTab === 'product_feed' ||
              activeTab === 'storehouse_catalog' ||
              activeTab === 'collections' ||
              activeTab === 'categories') && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  data-prefetch-tab="collections"
                  onClick={() => onSelectTab('collections')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'collections'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Collections
                </button>
                <button
                  data-prefetch-tab="categories"
                  onClick={() => onSelectTab('categories')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'categories'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Categories
                </button>
                <button
                  data-prefetch-tab="product_feed"
                  onClick={() => onSelectTab('product_feed')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'product_feed'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Product Feed
                </button>
                <button
                  data-prefetch-tab="storehouse_catalog"
                  onClick={() => onSelectTab('storehouse_catalog')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'storehouse_catalog'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Storehouse Catalog
                </button>
              </div>
            )}
          </div>

          {/* Inventory + Reservations */}
          <div>
            <button
              data-prefetch-tab="inventory"
              onClick={() => {
                onSelectTab('inventory');
                setIsInventoryExpanded(true);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-white border border-gray-200 shadow-2xs text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />
                <span className="text-[12px]">Inventory</span>
              </div>
            </button>

            {/* Sub-nav: Reservations */}
            {(isInventoryExpanded ||
              activeTab === 'inventory' ||
              activeTab === 'reservations') && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  data-prefetch-tab="reservations"
                  onClick={() => onSelectTab('reservations')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'reservations'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Reservations
                </button>
              </div>
            )}
          </div>

          {/* Customers + Customer Groups */}
          <div>
            <button
              data-prefetch-tab="customers"
              onClick={() => {
                onSelectTab('customers');
                setIsCustomersExpanded(true);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-white border border-gray-200 shadow-2xs text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />
                <span className="text-[12px]">Customers</span>
              </div>
            </button>

            {/* Sub-nav: Customer Groups */}
            {(isCustomersExpanded ||
              activeTab === 'customers' ||
              activeTab === 'customer_groups') && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  data-prefetch-tab="customer_groups"
                  onClick={() => onSelectTab('customer_groups')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'customer_groups'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Customer Groups
                </button>
              </div>
            )}
          </div>

          {/* Promotions + Campaigns */}
          <div>
            <button
              data-prefetch-tab="promotions"
              onClick={() => {
                onSelectTab('promotions');
                setIsPromotionsExpanded(true);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'promotions'
                  ? 'bg-white border border-gray-200 shadow-2xs text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />
                <span className="text-[12px]">Promotions</span>
              </div>
            </button>

            {/* Sub-nav: Campaigns */}
            {(isPromotionsExpanded ||
              activeTab === 'promotions' ||
              activeTab === 'campaigns') && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  data-prefetch-tab="campaigns"
                  onClick={() => onSelectTab('campaigns')}
                  className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
                    activeTab === 'campaigns'
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Campaigns
                </button>
              </div>
            )}
          </div>

          {/* Price Lists */}
          <button
            data-prefetch-tab="price_lists"
            onClick={() => onSelectTab('price_lists')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'price_lists'
                ? 'bg-white border border-gray-200 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-3.5 h-3.5 text-gray-700 stroke-[1.8]" />
              <span className="text-[12px]">Price Lists</span>
            </div>
          </button>
          <button
            data-prefetch-tab="product_update"
            onClick={() => onSelectTab('product_update')}
            className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
              activeTab === 'product_update'
                ? 'bg-gray-100 text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Product Update
          </button>
          <button
            data-prefetch-tab="store_categories"
            onClick={() => onSelectTab('store_categories')}
            className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
              activeTab === 'store_categories'
                ? 'bg-gray-100 text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Manage Categories
          </button>
          <button
            data-prefetch-tab="site_settings"
            onClick={() => onSelectTab('site_settings')}
            className={`w-full flex items-center pl-8 py-1 rounded-md text-[11.5px] transition-colors ${
              activeTab === 'site_settings'
                ? 'bg-gray-100 text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Website Info Manage
          </button>

          {/* ============================================================== */}
          {/* SECTION: EXTENSIONS (COMPACT VERTICAL SPACING)                 */}
          {/* ============================================================== */}
          <div className="pt-2 pb-5">
            <div className="flex items-center justify-between px-2 py-0.5 text-gray-500">
              <span className="text-xs font-semibold tracking-tight">
                Extensions
              </span>
              <button
                onClick={() => setIsExtensionsOpen(!isExtensionsOpen)}
                className="hover:text-gray-700 p-0.5 rounded transition-colors"
                title="Toggle extensions"
              >
                {isExtensionsOpen ? (
                  <Minus className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            </div>

            {isExtensionsOpen && (
              <div className="space-y-0.5 mt-0.5">
                {extensionItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      data-prefetch-tab={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (item.id === 'admin_settings') onSelectSettingsSubTab?.('store');
                      }}
                      className={`w-full flex items-center justify-between ${item.indent ? 'pl-5 pr-1.5' : 'px-1.5'} py-0.5 rounded-md text-xs font-medium transition-colors group ${
                        isActive
                          ? 'border border-blue-500 bg-white text-gray-900 font-semibold shadow-2xs'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {/* Compact rounded square container for icon matching screenshot */}
                        <div
                          className={`w-5 h-5 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                            isActive
                              ? 'border-blue-400 bg-white'
                              : 'border-gray-200/90 bg-white group-hover:border-gray-300'
                          }`}
                        >
                          {renderExtensionIcon(item.iconType)}
                        </div>

                        <span className="truncate text-[12px]">{item.label}</span>{item.id === 'disputes' && <DisputeUnreadBadge role="admin" />}{item.id==='support'&&<SupportUnreadBadge admin/>}{(item.id === 'withdrawals' || item.id === 'admin_withdrawals') && withdrawalsCount > 0 && <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">{withdrawalsCount > 99 ? '99+' : withdrawalsCount}</span>}{item.id === 'confirm_order_by_seller' && sellerConfirmedOrdersCount > 0 && <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">{sellerConfirmedOrdersCount > 99 ? '99+' : sellerConfirmedOrdersCount}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Footer / Quick Portal Switchers */}
      <div className="p-3 border-t border-gray-200 space-y-1 text-xs bg-[#fbfbfc]">
        <button
          data-prefetch-tab="admin_settings"
          onClick={() => {
            onSelectTab('admin_settings');
            onSelectSettingsSubTab?.('store');
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            <span>Settings</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <Link
          href="/seller/dashboard"
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <StoreIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>Seller Portal</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
        <Link
          href="/"
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            <span>Online Store</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>
    </aside>
  );
}
