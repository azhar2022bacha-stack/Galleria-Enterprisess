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
  Users,
  Plus,
} from 'lucide-react';

export interface AdminCustomerGroupItem {
  id: string;
  title: string;
  membersCount: number;
  createdAt: string;
}

const STORAGE_KEY = 'buyxoco_admin_customer_groups_v2';

const INITIAL_GROUPS: AdminCustomerGroupItem[] = [];

function getStoredGroups(): AdminCustomerGroupItem[] {
  if (typeof window === 'undefined') return INITIAL_GROUPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_GROUPS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_GROUPS;
  } catch {
    return INITIAL_GROUPS;
  }
}

function saveStoredGroups(groups: AdminCustomerGroupItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    window.dispatchEvent(new Event('buyxoco_admin_customer_groups_changed'));
  } catch (err) {
    console.error('Failed to save customer groups:', err);
  }
}

function FunnelIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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
      <path d="M2.5 3.5H13.5L9.5 8.5V12.5L6.5 13.5V8.5L2.5 3.5Z" />
    </svg>
  );
}

function ListSortUpDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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
      <line x1="2.5" y1="4.5" x2="8" y2="4.5" />
      <line x1="2.5" y1="8" x2="6.5" y2="8" />
      <line x1="2.5" y1="11.5" x2="8" y2="11.5" />
      <path d="M11 3.5V12.5M11 3.5L9.5 5M11 3.5L12.5 5M14 11L12.5 12.5L11 11" />
    </svg>
  );
}

function ListSortDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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

interface AdminCustomerGroupsViewProps {
  notify?: (msg: string) => void;
}

export function AdminCustomerGroupsView({ notify }: AdminCustomerGroupsViewProps) {
  const [groups, setGroups] = useState<AdminCustomerGroupItem[]>(INITIAL_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'title_asc' | 'members_high' | 'created_newest'>('default');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const menuId = useDismissMenusOnOutsideClick(isFilterOpen || isSortOpen || actionMenuId !== null, () => {
    setIsFilterOpen(false);
    setIsSortOpen(false);
    setActionMenuId(null);
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMembersCount, setNewMembersCount] = useState<number>(0);

  // Edit states
  const [editingGroup, setEditingGroup] = useState<AdminCustomerGroupItem | null>(null);

  useEffect(() => {
    setGroups(getStoredGroups());
    const handleSync = () => {
      setGroups(getStoredGroups());
    };
    window.addEventListener('buyxoco_admin_customer_groups_changed', handleSync);
    return () => window.removeEventListener('buyxoco_admin_customer_groups_changed', handleSync);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Group title is required.');
      return;
    }

    const newGrp: AdminCustomerGroupItem = {
      id: `grp_${Date.now()}`,
      title: newTitle.trim(),
      membersCount: Number(newMembersCount) || 0,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const updated = [newGrp, ...groups];
    saveStoredGroups(updated);
    setGroups(updated);
    setIsCreateOpen(false);

    setNewTitle('');
    setNewMembersCount(0);
    notify?.(`Customer Group "${newGrp.title}" created.`);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.title.trim()) return;

    const updated = groups.map((g) =>
      g.id === editingGroup.id ? editingGroup : g
    );
    saveStoredGroups(updated);
    setGroups(updated);
    setEditingGroup(null);
    notify?.(`Customer Group "${editingGroup.title}" updated.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer group?')) {
      const updated = groups.filter((g) => g.id !== id);
      saveStoredGroups(updated);
      setGroups(updated);
      setActionMenuId(null);
      notify?.('Customer group removed.');
    }
  };

  const filteredGroups = useMemo(() => {
    let result = [...groups];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) => g.title.toLowerCase().includes(q));
    }

    if (sortBy === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'members_high') {
      result.sort((a, b) => b.membersCount - a.membersCount);
    } else if (sortBy === 'created_newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [groups, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN CUSTOMER GROUPS CARD (MATCHING USER SCREENSHOT EXACTLY)   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Header Row: Title on Left, Controls on Right */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 bg-white flex-wrap">
          {/* Title */}
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
            Customer Groups
          </h1>

          {/* Right Controls: Filter Icon, Sort Icon, Search Bar, Create Button */}
          <div className="flex items-center gap-2">
            {/* Filter Icon Button */}
            <div className="relative" data-click-away-menu={isFilterOpen ? menuId : undefined}>
              <button
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-colors ${
                  isFilterOpen
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Filter"
              >
                <FunnelIcon className="w-3.5 h-3.5" />
              </button>

              {/* Filter Popover */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Filter Groups
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>All Groups</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>

            {/* Sort Icon Button */}
            <div className="relative" data-click-away-menu={isSortOpen ? menuId : undefined}>
              <button
                onClick={() => {
                  setIsSortOpen((prev) => !prev);
                  setIsFilterOpen(false);
                }}
                className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-colors ${
                  isSortOpen
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Sort"
              >
                <ListSortUpDownIcon className="w-3.5 h-3.5" />
              </button>

              {/* Sort Popover */}
              {isSortOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 text-xs">
                  <div className="font-semibold text-gray-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                    Sort Groups
                  </div>
                  {[
                    { key: 'default', label: 'Default' },
                    { key: 'title_asc', label: 'Title (A to Z)' },
                    { key: 'members_high', label: 'Members (High to Low)' },
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

            {/* Search Input matching Q Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-40 sm:w-52 transition-all"
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

            {/* Create Button */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-8 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center shrink-0"
            >
              Create
            </button>
          </div>
        </div>

        {/* Divider line directly under the header */}
        <div className="border-t border-gray-200"></div>

        {/* Sub-toolbar Row matching screenshot: Funnel on far left, Sort on far right */}
        <div className="px-5 sm:px-6 py-2.5 flex items-center justify-between bg-white border-b border-gray-200">
          {/* Sub Funnel Button on left */}
          <button data-click-away-menu={isFilterOpen ? menuId : undefined}
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            title="Filter view"
          >
            <FunnelIcon className="w-3.5 h-3.5" />
          </button>

          {/* Sub Sort Button on right */}
          <button data-click-away-menu={isSortOpen ? menuId : undefined}
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            title="Sort view"
          >
            <ListSortDownIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* BODY: EMPTY STATE (EXACT MATCH FOR USER SCREENSHOT)            */}
        {/* ============================================================== */}
        {filteredGroups.length === 0 ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4 bg-white select-none">
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
              No customer groups
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              There are no customer groups to display.
            </p>
          </div>
        ) : (
          /* When groups exist, display the table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                  <th className="py-3 px-5 sm:px-6 font-medium text-gray-600">Title</th>
                  <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Members</th>
                  <th className="py-3 px-4 sm:px-6 font-medium text-gray-600">Created</th>
                  <th className="py-3 px-5 sm:px-6 font-medium text-right text-gray-600 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                {filteredGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-3.5 px-5 sm:px-6 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{g.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {g.membersCount} {g.membersCount === 1 ? 'member' : 'members'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-gray-600 font-normal">
                      {g.createdAt}
                    </td>
                    <td className="py-3.5 px-5 sm:px-6 text-right relative" data-click-away-menu={actionMenuId === g.id ? menuId : undefined}>
                      <button
                        onClick={() => setActionMenuId(actionMenuId === g.id ? null : g.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {actionMenuId === g.id && (
                        <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs text-left">
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setEditingGroup(g);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>Edit Group</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDelete(g.id)}
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
        )}

        {/* ============================================================== */}
        {/* PAGINATION FOOTER (MATCHING USER SCREENSHOT EXACTLY)           */}
        {/* ============================================================== */}
        <div className="px-5 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-white">
          <span>
            {filteredGroups.length === 0
              ? '0 — 0 of 0 results'
              : `1 — ${filteredGroups.length} of ${filteredGroups.length} results`}
          </span>
          <div className="flex items-center gap-4">
            <span>1 of 1 pages</span>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="text-gray-300 cursor-not-allowed text-xs font-medium"
              >
                Prev
              </button>
              <button
                disabled
                className="text-gray-300 cursor-not-allowed text-xs font-medium"
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
              <h2 className="text-sm font-semibold text-gray-900">Create Customer Group</h2>
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
                  placeholder="e.g. VIP Customers, Wholesale"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Initial Member Count</label>
                <input
                  type="number"
                  min="0"
                  value={newMembersCount}
                  onChange={(e) => setNewMembersCount(parseInt(e.target.value) || 0)}
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
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT MODAL                                                     */}
      {/* ============================================================== */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Edit Customer Group</h2>
              <button
                onClick={() => setEditingGroup(null)}
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
                  value={editingGroup.title}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Member Count</label>
                <input
                  type="number"
                  min="0"
                  value={editingGroup.membersCount}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      membersCount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
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
