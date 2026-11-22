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
  Eye,
  EyeOff,
  SlidersHorizontal,
  Check,
  ArrowUpDown,
} from 'lucide-react';

export interface AdminCategoryItem {
  id: string;
  name: string;
  handle: string;
  status: 'Active' | 'Inactive';
  visibility: 'Public' | 'Private';
  rank?: number;
}

const STORAGE_KEY = 'buyxoco_admin_categories_list';

const INITIAL_CATEGORIES: AdminCategoryItem[] = [
  {
    id: 'cat_shirts',
    name: 'Shirts',
    handle: '/shirts',
    status: 'Inactive',
    visibility: 'Public',
    rank: 1,
  },
  {
    id: 'cat_sweatshirts',
    name: 'Sweatshirts',
    handle: '/sweatshirts',
    status: 'Inactive',
    visibility: 'Public',
    rank: 2,
  },
  {
    id: 'cat_pants',
    name: 'Pants',
    handle: '/pants',
    status: 'Inactive',
    visibility: 'Public',
    rank: 3,
  },
  {
    id: 'cat_merch',
    name: 'Merch',
    handle: '/merch',
    status: 'Inactive',
    visibility: 'Public',
    rank: 4,
  },
  {
    id: 'cat_vitamins',
    name: 'Vitamins & Supplements',
    handle: '/vitamins-supplements',
    status: 'Active',
    visibility: 'Public',
    rank: 5,
  },
];

function getStoredCategories(): AdminCategoryItem[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

function saveStoredCategories(categories: AdminCategoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('buyxoco_admin_categories_changed'));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

interface AdminCategoriesViewProps {
  notify?: (msg: string) => void;
}

export function AdminCategoriesView({ notify }: AdminCategoriesViewProps) {
  const [categories, setCategories] = useState<AdminCategoryItem[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingRanking, setIsEditingRanking] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const menuId = useDismissMenusOnOutsideClick(actionMenuId !== null, () => setActionMenuId(null));

  // Modal states for creating a new category
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [newVisibility, setNewVisibility] = useState<'Public' | 'Private'>('Public');

  useEffect(() => {
    setCategories(getStoredCategories());
    const handleSync = () => {
      setCategories(getStoredCategories());
    };
    window.addEventListener('buyxoco_admin_categories_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_categories_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Category name is required.');
      return;
    }

    const formattedHandle = newHandle.trim()
      ? (newHandle.startsWith('/') ? newHandle.trim() : `/${newHandle.trim()}`)
      : `/${newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

    const newCat: AdminCategoryItem = {
      id: `cat_${Date.now()}`,
      name: newName.trim(),
      handle: formattedHandle,
      status: newStatus,
      visibility: newVisibility,
      rank: categories.length + 1,
    };

    const updated = [...categories, newCat];
    saveStoredCategories(updated);
    setCategories(updated);
    setIsCreateOpen(false);

    setNewName('');
    setNewHandle('');
    setNewStatus('Inactive');
    setNewVisibility('Public');

    notify?.(`Category "${newCat.name}" created.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) {
      const updated = categories.filter((c) => c.id !== id);
      saveStoredCategories(updated);
      setCategories(updated);
      setActionMenuId(null);
      notify?.('Category removed.');
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = categories.map((c) => {
      if (c.id === id) {
        const nextStatus: 'Active' | 'Inactive' = c.status === 'Active' ? 'Inactive' : 'Active';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    saveStoredCategories(updated);
    setCategories(updated);
    setActionMenuId(null);
    notify?.('Category status updated.');
  };

  const handleToggleVisibility = (id: string) => {
    const updated = categories.map((c) => {
      if (c.id === id) {
        const nextVis: 'Public' | 'Private' = c.visibility === 'Public' ? 'Private' : 'Public';
        return { ...c, visibility: nextVis };
      }
      return c;
    });
    saveStoredCategories(updated);
    setCategories(updated);
    setActionMenuId(null);
    notify?.('Category visibility updated.');
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    saveStoredCategories(reordered);
    setCategories(reordered);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.visibility.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN CATEGORIES CARD (MATCHING USER SCREENSHOT EXACTLY)        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title & Subtitle + Action Buttons (Edit ranking, Create) */}
        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-3 bg-white flex-wrap">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Categories
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Organize products into categories, and manage those categories&apos; ranking and hierarchy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditingRanking(!isEditingRanking);
                notify?.(isEditingRanking ? 'Finished editing ranking.' : 'Category ranking mode enabled.');
              }}
              className={`h-8 px-3.5 border rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${
                isEditingRanking
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-800 bg-white hover:bg-gray-50 shadow-2xs'
              }`}
            >
              {isEditingRanking ? 'Done ranking' : 'Edit ranking'}
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
            >
              Create
            </button>
          </div>
        </div>

        {/* Divider line before toolbar */}
        <div className="border-t border-gray-200"></div>

        {/* Toolbar Row: Right-aligned Search Input matching screenshot */}
        <div className="px-5 sm:px-6 py-2.5 flex items-center justify-end bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-52 sm:w-60 transition-all"
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
        </div>

        {/* ============================================================== */}
        {/* CATEGORIES TABLE (EXACTLY MATCHING THE SCREENSHOT)             */}
        {/* ============================================================== */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-5 sm:px-8 font-medium text-gray-600">Name</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Handle</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Visibility</th>
                <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-xs">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Name */}
                    <td className="py-3.5 px-5 sm:px-8 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {isEditingRanking && (
                          <div className="flex items-center gap-1 text-gray-400 mr-1">
                            <button
                              onClick={() => moveCategory(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 hover:text-gray-800 disabled:opacity-20"
                              title="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveCategory(idx, 'down')}
                              disabled={idx === filteredCategories.length - 1}
                              className="p-0.5 hover:text-gray-800 disabled:opacity-20"
                              title="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <span>{c.name}</span>
                      </div>
                    </td>

                    {/* Handle */}
                    <td className="py-3.5 px-4 sm:px-6 text-gray-500 font-normal">
                      {c.handle}
                    </td>

                    {/* Status: Red indicator for Inactive, Green for Active */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <span
                          className={`w-2 h-2 rounded-[2px] inline-block shrink-0 ${
                            c.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{c.status}</span>
                      </div>
                    </td>

                    {/* Visibility: Green indicator for Public */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <span
                          className={`w-2 h-2 rounded-[2px] inline-block shrink-0 ${
                            c.visibility === 'Public' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        ></span>
                        <span>{c.visibility}</span>
                      </div>
                    </td>

                    {/* Action Dropdown ... */}
                    <td className="py-3.5 px-5 sm:px-6 text-right relative" data-click-away-menu={actionMenuId === c.id ? menuId : undefined}>
                      <button
                        onClick={() => setActionMenuId(actionMenuId === c.id ? null : c.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuId === c.id && (
                        <div className="absolute right-4 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                          <button
                            onClick={() => handleToggleStatus(c.id)}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                            <span>Set as {c.status === 'Active' ? 'Inactive' : 'Active'}</span>
                          </button>
                          <button
                            onClick={() => handleToggleVisibility(c.id)}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            {c.visibility === 'Public' ? (
                              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            <span>Set as {c.visibility === 'Public' ? 'Private' : 'Public'}</span>
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

        {/* Footer: Pagination */}
        <div className="border-t border-gray-200 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <div>
            <span>
              1 — {filteredCategories.length} of {filteredCategories.length} results
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
      {/* MODAL: CREATE CATEGORY                                         */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Category
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Organize products into hierarchical store categories.
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
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outerwear"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Handle (URL slug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /outerwear"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  >
                    <option value="Inactive">Inactive</option>
                    <option value="Active">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Visibility
                  </label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
