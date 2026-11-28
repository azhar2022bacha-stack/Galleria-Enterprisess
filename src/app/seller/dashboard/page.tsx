'use client';

import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import { SELLER_NOTIFICATIONS_CHANGED, sendSellerNotification } from '@/lib/sellerNotifications';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SupportUnreadBadge } from '@/components/support/SupportUnreadBadge';
import { DisputeUnreadBadge } from '@/components/disputes/DisputeUnreadBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getOrders,
  getWallet,
  syncApprovedRecharges,
  getShopSettings,
  hasSavedShopSettings,
  subscribeToOrders,
  subscribeToSellerProducts,
  syncConsignOrdersFromServer,
  getSellerProducts,
  saveSellerProducts,
  getCurrentPackageTier,
  cacheSellerPackage,
  SellerOrder,
} from '@/lib/sellerOrders';
import type { ShopSettings } from '@/lib/sellerOrders';
import { summarizeSellerDashboardOrders } from '@/lib/sellerDashboardMetrics';
import { DemoProduct } from '@/types/product';
import { getEligibleDemoProducts } from '@/lib/mock-products';


const formatUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;

const ViewSkeleton = () => (
  <div className="w-full h-80 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin"></div>
  </div>
);

const StorehouseCatalog = dynamic(() => import('@/components/seller/StorehouseCatalog').then((m) => m.StorehouseCatalog), { ssr: false, loading: () => <ViewSkeleton /> });
const MyProductsCatalog = dynamic(() => import('@/components/seller/MyProductsCatalog').then((m) => m.MyProductsCatalog), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerRetailListingsPanel = dynamic(() => import('@/components/seller/SellerRetailListingsPanel').then((m) => m.SellerRetailListingsPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerRetailOrdersPanel = dynamic(() => import('@/components/seller/SellerRetailOrdersPanel').then((m) => m.SellerRetailOrdersPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerOrdersPanel = dynamic(() => import('@/components/seller/SellerOrdersPanel').then((m) => m.SellerOrdersPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerOrderTrackerPanel = dynamic(() => import('@/components/seller/SellerOrderTrackerPanel').then((m) => m.SellerOrderTrackerPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerWalletPanel = dynamic(() => import('@/components/seller/SellerWalletPanel').then((m) => m.SellerWalletPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerCommissionPanel = dynamic(() => import('@/components/seller/SellerCommissionPanel').then((m) => m.SellerCommissionPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerRefundsPanel = dynamic(() => import('@/components/seller/SellerRefundsPanel').then((m) => m.SellerRefundsPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerDisputesPanel = dynamic(() => import('@/components/seller/SellerDisputesPanel').then((m) => m.SellerDisputesPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerQueriesPanel = dynamic(() => import('@/components/seller/SellerQueriesPanel').then((m) => m.SellerQueriesPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerPackagePanel = dynamic(() => import('@/components/seller/SellerPackagePanel').then((m) => m.SellerPackagePanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerNotificationsPanel = dynamic(() => import('@/components/seller/SellerNotificationsPanel').then((m) => m.SellerNotificationsPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerSupportPanel = dynamic(() => import('@/components/seller/SellerSupportPanel').then((m) => m.SellerSupportPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerVerificationPanel = dynamic(() => import('@/components/seller/SellerVerificationPanel').then((m) => m.SellerVerificationPanel), { ssr: false, loading: () => <ViewSkeleton /> });
const SellerSettingsPanel = dynamic(() => import('@/components/seller/SellerSettingsPanel').then((m) => m.SellerSettingsPanel), { ssr: false, loading: () => <ViewSkeleton /> });

const SELLER_PANEL_BY_TAB: Record<string, unknown> = {
  storehouse: StorehouseCatalog,
  my_products: MyProductsCatalog,
  retail_listings: SellerRetailListingsPanel,
  retail_orders: SellerRetailOrdersPanel,
  orders: SellerOrdersPanel,
  order_tracker: SellerOrderTrackerPanel,
  wallet: SellerWalletPanel,
  commission: SellerCommissionPanel,
  refunds: SellerRefundsPanel,
  disputes: SellerDisputesPanel,
  queries: SellerQueriesPanel,
  package: SellerPackagePanel,
  notifications: SellerNotificationsPanel,
  support: SellerSupportPanel,
  verification: SellerVerificationPanel,
  settings: SellerSettingsPanel,
};

const prefetchedSellerTabs = new Set<string>();

function prefetchSellerTab(tab: string): void {
  if (prefetchedSellerTabs.has(tab)) return;
  const component = SELLER_PANEL_BY_TAB[tab] as { preload?: () => unknown } | undefined;
  if (!component || typeof component.preload !== 'function') return;
  prefetchedSellerTabs.add(tab);
  try {
    void Promise.resolve(component.preload()).catch(() => prefetchedSellerTabs.delete(tab));
  } catch {
    prefetchedSellerTabs.delete(tab);
  }
}
import {
  AlignJustify,
  Building2,
  Columns,
  CircleDot,
  Sparkle,
  Percent,
  ArrowLeftRight,
  HelpCircle,
  Star,
  Mail,
  PhoneCall,
  Check,
  Settings,
  ExternalLink,
  ArrowLeft,
  LogOut,
  Plus,
  Bell,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  X,
  Printer,
  ChevronDown,
  Warehouse,
  Wallet,
  FileText,
  Send,
  UserCheck,
  Clock,
  Upload,
  PackageOpen,
  Inbox,
} from 'lucide-react';

// Interfaces
interface OrderItem {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerLocation: string;
  productSummary: string;
  quantityInfo: string;
  dateTime: string;
  amount: number;
  paymentStatus: 'Paid in Escrow' | 'Bank Wire Pending' | 'Released / Settled';
  fulfillmentStatus: 'Processing' | 'Dispatched' | 'Pending Confirmation' | 'Completed' | 'Disputed';
}

interface ProductItem {
  id: string;
  title: string;
  sku: string;
  category: string;
  categorySlug?: string;
  subcategory?: string;
  subcategorySlug?: string;
  pricePerKg: number;
  minOrderKg: number;
  stockBags: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image?: string;
  addedDate?: string;
}

interface QueryItem {
  id: string;
  buyerName: string;
  country: string;
  subject: string;
  product: string;
  requestedQty: string;
  date: string;
  unread: boolean;
  messages: { sender: string; time: string; text: string }[];
}


interface StorehouseProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
}

const STOREHOUSE_CATEGORIES = [
  'All categories',
  'Vitamins & Supplements',
  'Protein & Fitness',
  'Beauty & Personal Care',
  'Herbal & Wellness',
  'Electronics',
  'Fashion',
  'Beauty & Fragrance',
  'Jewelry & Watches',
  'Sports & Outdoor',
  'Home & Kitchen',
  'Tools & Home Improvement',
  'Kids & Toys',
  'Automotive',
  'Luxury & Collectibles',
];

const STOREHOUSE_PRODUCTS: StorehouseProduct[] = [
  {
    id: 'sh-1',
    title: 'Vitamin C 1000mg',
    price: 14.99,
    category: 'Vitamins & Supplements',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-2',
    title: 'Vitamin D3 5000 IU',
    price: 12.99,
    category: 'Vitamins & Supplements',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-3',
    title: 'Plant Protein Blend',
    price: 34.99,
    category: 'Protein & Fitness',
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-4',
    title: 'Creatine Monohydrate',
    price: 19.99,
    category: 'Protein & Fitness',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-5',
    title: 'Collagen Peptides',
    price: 27.99,
    category: 'Beauty & Personal Care',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-6',
    title: 'Hyaluronic Acid Serum',
    price: 21.99,
    category: 'Beauty & Personal Care',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-7',
    title: 'Biotin Gummies',
    price: 16.99,
    category: 'Herbal & Wellness',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-8',
    title: 'Ashwagandha Root',
    price: 19.99,
    category: 'Herbal & Wellness',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-9',
    title: 'Wireless ANC Headphones Pro',
    price: 149.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-10',
    title: 'Smart Fitness GPS Tracker',
    price: 89.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-11',
    title: 'Classic Pima Cotton Polo',
    price: 39.99,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-12',
    title: 'Designer Leather Tote Bag',
    price: 129.99,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-13',
    title: 'Rose & Sandalwood Eau de Parfum',
    price: 64.99,
    category: 'Beauty & Fragrance',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-14',
    title: 'Chronograph Automatic Watch',
    price: 249.99,
    category: 'Jewelry & Watches',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-15',
    title: 'Thermal Stainless Water Bottle 1L',
    price: 24.99,
    category: 'Sports & Outdoor',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sh-16',
    title: 'Espresso Artisan Coffee Maker',
    price: 79.99,
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
  },
];

export default function SellerDashboardPage() {
  const router = useRouter();

  // Navigation State - Strictly matching the 16 items
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [navigationReady, setNavigationReady] = useState(false);
  const viewingWallet = activeNav === 'wallet';
  useEffect(() => {
    let running = false;
    const sync = async () => {
      if (running || document.hidden) return;
      running = true;
      try { await syncApprovedRecharges(); } finally { running = false; }
    };
    void sync();
    const timer = window.setInterval(sync, viewingWallet ? 3000 : 30_000);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [viewingWallet]);
  const [timeRange, setTimeRange] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_week');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveNav(tab);
    }
    setNavigationReady(true);
  }, []);

  useEffect(() => {
    if (navigationReady && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeNav) {
        url.searchParams.set('tab', activeNav);
        if (url.searchParams.has('productId')) {
          url.searchParams.delete('productId');
          url.searchParams.delete('category');
        }
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeNav, navigationReady]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // FRESH CLEAN ACCOUNT DATA: ALL VALUES INITIALIZED TO ZERO / EMPTY
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('');
  const [replyText, setReplyText] = useState('');

  // Dynamic Merchant Profile (Loaded dynamically from database / active seller account)
  const [merchantProfile, setMerchantProfile] = useState<{
    fullName: string;
    shopName: string;
    email?: string;
  }>({
    fullName: 'Ansar collection',
    shopName: 'Ansar collection',
  });

  // Account Approval & KYC verification status state
  const [sellerStatus, setSellerStatus] = useState<string>('review');
  const [sellerIdStatus, setSellerIdStatus] = useState<string>('No ID uploaded');
  const [accountSuspension, setAccountSuspension] = useState<{ status: 'suspended'; reason: string; updatedAt: string } | null>(null);
  const isAccountSuspended = accountSuspension?.status === 'suspended';
  useEffect(() => {
    if (isAccountSuspended && activeNav !== 'support') setActiveNav('support');
  }, [isAccountSuspended, activeNav]);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refreshSuspension = async () => {
      if (!active || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const response = await fetch('/api/seller/account-restriction', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (active) {
          const nextSuspension = data.suspension?.status === 'suspended' ? data.suspension : null;
          setAccountSuspension((current) => current?.status === nextSuspension?.status
            && current?.reason === nextSuspension?.reason
            && current?.updatedAt === nextSuspension?.updatedAt
            ? current
            : nextSuspension);
        }
      } catch {
        // Keep the last known restriction state while temporarily offline.
      } finally {
        inFlight = false;
      }
    };
    void refreshSuspension();
    const timer = window.setInterval(() => void refreshSuspension(), 10_000);
    window.addEventListener('focus', refreshSuspension);
    document.addEventListener('visibilitychange', refreshSuspension);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshSuspension);
      document.removeEventListener('visibilitychange', refreshSuspension);
    };
  }, []);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [approvalViewed, setApprovalViewed] = useState(false);
  const [grantedFunds, setGrantedFunds] = useState(0);
  const [retailGrossSales, setRetailGrossSales] = useState(0);
  const [creditScore, setCreditScore] = useState(100);
  const [platformExposure, setPlatformExposure] = useState(0);
  const prevApprovedRef = React.useRef<boolean | null>(null);
  const currentEmailRef = React.useRef<string>('');
  const seenSellerNotificationIdsRef = React.useRef<Set<string> | null>(null);
  const productsRef = React.useRef<ProductItem[]>([]);
  const bulkProductWritesRef = React.useRef({ pending: 0, revision: 0 });

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let refreshPending = false;
    const refreshUnreadCount = async () => {
      if (!active || requestInFlight || document.visibilityState === 'hidden') return;
      let email = currentEmailRef.current;
      if (!email) {
        try {
          email = JSON.parse(localStorage.getItem('galleria_active_seller') || '{}').email || '';
        } catch {}
      }
      if (!email) return;
      requestInFlight = true;
      try {
        const response = await fetch(`/api/seller/notifications?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const notifications = Array.isArray(data.notifications) ? data.notifications : [];
        const previousIds = seenSellerNotificationIdsRef.current;
        const now = Date.now();
        const newlyUnread = notifications.filter((notification: any) => {
          if (notification.readAt) return false;
          if (previousIds) return !previousIds.has(notification.id);
          const createdAt = Date.parse(String(notification.createdAt || ''));
          return Number.isFinite(createdAt) && now - createdAt >= 0 && now - createdAt <= 5 * 60 * 1000;
        });
        if (active) {
          setUnreadNotificationCount(Number(data.unreadCount) || 0);
          const walletReturnNotification = newlyUnread.find((notification: any) =>
            String(notification.title || '').toLowerCase().includes('delivered and wallet credited')
          );
          if (walletReturnNotification) {
            const walletReturnMessage = Array.isArray(walletReturnNotification.message)
              ? walletReturnNotification.message.map((part: any) => String(part?.text || '')).join('').trim()
              : '';
            notify(walletReturnMessage || walletReturnNotification.title || 'Order delivered and wallet credited');
          } else if (newlyUnread.length === 1) {
            notify('New notification: ' + (newlyUnread[0].title || 'New seller message'));
          } else if (newlyUnread.length > 1) {
            notify(newlyUnread.length + ' new seller notifications');
          }
        }
        seenSellerNotificationIdsRef.current = new Set(
          notifications.map((notification: any) => notification.id).filter(Boolean)
        );
      } catch {} finally {
        requestInFlight = false;
        if (refreshPending) {
          refreshPending = false;
          void refreshUnreadCount();
        }
      }
    };
    const refreshAfterNotification = () => {
      if (requestInFlight) refreshPending = true;
      else void refreshUnreadCount();
    };
    void refreshUnreadCount();
    const timer = setInterval(() => { void refreshUnreadCount(); }, 30_000);
    window.addEventListener('focus', refreshUnreadCount);
    window.addEventListener(SELLER_NOTIFICATIONS_CHANGED, refreshAfterNotification);
    document.addEventListener('visibilitychange', refreshUnreadCount);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', refreshUnreadCount);
      window.removeEventListener(SELLER_NOTIFICATIONS_CHANGED, refreshAfterNotification);
      document.removeEventListener('visibilitychange', refreshUnreadCount);
    };
  }, []);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    let activeEmail = '';
    let requestInFlight = false;
    // 1. Immediate local load from localStorage / settings
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('galleria_active_seller');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.shopName || parsed.fullName)) {
            activeEmail = parsed.email || '';
            currentEmailRef.current = activeEmail;
            setMerchantProfile({
              fullName: parsed.fullName || parsed.shopName,
              shopName: hasSavedShopSettings()
                ? getShopSettings().shopName || parsed.shopName || parsed.fullName
                : parsed.shopName || parsed.fullName,
              email: parsed.email,
            });
            if (parsed.status) setSellerStatus(parsed.status.toLowerCase());
            if (parsed.idStatus) setSellerIdStatus(parsed.idStatus);
            if (parsed.accountSuspension?.status === 'suspended') setAccountSuspension(parsed.accountSuspension);

            const initialProds = getSellerProducts<ProductItem>(activeEmail);
            setProducts(initialProds);
            setAddedStorehouseIds(initialProds.map((p) => p.id));
          }
        } else {
          const s = getShopSettings();
          if (s && s.shopName) {
            setMerchantProfile({
              fullName: s.shopName,
              shopName: s.shopName,
            });
          }
          const initialProds = getSellerProducts<ProductItem>();
          setProducts(initialProds);
          setAddedStorehouseIds(initialProds.map((p) => p.id));
        }
      } catch (err) {}
    }

    // 2. Fetch authenticated seller from database & poll for admin approval
    const fetchSellerData = async () => {
      if (requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;
      try {
        const res = await fetch('/api/seller/current', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.seller) {
            const st = (data.seller.status || 'review').toLowerCase();
            const idSt = data.seller.idStatus || 'No ID uploaded';
            setSellerStatus(st);
            setSellerIdStatus(idSt);
            const nextSuspension = data.seller.accountSuspension?.status === 'suspended' ? data.seller.accountSuspension : null;
            setAccountSuspension((current) => current?.status === nextSuspension?.status
              && current?.reason === nextSuspension?.reason
              && current?.updatedAt === nextSuspension?.updatedAt
              ? current
              : nextSuspension);
            setApprovalViewed((viewed) => viewed || data.seller.approvalViewed === true);
            if (data.seller.package) cacheSellerPackage(data.seller.package.tier.id, data.seller.package.spend, data.seller.email);
            setGrantedFunds(Number(data.seller.grantedFunds) || 0);
            setRetailGrossSales(Number(data.seller.retailGrossSales) || 0);
            setCreditScore(data.seller.storeTraffic?.creditScore ?? 100);
            setPlatformExposure(Number(data.seller.storeTraffic?.exposure) || 0);

            const isNowApproved = st === 'approved' && idSt === 'Verified' && Boolean(data.seller.isApproved);
            if (prevApprovedRef.current === false && isNowApproved) {
              notify('🎉 Congratulations! Your merchant account and identity have been approved by the administrator.');
            }
            prevApprovedRef.current = isNowApproved;

            const shopSettings = getShopSettings();
            const hasCustomShopSettings = hasSavedShopSettings();
            setMerchantProfile((prev) => ({
              fullName: data.seller.fullName || data.seller.shopName || prev.fullName,
              shopName: hasCustomShopSettings
                ? shopSettings.shopName || data.seller.shopName || prev.shopName
                : data.seller.shopName || data.seller.fullName || prev.shopName,
              email: data.seller.email || prev.email,
            }));

            const finalEmail = data.seller.email || activeEmail;
            if (finalEmail) {
              currentEmailRef.current = finalEmail;
              const loadedProds = getSellerProducts<ProductItem>(finalEmail);
              if (loadedProds.length > 0 || productsRef.current.length === 0) {
                setProducts(loadedProds);
                setAddedStorehouseIds(loadedProds.map((p) => p.id));
              }
              if (data.seller.accountSuspension?.status !== 'suspended') {
                try {
                  const { pending, revision } = bulkProductWritesRef.current;
                  const savedResponse = await fetch(`/api/seller/products?email=${encodeURIComponent(finalEmail)}`, { cache: 'no-store' });
                  if (savedResponse.ok) {
                    const savedPayload = await savedResponse.json();
                    if (!pending && revision === bulkProductWritesRef.current.revision
                      && savedPayload.authoritative && Array.isArray(savedPayload.products)) {
                      const savedProducts = savedPayload.products as ProductItem[];
                      const savedIds = new Set(savedProducts.map((product) => product.id));
                      const localIds = new Set(loadedProds.map((product) => product.id));
                      const sameIds = savedIds.size === localIds.size && Array.from(localIds).every((id) => savedIds.has(id));
                      if (!sameIds) {
                        setProducts(savedProducts);
                        setAddedStorehouseIds(savedProducts.map((product) => product.id));
                        saveSellerProducts(savedProducts, finalEmail);
                      }
                    }
                  }
                } catch { /* Keep the current local catalog if the product sync is offline. */ }
              }
            }

            if (typeof window !== 'undefined') {
              localStorage.setItem(
                'galleria_active_seller',
                JSON.stringify({
                  ...data.seller,
                  status: st,
                  idStatus: idSt,
                  isApproved: isNowApproved,
                  accountSuspension: data.seller.accountSuspension || null,
                })
              );
              if (finalEmail && activeEmail !== finalEmail) {
                activeEmail = finalEmail;
                void syncApprovedRecharges();
              }
            }
          }
        }
      } catch (err) {} finally {
        requestInFlight = false;
      }
    };

    fetchSellerData();
    const pollInterval = setInterval(fetchSellerData, 30_000);
    window.addEventListener('focus', fetchSellerData);
    document.addEventListener('visibilitychange', fetchSellerData);

    const refreshShopSettings = () => {
      if (hasSavedShopSettings()) {
        const s = getShopSettings();
        if (s?.shopName) {
          setMerchantProfile((prev) => prev.shopName === s.shopName
            ? prev
            : { ...prev, shopName: s.shopName });
        }
      }
    };
    const refreshSellerProducts = () => {
      const saved = getSellerProducts<ProductItem>(currentEmailRef.current || activeEmail);
      setProducts(saved);
      setAddedStorehouseIds(saved.map((product) => product.id));
    };
    const unsub = subscribeToOrders(refreshShopSettings);
    const unsubscribeProducts = subscribeToSellerProducts(
      refreshSellerProducts,
      currentEmailRef.current || activeEmail,
    );

  return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', fetchSellerData);
      document.removeEventListener('visibilitychange', fetchSellerData);
      unsub();
      unsubscribeProducts();
    };
  }, []);

  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadShopSettings() {
      try {
        const response = await fetch('/api/seller/shop-settings', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && !controller.signal.aborted) {
          setShopSettings((saved) => saved ?? data.settings);
        }
      } catch {
        // The account name remains available if the shop profile cannot be loaded.
      }
    }
    void loadShopSettings();
    return () => controller.abort();
  }, []);

  const merchantName = shopSettings?.shopName || merchantProfile.shopName || merchantProfile.fullName || 'Ansar collection';
  const merchantInitial = (merchantName.trim().charAt(0) || 'A').toUpperCase();
  const merchantAvatar = shopSettings?.logoUrl
    ? <img src={shopSettings.logoUrl} alt="" className="h-full w-full rounded-[inherit] bg-white object-contain" />
    : merchantInitial;
  const isApproved = sellerStatus === 'approved' && sellerIdStatus === 'Verified';

  // Live orders + wallet from the shared seller order store (fed by storefront checkout and admin consign)
  const [liveOrders, setLiveOrders] = useState<SellerOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  useEffect(() => {
    const refresh = () => {
      const email = currentEmailRef.current || merchantProfile.email || '';
      setLiveOrders(getOrders(email));
      setWalletBalance(getWallet());
    };
    refresh();
    let syncInFlight = false;
    const syncOrders = () => {
      if (syncInFlight || document.visibilityState === 'hidden') return;
      const e = currentEmailRef.current || merchantProfile.email || '';
      if (!e) return;
      syncInFlight = true;
      void syncConsignOrdersFromServer(e).finally(() => { syncInFlight = false; });
    };
    syncOrders();
    const poll = setInterval(syncOrders, 15_000);
    window.addEventListener('focus', syncOrders);
    document.addEventListener('visibilitychange', syncOrders);
    const unsub = subscribeToOrders(refresh);
    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', syncOrders);
      document.removeEventListener('visibilitychange', syncOrders);
      unsub();
    };
  }, [merchantProfile.email]);
  const { flow, grossSales, estimatedProfit } = React.useMemo(() => summarizeSellerDashboardOrders(liveOrders), [liveOrders]);
  const liveAwaitingCount = flow.new;
  const liveInProgressCount = flow.confirmed + flow.pickedUp + flow.onTheWay;
  const processingStages = [
    { label: 'Confirmed', count: flow.confirmed },
    { label: 'Picked Up', count: flow.pickedUp },
    { label: 'On the Way', count: flow.onTheWay },
  ].filter(({ count }) => count > 0);

  const viewApprovalStatus = async () => {
    setActiveNav('verification');
    try {
      const response = await fetch('/api/seller/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view-approval' }),
      });
      if (!response.ok) throw new Error('Could not save approval view.');
      setApprovalViewed(true);
    } catch {
      notify('Could not save that you viewed your approval status. Please try again.');
    }
  };
  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const sellerMenuId = useDismissMenusOnOutsideClick(isMobileNavOpen, () => setIsMobileNavOpen(false));
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderItem | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);
  const notificationToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (notificationToastTimeoutRef.current) clearTimeout(notificationToastTimeoutRef.current);
  }, []);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('0.00');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/seller/logout', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Could not clear the seller session.');
    } catch {
      setIsLoggingOut(false);
      notify('Could not sign out. Please try again.');
      return;
    }

    try {
      localStorage.removeItem('galleria_active_seller');
    } finally {
      window.location.replace('/seller?mode=signin');
    }
  };
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Storehouse state
  const [selectedStorehouseCategory, setSelectedStorehouseCategory] = useState<string>('All categories');
  const [hideAdded, setHideAdded] = useState(false);
  const [addedStorehouseIds, setAddedStorehouseIds] = useState<string[]>([]);

  const [currentTier, setCurrentTier] = useState(() => getCurrentPackageTier());
  useEffect(() => {
    const refreshPackageTier = () => {
      const nextTier = getCurrentPackageTier();
      setCurrentTier((current) => current.id === nextTier.id ? current : nextTier);
    };
    refreshPackageTier();
    return subscribeToOrders(refreshPackageTier);
  }, []);
  const planLimit = currentTier.productLimit;
  const commissionRate = currentTier.rebatePercent;
  const productLimitMessage = `Limit reached: ${currentTier.name} allows up to ${planLimit} products.`;
  const remainingSlots = Math.max(0, planLimit - products.length);

  const handleAddStorehouseToShop = (item: StorehouseProduct) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === `p-${item.id}` || p.id === item.id);
      if (exists) {
        notify(`"${item.title}" is already in your My Products catalog.`);
        return prev;
      }
      if (prev.length >= planLimit) {
        notify(productLimitMessage);
        return prev;
      }
      const newProd: ProductItem = {
        id: `p-${item.id}`,
        title: item.title,
        sku: `SKU-${item.title.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        category: item.category,
        pricePerKg: item.price,
        minOrderKg: 10,
        stockBags: 100,
        status: 'In Stock',
        addedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      const updated = [newProd, ...prev];
      setAddedStorehouseIds(updated.map((p) => p.id));
      saveSellerProducts(updated, merchantProfile.email);
      notify(`Added "${item.title}" to My Products catalog! (${updated.length}/${planLimit})`);
      return updated;
    });
  };

  const handleAddDemoProductToShop = (item: DemoProduct) => {
    setProducts((prev) => {
      if (prev.some((p) => p.id === item.id)) {
        notify(`"${item.title}" is already in your My Products catalog.`);
        return prev;
      }
      if (prev.length >= planLimit) {
        notify(`${productLimitMessage} Upgrade your plan to add more.`);
        return prev;
      }
      const newProd: ProductItem = {
        id: item.id,
        title: item.title,
        sku: item.sku,
        category: item.category,
        categorySlug: item.categorySlug,
        subcategory: item.subcategory,
        subcategorySlug: item.subcategorySlug,
        pricePerKg: item.price,
        minOrderKg: item.minOrderQuantity,
        stockBags: item.stockQuantity,
        status: item.status === 'Low Stock' ? 'Low Stock' : 'In Stock',
        image: item.mainImage,
        addedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      const updated = [newProd, ...prev];
      setAddedStorehouseIds(updated.map((p) => p.id));
      saveSellerProducts(updated, currentEmailRef.current || merchantProfile.email);
      notify(`Added "${item.title}" to My Products catalog! (${updated.length}/${planLimit})`);
      return updated;
    });
  };

  const addDemoProductsToShop = async (items: DemoProduct[], append = false) => {
    const previous = productsRef.current;
    const slots = planLimit - previous.length;
    if (slots <= 0) {
      notify(productLimitMessage);
      return;
    }

    const existingIds = new Set(previous.map((product) => product.id));
    const toAdd: DemoProduct[] = [];
    for (const item of items) {
      if (existingIds.has(item.id)) continue;
      existingIds.add(item.id);
      toAdd.push(item);
      if (toAdd.length === slots) break;
    }
    if (!toAdd.length) {
      notify('All eligible products are already in your My Products catalog.');
      return;
    }

    const addedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const added: ProductItem[] = toAdd.map((item) => ({
      id: item.id,
      title: item.title,
      sku: item.sku,
      category: item.category,
      categorySlug: item.categorySlug,
      subcategory: item.subcategory,
      subcategorySlug: item.subcategorySlug,
      pricePerKg: item.price,
      minOrderKg: item.minOrderQuantity,
      stockBags: item.stockQuantity,
      status: item.status === 'Low Stock' ? 'Low Stock' : 'In Stock',
      image: item.mainImage,
      addedDate,
    }));
    const updated = append ? [...previous, ...added] : [...added, ...previous];
    const sellerEmail = currentEmailRef.current || merchantProfile.email;
    productsRef.current = updated;
    setProducts(updated);
    setAddedStorehouseIds(updated.map((item) => item.id));
    const writes = bulkProductWritesRef.current;
    writes.revision += 1;
    writes.pending += 1;
    const saved = await Promise.resolve().then(() => saveSellerProducts(updated, sellerEmail)).catch(() => false);
    writes.pending -= 1;
    if (!saved) {
      notify('Could not sync My Products to the server. Please check your connection.');
      return;
    }

    const title = `Added ${added.length} products to My Products`;
    const sent = await sendSellerNotification({
      sellerEmail,
      title,
      category: 'Products & Stock',
      tone: 'success',
      message: [{ text: `Your bulk add is complete. My Products now contains ${updated.length} of ${planLimit} products.` }],
      href: '/seller/dashboard?tab=my_products',
    });
    if (!sent) notify(title);
  };

  const handleAddMultipleDemoProductsToShop = (items: DemoProduct[]) => {
    void addDemoProductsToShop(items);
  };

  const handleAddAllDemoProductsToShop = (excludedCategorySlugs: string[] = []) => {
    const previous = productsRef.current;
    if (previous.length >= planLimit) {
      notify(productLimitMessage);
      return;
    }
    const eligible = getEligibleDemoProducts(planLimit - previous.length, previous.map((item) => item.id), excludedCategorySlugs);
    void addDemoProductsToShop(eligible, true);
  };

  const handleRemoveProductFromShop = (id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      setAddedStorehouseIds(updated.map((item) => item.id));
      saveSellerProducts(updated, currentEmailRef.current || merchantProfile.email);
      notify(`Product removed from My Products. (${updated.length}/${planLimit})`);
      return updated;
    });
  };

  const filteredStorehouseProducts = STOREHOUSE_PRODUCTS.filter((item) => {
    const matchesCategory =
      selectedStorehouseCategory === 'All categories' ||
      item.category.toLowerCase() === selectedStorehouseCategory.toLowerCase();
    const matchesHide = hideAdded ? !addedStorehouseIds.includes(item.id) : true;
    return matchesCategory && matchesHide;
  });

  // New product form
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'Cocoa Raw Materials',
    pricePerKg: '',
    minOrderKg: '',
    stockBags: '',
  });

  const notify = (msg: string) => {
    if (notificationToastTimeoutRef.current) clearTimeout(notificationToastTimeoutRef.current);
    setShowNotificationToast(msg);
    const normalizedMessage = msg.trim().toLowerCase();
    const isInsufficientBalanceWarning =
      normalizedMessage.startsWith('your wallet balance is too low') ||
      normalizedMessage.startsWith('insufficient wallet balance.');
    if (isInsufficientBalanceWarning) {
      try {
        const soundContext = new window.AudioContext();
        void soundContext.resume();
        const tone = soundContext.createOscillator();
        const volume = soundContext.createGain();
        const startAt = soundContext.currentTime;
        tone.type = 'sine';
        tone.frequency.setValueAtTime(740, startAt);
        tone.frequency.exponentialRampToValueAtTime(560, startAt + 0.18);
        volume.gain.setValueAtTime(0.0001, startAt);
        volume.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
        tone.connect(volume);
        volume.connect(soundContext.destination);
        tone.onended = () => { void soundContext.close(); };
        tone.start(startAt);
        tone.stop(startAt + 0.24);
      } catch {
        // Keep the warning visible if this browser blocks notification audio.
      }
    }
    const isWalletReturnNotification = normalizedMessage.includes('delivered and wallet credited') || (
      normalizedMessage.startsWith('order ') &&
      normalizedMessage.includes('has been delivered successfully to the buyer') &&
      normalizedMessage.includes('has been credited to your wallet')
    );
    notificationToastTimeoutRef.current = setTimeout(() => {
      setShowNotificationToast(null);
      notificationToastTimeoutRef.current = null;
    }, isWalletReturnNotification ? 12_000 : isInsufficientBalanceWarning ? 5000 : 3500);
  };

  const viewMyPublicStore = async () => {
    const storeTab = window.open('about:blank', '_blank');
    if (!storeTab) {
      notify('Allow pop-ups to open your public store in a new tab.');
      return;
    }
    storeTab.opener = null;
    try {
      const response = await fetch('/api/seller/public-store?ownerLink=1', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result?.success || !result?.store?.slug) {
        throw new Error(result?.error || 'Your public store is unavailable right now.');
      }
      storeTab.location.replace(`/stores/${result.store.slug}`);
    } catch (error) {
      storeTab.close();
      notify(error instanceof Error ? error.message : 'Your public store is unavailable right now.');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.productSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.buyerLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || ord.fulfillmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (orders.length === 0) {
      notify('No orders to export yet. Manifest is currently empty.');
      return;
    }
    const headers = 'Order Number,Buyer,Location,Product,Amount,Payment,Status\n';
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.orderNumber}","${o.buyerName}","${o.buyerLocation}","${o.productSummary}","$${o.amount}","${o.paymentStatus}","${o.fulfillmentStatus}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Galleria_AnsarCollection_Orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Wholesale orders manifest exported to CSV.');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (products.length >= planLimit) {
      notify(productLimitMessage);
      return;
    }
    const createdItem: ProductItem = {
      id: `p-${Date.now()}`,
      title: newProduct.title,
      sku: `SKU-${newProduct.title.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      category: newProduct.category,
      pricePerKg: parseFloat(newProduct.pricePerKg) || 15.0,
      minOrderKg: parseInt(newProduct.minOrderKg) || 200,
      stockBags: parseInt(newProduct.stockBags) || 50,
      status: 'In Stock',
      addedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setProducts((prev) => {
      const updated = [createdItem, ...prev];
      setAddedStorehouseIds(updated.map((p) => p.id));
      saveSellerProducts(updated, merchantProfile.email);
      notify(`New B2B product "${newProduct.title}" listed successfully! (${updated.length}/${planLimit})`);
      return updated;
    });
    setIsAddProductOpen(false);
    setNewProduct({
      title: '',
      category: 'Cocoa Raw Materials',
      pricePerKg: '',
      minOrderKg: '',
      stockBags: '',
    });
  };

  const handleSendQueryReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedQueryId) return;

    setQueries(
      queries.map((q) => {
        if (q.id === selectedQueryId) {
          return {
            ...q,
            unread: false,
            messages: [
              ...q.messages,
              {
                sender: `${merchantName} (You)`,
                time: 'Just now',
                text: replyText.trim(),
              },
            ],
          };
        }
        return q;
      })
    );
    setReplyText('');
    notify('Reply successfully sent to wholesale buyer.');
  };

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(payoutAmount) <= 0) {
      notify('Available payout balance is $0.00. No funds to withdraw.');
      setIsPayoutModalOpen(false);
      return;
    }
    setIsPayoutModalOpen(false);
    notify(`Payout of $${payoutAmount} initiated via ACH Wire to Citibank (*8821).`);
  };

  const activeQuery = queries.find((q) => q.id === selectedQueryId);

  // Sidebar items in user-requested order, without notification badges.
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: AlignJustify },
    { id: 'storehouse', label: 'Storehouse', icon: Building2 },
    { id: 'my_products', label: 'My Products', icon: Columns },
    { id: 'orders', label: 'Orders', icon: CircleDot },
    { id: 'order_tracker', label: 'Order Tracker', icon: PackageOpen },
    { id: 'wallet', label: 'Wallet & Earnings', icon: Sparkle },
    { id: 'commission', label: 'Commission History', icon: Percent },
    { id: 'refunds', label: 'Refunds', icon: ArrowLeftRight },
    { id: 'disputes', label: 'Disputes', icon: HelpCircle },
    { id: 'queries', label: 'Product Queries', icon: HelpCircle },
    { id: 'package', label: 'Package · Tier', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Mail },
    { id: 'support', label: 'Support', icon: PhoneCall },
    { id: 'verification', label: 'Verification', icon: Check },
    { id: 'settings', label: 'Shop Settings', icon: Settings },
  ];

  const effectiveActiveNav = isAccountSuspended ? 'support' : activeNav;

  if (!navigationReady) return <div className="min-h-screen bg-white" aria-busy="true" />;

  const isInsufficientBalanceToast = Boolean(
    showNotificationToast?.toLowerCase().startsWith('your wallet balance is too low') ||
    showNotificationToast?.toLowerCase().startsWith('insufficient wallet balance.')
  );
  const normalizedToastMessage = showNotificationToast?.toLowerCase() || '';
  const isWalletReturnToast = normalizedToastMessage.includes('delivered and wallet credited') || (
    normalizedToastMessage.startsWith('order ') &&
    normalizedToastMessage.includes('has been delivered successfully to the buyer') &&
    normalizedToastMessage.includes('has been credited to your wallet')
  );

  return (
    <div data-seller-layout className="min-h-screen bg-[#f4f6f9] flex text-gray-900 font-sans selection:bg-[#cca23b] selection:text-white">
      {/* Toast Notification */}
      {showNotificationToast && (
        <div className={`fixed top-5 right-5 z-50 animate-slideUp ${isWalletReturnToast ? 'left-4 right-4 sm:left-auto sm:w-[28rem]' : ''}`}>
          <div className={`flex items-center rounded-xl shadow-xl ${isWalletReturnToast ? 'w-full gap-3 border border-emerald-300 bg-[#071324] px-6 py-5 text-base font-semibold leading-6 text-white shadow-2xl ring-2 ring-emerald-300/40' : `gap-2.5 px-4 py-2.5 text-xs ${isInsufficientBalanceToast ? 'bg-gradient-to-r from-sky-50 to-blue-100 text-blue-950 border border-blue-200 shadow-[0_8px_30px_rgba(37,99,235,0.28)] ring-2 ring-blue-300/60 font-semibold' : 'bg-[#071324] text-white border border-[#cca23b]/50 font-medium'}`} `}>
            {isInsufficientBalanceToast
              ? <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
              : <CheckCircle2 className={`${isWalletReturnToast ? 'h-6 w-6 text-emerald-300' : 'w-4 h-4 text-[#cca23b]'} shrink-0`} />}
            <span>{showNotificationToast}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIDEBAR: DARK NAVY WITH GOLD ACCENTS                           */}
      {/* ============================================================== */}
      <aside data-seller-sidebar data-mobile-menu-open={isMobileNavOpen ? 'true' : 'false'} className="w-64 bg-[#071324] border-r border-[#162740] text-gray-300 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto select-none shadow-xl">
        <div>
          {/* Top Brand Header: Galleria • MERCHANT */}
          <div data-seller-brand className="p-4 border-b border-gray-800/80">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">
                  Galleria
                </span>
                <span className="w-2 h-2 rounded-full bg-[#cca23b] inline-block -mt-0.5"></span>
              </Link>
              <span className="px-2 py-0.5 rounded-full bg-[#cca23b] text-[#071324] text-[9px] font-extrabold uppercase tracking-wider">
                MERCHANT
              </span>
              <button
                type="button"
                aria-expanded={isMobileNavOpen}
                aria-controls="seller-mobile-nav"
                data-click-away-menu={isMobileNavOpen ? sellerMenuId : undefined}
                onClick={() => setIsMobileNavOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#263a55] bg-[#10213a] px-2.5 py-2 text-[10px] font-semibold text-gray-100 transition hover:bg-[#172b47] md:hidden"
              >
                {isMobileNavOpen ? <X className="h-3.5 w-3.5" /> : <AlignJustify className="h-3.5 w-3.5" />}
                <span>{isMobileNavOpen ? 'Close' : 'Menu'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isMobileNavOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Merchant Identity Profile */}
            <div data-seller-sidebar-identity className="mt-3.5 pt-3 border-t border-gray-800/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#cca23b] text-[#071324] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {merchantAvatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white truncate" title={merchantName}>
                    {merchantName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#0e2a22] border border-[#10b981]/40 text-[#10b981] text-[9.5px] font-bold shrink-0">
                    {creditScore.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 font-normal">Seller marketplace</p>
              </div>
            </div>
          </div>

          {/* Menu Items (1 to 14) */}
          <nav id="seller-mobile-nav" data-click-away-menu={isMobileNavOpen ? sellerMenuId : undefined} data-seller-nav className="p-3 space-y-1">
            <span className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2 mt-1">
              MENU NAVIGATION
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = effectiveActiveNav === item.id;
              const isRestricted = isAccountSuspended && item.id !== 'support';

              return (
                <button
                  key={item.id}
                  data-seller-nav-item={item.id}
                  disabled={isRestricted}
                  aria-disabled={isRestricted}
                  title={isRestricted ? 'This feature is unavailable while your account is suspended.' : undefined}
                  onPointerEnter={() => { if (!isRestricted) prefetchSellerTab(item.id); }}
                  onFocus={() => { if (!isRestricted) prefetchSellerTab(item.id); }}
                  onClick={() => {
                    if (isRestricted) return;
                    setActiveNav(item.id);
                    setIsMobileNavOpen(false);
                    notify(`Switched view to ${item.label}`);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left group ${
                    isActive
                      ? 'bg-[#cca23b] text-[#071324] font-bold shadow-sm'
                      : isRestricted ? 'cursor-not-allowed text-gray-600 opacity-50' : 'text-gray-300 hover:bg-[#11233b] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#071324]' : 'text-gray-400 group-hover:text-white'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'disputes' && <DisputeUnreadBadge role="seller" />}
                    {item.id === 'orders' && liveAwaitingCount > 0 && (
                      <span
                        aria-label={`${liveAwaitingCount} new orders awaiting seller confirmation`}
                        title={`${liveAwaitingCount} orders are waiting for seller confirmation`}
                        className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-[#071324] text-[#cca23b]' : 'bg-blue-600 text-white'}`}
                      >
                        {liveAwaitingCount > 99 ? '99+' : liveAwaitingCount}
                      </span>
                    )}
                    {item.id === 'support' && <SupportUnreadBadge />}
                    {item.id === 'notifications' && unreadNotificationCount > 0 && (
                      <span className={`min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.id === 'verification' && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-[#071324]/20 text-[#071324]'
                            : isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : (sellerStatus === 'pending' || sellerIdStatus === 'Pending' || sellerIdStatus === 'Pending verification')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {isApproved
                          ? 'Approved'
                          : (sellerStatus === 'pending' || sellerIdStatus === 'Pending' || sellerIdStatus === 'Pending verification')
                          ? 'In Review'
                          : 'Pending'}
                      </span>
                    )}
                    {/* Active Indicator Dot */}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#071324] shrink-0"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Menu Items */}
        <div data-seller-footer-nav data-click-away-menu={isMobileNavOpen ? sellerMenuId : undefined} className="p-3.5 border-t border-gray-800/80 space-y-1">
          <button
            disabled={isAccountSuspended}
            onClick={() => void viewMyPublicStore()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            <span>View my public store</span>
          </button>

          <button
            disabled={isAccountSuspended}
            onClick={() => router.push('/shop')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            <span>Back to shopping</span>
          </button>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-400" />
            <span>{isLoggingOut ? 'Signing out…' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT CANVAS                                            */}
      {/* ============================================================== */}
      <div data-seller-main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* ============================================================== */}
        {/* TOP HEADER: MATCHING DARK NAVY COLOR PALETTE                   */}
        {/* ============================================================== */}
        <header data-seller-dashboard-header className="bg-[#071324] border-b border-[#162740] px-3 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 sticky top-0 z-30 shadow-md">
          {accountSuspension && <div role="alert" className="order-first w-full rounded-xl border-2 border-rose-400 bg-rose-950 px-4 py-3 text-white shadow-lg">
            <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide"><ShieldCheck className="h-4 w-4 text-rose-300" />Seller account suspended</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm"><strong>Reason:</strong> {accountSuspension.reason}</p>
            <p className="mt-1 text-xs font-semibold text-emerald-200">Other seller features are disabled. Support remains available.</p>
          </div>}
          {/* Store Info Left */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-[#cca23b] text-[#071324] font-bold text-sm flex items-center justify-center shadow-sm">
              {merchantAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="max-w-full truncate font-bold text-sm text-white">
                  {merchantName}
                </span>
                {isAccountSuspended ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 shadow-xs sm:px-2.5">
                    <ShieldCheck className="w-3 h-3 text-rose-300" />
                    <span>Suspended</span>
                  </span>
                ) : isApproved ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shadow-xs sm:px-2.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Approved Merchant</span>
                  </span>
                ) : sellerStatus === 'pending' || sellerIdStatus === 'Pending' ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-xs sm:px-2.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Under Review</span>
                  </span>
                ) : sellerStatus === 'rejected' || sellerIdStatus === 'Rejected' ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 shadow-xs sm:px-2.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Verification Rejected</span>
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-[10px] font-medium flex items-center gap-1 shadow-xs sm:px-2.5">
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                    <span>Pending KYC</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Controls Right */}
          <div data-seller-header-actions className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:gap-3">
            {!isAccountSuspended && <>
            {/* Visit Storefront Button */}
            <button
              type="button"
              onClick={() => void viewMyPublicStore()}
              className="px-3 py-1.5 border border-gray-700 bg-transparent rounded-lg text-xs font-semibold text-gray-200 hover:bg-gray-800 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              <span>Visit Storefront</span>
            </button>

            {/* Add New Product Button */}
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-1.5 bg-[#cca23b] hover:bg-[#b88e28] text-[#071324] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                setActiveNav('notifications');
                notify('Navigated to Notifications center.');
              }}
              className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white border border-[#071324] text-[9px] leading-[14px] font-bold">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <div
              onClick={() => setActiveNav('settings')}
              title="Shop Settings"
              className="w-8 h-8 rounded-full bg-[#cca23b] text-[#071324] font-bold text-xs flex items-center justify-center cursor-pointer shadow-sm hover:opacity-90"
            >
              {merchantAvatar}
            </div>
            </>}
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="p-3 space-y-4 sm:p-6 sm:space-y-6">
          {/* ======================= VIEW 1: DASHBOARD (SELLER COMMAND CENTER) ======================= */}
          {effectiveActiveNav === 'dashboard' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Header Title Section: SELLER COMMAND CENTER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#2563eb] uppercase tracking-wider block">
                    SELLER COMMAND CENTER
                  </span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
                    {shopSettings?.logoUrl && (
                      <img src={shopSettings.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 bg-white object-contain" />
                    )}
                    <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-gray-900">
                      {merchantName}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e6f9f0] border border-[#a7f3d0] text-[#059669] text-xs font-semibold">
                      Credit score {creditScore.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 max-w-prose whitespace-pre-wrap break-words text-xs text-gray-500 sm:text-sm">
                    {shopSettings?.description || 'Live inventory, order movement, and sales health for your shop.'}
                  </p>
                </div>

                {/* Right Action Buttons: Manage Shop, Add Product */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveNav('settings')}
                    className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors shadow-sm"
                  >
                    Manage Shop
                  </button>
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Account Status Banner */}
              {isApproved ? (!approvalViewed && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-emerald-950">
                          Merchant Account Approved by Administrator
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Live & Verified
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800/80 mt-0.5">
                        Your identity verification has been reviewed and approved. Full access to inventory, bulk catalog distribution, and instant payouts is active.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={viewApprovalStatus}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors shadow-2xs"
                  >
                    View Status
                  </button>
                </div>
              )) : sellerStatus === 'pending' || sellerIdStatus === 'Pending' || sellerIdStatus === 'Pending verification' ? (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-amber-950">
                          Verification Documents Submitted
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                          Under Administrator Review
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/80 mt-0.5">
                        Your government ID documents are currently pending administrator review. Once verified, this account will automatically switch to approved status.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveNav('verification')}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors shadow-2xs"
                  >
                    Check Review
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-blue-50/40 to-white border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">
                          Identity Verification Required (KYC)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        To unlock full merchant selling privileges and order payouts, please upload your official photo ID (Front & Back).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveNav('verification')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors shadow-2xs"
                  >
                    Start Verification
                  </button>
                </div>
              )}

              {/* Row 1: Top 5 Metric Cards (All 5 on the same line on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1: PRODUCTS (White Background) */}
                <div
                  onClick={() => setActiveNav('my_products')}
                  className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      PRODUCTS
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100">
                      <Columns className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-gray-900 block">
                      {products.length}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {products.length} listed
                    </span>
                  </div>
                </div>

                {/* Card 2: ORDERS (White Background) */}
                <div
                  onClick={() => setActiveNav('orders')}
                  className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      ORDERS
                    </span>
                    <div className="w-7 h-7 rounded-full bg-amber-50 text-[#cca23b] flex items-center justify-center border border-[#cca23b]/30">
                      <CircleDot className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-gray-900 block">
                      {liveOrders.length}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {liveAwaitingCount} awaiting action
                    </span>
                  </div>
                </div>

                {/* Card 3: GROSS SALES (Dark Navy with Gold Trending Icon Matching Reference Image) */}
                <div className="bg-[#0c1b33] text-white border border-[#162740] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      GROSS SALES
                    </span>
                    <div className="w-7 h-7 rounded bg-[#cca23b] text-white flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-4 h-4 text-white stroke-[2.5]" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-white block tracking-tight">
                      {formatUsd(grossSales + retailGrossSales)}
                    </span>
                    <span className="text-xs text-gray-300 mt-1 block">Confirmed sales</span>
                  </div>
                </div>

                {/* Card 4: EST. PROFIT (White Background) */}
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      EST. PROFIT
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Sparkle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-gray-900 block">{formatUsd(estimatedProfit)}</span>
                    <span className="text-xs text-gray-500 mt-1 block">{commissionRate}% current package rate</span>
                  </div>
                </div>

                {/* Card 5: GRANTED FUNDS (White Background) */}
                <div
                  onClick={() => setActiveNav('wallet')}
                  className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      GRANTED FUNDS
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-gray-900 block">{formatUsd(grantedFunds)}</span>
                    <span className="text-xs text-gray-500 mt-1 block">{currentTier.name} · Platform credit</span>
                  </div>
                </div>
              </div>

              <dl className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#352066] via-[#503187] to-[#60439a] px-6 py-5 text-white shadow-sm">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 -z-10 h-52 w-52 rounded-full border border-white/15 ring-[24px] ring-white/5" />
                <div>
                  <dt className="text-sm font-semibold text-violet-100">Visitor Explorer Platform</dt>
                  <dd className="mt-2 break-words text-4xl font-bold tracking-tight tabular-nums">{platformExposure.toLocaleString()}</dd>
                </div>
              </dl>

              {/* Row 3: Order flow section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Order flow</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Flow 1: New Orders */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                    <span className="text-2xl font-bold text-[#f59e0b] block">{liveAwaitingCount}</span>
                    <span className="text-xs text-gray-600 block mt-1">New Orders</span>
                  </div>

                  {/* Flow 2: Processing */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                    <span className="text-2xl font-bold text-[#2563eb] block">{liveInProgressCount}</span>
                    <span className="text-xs text-gray-600 block mt-1">In Process</span>
                    {processingStages.length > 0 && (
                      <ul aria-label="Processing stages" className="mt-2 space-y-1 text-xs text-blue-700">
                        {processingStages.map(({ label, count }) => <li key={label}>{label} · {count}</li>)}
                      </ul>
                    )}
                  </div>

                  {/* Flow 3: Delivered */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                    <span className="text-2xl font-bold text-[#059669] block">{flow.delivered}</span>
                    <span className="text-xs text-gray-600 block mt-1">Delivered</span>
                  </div>

                  {/* Flow 4: Cancelled */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                    <span className="text-2xl font-bold text-[#64748b] block">{flow.cancelled}</span>
                    <span className="text-xs text-gray-600 block mt-1">Cancelled</span>
                  </div>
                </div>
              </div>

              {/* Row 4: 2 Columns (Last 7 Days Chart Left, Wallet & Package Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 cols: Last 7 Days Chart (Two-tone Navy & Gold matching reference image) */}
                <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Last 7 days</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Orders assigned to your shop.</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#0c1b33]"></span>
                          <span>Platform Orders</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#cca23b]"></span>
                          <span>Direct Orders</span>
                        </span>
                      </div>
                    </div>

                    {/* Dual-bar chart: Dark Navy (#0c1b33) & Gold (#cca23b) */}
                    <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 pb-2 border-b border-gray-100">
                      {[
                        { day: 'Mon', navyHeight: '48%', goldHeight: '32%' },
                        { day: 'Tue', navyHeight: '68%', goldHeight: '48%' },
                        { day: 'Wed', navyHeight: '82%', goldHeight: '54%' },
                        { day: 'Thu', navyHeight: '52%', goldHeight: '42%' },
                        { day: 'Fri', navyHeight: '96%', goldHeight: '70%' },
                        { day: 'Sat', navyHeight: '40%', goldHeight: '28%' },
                        { day: 'Sun', navyHeight: '52%', goldHeight: '40%' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        >
                          <div className="w-full flex items-end justify-center gap-1 h-full">
                            {/* Dark Navy Bar */}
                            <div
                              className="w-3.5 sm:w-4 bg-[#0c1b33] rounded-t-sm group-hover:bg-[#1a335d] transition-all shadow-sm"
                              style={{ height: item.navyHeight }}
                              title={`${item.day} Platform: ${item.navyHeight}`}
                            ></div>
                            {/* Gold Bar */}
                            <div
                              className="w-3.5 sm:w-4 bg-[#cca23b] rounded-t-sm group-hover:bg-[#deb97b] transition-all shadow-sm"
                              style={{ height: item.goldHeight }}
                              title={`${item.day} Direct: ${item.goldHeight}`}
                            ></div>
                          </div>
                          <span className="text-[11px] text-gray-500 mt-2.5 font-medium">
                            {item.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Wallet Balance & Current Package (Stacked) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card A: WALLET BALANCE */}
                  <div className="bg-[#f0fdf4] border border-emerald-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      WALLET BALANCE
                    </span>
                    <span className="text-2xl font-bold text-emerald-950 mt-1 block">{formatUsd(walletBalance)}</span>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setActiveNav('wallet')}
                        className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                      >
                        Wallet & Payments
                      </button>
                      <button
                        onClick={() => setActiveNav('orders')}
                        className="px-3.5 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Orders
                      </button>
                    </div>
                  </div>

                  {/* Card B: CURRENT PACKAGE */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        CURRENT PACKAGE
                      </span>
                      <button
                        onClick={() => setActiveNav('package')}
                        className="text-xs font-semibold text-[#2563eb] hover:underline"
                      >
                        Upgrade →
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mt-1">{currentTier.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{planLimit} product limit · {commissionRate}% rate</p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (products.length / planLimit) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Package usage {products.length === 0 ? '0%' : `${((products.length / planLimit) * 100).toFixed((products.length / planLimit) * 100 % 1 === 0 ? 0 : 1)}%`} ({products.length}/{planLimit})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= VIEW 2: PRODUCT STOREHOUSE ======================= */}
          {effectiveActiveNav === 'storehouse' && (
            <StorehouseCatalog
              remainingSlots={remainingSlots}
              planLimit={planLimit}
              packageName={currentTier.name}
              addedStorehouseIds={addedStorehouseIds}
              onAddToShop={handleAddDemoProductToShop}
              onRemoveFromShop={handleRemoveProductFromShop}
              onAddMultipleToShop={handleAddMultipleDemoProductsToShop}
              notify={notify}
            />
          )}

          {/* ======================= VIEW 3: MY PRODUCTS ======================= */}
          {effectiveActiveNav === 'my_products' && (
            <MyProductsCatalog
              onVisitStorehouse={() => setActiveNav('storehouse')}
              onAddMore={() => setActiveNav('storehouse')}
              onAddAllToShop={handleAddAllDemoProductsToShop}
              planLimit={planLimit}
              packageName={currentTier.name}
              onRemoveProduct={handleRemoveProductFromShop}
              onClearAll={() => {
                setProducts([]);
                setAddedStorehouseIds([]);
                saveSellerProducts([], currentEmailRef.current || merchantProfile.email);
                notify('All products removed from shop.');
              }}
              addedStorehouseProducts={products.map((p) => ({
                id: p.id,
                title: p.title,
                category: p.category,
                price: p.pricePerKg,
                stock: `${p.stockBags} units`,
                image: p.image,
                status: p.status,
                addedDate: p.addedDate,
              }))}
            />
          )}

          {/* ======================= VIEW 3B: RETAIL MARKETPLACE LISTINGS ======================= */}
          {effectiveActiveNav === 'retail_listings' && <SellerRetailListingsPanel />}
          {effectiveActiveNav === 'retail_orders' && <SellerRetailOrdersPanel />}

          {/* ======================= VIEW 4: ORDERS ======================= */}
          {effectiveActiveNav === 'orders' && (
            <SellerOrdersPanel
              onOpenWallet={() => setActiveNav('wallet')}
              notify={notify}
              sellerEmail={merchantProfile.email || currentEmailRef.current}
              sellerName={merchantProfile.fullName || merchantProfile.shopName}
              sellerShopName={merchantProfile.shopName}
            />
          )}

          {/* ======================= VIEW 5: ORDER TRACKER ======================= */}
          {effectiveActiveNav === 'order_tracker' && <SellerOrderTrackerPanel orders={liveOrders} />}

          {/* ======================= VIEW 6: WALLET & EARNINGS ======================= */}
          {effectiveActiveNav === 'wallet' && (
            <SellerWalletPanel
              onOpenSupport={() => setActiveNav('support')}
              notify={notify}
              productCount={products.length}
              capitalInStock={products.reduce(
                (acc, p) => acc + (p.pricePerKg * (p.stockBags || 1) || 0),
                0
              )}
            />
          )}

          {/* ======================= VIEW 6: COMMISSION HISTORY ======================= */}
          {effectiveActiveNav === 'commission' && <SellerCommissionPanel orders={liveOrders} />}

          {/* ======================= VIEW 7: REFUNDS ======================= */}
          {effectiveActiveNav === 'refunds' && <SellerRefundsPanel notify={notify} />}

          {/* ======================= VIEW 8: DISPUTES ======================= */}
          {effectiveActiveNav === 'disputes' && <SellerDisputesPanel />}

          {/* ======================= VIEW 9: PRODUCT QUERIES ======================= */}
          {effectiveActiveNav === 'queries' && <SellerQueriesPanel products={products} notify={notify} />}

          {/* ======================= VIEW 9: PACKAGE · TIER ======================= */}
          {effectiveActiveNav === 'package' && (
            <SellerPackagePanel
              sellerEmail={currentEmailRef.current || merchantProfile.email || ''}
              onOpenWallet={() => setActiveNav('wallet')}
              notify={notify}
            />
          )}

          {/* ======================= VIEW 10: NOTIFICATIONS ======================= */}
          {effectiveActiveNav === 'notifications' && <SellerNotificationsPanel notify={notify} />}

          {/* ======================= VIEW 11: SUPPORT ======================= */}
          {effectiveActiveNav === 'support' && <SellerSupportPanel notify={notify} />}

          {/* ======================= VIEW 12: VERIFICATION ======================= */}
          {effectiveActiveNav === 'verification' && <SellerVerificationPanel notify={notify} />}

          {/* ======================= VIEW 13: SHOP SETTINGS ======================= */}
          {effectiveActiveNav === 'settings' && (
            <SellerSettingsPanel
              onOpenNotifications={() => setActiveNav('notifications')}
              onShopSettingsSaved={setShopSettings}
              notify={notify}
            />
          )}
        </main>
      </div>

      {/* ======================= MODAL: ADD PRODUCT ======================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#cca23b]" />
                <span>Add New B2B Wholesale Product</span>
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. Fairtrade Organic Roasted Cocoa Mass"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cca23b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cca23b] bg-white"
                  >
                    <option value="Cocoa Raw Materials">Cocoa Raw Materials</option>
                    <option value="Single Origin Nibs">Single Origin Nibs</option>
                    <option value="Butter & Powders">Butter & Powders</option>
                    <option value="Bespoke Confectionery">Bespoke Confectionery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Price per KG ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.pricePerKg}
                    onChange={(e) => setNewProduct({ ...newProduct, pricePerKg: e.target.value })}
                    placeholder="14.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cca23b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Minimum Bulk Order (KG)
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.minOrderKg}
                    onChange={(e) => setNewProduct({ ...newProduct, minOrderKg: e.target.value })}
                    placeholder="250"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cca23b]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Warehouse Bags in Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.stockBags}
                    onChange={(e) => setNewProduct({ ...newProduct, stockBags: e.target.value })}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#cca23b]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#cca23b] hover:bg-[#b88e28] text-[#071324] font-bold rounded-lg shadow-sm"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ORDER DETAILS ======================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="font-mono font-bold text-sm text-gray-900">
                  {selectedOrderDetails.orderNumber}
                </span>
                <p className="text-[10px] text-gray-500">{selectedOrderDetails.dateTime}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                  Wholesale Buyer
                </span>
                <span className="font-bold text-gray-900 block text-sm">
                  {selectedOrderDetails.buyerName}
                </span>
                <span className="text-gray-500">{selectedOrderDetails.buyerLocation}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                  Item & Freight Manifest
                </span>
                <span className="font-semibold text-gray-800">
                  {selectedOrderDetails.productSummary}
                </span>
                <p className="text-gray-500">{selectedOrderDetails.quantityInfo}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-500 block">Total Settlement</span>
                  <span className="font-bold text-base text-gray-900">
                    ${selectedOrderDetails.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Payment Status</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedOrderDetails.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  notify(`Shipping label for ${selectedOrderDetails.orderNumber} dispatched to printer.`);
                  setSelectedOrderDetails(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill of Lading</span>
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-[#0c1b33] text-white font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: REQUEST PAYOUT ======================= */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#cca23b]" />
                <span>Request Instant Payout</span>
              </h3>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                  Payout Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Available balance: $0.00
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                  Destination Account
                </span>
                <span className="font-bold text-gray-900 block">Citibank N.A. (*8821)</span>
                <span className="text-gray-500 text-[10px]">Estimated wire arrival: 2-4 Hours</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#cca23b] text-[#071324] font-bold rounded-lg hover:bg-[#b88e28]"
                >
                  Confirm Wire Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: UPLOAD DOC ======================= */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
              <h3 className="font-bold text-sm text-gray-900">Upload Verification Document</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-500 mb-3">
              Upload your updated trade license, ISO certification, or bank verification letter.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#cca23b] cursor-pointer bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <span className="font-bold text-gray-700 block">Click to upload PDF or image</span>
              <span className="text-[10px] text-gray-400 mt-1 block">Max 15MB file size</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsDocModalOpen(false);
                  notify('Document received and queued for KYC audit.');
                }}
                className="px-4 py-1.5 bg-[#071324] text-white font-bold rounded-lg"
              >
                Submit Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
