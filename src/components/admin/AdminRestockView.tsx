'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, Search, Store } from 'lucide-react';
import { sendSellerNotification } from '@/lib/sellerNotifications';
import { PACKAGE_TIERS } from '@/lib/sellerOrders';

type ProductLimit = number | 'Unlimited';

interface RestockSellerItem {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  packageTier: string;
  productLimit: ProductLimit;
  status: string;
}

interface SellerProductItem {
  id: string;
  title: string;
  sku?: string;
  category?: string;
  price?: number | string;
  pricePerKg?: number | string;
  stock?: number | string;
  stockBags?: number | string;
  status?: string;
  image?: string;
  addedDate?: string;
  [field: string]: unknown;
}

type ProductMap = Record<string, SellerProductItem[]>;

function productLimitForTier(packageTier: string, fallback: unknown): ProductLimit {
  const normalizedTier = packageTier.trim().toLowerCase();
  if (normalizedTier.includes('diamond')) return 'Unlimited';
  if (normalizedTier.includes('basic')) return 500;
  const tier = PACKAGE_TIERS.find((item) => normalizedTier.includes(item.id));
  if (tier) return tier.productLimit;
  if (fallback === 'Unlimited') return fallback;
  const parsedLimit = Number(fallback);
  return Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 300;
}

function numericStock(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/\d+/);
  return match ? Math.max(0, Number(match[0])) : null;
}

function productStock(product: SellerProductItem): number | null {
  return numericStock(product.stockBags) ?? numericStock(product.stock);
}

function stockLabel(product: SellerProductItem): string {
  const stock = productStock(product);
  if (stock === null) return 'Units not recorded';
  return stock === 1 ? '1 unit' : `${stock.toLocaleString()} units`;
}

function stockStatus(product: SellerProductItem): 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Unknown' {
  const stock = productStock(product);
  if (stock === null) return 'Unknown';
  if (stock === 0) return 'Out of Stock';
  if (stock <= 25) return 'Low Stock';
  return 'In Stock';
}

function stockStatusClass(status: ReturnType<typeof stockStatus>): string {
  if (status === 'Out of Stock') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'Low Stock') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'In Stock') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-gray-200 bg-gray-50 text-gray-600';
}

function normalizeProductMap(value: unknown): ProductMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<ProductMap>((result, [email, rawProducts]) => {
    if (!Array.isArray(rawProducts)) return result;
    result[email.trim().toLowerCase()] = rawProducts
      .filter((product): product is Record<string, unknown> => Boolean(product) && typeof product === 'object')
      .map((product, index) => ({
        ...product,
        id: String(product.id || `seller-product-${index + 1}`),
        title: String(product.title || product.name || 'Untitled product'),
      }));
    return result;
  }, {});
}

interface AdminRestockViewProps {
  notify?: (msg: string) => void;
}

export function AdminRestockView({ notify }: AdminRestockViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [selectedSellerEmail, setSelectedSellerEmail] = useState('');
  const [sellers, setSellers] = useState<RestockSellerItem[]>([]);
  const [productsBySeller, setProductsBySeller] = useState<ProductMap>({});
  const [restockAmounts, setRestockAmounts] = useState<Record<string, number>>({});
  const [restockingKey, setRestockingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadRestockData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [ownersResponse, productsResponse] = await Promise.all([
          fetch('/api/admin/owners', { cache: 'no-store' }),
          fetch('/api/seller/products', { cache: 'no-store' }),
        ]);
        const [ownersResult, productsResult] = await Promise.all([
          ownersResponse.json(),
          productsResponse.json(),
        ]);

        if (!ownersResponse.ok || !ownersResult?.success) {
          throw new Error(ownersResult?.error || 'Unable to load platform sellers.');
        }
        if (!productsResponse.ok || !productsResult?.success) {
          throw new Error(productsResult?.error || 'Unable to load seller product records.');
        }

        if (!active) return;
        const nextSellers: RestockSellerItem[] = (Array.isArray(ownersResult.owners) ? ownersResult.owners : [])
          .filter((seller: any) => String(seller.email || '').trim())
          .map((seller: any) => {
            const packageTier = String(seller.packageTier || 'Free Shop');
            return {
              id: String(seller.id || seller.email),
              name: String(seller.shopName || seller.name || seller.fullName || seller.email),
              ownerName: String(seller.fullName || seller.subtitle || ''),
              email: String(seller.email).trim(),
              packageTier,
              productLimit: productLimitForTier(packageTier, seller.productLimit),
              status: String(seller.status || 'review'),
            };
          })
          .sort((left: RestockSellerItem, right: RestockSellerItem) => left.name.localeCompare(right.name));

        setSellers(nextSellers);
        setProductsBySeller(normalizeProductMap(productsResult.data));
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load restock data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRestockData();
    return () => { active = false; };
  }, [reloadKey]);

  const filteredSellers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sellers;
    return sellers.filter((seller) =>
      [seller.name, seller.ownerName, seller.email, seller.packageTier]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, sellers]);

  const selectedSeller = sellers.find((seller) => seller.email.toLowerCase() === selectedSellerEmail.toLowerCase());
  const selectedProducts = selectedSeller
    ? productsBySeller[selectedSeller.email.trim().toLowerCase()] || []
    : [];
  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return selectedProducts;
    return selectedProducts.filter((product) =>
      [product.title, product.sku || '', product.category || '', stockStatus(product)]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [productQuery, selectedProducts]);

  const productLimitLabel = selectedSeller?.productLimit === 'Unlimited'
    ? 'Unlimited'
    : Number(selectedSeller?.productLimit || 300).toLocaleString();
  const remainingProductSlots = selectedSeller?.productLimit === 'Unlimited'
    ? null
    : Math.max(0, Number(selectedSeller?.productLimit || 300) - selectedProducts.length);

  const handleUpdateUnits = (productId: string, delta: number) => {
    if (!selectedSeller) return;
    const key = `${selectedSeller.email.toLowerCase()}:${productId}`;
    setRestockAmounts((current) => ({
      ...current,
      [key]: Math.max(1, (current[key] || 1) + delta),
    }));
  };

  const handleRestockProduct = async (item: SellerProductItem) => {
    if (!selectedSeller) return;
    const emailKey = selectedSeller.email.trim().toLowerCase();
    const itemKey = `${emailKey}:${item.id}`;
    const units = Math.max(1, Math.floor(restockAmounts[itemKey] || 1));
    const currentStock = productStock(item) || 0;
    const nextStock = currentStock + units;
    const nextStatus = nextStock <= 25 ? 'Low Stock' : 'In Stock';
    const updatedProducts = selectedProducts.map((product) => product.id === item.id
      ? { ...product, stockBags: nextStock, stock: `${nextStock} units`, status: nextStatus }
      : product
    );

    setRestockingKey(itemKey);
    try {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedSeller.email, products: updatedProducts }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to update this seller’s stock.');
      }

      setProductsBySeller((current) => ({ ...current, [emailKey]: updatedProducts }));
      notify?.(`Restocked ${units} units of “${item.title}” for ${selectedSeller.name}.`);
      void sendSellerNotification({
        sellerEmail: selectedSeller.email,
        category: 'Products & Stock',
        title: 'Stock has been restocked',
        message: [
          { text: `${units} units of ` },
          { text: item.title, emphasis: 'blue' },
          { text: ' have been added to your product stock.' },
        ],
        tone: 'success',
        href: '/seller/dashboard?tab=my_products',
        dedupeKey: `seller-restock:${emailKey}:${item.id}:${Date.now()}`,
      });
    } catch (error) {
      notify?.(error instanceof Error ? error.message : 'Unable to update this seller’s stock.');
    } finally {
      setRestockingKey(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-12">
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quick restock (consign)</h1>
          <span className="text-xs text-gray-500">{sellers.length.toLocaleString()} platform sellers</span>
        </div>

        <div className="p-6 sm:p-8">
          {loadError && (
            <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <span>{loadError}</span>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Try again</button>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Pick a seller {loading ? '(loading…)': `(${sellers.length})`}</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search seller..."
                className="w-48 sm:w-56 px-3.5 py-2 rounded-lg border-2 border-blue-400 bg-white text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
              />
              <select
                value={selectedSellerEmail}
                onChange={(event) => { setSelectedSellerEmail(event.target.value); setProductQuery(''); }}
                disabled={loading}
                className="w-64 sm:w-72 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 text-xs sm:text-sm text-gray-800 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <option value="">— pick a seller —</option>
                {filteredSellers.map((seller) => (
                  <option key={seller.email} value={seller.email}>
                    {seller.name} · {seller.packageTier}
                  </option>
                ))}
              </select>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {!loading && !loadError && sellers.length === 0 && <p className="text-xs text-gray-500">No platform sellers are available.</p>}
            {!loading && searchQuery.trim() && filteredSellers.length === 0 && sellers.length > 0 && <p className="text-xs text-gray-500">No sellers match this search.</p>}
          </div>

          {selectedSeller && (
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-6 animate-fadeIn">
              <div className="bg-[#fbfbfc] border border-gray-200/90 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700"><Store className="w-5 h-5 text-gray-600" /></div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{selectedSeller.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedSeller.ownerName && `${selectedSeller.ownerName} · `}{selectedSeller.email}</p>
                    <p className="mt-1 text-[10px] capitalize text-gray-400">Account status: {selectedSeller.status}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <div><span className="text-gray-400 block text-[10.5px]">Store package</span><span className="font-bold text-gray-800">{selectedSeller.packageTier}</span></div>
                  <div><span className="text-gray-400 block text-[10.5px]">Products in shop</span><span className="font-bold text-gray-800">{selectedProducts.length.toLocaleString()} / {productLimitLabel}</span></div>
                  {remainingProductSlots !== null && <div><span className="text-gray-400 block text-[10.5px]">Product slots remaining</span><span className="font-bold text-gray-800">{remainingProductSlots.toLocaleString()}</span></div>}
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2"><Package className="w-4 h-4 text-gray-600" /><span>Selected seller products and stock</span></h3>
                  {selectedProducts.length > 0 && <label className="relative"><Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" /><input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search products..." className="w-52 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 outline-none focus:border-blue-400" /></label>}
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-gray-700">No products selected</p>
                    <p className="mt-1 text-xs text-gray-500">This seller has not added products to My Products yet.</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center text-xs text-gray-500">No selected products match this search.</div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                          <th className="py-3 px-4 w-[40%]">Product / SKU</th>
                          <th className="py-3 px-4">Current stock</th>
                          <th className="py-3 px-4">Availability</th>
                          <th className="py-3 px-4">Restock units</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {filteredProducts.map((item) => {
                          const itemKey = `${selectedSeller.email.toLowerCase()}:${item.id}`;
                          const status = stockStatus(item);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-gray-900">{item.title}</div>
                                <div className="text-[11px] text-gray-400 font-mono mt-0.5">{item.sku || 'SKU not provided'} · {item.category || 'Uncategorized'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-gray-800">{stockLabel(item)}</td>
                              <td className="py-3.5 px-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${stockStatusClass(status)}`}>{status}</span></td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-0.5 w-24 justify-between bg-white shadow-2xs">
                                  <button type="button" aria-label={`Decrease restock units for ${item.title}`} onClick={() => handleUpdateUnits(item.id, -1)} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100">-</button>
                                  <span className="font-bold text-xs">{restockAmounts[itemKey] || 1}</span>
                                  <button type="button" aria-label={`Increase restock units for ${item.title}`} onClick={() => handleUpdateUnits(item.id, 1)} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100">+</button>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button type="button" onClick={() => void handleRestockProduct(item)} disabled={restockingKey === itemKey} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18181b] hover:bg-black text-white transition-colors shadow-2xs disabled:opacity-50">
                                  {restockingKey === itemKey ? 'Restocking…' : 'Restock'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
