'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
  SlidersHorizontal,
  Plus,
  Minus,
} from 'lucide-react';

export interface AdminInventoryItem {
  id: string;
  title: string;
  sku: string;
  reserved: number;
  inStock: number;
}

const STORAGE_KEY = 'buyxoco_admin_inventory_list';

const INITIAL_INVENTORY: AdminInventoryItem[] = [
  {
    id: 'inv_1',
    title: 'S / Black',
    sku: 'SHIRT-S-BLACK',
    reserved: 0,
    inStock: 337,
  },
  {
    id: 'inv_2',
    title: 'S / White',
    sku: 'SHIRT-S-WHITE',
    reserved: 0,
    inStock: 78,
  },
  {
    id: 'inv_3',
    title: 'M / Black',
    sku: 'SHIRT-M-BLACK',
    reserved: 0,
    inStock: 66,
  },
  {
    id: 'inv_4',
    title: 'M / White',
    sku: 'SHIRT-M-WHITE',
    reserved: 0,
    inStock: 144,
  },
  {
    id: 'inv_5',
    title: 'L / Black',
    sku: 'SHIRT-L-BLACK',
    reserved: 0,
    inStock: 369,
  },
  {
    id: 'inv_6',
    title: 'XL / Black',
    sku: 'SHIRT-XL-BLACK',
    reserved: 0,
    inStock: 220,
  },
  {
    id: 'inv_7',
    title: 'XL / White',
    sku: 'SHIRT-XL-WHITE',
    reserved: 0,
    inStock: 218,
  },
];

function getStoredInventory(): AdminInventoryItem[] {
  if (typeof window === 'undefined') return INITIAL_INVENTORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_INVENTORY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVENTORY;
  } catch {
    return INITIAL_INVENTORY;
  }
}

function saveStoredInventory(items: AdminInventoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('buyxoco_admin_inventory_changed'));
  } catch (err) {
    console.error('Failed to save inventory:', err);
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

interface AdminInventoryViewProps {
  notify?: (msg: string) => void;
}

export function AdminInventoryView({ notify }: AdminInventoryViewProps) {
  const [items, setItems] = useState<AdminInventoryItem[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'stock_high' | 'stock_low' | 'title_asc'>('default');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Edit stock modal
  const [editingItem, setEditingItem] = useState<AdminInventoryItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newInStock, setNewInStock] = useState<number>(100);

  useEffect(() => {
    setItems(getStoredInventory());
    const handleSync = () => {
      setItems(getStoredInventory());
    };
    window.addEventListener('buyxoco_admin_inventory_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_inventory_changed', handleSync);
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleAdjustStock = (item: AdminInventoryItem, delta: number) => {
    const updated = items.map((it) => {
      if (it.id === item.id) {
        return { ...it, inStock: Math.max(0, it.inStock + delta) };
      }
      return it;
    });
    saveStoredInventory(updated);
    setItems(updated);
    if (editingItem && editingItem.id === item.id) {
      setEditingItem({ ...editingItem, inStock: Math.max(0, editingItem.inStock + delta) });
    }
    notify?.(`Adjusted stock for ${item.title}`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSku.trim()) {
      alert('Title and SKU are required.');
      return;
    }

    const newItem: AdminInventoryItem = {
      id: `inv_${Date.now()}`,
      title: newTitle.trim(),
      sku: newSku.trim().toUpperCase(),
      reserved: 0,
      inStock: Math.max(0, Number(newInStock) || 0),
    };

    const updated = [newItem, ...items];
    saveStoredInventory(updated);
    setItems(updated);
    setIsCreateOpen(false);
    setNewTitle('');
    setNewSku('');
    setNewInStock(100);
    notify?.(`Inventory item "${newItem.title}" created.`);
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q)
      );
    }

    if (stockFilter === 'in_stock') {
      result = result.filter((i) => i.inStock > 0);
    } else if (stockFilter === 'low_stock') {
      result = result.filter((i) => i.inStock < 100);
    }

    if (sortBy === 'stock_high') {
      result.sort((a, b) => b.inStock - a.inStock);
    } else if (sortBy === 'stock_low') {
      result.sort((a, b) => a.inStock - b.inStock);
    } else if (sortBy === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [items, searchQuery, stockFilter, sortBy]);

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN INVENTORY CARD (MATCHING USER SCREENSHOT EXACTLY)         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title & Subtitle + Create Button */}
        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-3 bg-white">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Inventory
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage your inventory items
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

        {/* Toolbar Row: "Add filter" on left, Search + Sort on right */}
        <div className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white flex-wrap">
          {/* Add Filter Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFilterOpen((prev) => !prev);
                setIsSortOpen(false);
              }}
              className={`h-8 px-3.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                stockFilter !== 'all' || isFilterOpen
                  ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                  : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <span>Add filter</span>
              {stockFilter !== 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            {/* Filter Popover */}
            {isFilterOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                  Stock Filter
                </div>
                <button
                  onClick={() => {
                    setStockFilter('all');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                    stockFilter === 'all' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>All Items</span>
                  {stockFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                </button>
                <button
                  onClick={() => {
                    setStockFilter('in_stock');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                    stockFilter === 'in_stock' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>In Stock ({'>'} 0)</span>
                  {stockFilter === 'in_stock' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                </button>
                <button
                  onClick={() => {
                    setStockFilter('low_stock');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                    stockFilter === 'low_stock' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Low Stock ({'<'} 100)</span>
                  {stockFilter === 'low_stock' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                </button>
              </div>
            )}
          </div>

          {/* Search Box + Sort Button */}
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
                    Sort Inventory
                  </div>
                  {[
                    { key: 'default', label: 'Default' },
                    { key: 'stock_high', label: 'Highest Stock' },
                    { key: 'stock_low', label: 'Lowest Stock' },
                    { key: 'title_asc', label: 'Title (A to Z)' },
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
        {/* INVENTORY TABLE (EXACTLY MATCHING THE SCREENSHOT)              */}
        {/* ============================================================== */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-4 sm:px-6 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Title</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">SKU</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Reserved</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">In stock</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 text-xs">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/70 transition-colors group ${
                        isChecked ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                        />
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-900">
                        {item.title}
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 sm:px-6 text-gray-500 font-normal">
                        {item.sku}
                      </td>

                      {/* Reserved */}
                      <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                        {item.reserved}
                      </td>

                      {/* In stock */}
                      <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                        {item.inStock}
                      </td>

                      {/* Action Dropdown ... */}
                      <td className="py-3.5 px-4 sm:px-6 text-right relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
                          className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {actionMenuId === item.id && (
                          <div className="absolute right-4 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>Adjust Stock Level</span>
                            </button>
                            <button
                              onClick={() => {
                                handleAdjustStock(item, 50);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-emerald-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Restock (+50 units)</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination */}
        <div className="border-t border-gray-200 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <div>
            <span>
              1 — {filteredItems.length} of {filteredItems.length} results
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
      {/* MODAL: ADJUST STOCK                                           */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Adjust Inventory
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingItem.title} ({editingItem.sku})
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-600 font-medium">Current Stock</span>
                <span className="text-base font-bold text-gray-900">{editingItem.inStock}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Stock Adjustment (+ / -)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(editingItem, -10)}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(editingItem, -1)}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(editingItem, 1)}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(editingItem, 10)}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(editingItem, 50)}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold"
                  >
                    +50
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black text-xs font-semibold shadow-2xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE INVENTORY ITEM                                   */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Inventory Item
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Register a new SKU and stock allocation.
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
                  Title / Variant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. XXL / Navy Blue"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHIRT-XXL-NAVY"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Initial Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={newInStock}
                  onChange={(e) => setNewInStock(Number(e.target.value))}
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
