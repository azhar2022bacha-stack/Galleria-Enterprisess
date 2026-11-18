'use client';

import React, { useState } from 'react';
import { AdminAccountsView } from '@/components/admin/AdminAccountsView';
import { AdminSupportView } from '@/components/admin/AdminSupportView';
import { AdminWithdrawalsView } from '@/components/admin/AdminWithdrawalsView';
import { AdminInvitesView } from '@/components/admin/AdminInvitesView';
import { AdminVerificationView } from '@/components/admin/AdminVerificationView';
import { AdminReviewsView } from '@/components/admin/AdminReviewsView';
import { AdminDisputesView } from '@/components/admin/AdminDisputesView';
import { AdminHandoverView } from '@/components/admin/AdminHandoverView';
import { AdminAnalyticsView } from '@/components/admin/AdminAnalyticsView';
import { AdminShortcutsView } from '@/components/admin/AdminShortcutsView';
import { AdminLiveStreamsView } from '@/components/admin/AdminLiveStreamsView';
import { AdminPayoutsView } from '@/components/admin/AdminPayoutsView';
import { AdminSiteSettingsView } from '@/components/admin/AdminSiteSettingsView';
import { AdminStoreSettingsView } from '@/components/admin/AdminStoreSettingsView';
import { AdminWalletLedgerView } from '@/components/admin/AdminWalletLedgerView';
import { AdminReceivingAddressView } from '@/components/admin/AdminReceivingAddressView';
import { AdminRestockView } from '@/components/admin/AdminRestockView';
import { AdminRefundRequestsView } from '@/components/admin/AdminRefundRequestsView';
import { AdminMerchantLoginsView } from '@/components/admin/AdminMerchantLoginsView';
import { AdminSellerProductReviewView } from '@/components/admin/AdminSellerProductReviewView';
import { AdminShowcaseVideosView } from '@/components/admin/AdminShowcaseVideosView';
import { AdminWalletRechargesView } from '@/components/admin/AdminWalletRechargesView';
import { AdminCommissionLedgerView } from '@/components/admin/AdminCommissionLedgerView';
import { AdminAuditLogView } from '@/components/admin/AdminAuditLogView';
import {
  Tag,
  Archive,
  Users,
  Percent,
  CircleDollarSign,
  UserCheck,
  ShieldCheck,
  Store,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Download,
  AlertCircle,
  Check,
  X,
  MessageSquare,
  Key,
  CreditCard,
  Building,
  Settings,
  Globe,
  Radio,
  Video,
  ShoppingBag,
  TrendingUp,
  Sliders,
  DollarSign,
  Layers,
  Activity,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { AdminTab, SettingsSubTab } from './AdminSidebar';
import { AdminOwnersView } from './AdminOwnersView';

interface AdminOtherViewsProps {
  activeTab: string;
  settingsSubTab?: SettingsSubTab;
  notify?: (msg: string) => void;
  onOpenTodo?: () => void;
}

export function AdminOtherViews({
  activeTab,
  settingsSubTab = 'store',
  notify,
  onOpenTodo,
}: AdminOtherViewsProps) {
  // Local state for Site Settings
  const [siteName, setSiteName] = useState('Buyxoco Global Commerce');
  const [siteDomain, setSiteDomain] = useState('https://buyxoco.com');
  const [defaultCurrency, setDefaultCurrency] = useState('USD ($)');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [receivingTrc20, setReceivingTrc20] = useState('TQ3Z94dE2vLmP4KjX7bN9wYr1sA8c6vB5m');

  // Regions state matching screenshot
  const [adminRegions, setAdminRegions] = useState([
    {
      id: 'reg-1',
      name: 'United States',
      countries: 'United States, Afghanistan + 242 more',
      paymentProviders: 'System (DEFAULT)',
    },
  ]);
  const [regionSearchQuery, setRegionSearchQuery] = useState('');
  const [isCreateRegionModalOpen, setIsCreateRegionModalOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionCountries, setNewRegionCountries] = useState('');
  const [newRegionPaymentProviders, setNewRegionPaymentProviders] = useState('System (DEFAULT)');
  const [activeRegionActionId, setActiveRegionActionId] = useState<string | null>(null);
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false);

  // Tax Regions state matching screenshot
  const [adminTaxRegions, setAdminTaxRegions] = useState([
    {
      id: 'tax-reg-1',
      name: 'United States',
      flag: '🇺🇸',
      rate: '0.00%',
    },
  ]);
  const [isCreateTaxRegionModalOpen, setIsCreateTaxRegionModalOpen] = useState(false);
  const [newTaxRegionName, setNewTaxRegionName] = useState('');
  const [newTaxRegionFlag, setNewTaxRegionFlag] = useState('🇺🇸');
  const [newTaxRegionRate, setNewTaxRegionRate] = useState('0.00%');
  const [activeTaxRegionActionId, setActiveTaxRegionActionId] = useState<string | null>(null);

  // Return Reasons state matching screenshot (default empty)
  const [adminReturnReasons, setAdminReturnReasons] = useState<
    { id: string; value: string; label: string; description?: string }[]
  >([]);
  const [returnReasonSearchQuery, setReturnReasonSearchQuery] = useState('');
  const [isCreateReturnReasonModalOpen, setIsCreateReturnReasonModalOpen] = useState(false);
  const [newReturnReasonValue, setNewReturnReasonValue] = useState('');
  const [newReturnReasonLabel, setNewReturnReasonLabel] = useState('');
  const [newReturnReasonDesc, setNewReturnReasonDesc] = useState('');
  const [activeReturnReasonActionId, setActiveReturnReasonActionId] = useState<string | null>(null);

  // Refund Reasons state matching screenshot
  const [adminRefundReasons, setAdminRefundReasons] = useState([
    {
      id: 'rr-1',
      label: 'Shipping Issue',
      code: 'shipping_issue',
      description: 'Refund due to lost, delayed, or misdelivered shipment',
    },
    {
      id: 'rr-2',
      label: 'Customer Care Adjustment',
      code: 'customer_care_adjustment',
      description: 'Refund given as goodwill or compensation for inconvenience',
    },
    {
      id: 'rr-3',
      label: 'Pricing Error',
      code: 'pricing_error',
      description: 'Refund to correct an overcharge, missing discount, or incorrect price',
    },
  ]);
  const [refundReasonSearchQuery, setRefundReasonSearchQuery] = useState('');
  const [isCreateRefundReasonModalOpen, setIsCreateRefundReasonModalOpen] = useState(false);
  const [newRefundReasonLabel, setNewRefundReasonLabel] = useState('');
  const [newRefundReasonCode, setNewRefundReasonCode] = useState('');
  const [newRefundReasonDesc, setNewRefundReasonDesc] = useState('');
  const [activeRefundReasonActionId, setActiveRefundReasonActionId] = useState<string | null>(null);

  // Sales Channels state matching screenshot
  const [adminSalesChannels, setAdminSalesChannels] = useState<
    {
      id: string;
      name: string;
      description: string;
      status: 'Enabled' | 'Disabled';
      created: string;
      updated: string;
    }[]
  >([
    {
      id: 'sc-1',
      name: 'Default Sales Channel',
      description: 'Created by Medusa',
      status: 'Enabled',
      created: 'Jul 14, 2026',
      updated: 'Jul 14, 2026',
    },
  ]);
  const [salesChannelSearchQuery, setSalesChannelSearchQuery] = useState('');
  const [isCreateSalesChannelModalOpen, setIsCreateSalesChannelModalOpen] = useState(false);
  const [newSalesChannelName, setNewSalesChannelName] = useState('');
  const [newSalesChannelDesc, setNewSalesChannelDesc] = useState('');
  const [newSalesChannelEnabled, setNewSalesChannelEnabled] = useState(true);
  const [activeSalesChannelActionId, setActiveSalesChannelActionId] = useState<string | null>(null);

  // Product Types state matching screenshot (default empty)
  const [adminProductTypes, setAdminProductTypes] = useState<
    { id: string; value: string; productsCount: number }[]
  >([]);
  const [isCreateProductTypeModalOpen, setIsCreateProductTypeModalOpen] = useState(false);
  const [newProductTypeValue, setNewProductTypeValue] = useState('');
  const [activeProductTypeActionId, setActiveProductTypeActionId] = useState<string | null>(null);

  // ==========================================
  // PRODUCTS & MASTER CATALOG
  // ==========================================
  if (activeTab === 'products') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-600" />
              <span>Products &amp; Master Catalog</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage platform merchandise, variants, global stock levels, and storehouse categories.
            </p>
          </div>
          <button
            onClick={() => notify?.('New product modal opened.')}
            className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-2.5 px-4 font-normal">Product Title</th>
                <th className="py-2.5 px-3 font-normal">SKU</th>
                <th className="py-2.5 px-3 font-normal">Category</th>
                <th className="py-2.5 px-3 font-normal">Available Units</th>
                <th className="py-2.5 px-3 font-normal">B2B Base Price</th>
                <th className="py-2.5 px-4 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {[
                { title: 'Vitamin C 1000mg Premium Crystals', sku: 'VTC-1000', cat: 'Vitamins & Supplements', units: 1450, price: '$14.99' },
                { title: 'Smart Fitness GPS Tracker Pro', sku: 'FIT-GPS-09', cat: 'Electronics', units: 820, price: '$89.99' },
                { title: 'Rose & Sandalwood Eau de Parfum 100ml', sku: 'PRF-RS-100', cat: 'Beauty & Fragrance', units: 410, price: '$64.99' },
                { title: 'Designer Leather Tote Bag Midnight', sku: 'BAG-LTH-01', cat: 'Fashion', units: 195, price: '$129.99' },
              ].map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{p.title}</td>
                  <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">{p.sku}</td>
                  <td className="py-3 px-3 text-gray-600">{p.cat}</td>
                  <td className="py-3 px-3 font-semibold text-gray-800">{p.units.toLocaleString()}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900">{p.price}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // COLLECTIONS
  // ==========================================
  if (activeTab === 'collections') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Collections
          </h1>
          <button
            onClick={() => notify?.('Create Collection modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Title</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { title: 'Summer 2026 Collection', handle: 'summer-2026', products: 12, updated: 'Just now' },
                { title: 'Core Essentials', handle: 'essentials', products: 24, updated: 'Oct 20, 2026' },
                { title: 'Footwear & Activewear', handle: 'activewear', products: 8, updated: 'Oct 15, 2026' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.title}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.products} products</td>
                  <td className="py-3.5 px-4 text-right text-gray-500">{c.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 3 of 3 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // INVENTORY
  // ==========================================
  if (activeTab === 'inventory') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-600" />
          <span>Warehouse &amp; Logistics Inventory</span>
        </h1>
        <p className="text-xs text-gray-400">
          Tracking global stock allocated across central fulfillment hubs and merchant partner dropships.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Tracked SKUs</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">2,840</p>
            <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">100% in stock</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <span className="text-[10px] uppercase font-bold text-gray-400">Reserved for Outbound</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">74 units</p>
            <span className="text-xs text-gray-500 mt-0.5 block">7 unfulfilled orders</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <span className="text-[10px] uppercase font-bold text-gray-400">Low Stock Alerts</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">0</p>
            <span className="text-xs text-gray-400 mt-0.5 block">Reorders scheduled</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================
  if (activeTab === 'customers') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <span>Customers &amp; Buyer Accounts</span>
        </h1>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-2.5 px-4 font-normal">Customer Name</th>
                <th className="py-2.5 px-3 font-normal">Email</th>
                <th className="py-2.5 px-3 font-normal">Orders Placed</th>
                <th className="py-2.5 px-3 font-normal">Total Spent</th>
                <th className="py-2.5 px-4 font-normal text-right">Account Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {[
                { name: 'buy buy', email: 'buyer.buy@example.com', count: 4, spent: '$ 319.02 USD', tier: 'Verified Buyer' },
                { name: 'Eleanor Vance', email: 'eleanor@vancecorp.io', count: 12, spent: '$ 4,210.50 USD', tier: 'VIP Wholesale' },
                { name: 'David Chen', email: 'david.chen@oriental.hk', count: 7, spent: '$ 8,920.00 USD', tier: 'Enterprise Tier' },
              ].map((c, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-3 text-gray-500">{c.email}</td>
                  <td className="py-3 px-3 font-semibold text-gray-800">{c.count}</td>
                  <td className="py-3 px-3 font-bold text-gray-900">{c.spent}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      {c.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DRAFTS
  // ==========================================
  if (activeTab === 'drafts') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Draft Orders
        </h1>
        <p className="text-xs text-gray-400">
          Manually created orders awaiting customer confirmation or quote agreement.
        </p>
        <div className="py-12 text-center text-gray-400 text-xs">
          No draft orders in progress.
        </div>
      </div>
    );
  }

  // ==========================================
  // TO-DO
  // ==========================================
  if (activeTab === 'todo') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Action Center (To-do)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and action pending operational items across all merchant stores.
            </p>
          </div>
          <button
            onClick={onOpenTodo}
            className="px-4 py-2 bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold rounded-lg shadow-2xs"
          >
            Open To-do Drawer
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUDIT LOG
  // ==========================================
  if (activeTab === 'audit_log') {
    return <AdminAuditLogView />;
  }

  // ==========================================
  // ACCOUNTS
  // ==========================================
  if (activeTab === 'accounts') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-gray-600" />
          <span>Staff &amp; Administrator Accounts</span>
        </h1>
        <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-gray-900">Primary Super Admin</p>
            <p className="text-gray-500 font-mono text-[11px]">admin.op@buyxoco.com · Full Access</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            Active Now
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // CONSIGN
  // ==========================================
  if (activeTab === 'consign') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gray-600" />
              <span>Consign &amp; Settlement Guarantee</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Escrow liquidity management and advance disbursement for merchant order fulfillment.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#ef4444] text-white text-xs font-bold">
            23 pending consignments
          </span>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-xs text-rose-900 space-y-1">
          <p className="font-bold">Consignment pool status: 23 active advance guarantees totaling $14,250.00 USD.</p>
          <p className="text-rose-700">Platform ensures immediate supplier dispatch while wholesale payments clear.</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // OWNERS (SELLERS VIEW)
  // ==========================================
  if (activeTab === 'owners') {
    return <AdminOwnersView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUPPORT
  // ==========================================
  if (activeTab === 'support') {
    return <AdminSupportView notify={notify} />;
  }

  // ==========================================
  // RECHARGES
  // ==========================================
  if (activeTab === 'recharges') {
    return <AdminWalletRechargesView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // WITHDRAWALS (AUDITS)
  // ==========================================
  if (activeTab === 'withdrawals') {
    return <AdminWithdrawalsView notify={notify} />;
  }

  // ==========================================
  // INVITES
  // ==========================================
  if (activeTab === 'invites') {
    return <AdminInvitesView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VERIFICATION
  // ==========================================
  if (activeTab === 'verification') {
    return <AdminVerificationView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // REVIEWS
  // ==========================================
  if (activeTab === 'reviews') {
    return <AdminReviewsView notify={notify} />;
  }

  // ==========================================
  // DISPUTES
  // ==========================================
  if (activeTab === 'disputes') {
    return <AdminDisputesView notify={notify} />;
  }

  // ==========================================
  // HANDOVER
  // ==========================================
  if (activeTab === 'handover') {
    return <AdminHandoverView notify={notify} />;
  }

  // ==========================================
  // ANALYTICS
  // ==========================================
  if (activeTab === 'analytics') {
    return <AdminAnalyticsView />;
  }

  // ==========================================
  // SHORTCUTS
  // ==========================================
  if (activeTab === 'shortcuts') {
    return <AdminShortcutsView notify={notify} />;
  }

  // ==========================================
  // LIVE
  // ==========================================
  if (activeTab === 'live') {
    return <AdminLiveStreamsView notify={notify} />;
  }

  // ==========================================
  // PAYOUTS
  // ==========================================
  if (activeTab === 'payouts') {
    return <AdminPayoutsView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SITE SETTINGS
  // ==========================================
  if (activeTab === 'site_settings') {
    return <AdminSiteSettingsView notify={notify} />;
  }

  // ==========================================
  // WALLET LEDGER
  // ==========================================
  if (activeTab === 'wallet_ledger') {
    return <AdminWalletLedgerView notify={notify} />;
  }

  // ==========================================
  // RECEIVING ADDRESS
  // ==========================================
  if (activeTab === 'receiving_address') {
    return <AdminReceivingAddressView notify={notify} />;
  }

  // ==========================================
  // RESTOCK
  // ==========================================
  if (activeTab === 'restock') {
    return <AdminRestockView notify={notify} />;
  }

  // ==========================================
  // REFUNDS GOVERNANCE
  // ==========================================
  if (activeTab === 'refund_governance') {
    return <AdminRefundRequestsView notify={notify} />;
  }

  // ==========================================
  // LOGINS
  // ==========================================
  if (activeTab === 'logins') {
    return <AdminMerchantLoginsView notify={notify} />;
  }

  // ==========================================
  // PRODUCT REVIEW
  // ==========================================
  if (activeTab === 'product_review') {
    return <AdminSellerProductReviewView notify={notify} />;
  }

  // ==========================================
  // VIDEOS
  // ==========================================
  if (activeTab === 'videos') {
    return <AdminShowcaseVideosView notify={notify} />;
  }

  // ==========================================
  // COMMISSION LEDGER
  // ==========================================
  if (activeTab === 'commission_ledger') {
    return <AdminCommissionLedgerView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // WITHDRAWALS (CAPITAL PAYOUT CENTER)
  // ==========================================
  if (activeTab === 'admin_withdrawals') {
    return <AdminWithdrawalsView notify={notify} />;
  }


  // ==========================================
  // CATEGORIES
  // ==========================================
  if (activeTab === 'categories') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden max-w-7xl mx-auto animate-fadeIn">
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Categories
          </h1>
          <button
            onClick={() => notify?.('Create Category modal opened.')}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
          >
            Create
          </button>
        </div>
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white">
          <button className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5">
            Add filter
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 font-medium text-gray-600">Parent</th>
                <th className="py-3 px-4 font-medium text-gray-600">Products</th>
                <th className="py-3 px-4 font-medium text-right text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {[
                { name: 'Apparel', handle: 'apparel', parent: '-', count: 32, status: 'Active' },
                { name: 'Tops & T-Shirts', handle: 'tops', parent: 'Apparel', count: 18, status: 'Active' },
                { name: 'Bottoms & Pants', handle: 'bottoms', parent: 'Apparel', count: 14, status: 'Active' },
                { name: 'Electronics', handle: 'electronics', parent: '-', count: 8, status: 'Active' },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">/{c.handle}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.parent}</td>
                  <td className="py-3.5 px-4 text-gray-600">{c.count} products</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <span>1 — 4 of 4 results</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Prev</button>
            <button disabled className="text-gray-400 font-medium cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SETTINGS (WITH 13 SUB-TABS)
  // ==========================================
  if (activeTab === 'admin_settings') {
    // 1. Store (Strictly matching the uploaded screenshots)
    if (settingsSubTab === 'store') {
      return <AdminStoreSettingsView notify={notify} />;
    }

    if (settingsSubTab === 'users') {
      return <AdminAccountsView notify={notify} />;
    }

    // 3. Regions (Strictly matching the uploaded screenshot)
    if (settingsSubTab === 'regions') {
      const filteredRegions = adminRegions.filter(
        (r) =>
          r.name.toLowerCase().includes(regionSearchQuery.toLowerCase()) ||
          r.countries.toLowerCase().includes(regionSearchQuery.toLowerCase()) ||
          r.paymentProviders.toLowerCase().includes(regionSearchQuery.toLowerCase())
      );

      return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-fadeIn">
          {/* Main Regions Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-start justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Regions</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  A region is an area that you sell products in. It can cover multiple countries, and has different tax rates, providers, and currency.
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setIsCreateRegionModalOpen(true)}
                className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 ml-4"
              >
                Create
              </button>
            </div>

            {/* Filter & Search Toolbar matching screenshot */}
            <div className="px-6 py-2.5 border-t border-gray-100 flex items-center justify-between bg-white relative">
              {/* Add Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setIsRegionFilterOpen(!isRegionFilterOpen)}
                  className="px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Add filter</span>
                </button>

                {isRegionFilterOpen && (
                  <div className="absolute left-0 top-9 z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn">
                    <button
                      onClick={() => {
                        setIsRegionFilterOpen(false);
                        notify?.('Filtered by active countries');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                    >
                      Filter by Country
                    </button>
                    <button
                      onClick={() => {
                        setIsRegionFilterOpen(false);
                        notify?.('Filtered by payment provider');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                    >
                      Filter by Provider
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Search & Sort */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={regionSearchQuery}
                    onChange={(e) => setRegionSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white w-48 sm:w-56 shadow-2xs text-gray-800"
                  />
                </div>

                <button
                  onClick={() => notify?.('Sort regions')}
                  className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
                  title="Sort"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table matching screenshot */}
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-gray-100 text-gray-500 text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600">Name</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Countries</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Payment Providers</th>
                    <th className="w-12 px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredRegions.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-3.5 font-normal text-gray-700">{r.name}</td>
                      <td className="px-6 py-3.5 font-normal text-gray-700">{r.countries}</td>
                      <td className="px-6 py-3.5 font-normal text-gray-700">{r.paymentProviders}</td>
                      <td className="w-12 px-6 py-3.5 text-right relative">
                        <button
                          onClick={() => setActiveRegionActionId(activeRegionActionId === r.id ? null : r.id)}
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeRegionActionId === r.id && (
                          <div className="absolute right-6 top-10 z-30 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn text-left">
                            <button
                              onClick={() => {
                                setActiveRegionActionId(null);
                                notify?.(`Region ${r.name} settings opened`);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                            >
                              Edit region
                            </button>
                            <button
                              onClick={() => {
                                setAdminRegions(adminRegions.filter((x) => x.id !== r.id));
                                setActiveRegionActionId(null);
                                notify?.(`Region ${r.name} removed`);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                            >
                              Delete region
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRegions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">
                        No regions match "{regionSearchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching screenshot */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>1 — {filteredRegions.length} of {filteredRegions.length} results</span>
              <div className="flex items-center gap-4">
                <span>1 of 1 pages</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Prev</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Next</span>
              </div>
            </div>
          </div>

          {/* Create Region Modal */}
          {isCreateRegionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Create Region</h3>
                  <button
                    onClick={() => setIsCreateRegionModalOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Region Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Europe, North America"
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Countries</label>
                    <input
                      type="text"
                      placeholder="e.g. United Kingdom, Germany, France"
                      value={newRegionCountries}
                      onChange={(e) => setNewRegionCountries(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Payment Providers</label>
                    <input
                      type="text"
                      placeholder="System (DEFAULT)"
                      value={newRegionPaymentProviders}
                      onChange={(e) => setNewRegionPaymentProviders(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsCreateRegionModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newRegionName.trim()) return;
                      setAdminRegions([
                        ...adminRegions,
                        {
                          id: `reg-${Date.now()}`,
                          name: newRegionName.trim(),
                          countries: newRegionCountries.trim() || 'Custom Countries',
                          paymentProviders: newRegionPaymentProviders.trim() || 'System (DEFAULT)',
                        },
                      ]);
                      setNewRegionName('');
                      setNewRegionCountries('');
                      setNewRegionPaymentProviders('System (DEFAULT)');
                      setIsCreateRegionModalOpen(false);
                      notify?.(`Region "${newRegionName.trim()}" created successfully.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-black text-xs font-semibold text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 4. Tax Regions (Strictly matching the uploaded screenshot)
    if (settingsSubTab === 'tax_regions') {
      return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-fadeIn">
          {/* Main Tax Regions Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-start justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Tax Regions</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Manage what you charge your customers when they shop from different countries and regions.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {/* Sort / View button */}
                <button
                  onClick={() => notify?.('Sort tax regions')}
                  className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg shadow-2xs transition-colors"
                  title="Sort"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Create button */}
                <button
                  onClick={() => setIsCreateTaxRegionModalOpen(true)}
                  className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Content Rows */}
            <div className="border-t border-gray-100 divide-y divide-gray-100 text-xs sm:text-sm">
              {adminTaxRegions.map((tr) => (
                <div
                  key={tr.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Left: Flag and Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-gray-200/90 bg-gray-50/80 flex items-center justify-center text-base shadow-2xs shrink-0 select-none">
                      {tr.flag}
                    </div>
                    <span className="font-normal text-gray-800 text-xs sm:text-sm">{tr.name}</span>
                  </div>

                  {/* Right: Actions */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveTaxRegionActionId(activeTaxRegionActionId === tr.id ? null : tr.id)}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeTaxRegionActionId === tr.id && (
                      <div className="absolute right-0 top-8 z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn text-left">
                        <button
                          onClick={() => {
                            setActiveTaxRegionActionId(null);
                            notify?.(`Editing tax rates for ${tr.name}`);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                        >
                          Edit rates
                        </button>
                        <button
                          onClick={() => {
                            setAdminTaxRegions(adminTaxRegions.filter((x) => x.id !== tr.id));
                            setActiveTaxRegionActionId(null);
                            notify?.(`Tax region ${tr.name} deleted`);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination footer matching screenshot */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>1 — {adminTaxRegions.length} of {adminTaxRegions.length} results</span>
              <div className="flex items-center gap-4">
                <span>1 of 1 pages</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Prev</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Next</span>
              </div>
            </div>
          </div>

          {/* Create Tax Region Modal */}
          {isCreateTaxRegionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Create Tax Region</h3>
                  <button
                    onClick={() => setIsCreateTaxRegionModalOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Region / Country Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Canada, Germany, United Kingdom"
                      value={newTaxRegionName}
                      onChange={(e) => setNewTaxRegionName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Flag Emoji or Code</label>
                    <input
                      type="text"
                      placeholder="🇨🇦"
                      value={newTaxRegionFlag}
                      onChange={(e) => setNewTaxRegionFlag(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Default Tax Rate</label>
                    <input
                      type="text"
                      placeholder="0.00%"
                      value={newTaxRegionRate}
                      onChange={(e) => setNewTaxRegionRate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsCreateTaxRegionModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newTaxRegionName.trim()) return;
                      setAdminTaxRegions([
                        ...adminTaxRegions,
                        {
                          id: `tax-reg-${Date.now()}`,
                          name: newTaxRegionName.trim(),
                          flag: newTaxRegionFlag.trim() || '🌐',
                          rate: newTaxRegionRate.trim() || '0.00%',
                        },
                      ]);
                      setNewTaxRegionName('');
                      setNewTaxRegionFlag('🇺🇸');
                      setNewTaxRegionRate('0.00%');
                      setIsCreateTaxRegionModalOpen(false);
                      notify?.(`Tax Region "${newTaxRegionName.trim()}" created.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-black text-xs font-semibold text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 5. Return Reasons (Strictly matching the uploaded screenshot)
    if (settingsSubTab === 'return_reasons') {
      const filteredReturnReasons = adminReturnReasons.filter(
        (r) =>
          r.label.toLowerCase().includes(returnReasonSearchQuery.toLowerCase()) ||
          r.value.toLowerCase().includes(returnReasonSearchQuery.toLowerCase())
      );

      return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-fadeIn">
          {/* Main Return Reasons Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-start justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Return Reasons</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Manage reasons for returned items.
                </p>
              </div>

              {/* Header Right Toolbar */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {/* Sort button */}
                <button
                  onClick={() => notify?.('Sort return reasons')}
                  className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg shadow-2xs transition-colors"
                  title="Sort"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Search input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={returnReasonSearchQuery}
                    onChange={(e) => setReturnReasonSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white w-48 sm:w-56 shadow-2xs text-gray-800"
                  />
                </div>

                {/* Create button */}
                <button
                  onClick={() => setIsCreateReturnReasonModalOpen(true)}
                  className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Sub-toolbar row matching screenshot */}
            <div className="px-6 py-2.5 border-t border-gray-100 flex items-center justify-end bg-white">
              <button
                onClick={() => notify?.('Sort order')}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
                title="Sort"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Body: Empty State or Table */}
            <div className="border-t border-gray-100">
              {filteredReturnReasons.length === 0 ? (
                /* Empty state matching the screenshot */
                <div className="py-24 sm:py-32 flex items-center justify-center text-center px-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    There are no records to show
                  </p>
                </div>
              ) : (
                /* Table when records exist */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-gray-100 text-gray-500 text-xs">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-600">Value</th>
                        <th className="px-6 py-3 font-medium text-gray-600">Label</th>
                        <th className="px-6 py-3 font-medium text-gray-600">Description</th>
                        <th className="w-12 px-6 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {filteredReturnReasons.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-3.5 font-mono text-gray-700">{item.value}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-900">{item.label}</td>
                          <td className="px-6 py-3.5 text-gray-500">{item.description || '-'}</td>
                          <td className="w-12 px-6 py-3.5 text-right relative">
                            <button
                              onClick={() =>
                                setActiveReturnReasonActionId(
                                  activeReturnReasonActionId === item.id ? null : item.id
                                )
                              }
                              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              title="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeReturnReasonActionId === item.id && (
                              <div className="absolute right-6 top-10 z-30 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn text-left">
                                <button
                                  onClick={() => {
                                    setAdminReturnReasons(
                                      adminReturnReasons.filter((x) => x.id !== item.id)
                                    );
                                    setActiveReturnReasonActionId(null);
                                    notify?.(`Return reason "${item.label}" deleted`);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination footer matching screenshot */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                {filteredReturnReasons.length === 0
                  ? '0 — 0 of 0 results'
                  : `1 — ${filteredReturnReasons.length} of ${filteredReturnReasons.length} results`}
              </span>
              <div className="flex items-center gap-4">
                <span>1 of 1 pages</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Prev</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Next</span>
              </div>
            </div>
          </div>

          {/* Create Return Reason Modal */}
          {isCreateReturnReasonModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Create Return Reason</h3>
                  <button
                    onClick={() => setIsCreateReturnReasonModalOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Value (Unique Code)</label>
                    <input
                      type="text"
                      placeholder="e.g. damaged_in_transit"
                      value={newReturnReasonValue}
                      onChange={(e) => setNewReturnReasonValue(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Damaged in transit"
                      value={newReturnReasonLabel}
                      onChange={(e) => setNewReturnReasonLabel(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Description (optional)</label>
                    <input
                      type="text"
                      placeholder="Package arrived visibly damaged"
                      value={newReturnReasonDesc}
                      onChange={(e) => setNewReturnReasonDesc(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsCreateReturnReasonModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newReturnReasonValue.trim() || !newReturnReasonLabel.trim()) return;
                      setAdminReturnReasons([
                        ...adminReturnReasons,
                        {
                          id: `rr-${Date.now()}`,
                          value: newReturnReasonValue.trim().toLowerCase().replace(/\s+/g, '_'),
                          label: newReturnReasonLabel.trim(),
                          description: newReturnReasonDesc.trim(),
                        },
                      ]);
                      setNewReturnReasonValue('');
                      setNewReturnReasonLabel('');
                      setNewReturnReasonDesc('');
                      setIsCreateReturnReasonModalOpen(false);
                      notify?.(`Return reason "${newReturnReasonLabel.trim()}" created.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-black text-xs font-semibold text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 6. Refund Reasons (Strictly matching the uploaded screenshot)
    if (settingsSubTab === 'refund_reasons') {
      const filteredRefundReasons = adminRefundReasons.filter(
        (r) =>
          r.label.toLowerCase().includes(refundReasonSearchQuery.toLowerCase()) ||
          r.code.toLowerCase().includes(refundReasonSearchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(refundReasonSearchQuery.toLowerCase())
      );

      return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-fadeIn">
          {/* Main Refund Reasons Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-start justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Refund Reasons</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Manage reasons for issuing refunds.
                </p>
              </div>

              {/* Header Right Toolbar */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {/* Sort button */}
                <button
                  onClick={() => notify?.('Sort refund reasons')}
                  className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg shadow-2xs transition-colors"
                  title="Sort"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Search input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={refundReasonSearchQuery}
                    onChange={(e) => setRefundReasonSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white w-48 sm:w-56 shadow-2xs text-gray-800"
                  />
                </div>

                {/* Create button */}
                <button
                  onClick={() => setIsCreateRefundReasonModalOpen(true)}
                  className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Sub-toolbar row matching screenshot */}
            <div className="px-6 py-2.5 border-t border-gray-100 flex items-center justify-end bg-white">
              <button
                onClick={() => notify?.('Sort order')}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
                title="Sort"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Table matching screenshot */}
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-gray-100 text-gray-500 text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600">Label</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Code</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Description</th>
                    <th className="w-12 px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredRefundReasons.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-3.5 font-normal text-gray-900">{item.label}</td>
                      <td className="px-6 py-3.5 font-mono text-gray-600 text-[12.5px]">{item.code}</td>
                      <td className="px-6 py-3.5 font-normal text-gray-600">{item.description}</td>
                      <td className="w-12 px-6 py-3.5 text-right relative">
                        <button
                          onClick={() =>
                            setActiveRefundReasonActionId(
                              activeRefundReasonActionId === item.id ? null : item.id
                            )
                          }
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeRefundReasonActionId === item.id && (
                          <div className="absolute right-6 top-10 z-30 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn text-left">
                            <button
                              onClick={() => {
                                setAdminRefundReasons(
                                  adminRefundReasons.filter((x) => x.id !== item.id)
                                );
                                setActiveRefundReasonActionId(null);
                                notify?.(`Refund reason "${item.label}" deleted`);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRefundReasons.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">
                        No refund reasons match "{refundReasonSearchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching screenshot */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>1 — {filteredRefundReasons.length} of {filteredRefundReasons.length} results</span>
              <div className="flex items-center gap-4">
                <span>1 of 1 pages</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Prev</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Next</span>
              </div>
            </div>
          </div>

          {/* Create Refund Reason Modal */}
          {isCreateRefundReasonModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Create Refund Reason</h3>
                  <button
                    onClick={() => setIsCreateRefundReasonModalOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Shipping Issue"
                      value={newRefundReasonLabel}
                      onChange={(e) => setNewRefundReasonLabel(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      placeholder="e.g. shipping_issue"
                      value={newRefundReasonCode}
                      onChange={(e) => setNewRefundReasonCode(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Refund due to lost, delayed, or misdelivered shipment"
                      value={newRefundReasonDesc}
                      onChange={(e) => setNewRefundReasonDesc(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsCreateRefundReasonModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newRefundReasonLabel.trim()) return;
                      const code = (
                        newRefundReasonCode.trim() ||
                        newRefundReasonLabel.trim().toLowerCase().replace(/\s+/g, '_')
                      );
                      setAdminRefundReasons([
                        ...adminRefundReasons,
                        {
                          id: `rr-${Date.now()}`,
                          label: newRefundReasonLabel.trim(),
                          code: code,
                          description: newRefundReasonDesc.trim() || 'Refund justification',
                        },
                      ]);
                      setNewRefundReasonLabel('');
                      setNewRefundReasonCode('');
                      setNewRefundReasonDesc('');
                      setIsCreateRefundReasonModalOpen(false);
                      notify?.(`Refund reason "${newRefundReasonLabel.trim()}" created.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-black text-xs font-semibold text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 7. Sales Channels (Strictly matching the uploaded screenshot)
    if (settingsSubTab === 'sales_channels') {
      const filteredSalesChannels = adminSalesChannels.filter(
        (sc) =>
          sc.name.toLowerCase().includes(salesChannelSearchQuery.toLowerCase()) ||
          sc.description.toLowerCase().includes(salesChannelSearchQuery.toLowerCase())
      );

      return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-fadeIn">
          {/* Main Sales Channels Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-start justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Sales Channels</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Manage the online and offline channels you sell products on.
                </p>
              </div>

              {/* Header Right Toolbar matching screenshot */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {/* Filter button */}
                <button
                  onClick={() => notify?.('Filter sales channels')}
                  className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg shadow-2xs transition-colors"
                  title="Filter"
                >
                  <Filter className="w-3.5 h-3.5 stroke-[1.6]" />
                </button>

                {/* Sort button */}
                <button
                  onClick={() => notify?.('Sort sales channels')}
                  className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg shadow-2xs transition-colors"
                  title="Sort"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Search input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={salesChannelSearchQuery}
                    onChange={(e) => setSalesChannelSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white w-48 sm:w-56 shadow-2xs text-gray-800"
                  />
                </div>

                {/* Create button */}
                <button
                  onClick={() => setIsCreateSalesChannelModalOpen(true)}
                  className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Sub-toolbar row matching screenshot */}
            <div className="px-6 py-2.5 border-t border-gray-100 flex items-center justify-between bg-white">
              <button
                onClick={() => notify?.('Filter active')}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
                title="Active filter"
              >
                <Filter className="w-3.5 h-3.5 stroke-[1.6]" />
              </button>

              <button
                onClick={() => notify?.('Sort order')}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
                title="Sort"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2.5 4h8M2.5 8h5M2.5 12h3M12.5 7l-2 2-2-2M10.5 3v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Table matching screenshot */}
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-gray-100 text-gray-500 text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600">Name</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Description</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Created</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Updated</th>
                    <th className="w-12 px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredSalesChannels.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-3.5 font-normal text-gray-900">{sc.name}</td>
                      <td className="px-6 py-3.5 font-normal text-gray-600">{sc.description}</td>
                      <td className="px-6 py-3.5 text-gray-700">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-[2px] inline-block ${
                              sc.status === 'Enabled' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          ></span>
                          <span>{sc.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-normal text-gray-700">{sc.created}</td>
                      <td className="px-6 py-3.5 font-normal text-gray-700">{sc.updated}</td>
                      <td className="w-12 px-6 py-3.5 text-right relative">
                        <button
                          onClick={() =>
                            setActiveSalesChannelActionId(
                              activeSalesChannelActionId === sc.id ? null : sc.id
                            )
                          }
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeSalesChannelActionId === sc.id && (
                          <div className="absolute right-6 top-10 z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn text-left">
                            <button
                              onClick={() => {
                                setAdminSalesChannels(
                                  adminSalesChannels.map((item) =>
                                    item.id === sc.id
                                      ? {
                                          ...item,
                                          status: item.status === 'Enabled' ? 'Disabled' : 'Enabled',
                                          updated: new Date().toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          }),
                                        }
                                      : item
                                  )
                                );
                                setActiveSalesChannelActionId(null);
                                notify?.(
                                  `Sales channel ${sc.name} status changed to ${
                                    sc.status === 'Enabled' ? 'Disabled' : 'Enabled'
                                  }`
                                );
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                            >
                              {sc.status === 'Enabled' ? 'Disable' : 'Enable'} channel
                            </button>
                            <button
                              onClick={() => {
                                setAdminSalesChannels(
                                  adminSalesChannels.filter((x) => x.id !== sc.id)
                                );
                                setActiveSalesChannelActionId(null);
                                notify?.(`Sales channel "${sc.name}" deleted`);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSalesChannels.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-xs">
                        No sales channels match "{salesChannelSearchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching screenshot */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>1 — {filteredSalesChannels.length} of {filteredSalesChannels.length} results</span>
              <div className="flex items-center gap-4">
                <span>1 of 1 pages</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Prev</span>
                <span className="text-gray-400 font-medium cursor-not-allowed select-none">Next</span>
              </div>
            </div>
          </div>

          {/* Create Sales Channel Modal */}
          {isCreateSalesChannelModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Create Sales Channel</h3>
                  <button
                    onClick={() => setIsCreateSalesChannelModalOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. B2B Wholesale Portal"
                      value={newSalesChannelName}
                      onChange={(e) => setNewSalesChannelName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. For high-volume wholesale buyers"
                      value={newSalesChannelDesc}
                      onChange={(e) => setNewSalesChannelDesc(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="scEnabled"
                      checked={newSalesChannelEnabled}
                      onChange={(e) => setNewSalesChannelEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <label htmlFor="scEnabled" className="text-gray-700 font-medium cursor-pointer">
                      Enable sales channel
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsCreateSalesChannelModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newSalesChannelName.trim()) return;
                      const dateStr = new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      setAdminSalesChannels([
                        ...adminSalesChannels,
                        {
                          id: `sc-${Date.now()}`,
                          name: newSalesChannelName.trim(),
                          description: newSalesChannelDesc.trim() || 'Online storefront',
                          status: newSalesChannelEnabled ? 'Enabled' : 'Disabled',
                          created: dateStr,
                          updated: dateStr,
                        },
                      ]);
                      setNewSalesChannelName('');
                      setNewSalesChannelDesc('');
                      setNewSalesChannelEnabled(true);
                      setIsCreateSalesChannelModalOpen(false);
                      notify?.(`Sales channel "${newSalesChannelName.trim()}" created.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-black text-xs font-semibold text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 8. Product Types (Strictly matching the uploaded screenshot)
    if (settingsSubTab === 'product_types') {
      return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-fadeIn">
          {/* Main Product Types Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-start justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Product Types</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Organize your products into types.
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setIsCreateProductTypeModalOpen(true)}
                className="px-3.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 ml-4"
              >
                Create
              </button>
            </div>

            {/* Divider and Body */}
            <div className="border-t border-gray-100">
              {adminProductTypes.length === 0 ? (
                /* Empty state matching the screenshot */
                <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center px-4">
                  <AlertCircle className="w-5 h-5 text-gray-400 stroke-[1.6]" />
                  <h3 className="text-sm font-semibold text-gray-900 mt-2">No records</h3>
                  <p className="text-xs text-gray-500 mt-0.5">There are no records to show</p>
                </div>
              ) : (
                /* Table when records exist */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-gray-100 text-gray-500 text-xs">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-600">Type</th>
                        <th className="px-6 py-3 font-medium text-gray-600">Products</th>
                        <th className="w-12 px-6 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {adminProductTypes.map((pt) => (
                        <tr key={pt.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-3.5 font-medium text-gray-900">{pt.value}</td>
                          <td className="px-6 py-3.5 text-gray-500">{pt.productsCount} products</td>
                          <td className="w-12 px-6 py-3.5 text-right relative">
                            <button
                              onClick={() =>
                                setActiveProductTypeActionId(
                                  activeProductTypeActionId === pt.id ? null : pt.id
                                )
                              }
                              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              title="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeProductTypeActionId === pt.id && (
                              <div className="absolute right-6 top-10 z-30 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs animate-fadeIn text-left">
                                <button
                                  onClick={() => {
                                    setAdminProductTypes(
                                      adminProductTypes.filter((x) => x.id !== pt.id)
                                    );
                                    setActiveProductTypeActionId(null);
                                    notify?.(`Product type "${pt.value}" deleted`);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Create Product Type Modal */}
          {isCreateProductTypeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Create Product Type</h3>
                  <button
                    onClick={() => setIsCreateProductTypeModalOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Type Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apparel, Electronics, Beauty"
                      value={newProductTypeValue}
                      onChange={(e) => setNewProductTypeValue(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsCreateProductTypeModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newProductTypeValue.trim()) return;
                      setAdminProductTypes([
                        ...adminProductTypes,
                        {
                          id: `pt-${Date.now()}`,
                          value: newProductTypeValue.trim(),
                          productsCount: 0,
                        },
                      ]);
                      setNewProductTypeValue('');
                      setIsCreateProductTypeModalOpen(false);
                      notify?.(`Product type "${newProductTypeValue.trim()}" created.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-black text-xs font-semibold text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 9. Product Tags
    if (settingsSubTab === 'product_tags') {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Product Tags</h1>
              <p className="text-xs text-gray-400">Keywords and search filters associated with catalog items.</p>
            </div>
            <button onClick={() => notify?.('Add tag.')} className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs">
              Add Tag
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {['Organic', 'Fast Shipping', 'FDA Certified', 'B2B Top Seller', 'Rebate Eligible', 'Wholesale Exclusive', 'High Margin'].map((t, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full font-medium text-gray-700">#{t}</span>
            ))}
          </div>

        </div>
      );
    }

    // 10. Locations & Shipping
    if (settingsSubTab === 'locations_shipping') {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Locations &amp; Shipping</h1>
              <p className="text-xs text-gray-400">Physical fulfillment warehouses, dispatch docks, and shipping profiles.</p>
            </div>
            <button onClick={() => notify?.('Add location.')} className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs">
              Add Location
            </button>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-gray-900 block text-sm">Central Port Hub — Dock 4B Logistics Corridor</span>
            <p className="text-gray-500">Port of Export Logistics Hub, South Maritime Zone · Global Dispatch</p>
            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">Primary Fulfillment Center</span>
          </div>

        </div>
      );
    }

    // 11. Publishable API Keys
    if (settingsSubTab === 'publishable_api_keys') {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Publishable API Keys</h1>
              <p className="text-xs text-gray-400">Client-safe API keys used by storefront apps to communicate with the Medusa backend.</p>
            </div>
            <button onClick={() => notify?.('Generated new publishable key.')} className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs">
              Create Key
            </button>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-gray-900">Web Storefront Production Key</p>
              <p className="font-mono text-gray-400 text-[11px]">pk_live_01HZX8942A9B7120CX</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">Active</span>
          </div>

        </div>
      );
    }

    // 12. Secret API Keys
    if (settingsSubTab === 'secret_api_keys') {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Secret API Keys</h1>
              <p className="text-xs text-gray-400">Server-side credentials for automated ERP, webhooks, and backend services.</p>
            </div>
            <button onClick={() => notify?.('Generated new secret key.')} className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs">
              Create Secret Key
            </button>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-gray-900">ERP &amp; Automated Webhook Master Secret</p>
              <p className="font-mono text-gray-400 text-[11px]">sk_live_99BXC88412********************</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">Active</span>
          </div>

        </div>
      );
    }

    // 13. Workflows (Medusa Orchestration Workflows)
    if (settingsSubTab === 'workflows') {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Workflows</h1>
              <p className="text-xs text-gray-400">Medusa orchestration workflows governing checkout, fulfillment, and refunds.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
              4 Active Workflows
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { id: 'create-order-workflow', trigger: 'Order Placed', steps: 'Cart validation → Payment capture → Inventory reserve → Receipt dispatch', executions: '1,429 executions', status: 'Healthy' },
              { id: 'fulfillment-dispatch-workflow', trigger: 'Seller Marks Dispatched', steps: 'Courier API assignment → Tracking code generated → Buyer SMS notified', executions: '1,390 executions', status: 'Healthy' },
              { id: 'merchant-settlement-workflow', trigger: 'Order Completed', steps: 'Escrow release → Wholesaler ledger credited → Rebate commission computed', executions: '1,280 executions', status: 'Healthy' },
              { id: 'refund-governance-workflow', trigger: 'Buyer Dispute Initiated', steps: 'Policy check → Threshold validation → Merchant 48h timer', executions: '8 executions', status: 'Healthy' },
            ].map((wf, idx) => (
              <div key={idx} className="p-4 border border-gray-100 hover:border-gray-200 rounded-xl bg-white shadow-2xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-900 text-xs">{wf.id}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                    {wf.status}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">Trigger: <span className="font-semibold text-gray-700">{wf.trigger}</span> · {wf.executions}</p>
                <div className="p-2 bg-gray-50 rounded text-[11px] font-mono text-gray-600">
                  {wf.steps}
                </div>
              </div>
            ))}
          </div>

        </div>
      );
    }
  }

  // Fallback for any other tab
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn max-w-7xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight capitalize">
        {activeTab.replace('_', ' ')}
      </h1>
      <p className="text-xs text-gray-400">
        Operational workspace for {activeTab.replace('_', ' ')}.
      </p>
      <div className="py-8 text-center text-xs text-gray-400">
        All records and operational controls active and synchronized.
      </div>
    </div>
  );
}
