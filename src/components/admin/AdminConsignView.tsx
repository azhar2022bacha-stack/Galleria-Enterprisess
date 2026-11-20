'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  ChevronDown,
  ShoppingBag,
  User,
  Users,
  Check,
  Package,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Truck,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import {
  CountryShopper,
  ShopperCountry,
  COUNTRY_TABS,
  COUNTRY_SHOPPERS,
  ALL_COUNTRY_SHOPPERS,
  TOTAL_SHOPPERS_COUNT,
  ShopperShippingAddress,
  generateShopperShipping,
} from '@/data/countryShoppers';
import {
  addOrderFromConsign,
  updateConsignOrderStatusInSeller,
  subscribeToOrders,
  syncConsignOrdersFromServer,
  CONSIGN_ORDERS_STORAGE_KEY,
  OrderShippingAddress,
  SellerOrderStatus,
} from '@/lib/sellerOrders';
import { AdminSellerTrackerView } from './AdminSellerTrackerView';
import { AdminConsignProductQueriesPanel } from './AdminConsignProductQueriesPanel';
import { recordAdminActivity } from '@/lib/adminAuditClient';
import { DisputeProductUnreadBadge, getDisputeProductUnreadCount, useDisputeProductUnread } from '@/components/disputes/DisputeUnreadBadge';

export interface ConsignMerchant {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  balance: number;
  productsCount?: number;
  products?: any[];
}

export interface ConsignProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  sku: string;
  stock?: string | number;
}

export type ConsignShopper = CountryShopper;

export interface ConsignOrder {
  id: string;
  auditWorkflowId?: string;
  orderNumber: string;
  shopName: string;
  merchantEmail?: string;
  itemTitle: string;
  itemCount: number;
  shopperName: string;
  shopperEmail: string;
  shippingAddress?: OrderShippingAddress;
  cost: number;
  commission: number;
  commissionRate: string;
  sellerStatus?: SellerOrderStatus;
  status:
    | 'Received · settled'
    | 'Paid · awaiting pickup'
    | 'Paid · Escrow secured'
    | 'Awaiting payment'
    | 'Awaiting pickup'
    | 'Picked up'
    | 'Picked up · transit hub'
    | 'Shipped · in transit'
    | 'Settled · Delivered'
    | 'Exception'
    | 'Overdue'
    | 'Cancelled'
    | 'Refunded';
  date: string;
  imageUrl?: string;
  refund?: { id: string; status: 'Refunded'; reason: string; createdAt: string };
  products?: { id: string; title: string; price: number; quantity?: number; image?: string; imageUrl?: string }[];
}

const CONSIGN_TRACKER_STAGES: { label: string; status: SellerOrderStatus }[] = [
  { label: 'Pending', status: 'awaiting_payment' },
  { label: 'Confirmed', status: 'confirmed' },
  { label: 'Picked Up', status: 'picked_up' },
  { label: 'On the Way', status: 'on_the_way' },
  { label: 'Delivered', status: 'delivered' },
];

const CONSIGN_TRACKER_STAGE_INDEX: Record<SellerOrderStatus, number> = {
  awaiting_payment: 0,
  confirmed: 1,
  picked_up: 2,
  on_the_way: 3,
  delivered: 4,
};

function getConsignTrackerStatus(order: ConsignOrder): SellerOrderStatus | null {
  const statusText = String(order.status || '').trim().toLowerCase();
  if (statusText.startsWith('cancelled') || statusText.startsWith('exception')) return null;
  if (order.sellerStatus) return order.sellerStatus;
  if (statusText.includes('settled') || statusText.includes('delivered')) return 'delivered';
  if (statusText.startsWith('shipped') || statusText.includes('in transit')) return 'on_the_way';
  if (statusText.startsWith('picked up')) return 'picked_up';
  if (statusText.startsWith('paid') || statusText.startsWith('awaiting pickup')) return 'confirmed';
  return 'awaiting_payment';
}

function hasSellerPaidConsignOrder(order: ConsignOrder): boolean {
  const sellerStatus = String(order.sellerStatus || '').trim().toLowerCase();
  if (sellerStatus && sellerStatus !== 'awaiting_payment') return true;

  const status = String(order.status || '').trim().toLowerCase();
  return status.startsWith('paid') ||
    status.startsWith('awaiting pickup') ||
    status.startsWith('picked up') ||
    status.startsWith('shipped') ||
    status.startsWith('received') ||
    status.startsWith('settled');
}
// Strictly real database accounts only - no mock accounts
const DB_MERCHANTS: ConsignMerchant[] = [
  {
    id: 'seller-disk-1',
    name: 'Azhar uddin',
    email: 'azhar2022bacha@gmail.com',
    balance: 0.0,
    productsCount: 300,
  },
  {
    id: 'seller-disk-2',
    name: 'Wajeed ullah',
    email: 'wajeed@gmail.com',
    balance: 0.0,
    productsCount: 300,
  },
];

const CONSIGN_CATALOG: readonly ConsignProduct[] = [];

// Zero mock orders - consign orders start clean and persist real dispatched orders
const INITIAL_CONSIGN_ORDERS: ConsignOrder[] = [];

interface AdminConsignViewProps {
  notify?: (msg: string) => void;
  initialTab?: 'consign' | 'seller_tracker' | 'product_queries';
}

export function AdminConsignView({ notify, initialTab = 'consign' }: AdminConsignViewProps) {
  const disputeProductCounts = useDisputeProductUnread('admin');
  const workflowId = useRef(`CON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`).current;
  const [activeConsignTab, setActiveConsignTab] = useState<'consign' | 'seller_tracker' | 'product_queries'>(initialTab);
  useEffect(() => {
    setActiveConsignTab(initialTab);
  }, [initialTab]);
  const previousConsignTab = useRef<string | null>(null);
  useEffect(() => {
    if (previousConsignTab.current === activeConsignTab) return;
    previousConsignTab.current = activeConsignTab;
    const tabName = activeConsignTab === 'consign' ? 'Consign order creation' : activeConsignTab === 'seller_tracker' ? 'Consign seller tracker' : 'Consign product questions';
    void recordAdminActivity({
      actionText: `Opened ${tabName}`,
      details: `Started workflow ${workflowId}.`,
      category: 'Other',
      workflowId,
      endpoint: 'Consign',
      method: 'NAVIGATE',
    });
  }, [activeConsignTab, workflowId]);
  // Screen 1: Merchant Selection - only real database accounts
  const [merchants, setMerchants] = useState<ConsignMerchant[]>(DB_MERCHANTS);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('seller-disk-1');
  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = useState(false);

  // Screen 1 (Part B): Products selection & Already Stock toggle
  const [isAlreadyStockView, setIsAlreadyStockView] = useState(false);
  const [productCategory, setProductCategory] = useState<string>('All categories');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [selectedProductsCache, setSelectedProductsCache] = useState<Record<string, ConsignProduct>>({});
  const [productPage, setProductPage] = useState(1);

  // Screen 3: Shopper selection (5 Country Sections: Pakistan, India, USA, Canada, UK)
  const [activeCountry, setActiveCountry] = useState<ShopperCountry>('Pakistan');
  const [shopperSearch, setShopperSearch] = useState('');
  const [selectedShopperIds, setSelectedShopperIds] = useState<Set<string>>(new Set(['pak-1']));
  const [shopperPage, setShopperPage] = useState(1);

  // Screen 4: Confirm & Push
  const [copiesCount, setCopiesCount] = useState<number>(1);
  const [isDispatching, setIsDispatching] = useState(false);

  // Screen 5: Consign orders table (Zero mock orders; loads persistent real dispatched orders if any)
  const [orders, setOrders] = useState<ConsignOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CONSIGN_ORDERS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return INITIAL_CONSIGN_ORDERS;
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [refundingOrderIds, setRefundingOrderIds] = useState<Set<string>>(new Set());
  const [rejectingOrderIds, setRejectingOrderIds] = useState<Set<string>>(new Set());
  const [cancellingOrderIds, setCancellingOrderIds] = useState<Set<string>>(new Set());
  const [rejectedOrderKeys, setRejectedOrderKeys] = useState<Set<string>>(new Set());

  // Read cached local products strictly scoped to a specific merchant email
  const readLocalSellerProducts = (email?: string): any[] => {
    if (typeof window === 'undefined' || !email) return [];
    try {
      const normalized = email.trim();
      for (const candidate of [normalized, normalized.toLowerCase()]) {
        const raw = localStorage.getItem(`galleria_seller_products_${candidate}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [];
  };

  // Dynamically load all registered sellers into Consign Merchants
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const ownersRes = await fetch('/api/admin/owners');
        let dynamicOwners: any[] = [];
        if (ownersRes.ok) {
          const data = await ownersRes.json();
          if (data.success && Array.isArray(data.owners)) {
            dynamicOwners = data.owners;
          }
        }

        // Process Merchants:
        if (dynamicOwners.length > 0) {
          const dynamicMerchants: ConsignMerchant[] = dynamicOwners.map((owner: any) => {
            let localProducts: any[] = owner.products || [];
            const storedLocal = readLocalSellerProducts(owner.email);
            if (storedLocal.length > 0 && (!localProducts || localProducts.length < storedLocal.length)) {
              localProducts = storedLocal;
            }
            const count = Math.max(owner.productsCount || 0, localProducts.length);
            const bal = owner.balances?.wallet ?? 0;
            return {
              id: owner.id ? String(owner.id) : `seller-${owner.email}`,
              name: owner.shopName || owner.name || owner.fullName,
              fullName: owner.fullName,
              email: owner.email,
              balance: bal,
              productsCount: count,
              products: localProducts,
            };
          });

          // Keep ONLY the real accounts present in the database (Azhar uddin, Wajeed ullah, etc.)
          setMerchants(dynamicMerchants);

          // Default select first dynamic merchant if available
          setSelectedMerchantId((prev) => {
            if (dynamicMerchants.some((m) => m.id === prev)) return prev;
            return dynamicMerchants[0]?.id || 'seller-disk-1';
          });
        }
      } catch (err) {
        console.warn('Failed to load dynamic consign merchants:', err);
      }
    };

    fetchMerchants();
    const interval = setInterval(fetchMerchants, 5000);
    window.addEventListener('focus', fetchMerchants);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchMerchants);
    };
  }, []);

  // Selected merchant object
  const selectedMerchant = useMemo(() => {
    return merchants.find((m) => m.id === selectedMerchantId) || merchants[0] || DB_MERCHANTS[0];
  }, [merchants, selectedMerchantId]);

  // If selected merchant's products are not yet loaded, auto-fetch from API or scoped local storage
  useEffect(() => {
    if (selectedMerchant?.email && (!selectedMerchant.products || selectedMerchant.products.length === 0)) {
      const localProducts = readLocalSellerProducts(selectedMerchant.email);

      if (localProducts.length > 0) {
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === selectedMerchant.id || m.email === selectedMerchant.email
              ? { ...m, products: localProducts, productsCount: localProducts.length }
              : m
          )
        );
      } else {
        fetch(`/api/seller/products?email=${encodeURIComponent(selectedMerchant.email)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.products) && d.products.length > 0) {
              setMerchants((prev) =>
                prev.map((m) =>
                  m.id === selectedMerchant.id || m.email === selectedMerchant.email
                    ? { ...m, products: d.products, productsCount: d.products.length }
                    : m
                )
              );
            }
          })
          .catch(() => {});
      }
    }
  }, [selectedMerchant?.id, selectedMerchant?.email]);

  // Products added to this seller's shop under "My Product"
  const currentMerchantProducts = useMemo<ConsignProduct[]>(() => {
    const rawList = selectedMerchant?.products || [];
    if (rawList.length > 0) {
      return rawList.map((p: any, idx: number) => ({
        id: String(p.id || `cp-${idx}`),
        name: p.title || p.name || 'Storehouse Product',
        price:
          typeof (p.price ?? p.pricePerKg) === 'number'
            ? (p.price ?? p.pricePerKg)
            : parseFloat(p.price || p.pricePerKg || '19.99') || 19.99,
        category: p.category || 'Storehouse',
        sku: p.sku || `SKU-${String(idx + 1).padStart(4, '0')}`,
        imageUrl: p.mainImage || p.image || p.imageUrl,
        stock: p.stock ?? (p.stockBags ? `${p.stockBags} units` : '100 units'),
      }));
    }
    return [];
  }, [selectedMerchant]);

  const productPageSize = 15;

  const activeProductsList = isAlreadyStockView ? currentMerchantProducts : CONSIGN_CATALOG;
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return activeProductsList.filter((prod) => {
      if (productCategory !== 'All categories' && prod.category !== productCategory) {
        return false;
      }
      return !query || prod.name.toLowerCase().includes(query) || prod.sku.toLowerCase().includes(query);
    });
  }, [activeProductsList, productCategory, productSearch]);
  const totalItemsCount = filteredProducts.length;
  const totalProductPages = Math.max(1, Math.ceil(totalItemsCount / productPageSize));

  // Generate pagination numbers sliding window (1, 2, 3, 4, 5... step by step)
  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    if (totalProductPages <= 7) {
      for (let i = 1; i <= totalProductPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Near start (pages 1 to 4): show 1, 2, 3, 4, 5, '...', totalProductPages
    if (productPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        range.push(i);
      }
      range.push('...');
      range.push(totalProductPages);
      return range;
    }

    // Near end: show 1, '...', last 5 pages
    if (productPage >= totalProductPages - 3) {
      range.push(1);
      range.push('...');
      for (let i = totalProductPages - 4; i <= totalProductPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Middle: 1, '...', productPage - 1, productPage, productPage + 1, '...', totalProductPages
    range.push(1);
    range.push('...');
    range.push(productPage - 1);
    range.push(productPage);
    range.push(productPage + 1);
    range.push('...');
    range.push(totalProductPages);
    return range;
  }, [productPage, totalProductPages]);

  const pageStart = (productPage - 1) * productPageSize;
  const displayProducts = filteredProducts.slice(pageStart, pageStart + productPageSize);

  const activeCategories = useMemo(() => {
    const names = activeProductsList.map((product) => product.category).filter(Boolean);
    return ['All categories', ...new Set(names)];
  }, [activeProductsList]);

  // Reset pagination on filter change
  useEffect(() => {
    setProductPage(1);
  }, [productCategory, productSearch, isAlreadyStockView, selectedMerchantId]);

  // Reset shopper page when switching country or search query
  useEffect(() => {
    setShopperPage(1);
  }, [activeCountry, shopperSearch]);

  // Shoppers for the active country (Pakistan 1,000, India 1,000, USA 1,000, Canada 1,000, UK 1,000)
  const activeCountryShoppers = useMemo(() => {
    return COUNTRY_SHOPPERS[activeCountry] || [];
  }, [activeCountry]);

  // Filtered Shoppers within the active country by name, email or number
  const filteredShoppers = useMemo(() => {
    if (!shopperSearch.trim()) return activeCountryShoppers;
    const q = shopperSearch.toLowerCase();
    return activeCountryShoppers.filter((sh) => {
      const matchesName = sh.name.toLowerCase().includes(q);
      const matchesEmail = sh.email.toLowerCase().includes(q);
      const matchesNum = String(sh.number).includes(q);
      return matchesName || matchesEmail || matchesNum;
    });
  }, [activeCountryShoppers, shopperSearch]);

  const SHOPPERS_PER_PAGE = 20;
  const shopperTotalPages = Math.max(1, Math.ceil(filteredShoppers.length / SHOPPERS_PER_PAGE));
  const pagedShoppers = useMemo(() => {
    const start = (shopperPage - 1) * SHOPPERS_PER_PAGE;
    return filteredShoppers.slice(start, start + SHOPPERS_PER_PAGE);
  }, [filteredShoppers, shopperPage]);

  // Generate step-by-step sliding window page buttons for shoppers (1, 2, 3, 4, 5, 6... step by step)
  const shopperPaginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    if (shopperTotalPages <= 7) {
      for (let i = 1; i <= shopperTotalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Near start (pages 1 to 4): show 1, 2, 3, 4, 5, 6, '...', shopperTotalPages
    if (shopperPage <= 4) {
      for (let i = 1; i <= Math.min(6, shopperTotalPages); i++) {
        range.push(i);
      }
      if (shopperTotalPages > 6) {
        range.push('...');
        range.push(shopperTotalPages);
      }
      return range;
    }

    // Near end: show 1, '...', last 5 pages
    if (shopperPage >= shopperTotalPages - 3) {
      range.push(1);
      range.push('...');
      for (let i = shopperTotalPages - 4; i <= shopperTotalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Middle: 1, '...', shopperPage - 1, shopperPage, shopperPage + 1, '...', shopperTotalPages
    range.push(1);
    range.push('...');
    range.push(shopperPage - 1);
    range.push(shopperPage);
    range.push(shopperPage + 1);
    range.push('...');
    range.push(shopperTotalPages);
    return range;
  }, [shopperTotalPages, shopperPage]);

  // Active selected shopper for the shipping address form
  const activeSelectedShopper = useMemo(() => {
    const firstSelectedId = Array.from(selectedShopperIds)[0];
    if (firstSelectedId) {
      const found = ALL_COUNTRY_SHOPPERS.find((s) => s.id === firstSelectedId);
      if (found) return found;
    }
    return activeCountryShoppers[0] || ALL_COUNTRY_SHOPPERS[0];
  }, [selectedShopperIds, activeCountryShoppers]);

  // Shipping form state auto-filled based on the selected country shopper
  const [shippingForm, setShippingForm] = useState<ShopperShippingAddress>(() =>
    generateShopperShipping(ALL_COUNTRY_SHOPPERS[0])
  );

  // Auto-sync shipping details whenever activeSelectedShopper changes
  useEffect(() => {
    if (activeSelectedShopper) {
      setShippingForm(generateShopperShipping(activeSelectedShopper));
    }
  }, [activeSelectedShopper]);

  const handleShippingFieldChange = (field: keyof ShopperShippingAddress, value: string) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

  // Clear product selections when changing merchant so products belong strictly to the chosen merchant
  useEffect(() => {
    setSelectedProductIds(new Set());
    setSelectedProductsCache({});
  }, [selectedMerchantId]);

  const selectedProductsList = useMemo(() => {
    const byId = new Map<string, ConsignProduct>();
    activeProductsList.forEach((p) => byId.set(p.id, p));
    currentMerchantProducts.forEach((p) => byId.set(p.id, p));
    return Array.from(selectedProductIds)
      .map((id) => byId.get(id) || selectedProductsCache[id])
      .filter((p): p is ConsignProduct => Boolean(p));
  }, [activeProductsList, currentMerchantProducts, selectedProductIds, selectedProductsCache]);

  const unitCostEach = useMemo(() => {
    if (selectedProductsList.length === 0) return 0;
    return selectedProductsList.reduce((acc, curr) => acc + curr.price, 0);
  }, [selectedProductsList]);

  const totalCalculated = useMemo(() => {
    const copies = Math.max(copiesCount, 1);
    const fallbackPrice = displayProducts[0]?.price || 0;
    const base = unitCostEach > 0 ? unitCostEach : fallbackPrice;
    return base * copies;
  }, [unitCostEach, copiesCount, displayProducts]);

  const handleSelectMerchant = (merchant: ConsignMerchant) => {
    const changed = selectedMerchantId !== merchant.id;
    setSelectedMerchantId(merchant.id);
    setIsMerchantDropdownOpen(false);
    if (changed) {
      void recordAdminActivity({
        actionText: `Step 1 · Selected ${merchant.name} as the Consign seller`,
        details: `Seller ID: ${merchant.id}${merchant.email ? `\nSeller account: ${merchant.email}` : ''}`,
        category: 'Other',
        workflowId,
        targetId: merchant.id,
        endpoint: 'Consign seller selection',
        method: 'SELECTION',
      });
    }
  };

  const handleToggleProduct = (id: string) => {
    const prod = activeProductsList.find((p) => p.id === id) || currentMerchantProducts.find((p) => p.id === id);
    const next = new Set(selectedProductIds);
    const wasSelected = next.has(id);
    if (wasSelected) {
      next.delete(id);
    } else {
      next.add(id);
      if (prod) {
        setSelectedProductsCache((prev) => ({ ...prev, [id]: prod }));
      }
    }
    setSelectedProductIds(next);
    if (prod) {
      void recordAdminActivity({
        actionText: wasSelected ? `Removed ${prod.name} from the Consign order selection` : `Step 2 · Selected ${prod.name} for a Consign order`,
        details: `Seller: ${selectedMerchant.name}\nSKU: ${prod.sku || 'not provided'}\nUnit price: $${Number(prod.price || 0).toFixed(2)}`,
        category: 'Other',
        workflowId,
        targetId: prod.id,
        endpoint: 'Consign product selection',
        method: 'SELECTION',
      });
    }
  };

  const handleSelectShopper = (id: string) => {
    // Single select: automatically deselects previous shopper and selects new shopper
    setSelectedShopperIds(new Set([id]));
    const found = ALL_COUNTRY_SHOPPERS.find((s) => s.id === id);
    if (found) {
      notify?.(`Selected #${found.number} ${found.name} (${found.country})`);
      void recordAdminActivity({
        actionText: `Step 3 · Assigned ${found.name} to the Consign order`,
        details: `Shopper ID: ${found.id}\nCountry: ${found.country}\nSeller: ${selectedMerchant.name}`,
        category: 'Other',
        workflowId,
        targetId: found.id,
        endpoint: 'Consign shopper assignment',
        method: 'ASSIGN',
      });
    }
  };

  const handleDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);

      const targetShoppers = [activeSelectedShopper];

      const productsToOrder = (
        selectedProductsList.length > 0
          ? selectedProductsList
          : displayProducts[0]
          ? [displayProducts[0]]
          : isAlreadyStockView && currentMerchantProducts[0]
          ? [currentMerchantProducts[0]]
          : []
      ).filter(Boolean);

      if (productsToOrder.length === 0) {
        void recordAdminActivity({
          actionText: 'Tried to dispatch a Consign order without a product',
          details: `Seller: ${selectedMerchant.name}\nShopper: ${activeSelectedShopper?.name || 'not selected'}\nThe order was not created because no product was selected.`,
          category: 'Other',
          workflowId,
          targetId: selectedMerchant.id,
          endpoint: 'Consign dispatch',
          method: 'ACTION',
          status: 400,
          success: false,
        });
        notify?.('Please select at least one product before dispatching.');
        return;
      }

      const orderProducts = productsToOrder.map((p) => ({
        id: p.id,
        title: p.name,
        quantity: copiesCount || 1,
        price: p.price,
        image: p.imageUrl,
      }));

      const effectiveUnitCost = productsToOrder.reduce((acc, curr) => acc + (curr.price || 0), 0);
      const perShopperCost = Number((effectiveUnitCost * (copiesCount || 1)).toFixed(2));
      const createdConsignOrders: ConsignOrder[] = [];
      const createdAtIso = new Date().toISOString();

      targetShoppers.forEach((shopper, idx) => {
        const orderId = `co_${Date.now()}_${idx}`;
        const orderNum = Math.random().toString(16).substring(2, 14);

        const rawShipping =
          targetShoppers.length === 1 && activeSelectedShopper?.id === shopper.id
            ? shippingForm
            : generateShopperShipping(shopper);

        const shopperShipping: OrderShippingAddress = {
          recipient: rawShipping.recipient,
          phone: rawShipping.phone,
          email: rawShipping.email,
          street: rawShipping.street,
          apt: rawShipping.apt,
          city: rawShipping.city,
          state: rawShipping.state,
          postalCode: rawShipping.postalCode,
          countryCode: rawShipping.countryCode,
          country: shopper.country,
        };

        const newOrder: ConsignOrder = {
          id: orderId,
          auditWorkflowId: workflowId,
          orderNumber: orderNum,
          shopName: selectedMerchant.name,
          merchantEmail: selectedMerchant.email,
          itemTitle: productsToOrder.map((p) => p.name).join(', ') || 'Consign Product',
          itemCount: productsToOrder.length,
          shopperName: shopperShipping.recipient,
          shopperEmail: shopperShipping.email,
          shippingAddress: shopperShipping,
          cost: effectiveUnitCost,
          commission: Number((effectiveUnitCost * 0.25).toFixed(2)),
          commissionRate: '25%',
          status: 'Awaiting payment',
          date: 'Just now',
          products: orderProducts,
        };

        createdConsignOrders.push(newOrder);

        // Dynamically push to the EXACT selected merchant's registered Seller Account Orders
        addOrderFromConsign({
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          shopName: selectedMerchant.name,
          merchantEmail: selectedMerchant.email,
          shopperName: shopperShipping.recipient,
          shopperEmail: shopperShipping.email,
          shippingAddress: shopperShipping,
          products: orderProducts,
          amount: perShopperCost,
          paymentMethod: 'Consign Escrow',
          status: 'awaiting_payment',
          createdAt: createdAtIso,
        });
      });

      const totalDispatched = perShopperCost * targetShoppers.length;
      const auditContext = {
        action: 'dispatch',
        workflowId,
        merchantName: selectedMerchant.name,
        products: productsToOrder.map((product) => ({
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: copiesCount || 1,
        })),
        shoppers: targetShoppers.map((shopper, index) => ({
          id: shopper.id,
          name: createdConsignOrders[index]?.shopperName || shopper.name,
          country: shopper.country,
        })),
        totalCost: totalDispatched,
      };

      setOrders((prev) => {
        const next = [...createdConsignOrders, ...prev];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CONSIGN_ORDERS_STORAGE_KEY, JSON.stringify(next));
          } catch {}
        }
        return next;
      });

      // Persist dispatched consign orders on server for cross-browser / separate session sync
      fetch('/api/consign/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditContext,
          orders: createdConsignOrders.map((co) => ({
            ...co,
            amount: perShopperCost,
            sellerStatus: 'awaiting_payment',
            createdAt: createdAtIso,
          })),
        }),
      }).catch(() => {});

      notify?.(
        `Dispatched ${createdConsignOrders.length} order(s) to ${selectedMerchant.name}! Total: $${totalDispatched.toFixed(2)}`
      );
    }, 600);
  };

  // Filtered Orders for Screen 4
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const refunded = Boolean(ord.refund) || ord.status === 'Refunded';
      if (
        orderStatusFilter === 'Refunded'
          ? !refunded
          : orderStatusFilter !== 'All' && (refunded || !ord.status.startsWith(orderStatusFilter))
      ) {
        return false;
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matches =
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.shopName.toLowerCase().includes(q) ||
          ord.shopperName.toLowerCase().includes(q) ||
          ord.shopperEmail.toLowerCase().includes(q) ||
          ord.itemTitle.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Dynamic counts calculated directly from real orders - no hardcoded mock counts
  const statusTabCounts = useMemo(() => {
    return {
      all: orders.length,
      refunded: orders.filter((o) => o.refund || o.status === 'Refunded').length,
      awaitingPayment: orders.filter((o) => o.status.startsWith('Awaiting payment')).length,
      awaitingPickup: orders.filter((o) => o.status.startsWith('Awaiting pickup')).length,
      pickedUp: orders.filter((o) => o.status.startsWith('Picked up')).length,
      shipped: orders.filter((o) => o.status.startsWith('Shipped')).length,
      received: orders.filter((o) => o.status.startsWith('Received')).length,
      exception: orders.filter((o) => o.status.startsWith('Exception')).length,
      overdue: orders.filter((o) => o.status.startsWith('Overdue')).length,
      cancelled: orders.filter((o) => o.status.startsWith('Cancelled')).length,
    };
  }, [orders]);

  const updateConsignOrderStatus = async (
    orderId: string,
    consignStatus: ConsignOrder['status'],
    sellerStatus: SellerOrderStatus | null,
    toastMessage: string
  ) => {
    const trackedOrder = orders.find((order) => order.id === orderId);
    const orderNumber = trackedOrder?.orderNumber || orderId;
    const auditContext = {
      workflowId: trackedOrder?.auditWorkflowId || workflowId,
      orderNumber,
      merchantName: trackedOrder?.shopName || selectedMerchant.name,
      shopperName: trackedOrder?.shopperName || activeSelectedShopper?.name || '',
      previousStatus: trackedOrder?.status || '',
      nextStatus: consignStatus,
    };
    const readConsignResponse = async (response: Response) => {
      const body = await response.text();
      try {
        return body ? JSON.parse(body) : null;
      } catch {
        throw new Error('The Consign service returned an invalid response (HTTP ' + response.status + '). Refresh the Admin page and try again.');
      }
    };

    const patchStatus = () => fetch('/api/consign/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: orderId,
        status: consignStatus,
        actor: 'admin',
        auditContext,
        ...(sellerStatus ? { sellerStatus } : {}),
      }),
    });

    try {
      let response = await patchStatus();
      let data = await readConsignResponse(response);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'The order status could not be saved. Please try again.');
      }

      if (!data.order) {
        const localOrder = orders.find((order) => order.id === orderId);
        if (!localOrder) {
          throw new Error('This order is not available in the current Consign list. Refresh the page and try again.');
        }

        const originalSellerStatus = localOrder.sellerStatus || getConsignTrackerStatus(localOrder) || 'awaiting_payment';
        const saveResponse = await fetch('/api/consign/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orders: [{ ...localOrder, sellerStatus: originalSellerStatus }],
          }),
        });
        const saveData = await readConsignResponse(saveResponse);
        const savedOrder = Array.isArray(saveData?.orders)
          ? saveData.orders.find((order: ConsignOrder) => order.id === orderId)
          : null;
        if (!saveResponse.ok || !saveData?.success || !savedOrder) {
          throw new Error(saveData?.error || 'The order could not be saved before its status update. Please try again.');
        }

        response = await patchStatus();
        data = await readConsignResponse(response);
        if (!response.ok || !data?.success || !data?.order) {
          throw new Error(data?.error || 'The order status could not be saved. Please try again.');
        }
      }

      const persistedOrder = data.order;
      const nextSellerStatus = sellerStatus || persistedOrder.sellerStatus || undefined;
      const updated = orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: persistedOrder.status || consignStatus,
              ...(nextSellerStatus ? { sellerStatus: nextSellerStatus } : {}),
            }
          : order
      );
      setOrders(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CONSIGN_ORDERS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      if (nextSellerStatus) updateConsignOrderStatusInSeller(orderId, nextSellerStatus);
      notify?.(toastMessage);
    } catch (error) {
      notify?.(error instanceof Error ? error.message : 'The order status could not be saved. Please try again.');
    }
  };

  const handleMarkPickedUp = (orderId: string) =>
    updateConsignOrderStatus(orderId, 'Picked up', 'picked_up', 'Order marked as picked up.');

  const handleMarkShipped = (orderId: string) =>
    updateConsignOrderStatus(orderId, 'Shipped · in transit', 'on_the_way', 'Order marked as on the way.');

  const handleMarkDelivered = (orderId: string) =>
    updateConsignOrderStatus(orderId, 'Received · settled', 'delivered', 'Order marked as delivered.');

  const handleRefundConsignOrder = async (orderId: string) => {
    const target = orders.find((order) => order.id === orderId);
    if (!target || target.refund || target.status === 'Refunded' || rejectedOrderKeys.has(orderId)) return;
    if (!hasSellerPaidConsignOrder(target)) {
      notify?.(`Order #${target.orderNumber} can only be refunded after the seller has paid.`);
      return;
    }

    setRefundingOrderIds((current) => new Set(current).add(orderId));
    const refundAuditContext = {
      workflowId: target.auditWorkflowId || workflowId,
      orderNumber: target.orderNumber,
      merchantName: target.shopName,
      shopperName: target.shopperName,
    };
    try {
      const requestRefund = () => fetch('/api/consign/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, auditContext: refundAuditContext }),
      });
      let response = await requestRefund();
      let data = await response.json().catch(() => null);
      if (response.status === 404) {
        const saveResponse = await fetch('/api/consign/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: [target] }),
        });
        const saveData = await saveResponse.json().catch(() => null);
        if (!saveResponse.ok || !saveData?.success) {
          throw new Error(saveData?.error || 'The Consign order could not be saved before refunding.');
        }
        response = await requestRefund();
        data = await response.json().catch(() => null);
      }
      if (!response.ok || !data?.success || !data.order || !data.refund) {
        throw new Error(data?.error || 'The refund could not be saved. Please try again.');
      }

      const updated = orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'Refunded' as const,
              refund: data.order.refund,
            }
          : order
      );
      setOrders(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CONSIGN_ORDERS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      notify?.(`Order #${target.orderNumber} was refunded and added to the seller's Refunds menu.`);
    } catch (error) {
      notify?.(error instanceof Error ? error.message : 'The refund could not be saved. Please try again.');
    } finally {
      setRefundingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleRejectConsignOrder = async (orderId: string) => {
    const target = orders.find((order) => order.id === orderId);
    if (!target || target.refund || target.status === 'Refunded' || rejectedOrderKeys.has(orderId)) return;

    setRejectingOrderIds((current) => new Set(current).add(orderId));
    const normalizeOrderNumber = (value: unknown) => String(value || '').trim().replace(/^#/, '').toLowerCase();
    try {
      const listResponse = await fetch('/api/consign/disputes', { cache: 'no-store' });
      const listData = await listResponse.json().catch(() => null);
      if (!listResponse.ok || !listData?.success) {
        throw new Error(listData?.error || 'Unable to load the order dispute. Please try again.');
      }

      const existing = (Array.isArray(listData.disputes) ? listData.disputes : []).find((dispute: any) =>
        String(dispute.orderId || '') === target.id ||
        normalizeOrderNumber(dispute.orderNumber) === normalizeOrderNumber(target.orderNumber)
      );
      if (existing?.status === 'refunded') throw new Error('This order has already been refunded.');

      const disputeId = String(existing?.id || `consign-${target.id}`);
      const syncResponse = await fetch('/api/consign/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          disputes: [{
            id: disputeId,
            orderId: target.id,
            orderNumber: target.orderNumber,
            productName: target.itemTitle,
            shop: target.shopName,
            sellerEmail: target.merchantEmail,
            reason: 'Consign order rejected by an administrator.',
            amount: `$${Number(target.cost || 0).toFixed(2)}`,
            openedAt: new Date().toISOString(),
            status: 'rejected',
            messages: [],
          }],
        }),
      });
      const syncData = await syncResponse.json().catch(() => null);
      if (!syncResponse.ok || !syncData?.success) {
        throw new Error(syncData?.error || 'Unable to create the seller dispute record.');
      }

      const statusResponse = await fetch('/api/consign/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', id: disputeId, status: 'rejected' }),
      });
      const statusData = await statusResponse.json().catch(() => null);
      if (!statusResponse.ok || !statusData?.success) {
        throw new Error(statusData?.error || 'The order rejection could not be saved.');
      }

      const persistRejectedOrder = () => fetch('/api/consign/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, status: 'Rejected', actor: 'admin' }),
      });
      let orderResponse = await persistRejectedOrder();
      let orderData = await orderResponse.json().catch(() => null);
      if (orderResponse.ok && orderData?.success && !orderData.order) {
        const createResponse = await fetch('/api/consign/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: [target] }),
        });
        const createData = await createResponse.json().catch(() => null);
        if (!createResponse.ok || !createData?.success) {
          throw new Error(createData?.error || 'The rejected order could not be added to Admin Orders.');
        }
        orderResponse = await persistRejectedOrder();
        orderData = await orderResponse.json().catch(() => null);
      }
      if (!orderResponse.ok || !orderData?.success || !orderData.order) {
        throw new Error(orderData?.error || 'The rejected order status could not be saved.');
      }

      setRejectedOrderKeys((current) => new Set(current).add(target.id).add(normalizeOrderNumber(target.orderNumber)));
      notify?.(`Order #${target.orderNumber} was rejected and added to Admin and Seller Disputes.`);
    } catch (error) {
      notify?.(error instanceof Error ? error.message : 'The order could not be rejected. Please try again.');
    } finally {
      setRejectingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const target = orders.find((order) => order.id === orderId);
    if (!target || target.status.startsWith('Cancelled') || target.status === 'Refunded' || rejectedOrderKeys.has(orderId)) return;
    setCancellingOrderIds((current) => new Set(current).add(orderId));
    try {
      await updateConsignOrderStatus(orderId, 'Cancelled', null, 'Consign order cancelled.');
    } finally {
      setCancellingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    }
  };

  // Real-time synchronization with Seller Dashboard actions (both same-browser localStorage & server persistence)
  useEffect(() => {
    const refreshFromLocal = () => {
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem(CONSIGN_ORDERS_STORAGE_KEY);
        if (raw) {
          setOrders(JSON.parse(raw));
        }
      } catch {}
    };

    const unsub = subscribeToOrders(refreshFromLocal);
    syncConsignOrdersFromServer().then(refreshFromLocal);
    const pollId = setInterval(() => {
      syncConsignOrdersFromServer().then(refreshFromLocal);
    }, 4000);
    const onFocus = () => syncConsignOrdersFromServer().then(refreshFromLocal);
    window.addEventListener('focus', onFocus);

    return () => {
      unsub();
      clearInterval(pollId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Keep rejected orders marked after navigation or a page refresh.
  useEffect(() => {
    let active = true;
    const refreshRejectedOrders = async () => {
      try {
        const response = await fetch('/api/consign/disputes', { cache: 'no-store' });
        const data = await response.json();
        if (!active || !response.ok || !data?.success) return;
        const rejected = new Set<string>();
        for (const dispute of Array.isArray(data.disputes) ? data.disputes : []) {
          if (dispute.status !== 'rejected') continue;
          if (dispute.orderId) rejected.add(String(dispute.orderId));
          const orderNumber = String(dispute.orderNumber || '').trim().replace(/^#/, '').toLowerCase();
          if (orderNumber) rejected.add(orderNumber);
        }
        setRejectedOrderKeys(rejected);
      } catch {
        // Keep the last known state if the dispute request is temporarily unavailable.
      }
    };
    void refreshRejectedOrders();
    const pollId = setInterval(() => void refreshRejectedOrders(), 4000);
    window.addEventListener('focus', refreshRejectedOrders);
    return () => {
      active = false;
      clearInterval(pollId);
      window.removeEventListener('focus', refreshRejectedOrders);
    };
  }, []);

  const handleRefuse = (orderId: string) =>
    updateConsignOrderStatus(orderId, 'Cancelled', null, 'Order consignment refused.');

  const handleReturn = (orderId: string) =>
    updateConsignOrderStatus(orderId, 'Exception', null, 'Return initiated for order.');

  // Screen 5 / Inspector: Timeline, Chat & Items
  const [inspectedOrderId, setInspectedOrderId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      sender: 'System',
      time: '10/6/2026, 11:20:00 PM',
      text: 'Automatic reminder: this order has not moved for over 24 hours.',
    },
    {
      id: '2',
      sender: 'System',
      time: '10/8/2026, 12:20:00 AM',
      text: 'Automatic reminder: this order has not moved for over 24 hours.',
    },
    {
      id: '3',
      sender: 'System',
      time: '10/9/2026, 1:20:00 AM',
      text: 'Automatic reminder: this order has not moved for over 24 hours.',
    },
    {
      id: '4',
      sender: 'System',
      time: '10/10/2026, 2:20:00 AM',
      text: 'Automatic reminder: this order has not moved for over 24 hours.',
    },
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChatMessage.trim()) return;
    if (!selectedMerchant?.email) {
      notify?.('Select a registered seller before sending this message.');
      return;
    }
    const messageText = newChatMessage.trim();
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          role: 'admin',
          email: selectedMerchant.email,
          name: selectedMerchant.name,
          text: messageText,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send the seller message.');
    } catch (error: any) {
      notify?.(error.message || 'Unable to send the seller message.');
      return;
    }
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}, ${now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })}`;
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'Ops',
      time: timeStr,
      text: messageText,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setNewChatMessage('');
    notify?.('Message sent as ops — the merchant has been notified.');
  };

  const consignTabs = (
    <div className="flex items-center gap-1 border-b border-gray-200" role="tablist" aria-label="Consign sections">
      <button
        type="button"
        role="tab"
        aria-selected={activeConsignTab === 'consign'}
        onClick={() => setActiveConsignTab('consign')}
        className={'border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ' + (activeConsignTab === 'consign' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800')}
      >
        Consign
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeConsignTab === 'seller_tracker'}
        onClick={() => setActiveConsignTab('seller_tracker')}
        className={'border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ' + (activeConsignTab === 'seller_tracker' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800')}
      >
        Seller Tracker
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeConsignTab === 'product_queries'}
        onClick={() => setActiveConsignTab('product_queries')}
        className={'border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ' + (activeConsignTab === 'product_queries' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800')}
      >
        Product Queries
      </button>
    </div>
  );

  if (activeConsignTab === 'seller_tracker') {
    return (
      <div className="max-w-7xl mx-auto animate-fadeIn space-y-6 pb-12">
        {consignTabs}
        <AdminSellerTrackerView />
      </div>
    );
  }

  if (activeConsignTab === 'product_queries') {
    return (
      <div className="max-w-7xl mx-auto animate-fadeIn space-y-6 pb-12">
        {consignTabs}
        <AdminConsignProductQueriesPanel merchants={merchants} orders={orders} notify={notify} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn space-y-6 pb-12">
      {consignTabs}
      {/* ============================================================== */}
      {/* SCREEN 1: 1 MERCHANT & 2 PRODUCTS & QUANTITIES                */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Section 1: Merchant */}
        <div className="p-5 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-sm text-gray-900">1</span>
            <h2 className="font-semibold text-sm text-gray-900">Merchant</h2>
          </div>

          {/* Merchant Dropdown (Matching Screenshot 1 & 2) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <button
                id="merchant-selector-button"
                onClick={() => setIsMerchantDropdownOpen(!isMerchantDropdownOpen)}
                className="w-full flex items-center justify-between h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 font-medium hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all text-left"
              >
                <span className="truncate">
                  {selectedMerchant.name} · bal ${selectedMerchant.balance.toFixed(2)}
                  {selectedMerchant.productsCount !== undefined ? ` · ${selectedMerchant.productsCount} stocked` : ''}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
              </button>

              {/* Dropdown Options List */}
              {isMerchantDropdownOpen && (
                <div id="merchant-dropdown-menu" className="absolute top-full left-0 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 text-xs">
                  {merchants.map((m) => (
                    <button
                      key={m.id}
                      data-merchant-id={m.id}
                      onClick={() => handleSelectMerchant(m)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between ${
                        selectedMerchantId === m.id ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{m.name}</span>
                        {m.fullName && m.fullName.toLowerCase() !== m.name.toLowerCase() && (
                          <span className="text-[10px] text-gray-400">({m.fullName})</span>
                        )}
                        {m.productsCount !== undefined && m.productsCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            {m.productsCount} stocked
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400 font-mono text-[11px] shrink-0 ml-2">
                        bal ${m.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct "Already Stock" Option for the Selected Seller */}
            <button
              onClick={() => {
                const nextState = !isAlreadyStockView;
                setIsAlreadyStockView(nextState);
                void recordAdminActivity({
                  actionText: nextState ? `Switched to Already Stock products for ${selectedMerchant.name}` : 'Switched back to the standard Consign catalog',
                  details: nextState ? `${currentMerchantProducts.length} seller-stocked products are available for this order.` : `Seller: ${selectedMerchant.name}`,
                  category: 'Other',
                  workflowId,
                  targetId: selectedMerchant.id,
                  endpoint: 'Consign catalog selection',
                  method: 'SELECTION',
                });
                if (nextState) {
                  notify?.(`Showing Already Stock for ${selectedMerchant.name} (${currentMerchantProducts.length} products).`);
                } else {
                  notify?.('Showing standard consignment catalog.');
                }
              }}
              className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
                isAlreadyStockView
                  ? 'bg-[#071324] text-white shadow-md ring-2 ring-blue-500/40'
                  : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Already Stock</span>
              {currentMerchantProducts.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isAlreadyStockView ? 'bg-blue-500 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentMerchantProducts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Products & quantities · Dynamic title */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">2</span>
              <h2 className="font-semibold text-sm text-gray-900">
                {isAlreadyStockView
                  ? `Already Stock · ${totalItemsCount.toLocaleString()} products attached to ${selectedMerchant.name}`
                  : `Products & quantities · ${totalItemsCount.toLocaleString()} available`}
              </h2>
            </div>

            {/* Search + Already Stocked */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-8 pl-3 pr-8 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56"
                />
              </div>
              <button
                onClick={() => notify?.(`Filtered products for "${productSearch || 'all'}"`)}
                className="h-8 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors"
              >
                Search
              </button>

              {/* Quick button to return to the standard Consign catalog */}
              {isAlreadyStockView && (
                <button
                  id="consign-storehouse-toggle"
                  onClick={() => {
                    setIsAlreadyStockView(false);
                    notify?.('Showing the Consign catalog.');
                  }}
                  className="h-8 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors whitespace-nowrap"
                >
                  Consign catalog
                </button>
              )}

              <button
                id="already-stock-btn"
                onClick={() => {
                  const nextState = !isAlreadyStockView;
                  setIsAlreadyStockView(nextState);
                  if (nextState) {
                    notify?.(`Showing Already Stock for ${selectedMerchant.name} (${currentMerchantProducts.length} products).`);
                  } else {
                    notify?.('Showing the Consign catalog.');
                  }
                }}
                className={`h-8 px-3.5 text-xs font-semibold rounded-lg shadow-2xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isAlreadyStockView
                    ? 'bg-[#071324] text-white border border-transparent shadow-md ring-2 ring-blue-500/30'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Already Stock</span>
                {currentMerchantProducts.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isAlreadyStockView ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {currentMerchantProducts.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category Chips / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {activeCategories.map((cat) => {
              const isActive = productCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setProductCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors text-[11.5px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {displayProducts.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-600">
                {!isAlreadyStockView && activeProductsList.length === 0 ? 'The Consign catalog is empty.' : 'No products found'}
              </p>
              {isAlreadyStockView && <p className="text-[11px] text-gray-400 mt-0.5">No "Already Stock" products found for {selectedMerchant.name}.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 min-h-[694px] content-start">
              {displayProducts.map((prod) => {
                const isSelected = selectedProductIds.has(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleProduct(prod.id)}
                    className={`border rounded-xl p-3 bg-white cursor-pointer transition-all flex flex-col justify-between select-none ${
                      isSelected
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Visual Thumbnail */}
                    <div className="w-full aspect-square bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center p-2 mb-2 relative overflow-hidden group shrink-0">
                      {prod.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          loading="lazy"
                          className="w-full h-full object-contain p-1 mix-blend-multiply group-hover:scale-105 transition-transform rounded"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-gray-400 group-hover:scale-105 transition-transform" />
                      )}
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Title & Price: fixed height prevents layout shifts between 1-line and 2-line titles */}
                    <div className="flex flex-col justify-between flex-1">
                      <div className="flex h-[32px] items-start gap-1">
                        <p className="min-w-0 flex-1 text-[11px] text-gray-800 font-medium line-clamp-2 leading-snug" title={prod.name}>
                          &quot;{prod.name}&quot;
                        </p>
                        <DisputeProductUnreadBadge count={getDisputeProductUnreadCount(disputeProductCounts, prod.id, prod.name)} />
                      </div>
                      <div className="flex items-center justify-between mt-1 h-5">
                        <p className="text-xs font-bold text-gray-900">
                          ${prod.price.toFixed(2)}
                        </p>
                        {prod.stock && (
                          <span className="text-[10px] text-gray-500">
                            {prod.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalProductPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-100 text-xs gap-3 min-h-[52px]">
              <span className="text-gray-500 text-[11.5px]">
                Showing {Math.min((productPage - 1) * productPageSize + 1, totalItemsCount).toLocaleString()} -{' '}
                {Math.min(productPage * productPageSize, totalItemsCount).toLocaleString()} of{' '}
                <strong className="text-gray-900 font-semibold">{totalItemsCount.toLocaleString()}</strong> items
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  id="consign-prev-page-btn"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
                >
                  Prev
                </button>

                {paginationRange.map((pNum, index) => {
                  if (pNum === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-gray-400 select-none text-xs"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pNum === productPage;
                  return (
                    <button
                      key={`page-${pNum}`}
                      id={`consign-page-btn-${pNum}`}
                      onClick={() => setProductPage(pNum as number)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#071324] text-white shadow-xs'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-100 bg-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  id="consign-next-page-btn"
                  onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  disabled={productPage === totalProductPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCREEN 3: SHOPPER (COUNTRY-WISE 5,000 SHOPPERS)                */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-4">
        {/* Header & selection summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-900">3</span>
            <h2 className="font-semibold text-sm text-gray-900">Shopper</h2>
            <span className="text-xs text-gray-500 font-normal">
              · {TOTAL_SHOPPERS_COUNT.toLocaleString()} available (1,000 per country)
            </span>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-2">
            <span>Selected:</span>
            <span className="font-semibold text-blue-600">
              {selectedShopperIds.size} shopper{selectedShopperIds.size !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* 5 Country Sections / Tabs: Pakistan, India, USA, Canada, UK */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-gray-100">
          {COUNTRY_TABS.map((tab) => {
            const isActive = activeCountry === tab.key;
            const countInCountry = COUNTRY_SHOPPERS[tab.key]?.length || 1000;
            return (
              <button
                key={tab.key}
                id={`consign-country-tab-${tab.key.toLowerCase()}`}
                type="button"
                onClick={() => {
                  setActiveCountry(tab.key);
                  setShopperSearch('');
                  setShopperPage(1);
                  // Automatically select the first shopper of the chosen country
                  const firstShopper = COUNTRY_SHOPPERS[tab.key]?.[0];
                  if (firstShopper) {
                    handleSelectShopper(firstShopper.id);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-sm">{tab.flag}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {countInCountry.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Dropdown quick-pick & Active Selection controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              id="consign-shopper-search-input"
              type="text"
              placeholder={`Search ${activeCountry} shoppers by name, email or # (1 - 1,000)...`}
              value={shopperSearch}
              onChange={(e) => {
                setShopperSearch(e.target.value);
                setShopperPage(1);
              }}
              className="w-full h-8 pl-8 pr-7 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {shopperSearch && (
              <button
                type="button"
                onClick={() => {
                  setShopperSearch('');
                  setShopperPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Select Shopper Dropdown for the chosen country */}
          <select
            id="consign-country-shopper-dropdown"
            value={
              Array.from(selectedShopperIds).find((id) =>
                activeCountryShoppers.some((s) => s.id === id)
              ) || ''
            }
            onChange={(e) => {
              const selId = e.target.value;
              if (selId) {
                handleSelectShopper(selId);
              }
            }}
            className="h-8 px-2.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer shadow-2xs max-w-xs truncate"
            title={`Select any individual shopper from ${activeCountry}`}
          >
            <option value="">-- Quick pick from {activeCountry} (1,000) --</option>
            {activeCountryShoppers.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.number} · {s.name} ({s.gender}) — {s.email}
              </option>
            ))}
          </select>

          {/* Active Shopper Indicator Pill */}
          {activeSelectedShopper && (
            <div className="h-8 px-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-2xs">
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span>#{activeSelectedShopper.number} · {activeSelectedShopper.name}</span>
            </div>
          )}
        </div>

        {/* Shopper List Box */}
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-72 overflow-y-auto bg-white">
          {filteredShoppers.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              <User className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
              <p className="font-medium text-gray-600">No shoppers match your search in {activeCountry}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Try searching a different name, email, or number.
              </p>
            </div>
          ) : (
            pagedShoppers.map((sh) => {
              const isChecked = selectedShopperIds.has(sh.id);
              const flag =
                sh.country === 'Pakistan'
                  ? '🇵🇰'
                  : sh.country === 'India'
                  ? '🇮🇳'
                  : sh.country === 'USA'
                  ? '🇺🇸'
                  : sh.country === 'Canada'
                  ? '🇨🇦'
                  : '🇬🇧';
              return (
                <div
                  key={sh.id}
                  id={`consign-shopper-row-${sh.id}`}
                  onClick={() => handleSelectShopper(sh.id)}
                  className={`px-4 py-2.5 flex items-center justify-between text-xs hover:bg-gray-50/70 transition-colors cursor-pointer select-none ${
                    isChecked ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="consign-shopper-radio"
                      checked={isChecked}
                      onChange={() => handleSelectShopper(sh.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-400 cursor-pointer accent-blue-600"
                    />
                    <span className="font-mono text-[11px] text-gray-400 w-8">
                      #{sh.number}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{sh.name}</span>
                        <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded text-[10px] font-medium flex items-center gap-1">
                          <span>{flag}</span>
                          <span>{sh.country}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            sh.gender === 'Female'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {sh.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-gray-500 font-mono text-[11px] hidden sm:inline">
                      {sh.email}
                    </span>
                    <button
                      type="button"
                      id={`select-shopper-btn-${sh.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectShopper(sh.id);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
                        isChecked
                          ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                          : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {isChecked ? '✓ Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">
              {filteredShoppers.length === 0 ? 0 : (shopperPage - 1) * SHOPPERS_PER_PAGE + 1}
            </span> -{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(shopperPage * SHOPPERS_PER_PAGE, filteredShoppers.length)}
            </span> of{' '}
            <span className="font-semibold text-gray-800">
              {filteredShoppers.length.toLocaleString()}
            </span> shoppers in{' '}
            <span className="font-semibold text-gray-900">{activeCountry}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="consign-shopper-prev-page-btn"
              type="button"
              disabled={shopperPage <= 1}
              onClick={() => setShopperPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
            >
              Prev
            </button>

            {shopperPaginationRange.map((pNum, index) => {
              if (pNum === '...') {
                return (
                  <span
                    key={`shopper-ellipsis-${index}`}
                    className="px-2 text-gray-400 select-none text-xs"
                  >
                    ...
                  </span>
                );
              }
              const isCurrent = pNum === shopperPage;
              return (
                <button
                  key={`shopper-page-${pNum}`}
                  id={`consign-shopper-page-btn-${pNum}`}
                  type="button"
                  onClick={() => setShopperPage(pNum as number)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#071324] text-white shadow-xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-100 bg-white'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              id="consign-shopper-next-page-btn"
              type="button"
              disabled={shopperPage >= shopperTotalPages}
              onClick={() => setShopperPage((p) => Math.min(shopperTotalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SHIP TO CARD (MATCHING USER SCREENSHOT)                        */}
        {/* ============================================================== */}
        <div className="pt-4 border-t border-gray-100 space-y-3.5">
          {/* Card Header & Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-gray-900 tracking-tight">
                Ship to · {activeSelectedShopper ? activeSelectedShopper.name : 'Random shopper'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]">
                Complete
              </span>
              <span className="text-[11px] text-gray-400 hidden sm:inline">
                (Auto-filled for {activeSelectedShopper?.country})
              </span>
            </div>
            <div className="text-[11px] text-gray-500">
              Country: <span className="font-semibold text-gray-700">{activeSelectedShopper?.country}</span>
            </div>
          </div>

          {/* Form Fields matching the user screenshot */}
          <div className="space-y-3">
            {/* Row 1: Recipient * & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Recipient <span className="text-red-500">*</span>
                </label>
                <input
                  id="shipping-recipient-input"
                  type="text"
                  value={shippingForm.recipient}
                  onChange={(e) => handleShippingFieldChange('recipient', e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="shipping-phone-input"
                  type="text"
                  value={shippingForm.phone}
                  onChange={(e) => handleShippingFieldChange('phone', e.target.value)}
                  placeholder="+1 415 555 0134"
                  className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                />
              </div>
            </div>

            {/* Row 2: Email */}
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="shipping-email-input"
                type="email"
                value={shippingForm.email}
                onChange={(e) => handleShippingFieldChange('email', e.target.value)}
                placeholder="name@example.com"
                className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
              />
            </div>

            {/* Row 3: Street address * */}
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Street address <span className="text-red-500">*</span>
              </label>
              <input
                id="shipping-street-input"
                type="text"
                value={shippingForm.street}
                onChange={(e) => handleShippingFieldChange('street', e.target.value)}
                placeholder="Street and number"
                className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Row 4: Apt / unit (optional) */}
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Apt / unit (optional)
              </label>
              <input
                id="shipping-apt-input"
                type="text"
                value={shippingForm.apt}
                onChange={(e) => handleShippingFieldChange('apt', e.target.value)}
                placeholder="Apt 5"
                className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Row 5: City * & State / province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="shipping-city-input"
                  type="text"
                  value={shippingForm.city}
                  onChange={(e) => handleShippingFieldChange('city', e.target.value)}
                  placeholder="San Francisco"
                  className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  State / province
                </label>
                <input
                  id="shipping-state-input"
                  type="text"
                  value={shippingForm.state}
                  onChange={(e) => handleShippingFieldChange('state', e.target.value)}
                  placeholder="CA"
                  className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Row 6: Postal code & Country code * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Postal code
                </label>
                <input
                  id="shipping-postal-input"
                  type="text"
                  value={shippingForm.postalCode}
                  onChange={(e) => handleShippingFieldChange('postalCode', e.target.value)}
                  placeholder="94107"
                  className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Country code <span className="text-red-500">*</span>
                </label>
                <input
                  id="shipping-country-code-input"
                  type="text"
                  value={shippingForm.countryCode}
                  onChange={(e) => handleShippingFieldChange('countryCode', e.target.value)}
                  placeholder="US"
                  className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 uppercase font-mono"
                />
              </div>
            </div>

            {/* Footer Disclaimer matching screenshot exactly */}
            <p className="text-[11px] text-gray-500 pt-0.5 leading-relaxed">
              The merchant only sees the name / phone / email / address masked; city and country are shown in full so they can judge shipping cost and time.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCREEN 3: 4 CONFIRM & PUSH TO MERCHANT (MATCHING SCREENSHOT 4) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900">4</span>
          <h2 className="font-semibold text-sm text-gray-900">
            Confirm &amp; push to merchant
          </h2>
        </div>

        {/* Dynamic calculation summary string */}
        <p className="text-xs text-gray-800 font-medium">
          {selectedProductsList.length > 0 ? selectedProductsList.length : displayProducts.length > 0 ? 1 : 0} product(s) · ${(unitCostEach > 0 ? unitCostEach : displayProducts[0]?.price || 0).toFixed(2)} each · {shippingForm.recipient || activeSelectedShopper?.name || 'Selected shopper'} ({activeSelectedShopper?.country}) × {copiesCount} = {copiesCount} order(s), total ${totalCalculated.toFixed(2)}
        </p>

        {/* Explanatory note */}
        <p className="text-xs text-gray-500 leading-relaxed">
          Cost and commission split by the merchant&apos;s tier; after they advance the cost the order ships, and capital + commission settle on delivery.
        </p>

        {/* Controls: Copies + Dispatch */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>Copies</span>
            <input
              type="number"
              min="1"
              value={copiesCount}
              onChange={(e) => setCopiesCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 h-8 px-2 text-center text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <button
            id="consign-dispatch-btn"
            onClick={handleDispatch}
            disabled={isDispatching}
            className="px-4 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isDispatching ? 'Dispatching...' : 'Dispatch'}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCREEN 4: CONSIGN ORDERS (MATCHING SCREENSHOT 5)               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header + Search */}
        <div className="p-5 sm:px-6 pt-5 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <h2 className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight">
            Consign orders
          </h2>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Order no / shopper / product / ..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="h-8 pl-3 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-52 sm:w-64"
            />
            <button
              onClick={() => notify?.(`Filtered consign orders for "${orderSearchQuery || 'all'}"`)}
              className="h-8 px-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Status Filter Tabs (Pills from Screenshot 5) */}
        <div className="px-5 sm:px-6 pb-3 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
          {[
            { id: 'All', label: `All · ${statusTabCounts.all}` },
            { id: 'Awaiting payment', label: `Awaiting payment · ${statusTabCounts.awaitingPayment}` },
            { id: 'Awaiting pickup', label: `Awaiting pickup · ${statusTabCounts.awaitingPickup}` },
            { id: 'Picked up', label: `Picked up · ${statusTabCounts.pickedUp}` },
            { id: 'Shipped', label: `Shipped · in transit · ${statusTabCounts.shipped}` },
            { id: 'Received', label: `Received · settled · ${statusTabCounts.received}` },
            { id: 'Refunded', label: `Refunded · ${statusTabCounts.refunded}` },
            { id: 'Exception', label: `Exception · ${statusTabCounts.exception}` },
            { id: 'Overdue', label: `Overdue · ${statusTabCounts.overdue}` },
            { id: 'Cancelled', label: `Cancelled · ${statusTabCounts.cancelled}` },
          ].map((tab) => {
            const isActive = orderStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setOrderStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-[11.5px] transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Consign Orders Table */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-5 sm:px-6 font-medium text-gray-500 text-left">Shop</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-500 text-left">Items</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-500 text-left">Shopper</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-500 text-left">Cost</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-500 text-left">Commission</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-500 text-left">Status</th>
                <th className="py-3 px-5 sm:px-6 font-medium text-gray-500 text-left">Track / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 text-xs">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-xs">No consign orders</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {orderSearchQuery || orderStatusFilter !== 'All'
                        ? 'No orders match your filter criteria.'
                        : 'Dispatched consign orders will appear here in real-time.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isRefunded = Boolean(ord.refund) || ord.status === 'Refunded';
                  const isCancelled = ord.status.startsWith('Cancelled');
                  const normalizedOrderNumber = ord.orderNumber.trim().replace(/^#/, '').toLowerCase();
                  const isRejected = rejectedOrderKeys.has(ord.id) || rejectedOrderKeys.has(normalizedOrderNumber);
                  const trackerStatus = isRefunded || isRejected || isCancelled ? null : getConsignTrackerStatus(ord);
                  const trackerStageIndex = trackerStatus ? CONSIGN_TRACKER_STAGE_INDEX[trackerStatus] : -1;
                  const itemImage =
                    ord.products?.find((product) => product.image || product.imageUrl)?.image ||
                    ord.products?.find((product) => product.imageUrl)?.imageUrl ||
                    ord.imageUrl;
                  const isRefunding = refundingOrderIds.has(ord.id);
                  const isRejecting = rejectingOrderIds.has(ord.id);
                  const isCancelling = cancellingOrderIds.has(ord.id);
                  const refundButton = (
                    <button
                      type="button"
                      disabled={!hasSellerPaidConsignOrder(ord) || isRefunded || isRejected || isCancelled || isRefunding || isRejecting || isCancelling}
                      title={isRefunded ? 'This order has been refunded.' : isRejected ? 'This order has been rejected.' : isCancelled ? 'This order has been cancelled.' : !hasSellerPaidConsignOrder(ord) ? 'Refund becomes available after the seller pays.' : 'Refund this Consign order.'}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (hasSellerPaidConsignOrder(ord) && !isRefunded && !isRejected && !isCancelled && !isRefunding && !isRejecting && !isCancelling) void handleRefundConsignOrder(ord.id);
                      }}
                      className={'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ' + (
                        isRefunded || isRejected || isCancelled
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                          : !hasSellerPaidConsignOrder(ord)
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : isRefunding
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                            : 'border-red-200 bg-white text-red-600 cursor-pointer hover:bg-red-50 hover:border-red-300'
                      )}
                    >
                      {isRefunded ? 'Refunded' : isRefunding ? 'Processing…' : 'Refund'}
                    </button>
                  );
                  const rejectButton = (
                    <button
                      type="button"
                      disabled={isRefunded || isRejected || isCancelled || isRejecting || isRefunding || isCancelling}
                      title={isRejected ? 'This order has been rejected.' : isRefunded ? 'A refunded order cannot be rejected.' : isCancelled ? 'A cancelled order cannot be rejected.' : 'Reject this Consign order.'}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isRefunded && !isRejected && !isCancelled && !isRejecting && !isRefunding && !isCancelling) void handleRejectConsignOrder(ord.id);
                      }}
                      className={'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ' + (
                        isRejected
                          ? 'border-rose-200 bg-rose-50 text-rose-700 cursor-default'
                          : isRefunded
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-default'
                            : isRejecting
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                              : 'border-rose-200 bg-white text-rose-600 cursor-pointer hover:bg-rose-50 hover:border-rose-300'
                      )}
                    >
                      {isRejected ? 'Rejected' : isRejecting ? 'Rejecting…' : 'Reject'}
                    </button>
                  );
                  const cancelButton = (
                    <button
                      type="button"
                      disabled={isRefunded || isRejected || isCancelled || isCancelling || isRefunding || isRejecting}
                      title={isCancelled ? 'This order has been cancelled.' : isRefunded ? 'A refunded order cannot be cancelled.' : isRejected ? 'A rejected order cannot be cancelled.' : 'Cancel this Consign order.'}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isRefunded && !isRejected && !isCancelled && !isCancelling && !isRefunding && !isRejecting) void handleCancelOrder(ord.id);
                      }}
                      className={'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ' + (
                        isCancelled
                          ? 'border-gray-200 bg-gray-100 text-gray-600 cursor-default'
                          : isRefunded || isRejected
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-default'
                            : isCancelling
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                              : 'border-gray-300 bg-white text-gray-700 cursor-pointer hover:bg-gray-100 hover:border-gray-400'
                      )}
                    >
                      {isCancelled ? 'Cancelled' : isCancelling ? 'Cancelling…' : 'Cancel'}
                    </button>
                  );
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setInspectedOrderId(ord.id)}
                      className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${
                        inspectedOrderId === ord.id ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Shop */}
                      <td className="py-4 px-5 sm:px-6 font-medium text-blue-500 hover:text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                        {ord.shopName}
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5 min-w-[190px]">
                          <div className="w-9 h-9 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {itemImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={itemImage} alt={ord.itemTitle} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div
                              className="font-medium text-blue-500 hover:text-blue-600 hover:underline cursor-pointer line-clamp-1 max-w-[280px]"
                              title={ord.itemTitle}
                            >
                              {ord.itemTitle}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 font-normal font-mono">
                              <span>{ord.orderNumber}</span>
                              <span>·</span>
                              <span>{ord.itemCount} item(s) ▸</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Shopper */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-medium text-gray-800">{ord.shopperName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{ord.shopperEmail}</div>
                        <div className="mt-1 max-w-[220px] space-y-0.5 break-words text-[10px] font-medium leading-snug text-gray-700">
                          <p><span className="font-semibold text-gray-900">Phone:</span> {ord.shippingAddress?.phone || '—'}</p>
                          <p><span className="font-semibold text-gray-900">Street:</span> {ord.shippingAddress?.street || '—'}</p>
                          <p><span className="font-semibold text-gray-900">Apt / unit:</span> {ord.shippingAddress?.apt || '—'}</p>
                          <p><span className="font-semibold text-gray-900">City:</span> {ord.shippingAddress?.city || '—'}</p>
                          <p><span className="font-semibold text-gray-900">State / province:</span> {ord.shippingAddress?.state || '—'}</p>
                          <p><span className="font-semibold text-gray-900">Postal code:</span> {ord.shippingAddress?.postalCode || '—'}</p>
                          <p><span className="font-semibold text-gray-900">Country code:</span> {ord.shippingAddress?.countryCode || '—'}</p>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-4 px-4 sm:px-6 font-normal text-gray-700 whitespace-nowrap">
                        ${ord.cost.toFixed(2)}
                      </td>

                      {/* Commission */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-normal text-gray-700">${ord.commission.toFixed(2)}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{ord.commissionRate}</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        {isRejected ? (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-[#fff1f2] border border-[#ffe4e6] text-[#be123c] text-[11px] font-medium leading-tight select-none">
                            <span>Rejected</span>
                          </div>
                        ) : isCancelled ? (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-medium leading-tight select-none">
                            <span>Cancelled</span>
                          </div>
                        ) : ord.status.startsWith('Awaiting payment') ? (
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-md bg-[#fff7ed] border border-[#ffedd5] text-[#c2410c] text-[11px] font-medium leading-tight select-none">
                            <span>Awaiting</span>
                            <span>payment</span>
                          </div>
                        ) : ord.status.includes('settled') ? (
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-md bg-[#ecfdf5] border border-[#d1fae5] text-[#047857] text-[11px] font-medium leading-tight select-none">
                            <span>Received ·</span>
                            <span>settled</span>
                          </div>
                        ) : ord.status.includes('pickup') ? (
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-md bg-[#f0fdf4] border border-[#dcfce7] text-[#15803d] text-[11px] font-medium leading-tight select-none">
                            <span>Paid ·</span>
                            <span>awaiting pickup</span>
                          </div>
                        ) : ord.status.includes('Shipped') ? (
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-md bg-[#eff6ff] border border-[#dbeafe] text-[#1d4ed8] text-[11px] font-medium leading-tight select-none">
                            <span>Shipped ·</span>
                            <span>in transit</span>
                          </div>
                        ) : isRefunded ? (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-[#ecfdf5] border border-[#d1fae5] text-[#047857] text-[11px] font-medium leading-tight select-none">
                            <span>Refunded</span>
                          </div>
                        ) : ord.status.startsWith('Cancelled') ? (
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-medium leading-tight select-none">
                            <span>Cancelled</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-medium leading-tight select-none">
                            <span>{ord.status}</span>
                          </div>
                        )}
                      </td>

                      {/* Track / Action */}
                      <td className="py-4 px-5 sm:px-6">
                        <div className="flex flex-col items-start gap-2">
                          {trackerStatus ? (
                            <div className="min-w-[250px] max-w-[370px] space-y-2">
                              <div className="flex flex-wrap items-center gap-1">
                                {CONSIGN_TRACKER_STAGES.map((stage, stageIndex) => {
                                  const complete = stageIndex < trackerStageIndex;
                                  const current = stageIndex === trackerStageIndex;
                                  const canSelectStage = stageIndex === trackerStageIndex || (trackerStageIndex > 0 && stageIndex === trackerStageIndex + 1) || (trackerStageIndex >= 2 && stageIndex >= 2 && stageIndex < trackerStageIndex);
                                  return (
                                    <button
                                      key={stage.status}
                                      type="button"
                                      disabled={!canSelectStage}
                                      aria-current={current ? 'step' : undefined}
                                      title={canSelectStage ? (stageIndex === trackerStageIndex ? stage.label + ' is the current status' : 'Set order status to ' + stage.label) : trackerStageIndex === 0 && stageIndex === 1 ? 'Seller payment is required before confirmation.' : undefined}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (!canSelectStage) return;
                                        if (stageIndex === 2) handleMarkPickedUp(ord.id);
                                        else if (stageIndex === 3) handleMarkShipped(ord.id);
                                        else if (stageIndex === 4) handleMarkDelivered(ord.id);
                                      }}
                                      className={'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ' + (
                                        complete
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : current
                                            ? 'border-blue-200 bg-blue-50 text-blue-700 font-semibold'
                                            : 'border-gray-200 bg-gray-50 text-gray-400'
                                      ) + (canSelectStage ? ' cursor-pointer hover:border-blue-400 hover:bg-blue-100' : ' cursor-default')}
                                    >
                                      <span>{stageIndex + 1}</span>
                                      {stage.label}
                                    </button>
                                  );
                                })}
                                {refundButton}
                                {rejectButton}
                                {cancelButton}
                              </div>
                              {trackerStageIndex === 0 && ord.status.startsWith('Awaiting payment') && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-amber-700">Waiting for merchant payment</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                                {isRejected ? 'Rejected' : isRefunded ? 'Refunded' : isCancelled ? 'Cancelled' : ord.status}
                              </span>
                              {isRejected ? rejectButton : isRefunded ? refundButton : isCancelled ? cancelButton : <>{refundButton}{rejectButton}{cancelButton}</>}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCREEN 5: ORDER TIMELINE, CHAT & ITEMS INSPECTOR               */}
      {/* Only rendered when there are real dispatched consign orders   */}
      {/* ============================================================== */}
      {orders.length > 0 && (
        <div className="space-y-4 pt-2">
          {/* Order Stepper / Timeline Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-start overflow-x-auto py-1">
              {/* Step 1: Assigned */}
              <div className="flex flex-col items-center w-28 text-center flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50 mb-2" />
                <span className="text-xs font-medium text-gray-800">Assigned</span>
                <span className="text-[11px] text-gray-500 leading-tight mt-0.5">Just now</span>
              </div>

              {/* Connector 1 (Green) */}
              <div className="h-0.5 w-12 sm:w-16 bg-emerald-500 mt-[7px] -mx-1 flex-shrink-0" />

              {/* Step 2: Paid */}
              <div className="flex flex-col items-center w-28 text-center flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50 mb-2" />
                <span className="text-xs font-medium text-gray-800">Paid</span>
                <span className="text-[11px] text-gray-500 leading-tight mt-0.5">Pending</span>
              </div>

              {/* Connector 2 (Gray) */}
              <div className="h-0.5 w-12 sm:w-16 bg-gray-200 mt-[7px] -mx-1 flex-shrink-0" />

              {/* Step 3: Shipped */}
              <div className="flex flex-col items-center w-28 text-center flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-gray-300 mb-2" />
                <span className="text-xs font-normal text-gray-600">Shipped</span>
                <span className="text-[11px] text-gray-400 leading-tight mt-0.5">—</span>
              </div>

              {/* Connector 3 (Gray) */}
              <div className="h-0.5 w-12 sm:w-16 bg-gray-200 mt-[7px] -mx-1 flex-shrink-0" />

              {/* Step 4: Settled */}
              <div className="flex flex-col items-center w-28 text-center flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-gray-300 mb-2" />
                <span className="text-xs font-normal text-gray-600">Settled</span>
                <span className="text-[11px] text-gray-400 leading-tight mt-0.5">—</span>
              </div>
            </div>
          </div>

          {/* Order Chat Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <h4 className="text-sm font-medium text-gray-800">
              Order chat (buyer / merchant / ops)
            </h4>

            {/* Messages list with scrollbar */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs">
                  <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                    <span>{msg.sender}</span>
                    <span className="text-gray-400 font-normal">·</span>
                    <span className="text-gray-400 font-normal">{msg.time}</span>
                  </div>
                  <div className="text-gray-600 mt-0.5 leading-relaxed">{msg.text}</div>
                </div>
              ))}
            </div>

            {/* Send message form */}
            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Send as ops — the merchant gets notified..."
                className="flex-1 h-9 px-3.5 bg-white border border-gray-200 rounded-lg text-xs placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="h-9 px-4 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors shadow-2xs"
              >
                Send
              </button>
            </form>
          </div>

          {/* Order Items Preview Row: Dynamically displays real items belonging to the active view */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {displayProducts.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xs font-medium text-gray-800 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 font-normal">
                    ${item.price.toFixed(2)} × 1 = ${item.price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
