'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  MoreHorizontal,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  Edit2,
  Copy,
  SlidersHorizontal,
} from 'lucide-react';

export interface AdminProductItem {
  id: string;
  title: string;
  collection: string;
  salesChannels: string;
  variantsCount: number;
  status: 'Draft' | 'Published';
  thumbnailType: 'tee' | 'shorts' | 'pants' | 'default';
  price?: number;
}

const STORAGE_KEY = 'buyxoco_admin_products_list';

const INITIAL_PRODUCTS: AdminProductItem[] = [
  {
    id: 'prod_tee',
    title: 'Essential Cotton Tee',
    collection: '-',
    salesChannels: 'Default Sales Channel',
    variantsCount: 8,
    status: 'Draft',
    thumbnailType: 'tee',
    price: 28.0,
  },
  {
    id: 'prod_shorts',
    title: 'Active Lounge Shorts',
    collection: '-',
    salesChannels: 'Default Sales Channel',
    variantsCount: 4,
    status: 'Draft',
    thumbnailType: 'shorts',
    price: 36.0,
  },
  {
    id: 'prod_sweatpants',
    title: 'Everyday Jogger Sweatpants',
    collection: '-',
    salesChannels: 'Default Sales Channel',
    variantsCount: 4,
    status: 'Draft',
    thumbnailType: 'pants',
    price: 54.0,
  },
];

function getStoredProducts(): AdminProductItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

function saveStoredProducts(products: AdminProductItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('buyxoco_admin_products_changed'));
  } catch (err) {
    console.error('Failed to save products:', err);
  }
}

// Icons matching the uploaded screenshot
function TshirtIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3a3 3 0 0 0 6 0h5l1 5-3.5 2V21H6.5V10L3 8l1-5h5z" />
    </svg>
  );
}

function ShortsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h16l1.2 9.5-5.2 2.5-4-3.5-4 3.5-5.2-2.5L4 4z" />
    </svg>
  );
}

function PantsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.5 3h13l-1.5 18h-4.2l-0.8-11-0.8 11H7L5.5 3z" />
    </svg>
  );
}

function ListSortIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2.5" y1="4" x2="8.5" y2="4" />
      <line x1="2.5" y1="8" x2="8.5" y2="8" />
      <line x1="2.5" y1="12" x2="6.5" y2="12" />
      <line x1="12" y1="3.5" x2="12" y2="12.5" />
      <path d="M10 10.5L12 12.5L14 10.5" />
    </svg>
  );
}

interface AdminProductsViewProps {
  notify?: (msg: string) => void;
}

export function AdminProductsView({ notify }: AdminProductsViewProps) {
  const [products, setProducts] = useState<AdminProductItem[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Published'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'title_asc' | 'title_desc' | 'variants'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // New product form
  const [newTitle, setNewTitle] = useState('');
  const [newCollection, setNewCollection] = useState('-');
  const [newSalesChannels, setNewSalesChannels] = useState('Default Sales Channel');
  const [newVariantsCount, setNewVariantsCount] = useState(1);
  const [newStatus, setNewStatus] = useState<'Draft' | 'Published'>('Draft');
  const [newThumbnailType, setNewThumbnailType] = useState<'tee' | 'shorts' | 'pants' | 'default'>('tee');
  const [newPrice, setNewPrice] = useState('35.00');

  useEffect(() => {
    setProducts(getStoredProducts());
    const handleSync = () => {
      setProducts(getStoredProducts());
    };
    window.addEventListener('buyxoco_admin_products_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_products_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Product title is required.');
      return;
    }

    const newProd: AdminProductItem = {
      id: `prod_${Date.now()}`,
      title: newTitle.trim(),
      collection: newCollection.trim() || '-',
      salesChannels: newSalesChannels.trim() || 'Default Sales Channel',
      variantsCount: Math.max(1, Number(newVariantsCount) || 1),
      status: newStatus,
      thumbnailType: newThumbnailType,
      price: parseFloat(newPrice) || 0,
    };

    const updated = [newProd, ...products];
    saveStoredProducts(updated);
    setProducts(updated);
    setIsCreateOpen(false);

    // Reset form
    setNewTitle('');
    setNewCollection('-');
    setNewVariantsCount(1);
    setNewPrice('35.00');

    notify?.(`Product "${newProd.title}" created.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product?')) {
      const updated = products.filter((p) => p.id !== id);
      saveStoredProducts(updated);
      setProducts(updated);
      setActionMenuId(null);
      notify?.('Product removed.');
    }
  };

  const handleDuplicate = (prod: AdminProductItem) => {
    const dup: AdminProductItem = {
      ...prod,
      id: `prod_${Date.now()}`,
      title: `${prod.title} (Copy)`,
      status: 'Draft',
    };
    const updated = [dup, ...products];
    saveStoredProducts(updated);
    setProducts(updated);
    setActionMenuId(null);
    notify?.(`Duplicated product as "${dup.title}".`);
  };

  const handleToggleStatus = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        const nextStatus: 'Draft' | 'Published' = p.status === 'Draft' ? 'Published' : 'Draft';
        return { ...p, status: nextStatus };
      }
      return p;
    });
    saveStoredProducts(updated);
    setProducts(updated);
    setActionMenuId(null);
    notify?.('Product status updated.');
  };

  const handleExportCSV = () => {
    const header = 'Product,Collection,Sales Channels,Variants,Status,Price\n';
    const rows = filteredProducts
      .map(
        (p) =>
          `"${p.title}","${p.collection}","${p.salesChannels}","${p.variantsCount} variants","${p.status}","$${p.price || 0}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify?.(`Exported ${filteredProducts.length} products to CSV.`);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          p.salesChannels.toLowerCase().includes(q) ||
          `${p.variantsCount} variants`.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (sortBy === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title_desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'variants') {
      result.sort((a, b) => b.variantsCount - a.variantsCount);
    }

    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  const renderThumbnail = (type: 'tee' | 'shorts' | 'pants' | 'default') => {
    return (
      <div className="w-9 h-9 rounded-lg bg-gray-100/90 border border-gray-200/50 flex items-center justify-center text-gray-900 shrink-0 shadow-2xs">
        {type === 'shorts' ? (
          <ShortsIcon className="w-4 h-4 text-gray-900" />
        ) : type === 'pants' ? (
          <PantsIcon className="w-4 h-4 text-gray-900" />
        ) : (
          <TshirtIcon className="w-4 h-4 text-gray-900" />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN PRODUCTS CARD (MATCHING USER SCREENSHOT EXACTLY)          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Unified Top Header & Toolbar Area (Seamless, matching screenshot) */}
        <div className="px-5 sm:px-6 pt-5 pb-3.5 space-y-3.5 bg-white">
          {/* Row 1: Title + Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Products
            </h1>

            {/* Action Buttons: Export, Import, Create */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
              >
                Export
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
              >
                Import
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
              >
                Create
              </button>
            </div>
          </div>

          {/* Row 2: Add filter + Search + Sort (no divider border between row 1 and 2) */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Add Filter Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className={`h-8 px-3.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  statusFilter !== 'all' || isFilterOpen
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                    : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <span>Add filter</span>
                {statusFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>

              {/* Filter Popover */}
              {isFilterOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Filter By Status
                  </div>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      statusFilter === 'all'
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>All Products</span>
                    {statusFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('Draft');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      statusFilter === 'Draft'
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Draft</span>
                    {statusFilter === 'Draft' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('Published');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      statusFilter === 'Published'
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Published</span>
                    {statusFilter === 'Published' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                </div>
              )}
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Search Input Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-44 sm:w-56 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Sort Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsSortOpen((prev) => !prev);
                    setIsFilterOpen(false);
                  }}
                  className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-colors ${
                    isSortOpen ? 'border-gray-400 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Sort options"
                >
                  <ListSortIcon className="w-3.5 h-3.5" />
                </button>

                {/* Sort Popover */}
                {isSortOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                    <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                      Sort Products
                    </div>
                    {[
                      { key: 'default', label: 'Default Order' },
                      { key: 'title_asc', label: 'Title (A to Z)' },
                      { key: 'title_desc', label: 'Title (Z to A)' },
                      { key: 'variants', label: 'Most Variants' },
                    ].map((s) => (
                      <button
                        key={s.key}
                        onClick={() => {
                          setSortBy(s.key as any);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                          sortBy === s.key ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{s.label}</span>
                        {sortBy === s.key && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRODUCTS TABLE (EXACTLY MATCHING THE SCREENSHOT)               */}
        {/* ============================================================== */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Product</th>
                <th className="py-3 px-4 font-medium text-gray-600">Collection</th>
                <th className="py-3 px-4 font-medium text-gray-600">Sales Channels</th>
                <th className="py-3 px-4 font-medium text-gray-600">Variants</th>
                <th className="py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 text-xs">
                    No products match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Product Title + Thumbnail */}
                    <td className="py-3 px-5 sm:px-6">
                      <div className="flex items-center gap-3">
                        {renderThumbnail(p.thumbnailType)}
                        <span className="font-medium text-gray-900">{p.title}</span>
                      </div>
                    </td>

                    {/* Collection */}
                    <td className="py-3 px-4 text-gray-500">{p.collection}</td>

                    {/* Sales Channels */}
                    <td className="py-3 px-4 text-gray-600">{p.salesChannels}</td>

                    {/* Variants */}
                    <td className="py-3 px-4 text-gray-600">{p.variantsCount} variants</td>

                    {/* Status: Small square + text matching screenshot */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <span
                          className={`w-2 h-2 rounded-[2px] inline-block ${
                            p.status === 'Published' ? 'bg-emerald-500' : 'bg-gray-500'
                          }`}
                        ></span>
                        <span>{p.status}</span>
                      </div>
                    </td>

                    {/* Action Dropdown ... */}
                    <td className="py-3 px-5 sm:px-6 text-right relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === p.id ? null : p.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuId === p.id && (
                        <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                            <span>Set as {p.status === 'Draft' ? 'Published' : 'Draft'}</span>
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                            <span>Duplicate</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <div>
            <span>
              1 — {filteredProducts.length} of {filteredProducts.length} results
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-gray-500 font-normal">1 of 1 pages</span>
            <button
              disabled
              className="text-gray-400 font-medium cursor-not-allowed select-none hover:text-gray-400"
            >
              Prev
            </button>
            <button
              disabled
              className="text-gray-400 font-medium cursor-not-allowed select-none hover:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: CREATE PRODUCT                                          */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Product
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Add a new merchandise item to your catalog.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Oversized Hoodie"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Collection
                  </label>
                  <input
                    type="text"
                    placeholder="-"
                    value={newCollection}
                    onChange={(e) => setNewCollection(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Sales Channels
                  </label>
                  <input
                    type="text"
                    value={newSalesChannels}
                    onChange={(e) => setNewSalesChannels(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Variants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newVariantsCount}
                    onChange={(e) => setNewVariantsCount(Number(e.target.value))}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Icon Type
                  </label>
                  <select
                    value={newThumbnailType}
                    onChange={(e) => setNewThumbnailType(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  >
                    <option value="tee">T-Shirt</option>
                    <option value="shorts">Shorts</option>
                    <option value="pants">Pants/Joggers</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black text-xs font-semibold shadow-2xs transition-colors"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IMPORT PRODUCTS                                         */}
      {/* ============================================================== */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Import Products
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Seller catalog imports are managed in Storehouse Catalog.
                </p>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                <Upload className="mx-auto mb-2 h-7 w-7 text-slate-400 stroke-[1.5]" />
                <p className="font-semibold text-gray-700">Central catalog import</p>
                <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-gray-500">
                  Use the Storehouse Catalog importer for category-balanced batches, product and image duplicate checks, and seller publishing.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    window.location.href = '/admin?tab=storehouse_catalog';
                  }}
                  className="px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black text-xs font-semibold shadow-2xs transition-colors"
                >
                  Open Storehouse Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
