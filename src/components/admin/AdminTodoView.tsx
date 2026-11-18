'use client';

import React from 'react';
import type { AdminTab } from './AdminSidebar';
import { ADMIN_TODO_CATEGORIES, totalAdminTodoCount } from '@/lib/adminTodoCounts';
import type { AdminTodoCounts } from '@/lib/adminTodoCounts';

interface TodoQueueItem {
  id: string;
  label: string;
  count: number;
  targetTab?: AdminTab;
}

interface AdminTodoViewProps {
  counts: AdminTodoCounts;
  notify?: (msg: string) => void;
  onSelectTab?: (tab: AdminTab) => void;
  onOpenDeposits?: () => void;
}

export function AdminTodoView({
  counts,
  notify,
  onSelectTab,
  onOpenDeposits,
}: AdminTodoViewProps) {
  const items: TodoQueueItem[] = ADMIN_TODO_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    count: counts[category.id],
    targetTab: category.targetTab,
  }));
  const totalWaiting = totalAdminTodoCount(counts);

  const handleOpenItem = (item: TodoQueueItem) => {
    notify?.(item.id === 'deposits'
      ? `Opening ${item.count} deposit record${item.count === 1 ? '' : 's'}`
      : `Opening ${item.label} (${item.count} waiting item${item.count === 1 ? '' : 's'})`);
    if (item.id === 'deposits') {
      onOpenDeposits?.();
    } else if (item.targetTab && onSelectTab) {
      onSelectTab(item.targetTab);
    }
  };

  // Row 1 (Items 0-3)
  const row1 = items.slice(0, 4);
  // Row 2 (Items 4-7)
  const row2 = items.slice(4, 8);
  // Row 3 (Items 8-11)
  const row3 = items.slice(8, 12);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* MAIN TO-DO CARD (MATCHING USER SCREENSHOT EXACTLY)             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between bg-white border-b border-gray-200">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              To-do
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalWaiting} item(s) waiting
            </p>
          </div>

          {/* Badge: Pink Background, Red Bold Text */}
          <div className="bg-[#ffe4e6] text-[#e11d48] px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight shadow-2xs">
            {totalWaiting}
          </div>
        </div>

        {/* 4-Column Grid: Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-gray-200">
          {row1.map((item, idx) => {
            const hasItems = item.count > 0;
            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 flex flex-col justify-between min-h-[110px] bg-white hover:bg-gray-50/50 transition-colors ${
                  idx < 3 ? 'lg:border-r border-gray-200' : ''
                } ${idx % 2 === 0 ? 'sm:border-r lg:border-r' : ''}`}
              >
                <div className="text-xs text-gray-600 font-medium">
                  {item.label}
                </div>
                <div className="flex items-baseline justify-between mt-4">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      hasItems ? 'text-[#e11d48]' : 'text-[#475569]'
                    }`}
                  >
                    {item.count}
                  </span>
                  <button
                    onClick={() => handleOpenItem(item)}
                    className={`px-3.5 py-1 text-xs rounded-lg transition-colors shadow-2xs ${
                      hasItems
                        ? 'bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold'
                        : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-medium'
                    }`}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4-Column Grid: Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-gray-200">
          {row2.map((item, idx) => {
            const hasItems = item.count > 0;
            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 flex flex-col justify-between min-h-[110px] bg-white hover:bg-gray-50/50 transition-colors ${
                  idx < 3 ? 'lg:border-r border-gray-200' : ''
                } ${idx % 2 === 0 ? 'sm:border-r lg:border-r' : ''}`}
              >
                <div className="text-xs text-gray-600 font-medium">
                  {item.label}
                </div>
                <div className="flex items-baseline justify-between mt-4">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      hasItems ? 'text-[#e11d48]' : 'text-[#475569]'
                    }`}
                  >
                    {item.count}
                  </span>
                  <button
                    onClick={() => handleOpenItem(item)}
                    className={`px-3.5 py-1 text-xs rounded-lg transition-colors shadow-2xs ${
                      hasItems
                        ? 'bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold'
                        : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-medium'
                    }`}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4-Column Grid: Row 3 (4 items) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {row3.map((item, idx) => {
            const hasItems = item.count > 0;
            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 flex flex-col justify-between min-h-[110px] bg-white hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? 'sm:border-r border-gray-200' : ''} ${idx < 3 ? 'lg:border-r border-gray-200' : ''}`}
              >
                <div className="text-xs text-gray-600 font-medium">
                  {item.label}
                </div>
                <div className="flex items-baseline justify-between mt-4">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                      hasItems ? 'text-[#e11d48]' : 'text-[#475569]'
                    }`}
                  >
                    {item.count}
                  </span>
                  <button
                    onClick={() => handleOpenItem(item)}
                    className={`px-3.5 py-1 text-xs rounded-lg transition-colors shadow-2xs ${
                      hasItems
                        ? 'bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold'
                        : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-medium'
                    }`}
                  >
                    Open
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
