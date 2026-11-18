'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, PackageOpen, Trash2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductImageWithFallback } from './ProductImageWithFallback';
import { DisputeProductUnreadBadge, getDisputeProductUnreadCount, useDisputeProductUnread } from '@/components/disputes/DisputeUnreadBadge';

export interface MyProductItem {
  id: string;
  title: string;
  category: string;
  stock: string;
  price: number;
  status: 'Published' | 'Draft' | 'Low Stock' | 'Out of Stock';
  addedDate: string;
  image: string;
}

// Initial products: empty as requested so no dummy products are pre-seeded
export const INITIAL_MY_PRODUCTS: MyProductItem[] = [];

interface MyProductsCatalogProps {
  onVisitStorehouse: () => void;
  onAddMore?: () => void;
  onAddAllToShop?: () => void;
  onRemoveProduct?: (id: string) => void;
  onClearAll?: () => void;
  planLimit?: number;
  packageName?: string;
  addedStorehouseProducts?: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    stock?: string | number;
    image?: string;
    status?: string;
    addedDate?: string;
  }>;
}

export const MyProductsCatalog: React.FC<MyProductsCatalogProps> = ({
  onVisitStorehouse,
  onAddMore,
  onAddAllToShop,
  onRemoveProduct,
  onClearAll,
  planLimit = 300,
  packageName = 'Free Shop',
  addedStorehouseProducts = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const disputeProductCounts = useDisputeProductUnread('seller');

  // Combine initial products (empty) with any products added from Storehouse
  const allProducts = useMemo(() => {
    const dynamicItems: MyProductItem[] = addedStorehouseProducts.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category || 'Storehouse',
      stock: typeof p.stock === 'number' ? `${p.stock} units` : (p.stock || '100 units'),
      price: p.price,
      status: 'Published',
      addedDate: p.addedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      image: p.image || '/images/my-products/d-mannose.png',
    }));

    return [...INITIAL_MY_PRODUCTS, ...dynamicItems];
  }, [addedStorehouseProducts]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allProducts, searchQuery]);

  const limit = planLimit || 300;
  const totalCount = allProducts.length;
  const remainingUploads = Math.max(0, limit - totalCount);
  const progressPercent = Math.min(100, Math.max(0, (totalCount / limit) * 100));

  // Format progress matching PRD specification:
  // 0 / 300 -> 0%
  // 100 / 300 -> 33.33%
  // 200 / 300 -> 66.67%
  // 300 / 300 -> 100%
  const formattedProgress = useMemo(() => {
    if (totalCount <= 0 || limit <= 0) return '0%';
    if (totalCount >= limit) return '100%';
    const pct = (totalCount / limit) * 100;
    const rounded = Math.round(pct * 100) / 100;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2)}%`;
  }, [totalCount, limit]);

  // SVG Circular progress dimensions (r = 26, circumference = 2 * PI * 26 ≈ 163.36)
  const circleRadius = 26;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference;

  // Pagination for large product catalogs (up to 300 items)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  // Interactive page numbers for client-side pagination
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    const leftBound = Math.max(2, safePage - 1);
    const rightBound = Math.min(totalPages - 1, safePage + 1);

    if (leftBound > 2) {
      pages.push('...');
    }
    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }
    if (rightBound < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP HEADER                                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#1c9e77] uppercase block">
            SELLER INVENTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">
            My Products
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Products attached to your shop — including items the platform stocked for you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onVisitStorehouse}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Visit Storehouse</span>
          </button>
          <button
            type="button"
            onClick={onAddMore || onVisitStorehouse}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add More</span>
          </button>
          {onAddAllToShop && (
            <button
              type="button"
              onClick={onAddAllToShop}
              disabled={remainingUploads <= 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 border ${
                remainingUploads <= 0
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-[#071324] hover:bg-[#11233b] text-white border-[#162740]'
              }`}
              title={
                remainingUploads <= 0
                  ? `Product limit reached (${limit}/${limit})`
                  : `Add all eligible products to My Products up to ${limit}`
              }
            >
              <Plus className={`w-3.5 h-3.5 stroke-[2.5] ${remainingUploads <= 0 ? 'text-gray-400' : 'text-[#cca23b]'}`} />
              <span>Add All to My Products</span>
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. TOP METRIC CARDS                                                   */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Card: Remaining Uploads with Circular Progress Indicator */}
        <div className="bg-[#071324] border border-[#162740] rounded-xl p-5 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              REMAINING UPLOADS
            </span>
            <span className="bg-white/10 text-white border border-white/15 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {totalCount} / {limit} uploaded
            </span>
          </div>

          <div className="my-3 flex items-center justify-between gap-4">
            <div>
              <span className="text-4xl font-extrabold tracking-tight text-white block">
                {totalCount}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                {totalCount >= limit ? 'Upload limit reached (100%)' : `${remainingUploads} uploads remaining`}
              </span>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
                {/* Background track circle */}
                <circle
                  cx="32"
                  cy="32"
                  r={circleRadius}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="5"
                  fill="none"
                />
                {/* Progress arc (fills completely to 100% when 300 uploaded) */}
                <circle
                  cx="32"
                  cy="32"
                  r={circleRadius}
                  stroke={totalCount >= limit ? '#10b981' : '#38bdf8'}
                  strokeWidth="5"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              {/* Progress Percentage in Center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold text-white tracking-tight">
                  {formattedProgress}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar matching menu theme */}
          <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                totalCount >= limit ? 'bg-emerald-400' : 'bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Card: Current Package (White Card) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              CURRENT PACKAGE
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">{packageName}</h2>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500 font-medium">{limit} product limit</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. PRODUCT LIST TABLE CARD                                            */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Product list</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalCount} products attached to your shop
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Clear All button if products exist */}
            {onClearAll && totalCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition-colors"
              >
                Remove All
              </button>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Products Table or Empty State */}
        {allProducts.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <PackageOpen className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Your Shop is Empty</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              You have no products attached to your shop. Select individual products or add all eligible products with one click.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onVisitStorehouse}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <span>Visit Storehouse to Select</span>
              </button>
              {onAddAllToShop && (
                <button
                  type="button"
                  onClick={onAddAllToShop}
                  className="px-4 py-2 bg-[#071324] hover:bg-[#11233b] text-white rounded-lg text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5] text-[#cca23b]" />
                  <span>Add All to My Products</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 sm:px-6">PRODUCT</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">STOCK</th>
                  <th className="py-3 px-4">PRICE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">ADDED</th>
                  {onRemoveProduct && <th className="py-3 px-4 text-right">ACTION</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={onRemoveProduct ? 7 : 6} className="py-12 text-center text-gray-400">
                      <p className="text-xs">No products match your search.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* PRODUCT COLUMN */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <ProductImageWithFallback
                              src={p.image}
                              alt={p.title}
                              className="h-full w-full object-contain"
                              containerClassName="relative w-full h-full flex items-center justify-center"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md md:max-w-lg">
                            <div className="flex items-start gap-2">
                              <span className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-[12px]">{p.title}</span>
                              <DisputeProductUnreadBadge count={getDisputeProductUnreadCount(disputeProductCounts, p.id, p.title)} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3 px-4 text-gray-600 font-normal whitespace-nowrap">
                        {p.category}
                      </td>

                      {/* STOCK */}
                      <td className="py-3 px-4 text-gray-800 font-normal whitespace-nowrap">
                        {p.stock}
                      </td>

                      {/* PRICE */}
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        ${p.price.toFixed(2)}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#e8f6f0] text-[#1c9e77] border border-[#c4e8dc]">
                          {p.status}
                        </span>
                      </td>

                      {/* ADDED */}
                      <td className="py-3 px-4 text-gray-500 font-normal whitespace-nowrap">
                        {p.addedDate}
                      </td>

                      {/* REMOVE ACTION */}
                      {onRemoveProduct && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemoveProduct(p.id);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar for Multi-Page Product Catalogs (Strictly Client-Side Without Full-Page Refresh) */}
        {filteredProducts.length > pageSize && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-800">{(safePage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-gray-800">
                {Math.min(safePage * pageSize, filteredProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-800">{filteredProducts.length}</span> products
            </span>
            <div className="flex items-center gap-1.5">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={safePage <= 1}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-gray-700 transition-colors shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {/* Numbered Page Buttons for Quick Client-Side Switching */}
              <div className="hidden sm:flex items-center gap-1">
                {paginationRange.map((pNum, index) => {
                  if (pNum === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-xs text-gray-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pNum === safePage;
                  return (
                    <button
                      key={`page-${pNum}`}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPage(pNum as number);
                      }}
                      className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#071324] text-white shadow-xs'
                          : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-100'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Page Indicator */}
              <span className="sm:hidden text-xs font-semibold text-gray-700 px-2">
                Page {safePage} of {totalPages}
              </span>

              {/* Next Page Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={safePage >= totalPages}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-gray-700 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
