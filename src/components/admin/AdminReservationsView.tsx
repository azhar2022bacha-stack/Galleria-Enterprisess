'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export interface AdminReservationItem {
  id: string;
  sku: string;
  orderNumber: string;
  description: string;
  location: string;
  quantity: number;
  createdAt: string;
}

const STORAGE_KEY = 'buyxoco_admin_reservations_list';

const INITIAL_RESERVATIONS: AdminReservationItem[] = [];

function getStoredReservations(): AdminReservationItem[] {
  if (typeof window === 'undefined') return INITIAL_RESERVATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_RESERVATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RESERVATIONS;
  } catch {
    return INITIAL_RESERVATIONS;
  }
}

function saveStoredReservations(reservations: AdminReservationItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    window.dispatchEvent(new Event('buyxoco_admin_reservations_changed'));
  } catch (err) {
    console.error('Failed to save reservations:', err);
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

interface AdminReservationsViewProps {
  notify?: (msg: string) => void;
}

export function AdminReservationsView({ notify }: AdminReservationsViewProps) {
  const [items, setItems] = useState<AdminReservationItem[]>(INITIAL_RESERVATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'sku_asc' | 'qty_high'>('default');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSku, setNewSku] = useState('SHIRT-S-BLACK');
  const [newOrder, setNewOrder] = useState('#32');
  const [newDescription, setNewDescription] = useState('Essential Cotton Tee - S / Black');
  const [newLocation, setNewLocation] = useState('Default Location');
  const [newQuantity, setNewQuantity] = useState(1);

  useEffect(() => {
    setItems(getStoredReservations());
    const handleSync = () => {
      setItems(getStoredReservations());
    };
    window.addEventListener('buyxoco_admin_reservations_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_reservations_changed', handleSync);
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim()) {
      alert('SKU is required.');
      return;
    }

    const newRes: AdminReservationItem = {
      id: `res_${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      orderNumber: newOrder.trim() || '#New',
      description: newDescription.trim() || 'Inventory Item',
      location: newLocation.trim() || 'Default Location',
      quantity: Math.max(1, Number(newQuantity) || 1),
      createdAt: 'Just now',
    };

    const updated = [newRes, ...items];
    saveStoredReservations(updated);
    setItems(updated);
    setIsCreateOpen(false);

    notify?.(`Created reservation for ${newRes.sku}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Release this reservation? Stock will return to available inventory.')) {
      const updated = items.filter((i) => i.id !== id);
      saveStoredReservations(updated);
      setItems(updated);
      setActionMenuId(null);
      notify?.('Reservation released.');
    }
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.orderNumber.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'sku_asc') {
      result.sort((a, b) => a.sku.localeCompare(b.sku));
    } else if (sortBy === 'qty_high') {
      result.sort((a, b) => b.quantity - a.quantity);
    }

    return result;
  }, [items, searchQuery, sortBy]);

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN RESERVATIONS CARD (MATCHING USER SCREENSHOT EXACTLY)      */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title & Subtitle + Create Button */}
        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-3 bg-white">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Reservations
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage the reserved quantity of inventory items.
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
        {filteredItems.length === 0 ? (
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
          /* When reservations are created, render toolbar + table + footer */
          <>
            {/* Toolbar Row */}
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
                      Location Filter
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-gray-600 hover:bg-gray-50"
                    >
                      All Locations
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-gray-600 hover:bg-gray-50"
                    >
                      Default Location
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
                        Sort Reservations
                      </div>
                      {[
                        { key: 'default', label: 'Default' },
                        { key: 'sku_asc', label: 'SKU (A to Z)' },
                        { key: 'qty_high', label: 'Most Quantity' },
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

            {/* Reservations Table */}
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
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Item / SKU</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Order</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Description</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Location</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Quantity</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Created</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                  {filteredItems.map((item) => {
                    const isChecked = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50/70 transition-colors group ${
                          isChecked ? 'bg-gray-50/50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-900 font-mono text-[11.5px]">
                          {item.sku}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-900">
                          {item.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-gray-600">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-gray-500">
                          {item.location}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-gray-500">
                          {item.createdAt}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="Options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {actionMenuId === item.id && (
                            <div className="absolute right-4 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Release Reservation</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
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
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: CREATE RESERVATION                                      */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Reservation
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Reserve inventory units for a customer or wholesale order.
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
                  Item SKU *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHIRT-S-BLACK"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #32"
                    value={newOrder}
                    onChange={(e) => setNewOrder(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Essential Cotton Tee - S / Black"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
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
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
