'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

export interface SellerConfirmedOrder {
  id: string;
  orderNumber?: string;
  shopName?: string;
  merchantEmail?: string;
  itemTitle?: string;
  itemCount?: number;
  imageUrl?: string;
  shopperName?: string;
  shopperEmail?: string;
  cost?: number;
  commission?: number;
  commissionRate?: string;
  status?: string;
  sellerStatus?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  products?: { id?: string; title?: string; quantity?: number; price?: number; image?: string }[];
}

interface AdminConfirmSellerOrdersViewProps {
  orders: SellerConfirmedOrder[];
  readOrderIds: string[];
  onMarkAllRead: () => void;
  onOpenConsign: () => void;
}

function formatCurrency(value: unknown): string {
  const amount = Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string): string {
  if (!value) return 'Recently confirmed';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
}

function getProductQuantity(value?: number): number {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
}

function normalizeSearchText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function fuzzyTokenMatches(term: string, token: string): boolean {
  if (token.includes(term)) return true;
  if (term.length < 4 || token.length < 4) return false;

  const maxDistance = term.length >= 9 ? 2 : 1;
  const minLength = Math.max(1, term.length - maxDistance);
  const maxLength = Math.min(token.length, term.length + maxDistance);
  for (let length = minLength; length <= maxLength; length += 1) {
    for (let start = 0; start + length <= token.length; start += 1) {
      if (editDistance(term, token.slice(start, start + length)) <= maxDistance) return true;
    }
  }
  return false;
}
export function AdminConfirmSellerOrdersView({
  orders,
  readOrderIds,
  onMarkAllRead,
  onOpenConsign,
}: AdminConfirmSellerOrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const unreadCount = orders.filter((order) => !readOrderIds.includes(order.id)).length;

  const searchTerms = normalizeSearchText(searchTerm).match(/[a-z0-9]+/g) || [];
  const filteredOrders = orders.filter((order) => {
    if (searchTerms.length === 0) return true;

    const productSearch = (order.products || []).flatMap((product) => {
      const quantity = getProductQuantity(product.quantity);
      const price = Number(product.price);
      return [
        product.title,
        product.quantity,
        product.price,
        'quantity ' + quantity + ' pcs pieces items',
        Number.isFinite(price) ? formatCurrency(price) : '',
        Number.isFinite(price) ? formatCurrency((Math.round(price * 100) * quantity) / 100) : '',
      ];
    });
    const dateSearch = [order.updatedAt, order.createdAt, order.date]
      .filter(Boolean)
      .flatMap((value) => [value, formatDate(value), new Date(value as string).toLocaleDateString('en-US')]);
    const searchableText = [
      JSON.stringify(order),
      order.itemCount ? 'quantity ' + order.itemCount + ' pcs pieces items' : '',
      formatCurrency(order.cost),
      ...productSearch,
      ...dateSearch,
    ].map((value) => String(value ?? '')).join(' ');
    const searchableTokens = normalizeSearchText(searchableText).match(/[a-z0-9]+/g) || [];

    return searchTerms.every((term) =>
      searchableTokens.some((token) => fuzzyTokenMatches(term, token))
    );
  });
  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Confirm Order by Seller</h1>
          <p className="mt-1 text-xs text-gray-500">
            Orders sellers have confirmed by paying from their wallet. These are ready for the next fulfillment step.
          </p>
        </div>
        <span
          className="inline-flex min-w-9 h-9 items-center justify-center rounded-full bg-blue-100 px-3 text-sm font-bold text-blue-800"
          aria-label={unreadCount + ' unread seller-confirmed orders'}
        >
          {unreadCount}
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search product, price, seller, customer, email, quantity, or date (typos accepted)"
            aria-label="Search seller-confirmed orders"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <span className="text-xs font-semibold text-gray-600" aria-live="polite">
          {unreadCount} unread
        </span>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark all read
        </button>
        <span className="text-[11px] text-gray-500">
          Showing {filteredOrders.length} of {orders.length}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-gray-700">
            {orders.length === 0 ? 'No seller-confirmed orders yet.' : 'No orders match your search.'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {orders.length === 0 ? 'When a seller pays for an order, it will appear here.' : 'Try another search term.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => {
            const orderNumber = String(order.orderNumber || order.id);
            const isRead = readOrderIds.includes(order.id);
            const products = Array.isArray(order.products) ? order.products : [];
            const displayProducts = products.length > 0
              ? products
              : order.itemTitle
                ? [{ title: order.itemTitle, image: order.imageUrl, quantity: order.itemCount }]
                : [];
            const totalItems = products.length > 0
              ? products.reduce((total, product) => total + getProductQuantity(product.quantity), 0)
              : Number(order.itemCount) > 0
                ? Math.floor(Number(order.itemCount))
                : displayProducts.length;

            return (
              <article
                key={order.id}
                className={'rounded-2xl border p-4 shadow-2xs sm:p-5 ' + (isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50/30')}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">Order #{orderNumber} confirmed by seller</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {String(order.shopName || 'Seller')} · {String(order.merchantEmail || 'Seller account')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isRead && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                        Unread
                      </span>
                    )}
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                      Seller confirmed
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 border-t border-gray-100 pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Customer</span>
                    <span className="mt-0.5 block font-medium text-gray-800">{order.shopperName || 'Customer'}</span>
                    {order.shopperEmail && <span className="block break-all text-[10px] text-gray-500">{order.shopperEmail}</span>}
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Product photos & quantity</span>
                    {displayProducts.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {displayProducts.map((product, productIndex) => {
                          const title = product.title || 'Product';
                          const quantity = getProductQuantity(product.quantity);
                          const unitPrice = Number(product.price);
                          const hasPrice = Number.isFinite(unitPrice);
                          const lineTotal = hasPrice ? (Math.round(unitPrice * 100) * quantity) / 100 : null;
                          return (
                            <div key={product.id || order.id + '-product-' + productIndex} className="flex items-center gap-2.5">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={title}
                                  loading="lazy"
                                  className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-1 text-center text-[8px] text-gray-400">
                                  Image unavailable
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="break-words font-medium text-gray-800">{title}</p>
                                <p className="text-[10px] text-gray-500">Quantity: {quantity}</p>
                                <p className="text-[10px] text-gray-500">
                                  Unit price: {hasPrice ? formatCurrency(unitPrice) : 'Price unavailable'}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-700">
                                  Line total: {lineTotal === null ? 'Price unavailable' : formatCurrency(lineTotal)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-500">Product details unavailable</p>
                    )}
                    <p className="mt-2 font-semibold text-gray-700">
                      Total: {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Order amount</span>
                    <span className="mt-0.5 block font-semibold text-gray-900">{formatCurrency(order.cost)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Seller confirmed</span>
                    <span className="mt-0.5 block text-gray-800">{formatDate(order.updatedAt || order.createdAt || order.date)}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={onOpenConsign}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Open order management
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}