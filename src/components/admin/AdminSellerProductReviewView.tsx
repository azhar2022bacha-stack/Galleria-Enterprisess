'use client';

import React, { useState, useEffect } from 'react';
import { sendSellerNotification } from '@/lib/sellerNotifications';

export interface PendingProductReview {
  id: string;
  sellerProductId: string;
  name: string;
  sellerName: string;
  sellerEmail?: string;
  sku: string;
  category: string;
  proposedPrice: number;
  submittedAt: string;
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdminSellerProductReviewViewProps {
  notify?: (msg: string) => void;
}

async function fetchPendingProductReviews(): Promise<PendingProductReview[]> {
  const [productResponse, ownerResponse] = await Promise.all([
    fetch('/api/seller/products', { cache: 'no-store' }),
    fetch('/api/admin/owners', { cache: 'no-store' }),
  ]);
  if (!productResponse.ok) throw new Error('Unable to load seller product reviews.');
  const productData = await productResponse.json();
  const ownerData = ownerResponse.ok ? await ownerResponse.json() : {};
  const productMap = productData?.data && typeof productData.data === 'object' ? productData.data : {};
  const owners = Array.isArray(ownerData?.owners) ? ownerData.owners : [];
  const ownerNames = new Map<string, string>(owners.map((owner: any) => [
    String(owner.email || '').trim().toLowerCase(),
    String(owner.shopName || owner.name || owner.email || 'Seller'),
  ] as [string, string]));
  const sellerEntries = Object.entries(productMap).filter(([email]) => email !== 'default');

  return sellerEntries.flatMap(([sellerEmail, sellerProducts]) => {
    if (!Array.isArray(sellerProducts)) return [];
    return sellerProducts.flatMap((product: any) => {
      const status = String(product?.status || '').trim().toLowerCase().replace(/[ _-]+/g, ' ');
      const isPending = status === 'pending' || status.startsWith('pending ') || status.endsWith(' pending') ||
        status.includes('in review') || status === 'under review' || status === 'review';
      if (!isPending) return [];
      const sellerProductId = String(product.id || product.sku || product.title || 'product');
      const email = sellerEmail;
      return [{
        id: `${email}:${sellerProductId}`,
        sellerProductId,
        name: String(product.title || 'Untitled product'),
        sellerName: ownerNames.get(String(email).toLowerCase()) || (email || 'Seller'),
        sellerEmail: email,
        sku: String(product.sku || '—'),
        category: String(product.category || '—'),
        proposedPrice: Number(product.pricePerKg ?? product.price ?? 0) || 0,
        submittedAt: String(product.addedDate || 'Recently submitted'),
        image: product.image,
        status: 'pending' as const,
      }];
    });
  });
}

export function AdminSellerProductReviewView({ notify }: AdminSellerProductReviewViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<PendingProductReview[]>([]);

  const loadProducts = async () => {
    setIsRefreshing(true);
    try {
      setProducts(await fetchPendingProductReviews());
    } catch (error: any) {
      notify?.(error.message || 'Unable to load seller product reviews.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const loaded = await fetchPendingProductReviews();
        if (!cancelled) setProducts(loaded);
      } catch {}
    };
    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 15_000);
    window.addEventListener('storage', refresh);
    window.addEventListener('galleria:seller-orders-changed', refresh);
    window.addEventListener('galleria:admin-todo-changed', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('galleria:seller-orders-changed', refresh);
      window.removeEventListener('galleria:admin-todo-changed', refresh);
    };
  }, []);

  const updateProductReview = async (product: PendingProductReview, decision: 'approved' | 'rejected') => {
    if (!product.sellerEmail) {
      notify?.('This product does not have a seller account assigned.');
      return;
    }
    try {
      const response = await fetch(`/api/seller/products?email=${encodeURIComponent(product.sellerEmail)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load this seller’s products.');
      const data = await response.json();
      const currentProducts = Array.isArray(data?.products) ? data.products : [];
      const updatedProducts = currentProducts.map((item: any) => {
        const matches = String(item.id || item.sku || item.title || '') === product.sellerProductId;
        if (!matches) return item;
        const stock = Number(item.stockBags ?? item.stock ?? 0);
        return { ...item, status: decision === 'approved' ? (stock > 0 ? 'In Stock' : 'Out of Stock') : 'Rejected' };
      });
      const saveResponse = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: product.sellerEmail, products: updatedProducts }),
      });
      if (!saveResponse.ok) throw new Error('Unable to save this product review.');
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      window.dispatchEvent(new Event('galleria:admin-todo-changed'));
      window.dispatchEvent(new Event('buyxoco_admin_data_changed'));
      if (decision === 'approved') {
        notify?.(`"${product.name}" approved and published to shop.`);
        void sendSellerNotification({
          sellerEmail: product.sellerEmail,
          category: 'Products & Stock',
          title: 'Your product has been approved',
          message: [
            { text: 'Your product ' },
            { text: product.name, emphasis: 'blue' },
            { text: ' has been approved and published. You can view the live listing in My Products.' },
          ],
          tone: 'success',
          href: '/seller/dashboard?tab=my_products',
          dedupeKey: `product-review:${product.id}:approved`,
        });
      } else {
        notify?.(`"${product.name}" rejected.`);
        void sendSellerNotification({
          sellerEmail: product.sellerEmail,
          category: 'Products & Stock',
          title: 'Action needed: your product was not approved',
          message: [
            { text: 'Your product ' },
            { text: product.name, emphasis: 'red' },
            { text: ' was not approved for publication. Please review the product information and images, then submit an updated listing for review.', emphasis: 'red' },
          ],
          tone: 'rejection',
          href: '/seller/dashboard?tab=my_products',
          dedupeKey: `product-review:${product.id}:rejected`,
        });
      }
    } catch (error: any) {
      notify?.(error.message || 'Unable to update this product review.');
    }
  };

  const handleRefresh = () => {
    void loadProducts();
    notify?.('Product review queue refreshed.');
  };

  const handleApprove = (product: PendingProductReview) => {
    void updateProductReview(product, 'approved');
  };

  const handleReject = (product: PendingProductReview) => {
    void updateProductReview(product, 'rejected');
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container matching screenshot */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Top Header Row */}
        <div className="px-6 sm:px-8 py-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Seller Products · Review
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-2xs"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Informational Policy Strip */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-b border-gray-100/90 bg-[#fafafa]/80 text-xs text-gray-500 leading-relaxed">
          Seller-submitted products wait here for review. Approve to publish to the shop &amp; feed; reject to keep them off-market.
        </div>

        {/* Product Review List or Empty State */}
        {products.length === 0 ? (
          <div className="px-6 sm:px-8 py-10 sm:py-12 text-sm text-gray-500 font-normal">
            No products awaiting review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-3 px-6 font-semibold">Product</th>
                  <th className="py-3 px-6 font-semibold">Seller</th>
                  <th className="py-3 px-6 font-semibold">Category</th>
                  <th className="py-3 px-6 font-semibold">Price</th>
                  <th className="py-3 px-6 font-semibold">Submitted</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {item.sku}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      <div>{item.sellerName}</div>
                      {item.sellerEmail && (
                        <div className="text-[11px] text-gray-400">{item.sellerEmail}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{item.category}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900 font-mono">
                      ${item.proposedPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap">{item.submittedAt}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(item)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
