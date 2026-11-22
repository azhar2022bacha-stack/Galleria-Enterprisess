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
  Plus,
} from 'lucide-react';

export interface AdminCustomerItem {
  id: string;
  email: string;
  name: string;
  accountType: 'Guest' | 'Registered';
  createdAt: string;
  phone?: string;
}

const STORAGE_KEY = 'buyxoco_admin_customers_list';

const INITIAL_CUSTOMERS: AdminCustomerItem[] = [
  {
    id: 'cust_1',
    email: 'buyer@example.com',
    name: '-',
    accountType: 'Guest',
    createdAt: 'Jul 15, 2026',
  },
  {
    id: 'cust_2',
    email: 'buyer2@example.com',
    name: '-',
    accountType: 'Guest',
    createdAt: 'Jul 21, 2026',
  },
  {
    id: 'cust_3',
    email: 'buyer3@example.com',
    name: '-',
    accountType: 'Guest',
    createdAt: 'Jul 21, 2026',
  },
];

function getStoredCustomers(): AdminCustomerItem[] {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CUSTOMERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

function saveStoredCustomers(customers: AdminCustomerItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    window.dispatchEvent(new Event('buyxoco_admin_customers_changed'));
  } catch (err) {
    console.error('Failed to save customers:', err);
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

interface AdminCustomersViewProps {
  notify?: (msg: string) => void;
}

export function AdminCustomersView({ notify }: AdminCustomersViewProps) {
  const [customers, setCustomers] = useState<AdminCustomerItem[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<'all' | 'Guest' | 'Registered'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'email_asc' | 'created_newest'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const menuId = useDismissMenusOnOutsideClick(isFilterOpen || isSortOpen || actionMenuId !== null, () => {
    setIsFilterOpen(false);
    setIsSortOpen(false);
    setActionMenuId(null);
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAccountType, setNewAccountType] = useState<'Guest' | 'Registered'>('Guest');

  useEffect(() => {
    setCustomers(getStoredCustomers());
    const handleSync = () => {
      setCustomers(getStoredCustomers());
    };
    window.addEventListener('buyxoco_admin_customers_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_customers_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert('Email is required.');
      return;
    }

    const newCust: AdminCustomerItem = {
      id: `cust_${Date.now()}`,
      email: newEmail.trim(),
      name: newName.trim() || '-',
      phone: newPhone.trim() || undefined,
      accountType: newAccountType,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const updated = [newCust, ...customers];
    saveStoredCustomers(updated);
    setCustomers(updated);
    setIsCreateOpen(false);

    setNewEmail('');
    setNewName('');
    setNewPhone('');
    setNewAccountType('Guest');

    notify?.(`Customer ${newCust.email} added.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer account?')) {
      const updated = customers.filter((c) => c.id !== id);
      saveStoredCustomers(updated);
      setCustomers(updated);
      setActionMenuId(null);
      notify?.('Customer removed.');
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.accountType.toLowerCase().includes(q)
      );
    }

    if (accountFilter !== 'all') {
      result = result.filter((c) => c.accountType === accountFilter);
    }

    if (sortBy === 'email_asc') {
      result.sort((a, b) => a.email.localeCompare(b.email));
    } else if (sortBy === 'created_newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [customers, searchQuery, accountFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN CUSTOMERS CARD (MATCHING USER SCREENSHOT EXACTLY)         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Seamless Header Area (No divider between row 1 and row 2) */}
        <div className="px-5 sm:px-6 pt-5 pb-3.5 space-y-3.5 bg-white">
          {/* Row 1: Title + Action Button (Create) */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Customers
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
            <div className="relative" data-click-away-menu={isFilterOpen ? menuId : undefined}>
              <button
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className={`h-8 px-3.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  accountFilter !== 'all' || isFilterOpen
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                    : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <span>Add filter</span>
                {accountFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                )}
              </button>

              {/* Filter Popover */}
              {isFilterOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Account Type
                  </div>
                  <button
                    onClick={() => {
                      setAccountFilter('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      accountFilter === 'all' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>All Accounts</span>
                    {accountFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setAccountFilter('Guest');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      accountFilter === 'Guest' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Guest</span>
                    {accountFilter === 'Guest' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => {
                      setAccountFilter('Registered');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      accountFilter === 'Registered' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Registered</span>
                    {accountFilter === 'Registered' && <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />}
                  </button>
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
                      Sort Customers
                    </div>
                    {[
                      { key: 'default', label: 'Default' },
                      { key: 'email_asc', label: 'Email (A to Z)' },
                      { key: 'created_newest', label: 'Recently Added' },
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
        {/* CUSTOMERS TABLE (EXACTLY MATCHING THE SCREENSHOT)              */}
        {/* ============================================================== */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Email</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Name</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Account</th>
                <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Created</th>
                <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-xs">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Email */}
                    <td className="py-3.5 px-5 sm:px-6 font-medium text-gray-900">
                      {c.email}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 sm:px-6 text-gray-500 font-normal">
                      {c.name}
                    </td>

                    {/* Account Type: Orange/Amber square for Guest, Green for Registered */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <span
                          className={`w-2 h-2 rounded-[2px] inline-block shrink-0 ${
                            c.accountType === 'Registered' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        ></span>
                        <span>{c.accountType}</span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                      {c.createdAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 sm:px-6 text-right relative" data-click-away-menu={actionMenuId === c.id ? menuId : undefined}>
                      <button
                        onClick={() => setActionMenuId(actionMenuId === c.id ? null : c.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {actionMenuId === c.id && (
                        <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              notify?.(`Customer details for ${c.email}`);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>View Details</span>
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
              1 — {filteredCustomers.length} of {filteredCustomers.length} results
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
      {/* MODAL: CREATE CUSTOMER                                         */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Create Customer
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Add a new customer profile to your store.
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
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. buyer@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Account Type
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs"
                  >
                    <option value="Guest">Guest</option>
                    <option value="Registered">Registered</option>
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
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
