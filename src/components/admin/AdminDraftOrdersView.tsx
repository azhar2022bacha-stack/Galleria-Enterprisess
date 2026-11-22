'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDismissMenusOnOutsideClick } from '@/hooks/useDismissMenusOnOutsideClick';
import {
  Search,
  Filter,
  Plus,
  X,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export interface AdminDraftOrder {
  id: string;
  draftNumber: string;
  createdAt: string;
  customerEmail: string;
  customerName?: string;
  items: {
    title: string;
    quantity: number;
    unitPrice: number;
  }[];
  currency: string;
  status: 'open' | 'completed';
  total: number;
  notes?: string;
}

const STORAGE_KEY = 'buyxoco_admin_draft_orders';

function getStoredDrafts(): AdminDraftOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredDrafts(drafts: AdminDraftOrder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    window.dispatchEvent(new Event('buyxoco_admin_drafts_changed'));
  } catch (err) {
    console.error('Failed to save draft orders:', err);
  }
}

// Custom sort/list icon matching the screenshot (3 horizontal lines + down arrow)
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

// Funnel filter icon matching the screenshot
function FilterFunnelIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 3h11l-4.5 5.5v4.5l-2-1v-3.5L2.5 3z" />
    </svg>
  );
}

interface AdminDraftOrdersViewProps {
  notify?: (msg: string) => void;
}

export function AdminDraftOrdersView({ notify }: AdminDraftOrdersViewProps) {
  const [drafts, setDrafts] = useState<AdminDraftOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const menuId = useDismissMenusOnOutsideClick(isFilterOpen || isSortOpen, () => {
    setIsFilterOpen(false);
    setIsSortOpen(false);
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total_high' | 'total_low'>('newest');

  // Form states for creating a new draft order
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('Standard Product Item');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState('49.99');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newNotes, setNewNotes] = useState('');

  // Sync drafts when storage changes
  useEffect(() => {
    setDrafts(getStoredDrafts());
    const handleSync = () => {
      setDrafts(getStoredDrafts());
    };
    window.addEventListener('buyxoco_admin_drafts_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_drafts_changed', handleSync);
  }, []);

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerEmail.trim()) {
      alert('Please provide a customer email address.');
      return;
    }

    const price = parseFloat(newItemPrice) || 0;
    const qty = Math.max(1, Number(newItemQty) || 1);
    const total = price * qty;
    const nextNumber = drafts.length + 1;

    const newDraft: AdminDraftOrder = {
      id: `draft_${Date.now()}`,
      draftNumber: `#DRAFT-${String(nextNumber).padStart(3, '0')}`,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      customerEmail: newCustomerEmail.trim(),
      customerName: newCustomerName.trim() || undefined,
      items: [
        {
          title: newItemTitle.trim() || 'Custom Order Item',
          quantity: qty,
          unitPrice: price,
        },
      ],
      currency: newCurrency,
      status: 'open',
      total,
      notes: newNotes.trim() || undefined,
    };

    const updated = [newDraft, ...drafts];
    saveStoredDrafts(updated);
    setDrafts(updated);
    setIsCreateModalOpen(false);

    // Reset fields
    setNewCustomerEmail('');
    setNewCustomerName('');
    setNewItemTitle('Standard Product Item');
    setNewItemQty(1);
    setNewItemPrice('49.99');
    setNewNotes('');

    notify?.(`Draft order ${newDraft.draftNumber} created successfully.`);
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this draft order?')) {
      const updated = drafts.filter((d) => d.id !== id);
      saveStoredDrafts(updated);
      setDrafts(updated);
      notify?.('Draft order deleted.');
    }
  };

  // Filtered & sorted drafts
  const filteredDrafts = useMemo(() => {
    let result = [...drafts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.draftNumber.toLowerCase().includes(q) ||
          d.customerEmail.toLowerCase().includes(q) ||
          (d.customerName && d.customerName.toLowerCase().includes(q)) ||
          d.items.some((i) => i.title.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return a.id.localeCompare(b.id);
      }
      if (sortBy === 'total_high') {
        return b.total - a.total;
      }
      if (sortBy === 'total_low') {
        return a.total - b.total;
      }
      return b.id.localeCompare(a.id); // newest first
    });

    return result;
  }, [drafts, searchQuery, statusFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN DRAFT ORDERS CARD (MATCHING USER SCREENSHOT EXACTLY)        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Card Header Row */}
        <div className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Draft Orders
          </h1>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
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

            {/* Filter Funnel Button */}
            <div className="relative" data-click-away-menu={isFilterOpen ? menuId : undefined}>
              <button
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-colors ${
                  statusFilter !== 'all' || isFilterOpen
                    ? 'border-gray-400 bg-gray-50 text-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Filter options"
              >
                <FilterFunnelIcon className="w-3.5 h-3.5" />
              </button>

              {/* Filter Popover Dropdown */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Status Filter
                  </div>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      statusFilter === 'all' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>All Drafts</span>
                    {statusFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('open');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      statusFilter === 'open' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Open</span>
                    {statusFilter === 'open' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('completed');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      statusFilter === 'completed' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Completed</span>
                    {statusFilter === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                </div>
              )}
            </div>

            {/* Sort / Reorder Icon Button */}
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

              {/* Sort Popover Dropdown */}
              {isSortOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Sort Order
                  </div>
                  {[
                    { key: 'newest', label: 'Newest First' },
                    { key: 'oldest', label: 'Oldest First' },
                    { key: 'total_high', label: 'Total (Highest)' },
                    { key: 'total_low', label: 'Total (Lowest)' },
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

            {/* Create Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center"
            >
              Create
            </button>
          </div>
        </div>

        {/* Sub-bar with left filter icon and right sort icon matching screenshot */}
        <div className="border-t border-gray-200 px-3.5 sm:px-6 py-2 flex items-center justify-between bg-white">
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="h-7 w-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
            title="Toggle filter"
          >
            <FilterFunnelIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="h-7 w-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
            title="Toggle sort"
          >
            <ListSortIcon className="w-3 h-3" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* MAIN BODY: EMPTY STATE OR DRAFT ORDERS LIST                     */}
        {/* ============================================================== */}
        {filteredDrafts.length === 0 ? (
          /* Empty State strictly matching the uploaded screenshot */
          <div className="py-28 sm:py-36 flex flex-col items-center justify-center text-center px-4 bg-white select-none">
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
              No draft orders found
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Create a new draft order to get started.
            </p>
          </div>
        ) : (
          /* When draft orders are created, display clean Medusa-style table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60 text-gray-500 font-medium">
                  <th className="py-2.5 px-4 font-medium">Draft #</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Customer</th>
                  <th className="py-2.5 px-4 font-medium">Items</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total</th>
                  <th className="py-2.5 px-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredDrafts.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span>{d.draftNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{d.createdAt}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{d.customerName || 'Customer'}</div>
                      <div className="text-[11px] text-gray-400">{d.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {d.items.map((it, idx) => (
                        <div key={idx} className="truncate max-w-[200px]">
                          {it.quantity}x {it.title}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {d.status === 'open' ? 'Open Draft' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${d.total.toFixed(2)} {d.currency}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => handleDeleteDraft(d.id, e)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* FOOTER: PAGINATION BAR MATCHING SCREENSHOT                     */}
        {/* ============================================================== */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-gray-500 bg-white select-none">
          <div>
            {filteredDrafts.length === 0 ? (
              <span>0 — 0 of 0 results</span>
            ) : (
              <span>
                1 — {filteredDrafts.length} of {filteredDrafts.length} results
              </span>
            )}
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
      {/* MODAL: CREATE DRAFT ORDER                                      */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Draft Order
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set up a custom order draft on behalf of a customer.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateDraft} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Customer Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Item Description
                  </label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or instructions for this draft..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black text-xs font-semibold shadow-2xs transition-colors"
                >
                  Save Draft Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
