'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { StorefrontPromotion as AdminPromotionItem } from '@/lib/storefrontPromotions';

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

interface AdminPromotionsViewProps {
  notify?: (msg: string) => void;
}

export function AdminPromotionsView({ notify }: AdminPromotionsViewProps) {
  const [promotions, setPromotions] = useState<AdminPromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Draft' | 'Disabled'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Promotion code'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'code_asc' | 'status_active'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newMethod, setNewMethod] = useState<'Promotion code'>('Promotion code');
  const [newStatus, setNewStatus] = useState<'Active' | 'Draft' | 'Disabled'>('Active');
  const [newValue, setNewValue] = useState('');

  // Edit states
  const [editingPromotion, setEditingPromotion] = useState<AdminPromotionItem | null>(null);

  const loadPromotions = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/storefront-promotions?scope=admin', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load promotions.');
      setPromotions(Array.isArray(result.promotions) ? result.promotions : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load promotions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPromotions(); }, [loadPromotions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/storefront-promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: newCode, method: newMethod, status: newStatus, value: newValue }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to create promotion.');
      setPromotions((current) => [result.promotion, ...current]);
      setIsCreateOpen(false);
      setNewCode(''); setNewMethod('Promotion code'); setNewStatus('Active'); setNewValue('');
      notify?.(`Promotion "${result.promotion.code}" created.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create promotion.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;
    setError('');
    try {
      const response = await fetch('/api/storefront-promotions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editingPromotion, code: editingPromotion.code.toUpperCase() }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update promotion.');
      setPromotions((current) => current.map((promotion) => promotion.id === result.promotion.id ? result.promotion : promotion));
      setEditingPromotion(null);
      notify?.(`Promotion "${result.promotion.code}" updated.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update promotion.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    setError('');
    try {
      const response = await fetch(`/api/storefront-promotions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to delete promotion.');
      setPromotions((current) => current.filter((promotion) => promotion.id !== id));
      setActionMenuId(null);
      notify?.('Promotion removed.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete promotion.');
    }
  };

  const filteredPromotions = useMemo(() => {
    let result = [...promotions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (methodFilter !== 'all') {
      result = result.filter((p) => p.method === methodFilter);
    }

    if (sortBy === 'code_asc') {
      result.sort((a, b) => a.code.localeCompare(b.code));
    } else if (sortBy === 'status_active') {
      result.sort((a, b) => (a.status === 'Active' ? -1 : 1));
    }

    return result;
  }, [promotions, searchQuery, statusFilter, methodFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}
      {/* ============================================================== */}
      {/* MAIN PROMOTIONS CARD (MATCHING USER SCREENSHOT EXACTLY)        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Seamless Header Area (No divider between row 1 and row 2) */}
        <div className="px-5 sm:px-6 pt-5 pb-3.5 space-y-3.5 bg-white">
          {/* Row 1: Title + Action Button (Create) */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Promotions
            </h1>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center shrink-0"
            >
              Create
            </button>
          </div>

          {/* Row 2: Add filter + Search + Sort */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Add Filter Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className={`h-8 px-3.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  statusFilter !== 'all' || methodFilter !== 'all' || isFilterOpen
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                    : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <span>Add filter</span>
                {(statusFilter !== 'all' || methodFilter !== 'all') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>

              {/* Filter Popover */}
              {isFilterOpen && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Filter by Status
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
                    Filter by Method
                  </div>
                  {(['all', 'Promotion code'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMethodFilter(m);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                        methodFilter === m ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{m === 'all' ? 'All Methods' : m}</span>
                      {methodFilter === m && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
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
                      Sort Promotions
                    </div>
                    {[
                      { key: 'default', label: 'Default' },
                      { key: 'code_asc', label: 'Code (A to Z)' },
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
        </div>

        {/* ============================================================== */}
        {/* PROMOTIONS TABLE (EXACTLY MATCHING USER SCREENSHOT)            */}
        {/* ============================================================== */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Code</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Method</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Discount</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Status</th>
                <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-xs">
                    {loading ? 'Loading promotions…' : 'No promotions found. Create a percentage code to use at checkout.'}
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Code badge */}
                    <td className="py-3.5 px-5 sm:px-6 font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-900 border border-gray-200/70">
                        {p.code}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-4 sm:px-6 text-gray-700 font-normal">
                      {p.method}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-gray-700 font-medium">{p.value}</td>

                    {/* Status with green/gray square dot */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2 text-gray-700 font-normal">
                        <span
                          className={`w-2 h-2 rounded-[2px] inline-block shrink-0 ${
                            p.status === 'Active'
                              ? 'bg-emerald-500'
                              : p.status === 'Draft'
                              ? 'bg-gray-400'
                              : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{p.status}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 sm:px-6 text-right relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === p.id ? null : p.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {actionMenuId === p.id && (
                        <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setEditingPromotion(p);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>Edit Promotion</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-full px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600"
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

        {/* Pagination Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-white">
          <span>
            {filteredPromotions.length === 0
              ? '0 of 0 results'
              : `1 — ${filteredPromotions.length} of ${filteredPromotions.length} results`}
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
      </div>

      {/* ============================================================== */}
      {/* CREATE MODAL                                                   */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Create Promotion</h2>
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
                  Promotion Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20, SUMMER10"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Method</label>
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Promotion code">Promotion code</option>
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
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Discount</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% off or 15% off first order"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
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
                  Create Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT MODAL                                                     */}
      {/* ============================================================== */}
      {editingPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Edit Promotion</h2>
              <button
                onClick={() => setEditingPromotion(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Promotion Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingPromotion.code}
                  onChange={(e) =>
                    setEditingPromotion({ ...editingPromotion, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Method</label>
                <select
                  value={editingPromotion.method}
                  onChange={(e) =>
                    setEditingPromotion({ ...editingPromotion, method: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Promotion code">Promotion code</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Status</label>
                <select
                  value={editingPromotion.status}
                  onChange={(e) =>
                    setEditingPromotion({ ...editingPromotion, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Discount</label>
                <input type="text" required value={editingPromotion.value} onChange={(e) => setEditingPromotion({ ...editingPromotion, value: e.target.value })} placeholder="10% off or 15% off first order" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                <p className="mt-1 text-[10px] text-gray-500">1% to 90%. Add “first order” to limit it by checkout email.</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPromotion(null)}
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
