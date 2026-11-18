'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface ShortcutItem {
  id: string;
  tab: AdminTab;
  label: string;
  iconType: string;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  // Row 1
  { id: 'todo', tab: 'todo', label: 'To-do', iconType: 'todo' },
  { id: 'audit_log', tab: 'audit_log', label: 'Audit Log', iconType: 'audit_log' },
  { id: 'accounts', tab: 'accounts', label: 'Accounts', iconType: 'accounts' },

  // Row 2
  { id: 'consign', tab: 'consign', label: 'Consign', iconType: 'consign' },
  { id: 'owners', tab: 'owners', label: 'Owners', iconType: 'owners' },
  { id: 'support', tab: 'support', label: 'Support', iconType: 'support' },

  // Row 3
  { id: 'recharges', tab: 'recharges', label: 'Recharges', iconType: 'recharges' },
  { id: 'withdrawals', tab: 'withdrawals', label: 'Withdrawals', iconType: 'withdrawals' },
  { id: 'invites', tab: 'invites', label: 'Invites', iconType: 'invites' },

  // Row 4
  { id: 'verification', tab: 'verification', label: 'Verification', iconType: 'verification' },
  { id: 'reviews', tab: 'reviews', label: 'Reviews', iconType: 'reviews' },
  { id: 'disputes', tab: 'disputes', label: 'Disputes', iconType: 'disputes' },

  // Row 5
  { id: 'handover', tab: 'handover', label: 'Handover', iconType: 'handover' },
  { id: 'analytics', tab: 'analytics', label: 'Analytics', iconType: 'analytics' },
  { id: 'live', tab: 'live', label: 'Live', iconType: 'live' },

  // Row 6
  { id: 'payouts', tab: 'payouts', label: 'Payouts', iconType: 'payouts' },
  { id: 'site_settings', tab: 'site_settings', label: 'Site Settings', iconType: 'site_settings' },
  { id: 'wallet_ledger', tab: 'wallet_ledger', label: 'Ledger', iconType: 'wallet_ledger' },

  // Row 7
  { id: 'receiving_address', tab: 'receiving_address', label: 'Receiving', iconType: 'receiving_address' },
  { id: 'restock', tab: 'restock', label: 'Restock', iconType: 'restock' },
  { id: 'refund_governance', tab: 'refund_governance', label: 'Refunds', iconType: 'refund_governance' },
];

interface AdminShortcutsViewProps {
  onSelectTab?: (tab: AdminTab) => void;
  notify?: (msg: string) => void;
}

export function AdminShortcutsView({ onSelectTab, notify }: AdminShortcutsViewProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(DEFAULT_SHORTCUTS);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Load custom reordered list from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('buyxoco_admin_shortcuts_order');
      if (saved) {
        const savedIds: string[] = JSON.parse(saved);
        const itemMap = new Map(DEFAULT_SHORTCUTS.map((item) => [item.id, item]));
        const ordered: ShortcutItem[] = [];
        savedIds.forEach((id) => {
          const found = itemMap.get(id);
          if (found) {
            ordered.push(found);
            itemMap.delete(id);
          }
        });
        // Append any items that were not in saved list
        itemMap.forEach((val) => ordered.push(val));
        if (ordered.length === DEFAULT_SHORTCUTS.length) {
          setShortcuts(ordered);
        }
      }
    } catch {
      // Ignore parse errors and fallback to defaults
    }
  }, []);

  const saveOrder = (newItems: ShortcutItem[]) => {
    setShortcuts(newItems);
    try {
      localStorage.setItem(
        'buyxoco_admin_shortcuts_order',
        JSON.stringify(newItems.map((i) => i.id))
      );
    } catch {
      // storage unavailable
    }
  };

  const moveItem = (index: number, delta: number) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= shortcuts.length) return;
    const nextList = [...shortcuts];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIdx, 0, moved);
    saveOrder(nextList);
  };

  const handleReset = () => {
    saveOrder(DEFAULT_SHORTCUTS);
    try {
      localStorage.removeItem('buyxoco_admin_shortcuts_order');
    } catch {
      // ignore
    }
    notify?.('Shortcuts order reset to default');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.setData('text/plain', `${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) return;
    const nextList = [...shortcuts];
    const [moved] = nextList.splice(draggedIdx, 1);
    nextList.splice(targetIndex, 0, moved);
    saveOrder(nextList);
    setDraggedIdx(null);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'todo':
        return (
          <div className="w-[19px] h-[19px] rounded-[3px] bg-[#00a82d] border border-black flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
          </div>
        );
      case 'audit_log':
        return <span className="text-[17px] leading-none shrink-0 select-none">📜</span>;
      case 'accounts':
        return (
          <div className="w-[19px] h-[19px] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#1e293b]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        );
      case 'consign':
        return <span className="text-[17px] leading-none shrink-0 select-none">📦</span>;
      case 'owners':
        return <span className="text-[17px] leading-none shrink-0 select-none">🏪</span>;
      case 'support':
        return <span className="text-[17px] leading-none shrink-0 select-none">💬</span>;
      case 'recharges':
        return <span className="text-[17px] leading-none shrink-0 select-none">💳</span>;
      case 'withdrawals':
        return (
          <div className="w-[19px] h-[19px] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M4 14l3-3h10l3 3v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.4" />
              <path d="M12 3v10m-3-3l3-3 3 3" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case 'invites':
        return <span className="text-[17px] leading-none shrink-0 select-none">🎫</span>;
      case 'verification':
        return (
          <div className="w-[18px] h-[18px] flex flex-col justify-between py-[1.5px] px-[2px] shrink-0">
            <div className="w-full h-[2.5px] bg-black rounded-[0.5px]"></div>
            <div className="w-full h-[2.5px] bg-black rounded-[0.5px]"></div>
            <div className="w-full h-[2.5px] bg-black rounded-[0.5px]"></div>
            <div className="w-full h-[2.5px] bg-black rounded-[0.5px]"></div>
          </div>
        );
      case 'reviews':
        return <span className="text-[17px] leading-none shrink-0 select-none">⭐</span>;
      case 'disputes':
        return <span className="text-[17px] leading-none shrink-0 select-none">⚖️</span>;
      case 'handover':
        return (
          <div className="w-[19px] h-[19px] rounded-[3px] bg-[#0284c7] flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </div>
        );
      case 'analytics':
        return <span className="text-[17px] leading-none shrink-0 select-none">📊</span>;
      case 'live':
        return <span className="text-[17px] leading-none shrink-0 select-none">📡</span>;
      case 'payouts':
        return <span className="text-[17px] leading-none shrink-0 select-none">💵</span>;
      case 'site_settings':
        return <span className="text-[17px] leading-none shrink-0 select-none">⚙️</span>;
      case 'wallet_ledger':
        return <span className="text-[17px] leading-none shrink-0 select-none">💰</span>;
      case 'receiving_address':
        return <span className="text-[17px] leading-none shrink-0 select-none">🏢</span>;
      case 'restock':
        return (
          <div className="w-[19px] h-[19px] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 17h16M5 17V7h10v10M7 7V4h6v3" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="7" y="9" width="6" height="5" rx="1" fill="#ef4444" />
              <circle cx="6" cy="19" r="1.5" fill="#334155" />
              <circle cx="16" cy="19" r="1.5" fill="#334155" />
            </svg>
          </div>
        );
      case 'refund_governance':
        return (
          <div className="w-[19px] h-[19px] rounded-[3px] bg-[#0369a1] flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
          </div>
        );
      default:
        return <span className="text-[17px] leading-none shrink-0 select-none">📋</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7">
        {/* Header with Title, Instructions, and Reset Button */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Shortcuts
            </h1>
            <p className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-1 leading-relaxed">
              <span>Drag the</span>
              <span className="inline-flex items-center text-gray-400 font-bold select-none">
                <svg className="w-3.5 h-3.5 inline text-gray-400" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="3.5" r="1.3" />
                  <circle cx="11" cy="3.5" r="1.3" />
                  <circle cx="5" cy="8" r="1.3" />
                  <circle cx="11" cy="8" r="1.3" />
                  <circle cx="5" cy="12.5" r="1.3" />
                  <circle cx="11" cy="12.5" r="1.3" />
                </svg>
              </span>
              <span>handle or use ↑ ↓ to reorder. The order is saved to your account only and applies just to you. Click a card to open it.</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors shadow-2xs shrink-0"
          >
            Reset
          </button>
        </div>

        {/* 3-Column Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {shortcuts.map((item, index) => {
            const isDragging = draggedIdx === index;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => setDraggedIdx(null)}
                onClick={() => {
                  onSelectTab?.(item.tab);
                  notify?.(`Opened ${item.label}`);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200/90 bg-[#f9fafb] hover:bg-gray-100/70 hover:border-gray-300 transition-all cursor-pointer group select-none shadow-2xs ${
                  isDragging ? 'opacity-40 border-dashed border-blue-400' : ''
                }`}
              >
                {/* Left section: Drag handle, Icon, Label */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0"
                    title="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="5" cy="3.5" r="1.3" />
                      <circle cx="11" cy="3.5" r="1.3" />
                      <circle cx="5" cy="8" r="1.3" />
                      <circle cx="11" cy="8" r="1.3" />
                      <circle cx="5" cy="12.5" r="1.3" />
                      <circle cx="11" cy="12.5" r="1.3" />
                    </svg>
                  </div>

                  {/* Icon */}
                  {renderIcon(item.iconType)}

                  {/* Label */}
                  <span className="text-[13px] font-medium text-gray-800 truncate">
                    {item.label}
                  </span>
                </div>

                {/* Right section: Move Up & Move Down arrows */}
                <div className="flex items-center gap-1.5 text-gray-400 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, -1);
                    }}
                    disabled={index === 0}
                    className="p-1 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg
                      className="w-3.5 h-3.5 stroke-[2]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, 1);
                    }}
                    disabled={index === shortcuts.length - 1}
                    className="p-1 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg
                      className="w-3.5 h-3.5 stroke-[2]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
