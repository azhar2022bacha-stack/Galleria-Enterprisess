'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
} from 'lucide-react';

export interface AdminCollectionItem {
  id: string;
  title: string;
  handle: string;
  productsCount: number;
}

const STORAGE_KEY = 'buyxoco_admin_collections_list';

const INITIAL_COLLECTIONS: AdminCollectionItem[] = [
  {
    id: 'col_best_sellers',
    title: 'Best Sellers',
    handle: '/best-sellers',
    productsCount: 17,
  },
  {
    id: 'col_new_arrivals',
    title: 'New Arrivals',
    handle: '/new-arrivals',
    productsCount: 18,
  },
];

function getStoredCollections(): AdminCollectionItem[] {
  if (typeof window === 'undefined') return INITIAL_COLLECTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_COLLECTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COLLECTIONS;
  } catch {
    return INITIAL_COLLECTIONS;
  }
}

function saveStoredCollections(collections: AdminCollectionItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    window.dispatchEvent(new Event('buyxoco_admin_collections_changed'));
  } catch (err) {
    console.error('Failed to save collections:', err);
  }
}

// Sort/list icon strictly matching the screenshot
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

interface AdminCollectionsViewProps {
  notify?: (msg: string) => void;
}

export function AdminCollectionsView({ notify }: AdminCollectionsViewProps) {
  const [collections, setCollections] = useState<AdminCollectionItem[]>(INITIAL_COLLECTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'title_asc' | 'title_desc' | 'products_high'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newProductsCount, setNewProductsCount] = useState<number>(0);

  useEffect(() => {
    setCollections(getStoredCollections());
    const handleSync = () => {
      setCollections(getStoredCollections());
    };
    window.addEventListener('buyxoco_admin_collections_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_collections_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Collection title is required.');
      return;
    }

    const formattedHandle = newHandle.trim()
      ? (newHandle.startsWith('/') ? newHandle.trim() : `/${newHandle.trim()}`)
      : `/${newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

    const newCol: AdminCollectionItem = {
      id: `col_${Date.now()}`,
      title: newTitle.trim(),
      handle: formattedHandle,
      productsCount: Math.max(0, Number(newProductsCount) || 0),
    };

    const updated = [newCol, ...collections];
    saveStoredCollections(updated);
    setCollections(updated);
    setIsCreateOpen(false);

    setNewTitle('');
    setNewHandle('');
    setNewProductsCount(0);

    notify?.(`Collection "${newCol.title}" created.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this collection?')) {
      const updated = collections.filter((c) => c.id !== id);
      saveStoredCollections(updated);
      setCollections(updated);
      setActionMenuId(null);
      notify?.('Collection removed.');
    }
  };

  const filteredCollections = useMemo(() => {
    let result = [...collections];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title_desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'products_high') {
      result.sort((a, b) => b.productsCount - a.productsCount);
    }

    return result;
  }, [collections, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN COLLECTIONS CARD (MATCHING USER SCREENSHOT EXACTLY)       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title & Subtitle + Create Button */}
        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-3 bg-white">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Collections
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Organize products into collections.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center shrink-0"
          >
            Create
          </button>
        </div>

        {/* Divider line before toolbar */}
        <div className="border-t border-gray-200"></div>

        {/* Toolbar Row: "Add filter" + Search + Sort Button */}
        <div className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white flex-wrap">
          {/* Add Filter Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFilterOpen((prev) => !prev);
                setIsSortOpen(false);
              }}
              className={`h-8 px-3.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isFilterOpen
                  ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                  : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <span>Add filter</span>
            </button>

            {/* Filter Popover */}
            {isFilterOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                  Filter Collections
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-gray-600 hover:bg-gray-50"
                >
                  All Collections
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-gray-600 hover:bg-gray-50"
                >
                  With Products ({'>'} 0)
                </button>
              </div>
            )}
          </div>

          {/* Search Input Box + Sort Button */}
          <div className="flex items-center gap-2 ml-auto">
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
                    Sort Order
                  </div>
                  {[
                    { key: 'default', label: 'Default' },
                    { key: 'title_asc', label: 'Title (A to Z)' },
                    { key: 'title_desc', label: 'Title (Z to A)' },
                    { key: 'products_high', label: 'Most Products' },
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

        {/* ============================================================== */}
        {/* COLLECTIONS TABLE (EXACTLY MATCHING THE SCREENSHOT)            */}
        {/* ============================================================== */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Title</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Products</th>
                <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-400 text-xs">
                    No collections found.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Title */}
                    <td className="py-3.5 px-5 sm:px-6 font-medium text-gray-900">
                      {c.title}
                    </td>

                    {/* Handle */}
                    <td className="py-3.5 px-4 sm:px-6 text-gray-500 font-normal">
                      {c.handle}
                    </td>

                    {/* Products */}
                    <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                      {c.productsCount}
                    </td>

                    {/* Action Dropdown ... */}
                    <td className="py-3.5 px-5 sm:px-6 text-right relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === c.id ? null : c.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuId === c.id && (
                        <div className="absolute right-4 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              notify?.(`Editing ${c.title}...`);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>Edit</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDelete(c.id)}
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

        {/* Footer: Pagination matching screenshot */}
        <div className="border-t border-gray-200 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <div>
            <span>
              1 — {filteredCollections.length} of {filteredCollections.length} results
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
      {/* MODAL: CREATE COLLECTION                                       */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Collection
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Organize products into customer-facing collections.
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Essentials"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Handle (URL slug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /summer-essentials"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Initial Products Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProductsCount}
                  onChange={(e) => setNewProductsCount(Number(e.target.value))}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
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
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
