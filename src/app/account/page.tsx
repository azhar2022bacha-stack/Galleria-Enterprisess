'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  MapPin,
  Store,
  ShieldAlert,
  CheckCircle,
  ChevronRight,
  UserPlus,
  Briefcase,
  Lock,
  Mail,
  Phone,
  Building,
  ArrowRight,
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { OrderLookupPanel } from '@/components/account/OrderLookupPanel';
import { storefrontCompany } from '@/lib/storefrontCompany';

function AccountContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');

  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [buyerSubView, setBuyerSubView] = useState<'dashboard' | 'register'>('dashboard');
  const [sellerSubView, setSellerSubView] = useState<'dashboard' | 'register'>('dashboard');

  const { totalWishlistItems } = useWishlist();
  const { clearToast } = useCart();

  const [buyerForm, setBuyerForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [sellerForm, setSellerForm] = useState({
    storeName: '',
    businessEmail: '',
    phone: '',
    category: "Women's Fashion",
    taxId: '',
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode === 'seller') {
      setActiveTab('seller');
      setSellerSubView('register');
    } else if (initialMode === 'buyer') {
      setActiveTab('buyer');
      setBuyerSubView('register');
    }
  }, [initialMode]);

  const handleBuyerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification('Buyer account created successfully! Welcome to ' + storefrontCompany.name + '.');
    setBuyerSubView('dashboard');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSellerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification('Seller application submitted successfully! Your merchant portal is now active.');
    setSellerSubView('dashboard');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#0c1b33] font-medium">Account & Portal</span>
        </div>

        {/* Success Alert Banner if any */}
        {notification && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* User Welcome Banner */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0c1b33] text-white flex items-center justify-center font-serif text-2xl font-bold border-2 border-[#c5a059]">
              AK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0c1b33]">
                  {storefrontCompany.name} User Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-[#c5a059]/40 text-[#c5a059] text-[10px] font-bold uppercase tracking-wider">
                  {activeTab === 'buyer' ? 'Buyer Panel' : activeTab === 'seller' ? 'Seller Merchant' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Switch between Buyer and Seller account modes seamlessly</p>
            </div>
          </div>

          {/* Role switcher tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'buyer'
                  ? 'bg-white text-[#0c1b33] shadow-sm'
                  : 'text-gray-600 hover:text-[#0c1b33]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#0c1b33]" />
              <span>Buyer Account</span>
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'seller'
                  ? 'bg-white text-[#0c1b33] shadow-sm'
                  : 'text-gray-600 hover:text-[#0c1b33]'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Seller Account</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-[#0c1b33] shadow-sm'
                  : 'text-gray-600 hover:text-[#0c1b33]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Preview</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BUYER ACCOUNT / PANEL */}
        {activeTab === 'buyer' && (
          <div>
            {/* Sub-view toggle for Buyer: Create Account / Dashboard */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBuyerSubView('dashboard')}
                  className={`text-xs font-bold pb-1 transition-all ${
                    buyerSubView === 'dashboard'
                      ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Buyer Dashboard & Orders
                </button>
                <button
                  onClick={() => setBuyerSubView('register')}
                  className={`text-xs font-bold pb-1 transition-all flex items-center gap-1 ${
                    buyerSubView === 'register'
                      ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create New Buyer Account / Login</span>
                </button>
              </div>
            </div>

            {buyerSubView === 'register' ? (
              /* Buyer Registration / Login Form */
              <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#0c1b33] text-white flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-[#c5a059]" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#0c1b33]">
                    Create Buyer Account
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Sign up or log in to track your orders, save items to wishlist, and enjoy express checkout.
                  </p>
                </div>

                <form onSubmit={handleBuyerRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={buyerForm.fullName}
                      onChange={(e) => setBuyerForm({ ...buyerForm, fullName: e.target.value })}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={buyerForm.email}
                        onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
                        placeholder="eleanor@example.com"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={buyerForm.password}
                        onChange={(e) => setBuyerForm({ ...buyerForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={buyerForm.phone}
                        onChange={(e) => setBuyerForm({ ...buyerForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0c1b33] hover:bg-[#162b4e] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-md mt-2"
                  >
                    Create Buyer Account / Sign In
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setBuyerSubView('dashboard')}
                      className="text-xs text-[#c5a059] hover:underline"
                    >
                      Already have an account? Go to My Dashboard →
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Buyer Dashboard */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Orders (8 cols) */}
                <div className="lg:col-span-8"><OrderLookupPanel /></div>

                {/* Right Column: Shortcuts & Address (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <h3 className="font-serif text-sm font-bold text-[#0c1b33] mb-2">Buyer Shortcuts</h3>
                    <Link
                      href="/wishlist"
                      className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 text-xs font-medium text-gray-700"
                    >
                      <span>Saved Wishlist Items</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#c5a059] font-bold">
                        {totalWishlistItems}
                      </span>
                    </Link>
                    <Link
                      href="/cart"
                      className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 text-xs font-medium text-gray-700"
                    >
                      <span>Active Shopping Cart</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif text-sm font-bold text-[#0c1b33] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#c5a059]" />
                        <span>Default Address</span>
                      </h3>
                      <span className="text-[10px] font-bold text-[#c5a059] uppercase">Primary</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-900">Azhar Uddin Khan</p>
                      <p>123 Park Avenue, Apt 4B</p>
                      <p>New York, NY 10001</p>
                      <p>United States</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 2: SELLER ACCOUNT / PORTAL */}
        {activeTab === 'seller' && (
          <div>
            {/* Sub-view toggle for Seller: Create Account / Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSellerSubView('dashboard')}
                  className={`text-xs font-bold pb-1 transition-all ${
                    sellerSubView === 'dashboard'
                      ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Seller Dashboard & Store Overview
                </button>
                <button
                  onClick={() => setSellerSubView('register')}
                  className={`text-xs font-bold pb-1 transition-all flex items-center gap-1 ${
                    sellerSubView === 'register'
                      ? 'text-[#0c1b33] border-b-2 border-[#0c1b33]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Create / Register Seller Account</span>
                </button>
              </div>
              <Link
                href="/seller"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0d6efd] hover:bg-[#0b5ed7] transition-all shadow-sm"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Go to Wholesale Seller Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {sellerSubView === 'register' ? (
              /* Seller Registration Form */
              <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#0c1b33] text-white flex items-center justify-center mx-auto mb-3">
                    <Store className="w-6 h-6 text-[#c5a059]" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#0c1b33]">
                    Create Seller Account
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Start selling your luxury collections on the {storefrontCompany.name} marketplace.
                  </p>
                </div>

                <form onSubmit={handleSellerRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Store / Business Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={sellerForm.storeName}
                        onChange={(e) => setSellerForm({ ...sellerForm, storeName: e.target.value })}
                        placeholder="e.g. Prestige Leather Goods"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                      />
                      <Building className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Business Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={sellerForm.businessEmail}
                        onChange={(e) => setSellerForm({ ...sellerForm, businessEmail: e.target.value })}
                        placeholder="seller@prestige.com"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Business Phone</label>
                      <input
                        type="tel"
                        required
                        value={sellerForm.phone}
                        onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Primary Category</label>
                      <select
                        value={sellerForm.category}
                        onChange={(e) => setSellerForm({ ...sellerForm, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none bg-white"
                      >
                        <option value="Women's Fashion">Women&apos;s Fashion</option>
                        <option value="Men's Fashion">Men&apos;s Fashion</option>
                        <option value="Bags & Accessories">Bags & Accessories</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Home & Living">Home & Living</option>
                        <option value="Sports & Fitness">Sports & Fitness</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID / Business Registration Number</label>
                    <input
                      type="text"
                      required
                      value={sellerForm.taxId}
                      onChange={(e) => setSellerForm({ ...sellerForm, taxId: e.target.value })}
                      placeholder="e.g. US-EIN-98765432"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0c1b33] hover:bg-[#162b4e] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    <Store className="w-4 h-4 text-[#c5a059]" />
                    <span>Create Seller Account / Launch Store</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setSellerSubView('dashboard')}
                      className="text-xs text-[#c5a059] hover:underline"
                    >
                      Already a verified seller? Open Store Dashboard →
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Seller Dashboard */
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-serif text-xl font-bold text-[#0c1b33]">
                        Multi-Vendor Merchant Dashboard
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Storefront: <strong>Galleria Official Boutique</strong> • Vendor ID: V-9901
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/seller/dashboard"
                        className="px-3.5 py-1.5 bg-[#cca23b] hover:bg-[#b88e28] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Launch Wholesale Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="w-fit px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                        Active & Verified
                      </span>
                    </div>
                  </div>

                  {/* 4 KPI cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500">Total Store Revenue</span>
                      <p className="text-2xl font-bold text-[#0c1b33] mt-1">$48,250.00</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">+18.4% this month</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500">Active Products Listed</span>
                      <p className="text-2xl font-bold text-[#0c1b33] mt-1">12 Products</p>
                      <span className="text-[10px] text-gray-500">All synchronized</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500">Orders Pending Dispatch</span>
                      <p className="text-2xl font-bold text-[#c5a059] mt-1">4 Orders</p>
                      <span className="text-[10px] text-amber-700">Ready for packing</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500">Merchant Rating</span>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">4.98 ★</p>
                      <span className="text-[10px] text-gray-500">Based on 312 reviews</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 p-4 bg-blue-50/60 rounded border border-blue-200/60 flex items-center justify-between">
                    <span>Architecture ready: When NestJS + PostgreSQL backend is connected, vendor CRUD APIs will bind automatically.</span>
                    <span className="font-semibold text-blue-900">API Gateway: Ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADMIN PREVIEW */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#0c1b33]">
                    Marketplace Superadmin Console
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    System Overview • Database Engine: PostgreSQL (Planned Phase 2)
                  </p>
                </div>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                  System Health: 100% Operational
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                  <span className="text-xs text-gray-500">Platform GMV (Year to Date)</span>
                  <p className="text-2xl font-bold text-[#0c1b33] mt-1">$2.45M</p>
                </div>
                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                  <span className="text-xs text-gray-500">Registered Marketplace Sellers</span>
                  <p className="text-2xl font-bold text-[#0c1b33] mt-1">142 Vendors</p>
                </div>
                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                  <span className="text-xs text-gray-500">Commission Rate</span>
                  <p className="text-2xl font-bold text-[#c5a059] mt-1">8.5%</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-12 text-center text-gray-500">Loading Account Portal...</div>}>
      <AccountContent />
    </Suspense>
  );
}
