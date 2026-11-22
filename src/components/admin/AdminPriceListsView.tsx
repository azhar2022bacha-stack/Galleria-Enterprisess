'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import {
  Search,
  X,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  Plus,
  CircleDollarSign,
} from 'lucide-react';

export interface AdminPriceListItem {
  id: string;
  title: string;
  description?: string;
  type: 'Sale' | 'Override';
  status: 'Active' | 'Draft';
  createdAt: string;
}

const STORAGE_KEY = 'buyxoco_admin_price_lists_v1';

const INITIAL_PRICE_LISTS: AdminPriceListItem[] = [];

function getStoredPriceLists(): AdminPriceListItem[] {
  if (typeof window === 'undefined') return INITIAL_PRICE_LISTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PRICE_LISTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PRICE_LISTS;
  } catch {
    return INITIAL_PRICE_LISTS;
  }
}

function saveStoredPriceLists(items: AdminPriceListItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('buyxoco_admin_price_lists_changed'));
  } catch (err) {
    console.error('Failed to save price lists:', err);
  }
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

interface AdminPriceListsViewProps {
  notify?: (msg: string) => void;
}

export function AdminPriceListsView({ notify }: AdminPriceListsViewProps) {
  const [priceLists, setPriceLists] = useState<AdminPriceListItem[]>(INITIAL_PRICE_LISTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Draft'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Sale' | 'Override'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'title_asc' | 'status_active'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const menuId = useDismissMenusOnOutsideClick(isFilterOpen || isSortOpen || actionMenuId !== null, () => {
    setIsFilterOpen(false);
    setIsSortOpen(false);
    setActionMenuId(null);
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'Sale' | 'Override'>('Sale');
  const [newStatus, setNewStatus] = useState<'Active' | 'Draft'>('Active');

  // Edit states
  const [editingItem, setEditingItem] = useState<AdminPriceListItem | null>(null);

  useEffect(() => {
    setPriceLists(getStoredPriceLists());
    const handleSync = () => {
      setPriceLists(getStoredPriceLists());
    };
    window.addEventListener('buyxoco_admin_price_lists_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_price_lists_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Price list title is required.');
      return;
    }

    const newItem: AdminPriceListItem = {
      id: `pl_${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      type: newType,
      status: newStatus,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const updated = [newItem, ...priceLists];
    saveStoredPriceLists(updated);
    setPriceLists(updated);
    setIsCreateOpen(false);

    setNewTitle('');
    setNewDescription('');
    setNewType('Sale');
    setNewStatus('Active');

    notify?.(`Price List "${newItem.title}" created.`);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    const updated = priceLists.map((p) =>
      p.id === editingItem.id ? editingItem : p
    );
    saveStoredPriceLists(updated);
    setPriceLists(updated);
    setEditingItem(null);
    notify?.(`Price List "${editingItem.title}" updated.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this price list?')) {
      const updated = priceLists.filter((p) => p.id !== id);
      saveStoredPriceLists(updated);
      setPriceLists(updated);
      setActionMenuId(null);
      notify?.('Price list removed.');
    }
  };

  const filteredItems = useMemo(() => {
    let result = [...priceLists];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((p) => p.type === typeFilter);
    }

    if (sortBy === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'status_active') {
      result.sort((a, b) => (a.status === 'Active' ? -1 : 1));
    }

    return result;
  }, [priceLists, searchQuery, statusFilter, typeFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN PRICE LISTS CARD (EXACT MATCH FOR USER SCREENSHOT)        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title & Subtitle + Action Button (Create) */}
        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-3 bg-white flex-wrap">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Price Lists
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Create sales or override prices for specific conditions.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center shrink-0"
          >
            Create
          </button>
        </div>

        {/* Divider line directly under the header */}
        <div className="border-t border-gray-200"></div>

        {/* ============================================================== */}
        {/* BODY: EMPTY STATE (EXACT MATCH FOR USER SCREENSHOT)            */}
        {/* ============================================================== */}
        {priceLists.length === 0 ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4 bg-white select-none">
            <AlertCircle className="w-4 h-4 text-gray-400 mb-2 stroke-[1.6]" />
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight">
              No records
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              There are no records to show
            </p>
          </div>
        ) : (
          /* When price lists exist, render toolbar + table + footer */
          <>
            {/* Toolbar Row */}
            <div className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 bg-white flex-wrap">
              {/* Add Filter Button */}
              <div className="relative" data-click-away-menu={isFilterOpen ? menuId : undefined}>
                <button
                  onClick={() => {
                    setIsFilterOpen((prev) => !prev);
                    setIsSortOpen(false);
                  }}
                  className={`h-8 px-3.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    statusFilter !== 'all' || typeFilter !== 'all' || isFilterOpen
                      ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                      : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span>Add filter</span>
                  {(statusFilter !== 'all' || typeFilter !== 'all') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>

                {/* Filter Popover */}
                {isFilterOpen && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                    <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                      Status
                    </div>
                    {(['all', 'Active', 'Draft'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                          statusFilter === st ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="capitalize">{st === 'all' ? 'All Statuses' : st}</span>
                        {statusFilter === st && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                      Type
                    </div>
                    {(['all', 'Sale', 'Override'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTypeFilter(t);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                          typeFilter === t ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{t === 'all' ? 'All Types' : t}</span>
                        {typeFilter === t && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search + Sort */}
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
                <div className="relative" data-click-away-menu={isSortOpen ? menuId : undefined}>
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
                        Sort Price Lists
                      </div>
                      {[
                        { key: 'default', label: 'Default' },
                        { key: 'title_asc', label: 'Title (A to Z)' },
                        { key: 'status_active', label: 'Active First' },
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

            {/* Table */}
            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                    <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Title</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Type</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Status</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Created</th>
                    <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-3.5 px-5 sm:px-6 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="w-3.5 h-3.5 text-gray-400" />
                          <div>
                            <div>{item.title}</div>
                            {item.description && (
                              <div className="text-[11px] text-gray-400 font-normal">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-gray-700 font-normal">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2 text-gray-700 font-normal">
                          <span
                            className={`w-2 h-2 rounded-[2px] inline-block shrink-0 ${
                              item.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          ></span>
                          <span>{item.status}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                        {item.createdAt}
                      </td>
                      <td className="py-3.5 px-5 sm:px-6 text-right relative" data-click-away-menu={actionMenuId === item.id ? menuId : undefined}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
                          className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {actionMenuId === item.id && (
                          <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                setEditingItem(item);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>Edit List</span>
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-full px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-white">
              <span>
                1 — {filteredItems.length} of {filteredItems.length} results
              </span>
              <div className="flex items-center gap-4">
                <span>1 of 1 pages</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled
                    className="px-2 py-1 text-gray-300 cursor-not-allowed text-xs font-medium rounded hover:bg-transparent"
                  >
                    Prev
                  </button>
                  <button
                    disabled
                    className="px-2 py-1 text-gray-300 cursor-not-allowed text-xs font-medium rounded hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* CREATE MODAL                                                   */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Create Price List</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Flash Sale 20%"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Special prices for promotional sale"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Sale">Sale</option>
                  <option value="Override">Override</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
                >
                  Create Price List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT MODAL                                                     */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Edit Price List</h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Type</label>
                <select
                  value={editingItem.type}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Sale">Sale</option>
                  <option value="Override">Override</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Status</label>
                <select
                  value={editingItem.status}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
