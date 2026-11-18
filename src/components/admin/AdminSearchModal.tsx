'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Tag, Users, Percent, CircleDollarSign, X, ArrowRight } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AdminTab) => void;
}

export function AdminSearchModal({
  isOpen,
  onClose,
  onSelectTab,
}: AdminSearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks: { title: string; category: string; tab: AdminTab; icon: any }[] = [
    { title: 'Draft Orders · Create & Manage', category: 'Drafts', tab: 'drafts', icon: ShoppingCart },
    { title: 'Order #31 · buy buy', category: 'Orders', tab: 'orders', icon: ShoppingCart },
    { title: 'Order #30 · buy buy', category: 'Orders', tab: 'orders', icon: ShoppingCart },
    { title: 'Order #29 · buy buy', category: 'Orders', tab: 'orders', icon: ShoppingCart },
    { title: 'Order #28 · buy buy', category: 'Orders', tab: 'orders', icon: ShoppingCart },
    { title: 'To-do list (37 items waiting)', category: 'To-do', tab: 'todo', icon: ShoppingCart },
    { title: 'Audit Log · System Activity & Security', category: 'Audit log', tab: 'audit_log', icon: Tag },
    { title: 'Accounts · Manage Passwords & Admins', category: 'Accounts', tab: 'accounts', icon: Users },
    { title: 'Consign · Push Orders & Liquidity', category: 'Consign', tab: 'consign', icon: Tag },
    { title: 'Ansar collection · Wholesaler', category: 'Owners', tab: 'owners', icon: Users },
    { title: 'Stock Reservations · Inventory', category: 'Reservations', tab: 'reservations', icon: Tag },
    { title: 'JENNY10 · Promotion code', category: 'Promotions', tab: 'promotions', icon: Percent },
    { title: 'Summer Launch 2026 · Campaign', category: 'Campaigns', tab: 'campaigns', icon: Percent },
    { title: 'Price Lists · Sales & Overrides', category: 'Price Lists', tab: 'price_lists', icon: CircleDollarSign },
    { title: 'Product Update · Edit Catalog Listings', category: 'Price Lists', tab: 'product_update', icon: Tag },
    { title: 'buyer@example.com · Guest Customer', category: 'Customers', tab: 'customers', icon: Users },
    { title: 'VIP Customers · Customer Group', category: 'Customer Groups', tab: 'customer_groups', icon: Users },
    { title: 'SHIRT-S-BLACK · Inventory', category: 'Inventory', tab: 'inventory', icon: Tag },
    { title: 'Shirts & Apparel · Category', category: 'Categories', tab: 'categories', icon: Tag },
    { title: 'Best Sellers · Collection', category: 'Collections', tab: 'collections', icon: Tag },
    { title: 'Essential Cotton Tee · Apparel', category: 'Products', tab: 'products', icon: Tag },
    { title: 'Vitamin C 1000mg', category: 'Products', tab: 'products', icon: Tag },
    { title: 'Product Feed · Add or import products', category: 'Products', tab: 'product_feed', icon: Tag },
    { title: 'Storehouse Catalog · Bulk Import', category: 'Products', tab: 'storehouse_catalog', icon: Tag },
  ];

  const filtered = query.trim()
    ? quickLinks.filter((l) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type an order #, customer, product or view..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border border-gray-200 rounded text-gray-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Navigation &amp; Quick Results
          </div>
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectTab(item.tab);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900" />
                  <span className="font-medium truncate">{item.title}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
