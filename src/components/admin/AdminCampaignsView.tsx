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
  Sparkles,
} from 'lucide-react';

export interface AdminCampaignItem {
  id: string;
  name: string;
  identifier: string;
  budget: string;
  status: 'Active' | 'Draft' | 'Expired';
  createdAt: string;
}

const STORAGE_KEY = 'buyxoco_admin_campaigns_v2';

const INITIAL_CAMPAIGNS: AdminCampaignItem[] = [];

function getStoredCampaigns(): AdminCampaignItem[] {
  if (typeof window === 'undefined') return INITIAL_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CAMPAIGNS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CAMPAIGNS;
  } catch {
    return INITIAL_CAMPAIGNS;
  }
}

function saveStoredCampaigns(campaigns: AdminCampaignItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    window.dispatchEvent(new Event('buyxoco_admin_campaigns_changed'));
  } catch (err) {
    console.error('Failed to save campaigns:', err);
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

interface AdminCampaignsViewProps {
  notify?: (msg: string) => void;
}

export function AdminCampaignsView({ notify }: AdminCampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<AdminCampaignItem[]>(INITIAL_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Draft' | 'Expired'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'name_asc' | 'status_active'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [newBudget, setNewBudget] = useState('$5,000.00');
  const [newStatus, setNewStatus] = useState<'Active' | 'Draft'>('Active');

  // Edit states
  const [editingCampaign, setEditingCampaign] = useState<AdminCampaignItem | null>(null);

  useEffect(() => {
    setCampaigns(getStoredCampaigns());
    const handleSync = () => {
      setCampaigns(getStoredCampaigns());
    };
    window.addEventListener('buyxoco_admin_campaigns_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_campaigns_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Campaign name is required.');
      return;
    }

    const formattedId = newIdentifier.trim()
      ? newIdentifier.trim().toLowerCase().replace(/\s+/g, '-')
      : newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newCamp: AdminCampaignItem = {
      id: `camp_${Date.now()}`,
      name: newName.trim(),
      identifier: formattedId,
      budget: newBudget.trim() ? `$0.00 / ${newBudget.trim()}` : 'No limit',
      status: newStatus,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const updated = [newCamp, ...campaigns];
    saveStoredCampaigns(updated);
    setCampaigns(updated);
    setIsCreateOpen(false);

    setNewName('');
    setNewIdentifier('');
    setNewBudget('$5,000.00');
    setNewStatus('Active');

    notify?.(`Campaign "${newCamp.name}" created.`);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign || !editingCampaign.name.trim()) return;

    const updated = campaigns.map((c) =>
      c.id === editingCampaign.id ? editingCampaign : c
    );
    saveStoredCampaigns(updated);
    setCampaigns(updated);
    setEditingCampaign(null);
    notify?.(`Campaign "${editingCampaign.name}" updated.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this campaign?')) {
      const updated = campaigns.filter((c) => c.id !== id);
      saveStoredCampaigns(updated);
      setCampaigns(updated);
      setActionMenuId(null);
      notify?.('Campaign removed.');
    }
  };

  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.identifier.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'status_active') {
      result.sort((a, b) => (a.status === 'Active' ? -1 : 1));
    }

    return result;
  }, [campaigns, searchQuery, statusFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN CAMPAIGNS CARD (MATCHING USER SCREENSHOT EXACTLY)         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title on Left, Create on Right (No Subtitle) */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 bg-white">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Campaigns
          </h1>

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
        {campaigns.length === 0 ? (
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
          /* When campaigns exist, render toolbar + table + footer */
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
                      Campaign Status
                    </div>
                    {(['all', 'Active', 'Draft', 'Expired'] as const).map((st) => (
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
                        Sort Campaigns
                      </div>
                      {[
                        { key: 'default', label: 'Default' },
                        { key: 'name_asc', label: 'Name (A to Z)' },
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

            {/* Campaigns Table */}
            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                    <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Campaign</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Identifier</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Budget Spent</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Status</th>
                    <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-3.5 px-5 sm:px-6 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-gray-500 font-mono text-[11px]">
                        {c.identifier}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-gray-700 font-normal">
                        {c.budget}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2 text-gray-700 font-normal">
                          <span
                            className={`w-2 h-2 rounded-[2px] inline-block shrink-0 ${
                              c.status === 'Active'
                                ? 'bg-emerald-500'
                                : c.status === 'Draft'
                                ? 'bg-gray-400'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{c.status}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 sm:px-6 text-right relative">
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
                                setEditingCampaign(c);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>Edit Campaign</span>
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => handleDelete(c.id)}
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
                1 — {filteredCampaigns.length} of {filteredCampaigns.length} results
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
              <h2 className="text-sm font-semibold text-gray-900">Create Campaign</h2>
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
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Launch 2026"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. summer-2026"
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Budget Limit</label>
                <input
                  type="text"
                  placeholder="$5,000.00"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
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
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT MODAL                                                     */}
      {/* ============================================================== */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Edit Campaign</h2>
              <button
                onClick={() => setEditingCampaign(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCampaign.name}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Identifier</label>
                <input
                  type="text"
                  value={editingCampaign.identifier}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, identifier: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Budget</label>
                <input
                  type="text"
                  value={editingCampaign.budget}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, budget: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Status</label>
                <select
                  value={editingCampaign.status}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
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
