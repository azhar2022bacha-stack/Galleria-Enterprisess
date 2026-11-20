'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Store,
  ArrowRight,
  LogIn,
  CheckCircle,
  Phone,
  X,
  Copy,
  ShieldCheck,
  User,
  KeyRound,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  validateRegistrationPasswords,
  EXACT_PRD_SEPARATION_ERROR,
  SELLER_REGISTRATION_PASSWORD_MIN_LENGTH,
} from '@/lib/passwordValidation';
import {
  validateInviteCode,
  EXACT_INVALID_INVITE_ERROR,
  EXACT_EXHAUSTED_INVITE_ERROR,
} from '@/lib/inviteCodes';
import { getShopSettings, hasSavedShopSettings, saveShopSettings } from '@/lib/sellerOrders';

/**
 * Wholesaler Storefront Icon matching the reference image:
 * A blue-and-white awning with scalloped hem, building base, door & window
 */
function WholesalerStoreIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft base shadow */}
      <ellipse cx="32" cy="58" rx="24" ry="3" fill="#D7BC68" opacity="0.45" />
      
      {/* Store Building Base */}
      <rect x="15" y="27" width="34" height="28" rx="3" fill="#F8FAFC" stroke="#D7BC68" strokeWidth="2.5" />
      
      {/* Store Door */}
      <rect x="22" y="36" width="10" height="19" rx="1.5" fill="#101B2D" />
      
      {/* Store Window with crossbars */}
      <rect x="36" y="36" width="10" height="10" rx="1.5" fill="#E2E8F0" stroke="#D7BC68" strokeWidth="1.6" />
      <line x1="41" y1="36" x2="41" y2="46" stroke="#D7BC68" strokeWidth="1.4" />
      <line x1="36" y1="41" x2="46" y2="41" stroke="#D7BC68" strokeWidth="1.4" />
      
      {/* Awning main body */}
      <path d="M11 27L15 13H49L53 27H11Z" fill="#101B2D" />
      
      {/* Awning White Stripes */}
      <path d="M20 13L18.5 27H24L25 13H20Z" fill="#D7BC68" />
      <path d="M30 13L29.5 27H34.5L35 13H30Z" fill="#D7BC68" />
      <path d="M40 13L40.5 27H46L45 13H40Z" fill="#D7BC68" />
      
      {/* Awning scalloped hem */}
      <path
        d="M11 27C11 29 12.8 30.5 15 30.5C17.2 30.5 19 29 19 27C19 29 20.8 30.5 23 30.5C25.2 30.5 27 29 27 27C27 29 28.8 30.5 31 30.5C33.2 30.5 35 29 35 27C35 29 36.8 30.5 39 30.5C41.2 30.5 43 29 43 27C43 29 44.8 30.5 47 30.5C49.2 30.5 51 29 51 27C51 29 52 30 53 27"
        fill="#101B2D"
      />
    </svg>
  );
}

function SellerPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');
  const queryInvite = searchParams.get('code') || searchParams.get('invite') || '';

  // Mode: 'signin' or 'register'
  const [viewMode, setViewMode] = useState<'signin' | 'register'>(
    initialMode === 'register' ? 'register' : 'signin'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sign In state (empty by default so user can enter their own credentials)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Registration states (matches "Register Your Shop" screenshot form)
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [repeatTransactionPin, setRepeatTransactionPin] = useState('');
  const [showTransPass, setShowTransPass] = useState(false);
  const [invitationCode, setInvitationCode] = useState(queryInvite);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Real-time password validation according to PRD
  const passwordValidation = useMemo(() => {
    return validateRegistrationPasswords({
      password: regPassword,
      confirmPassword,
      transactionPin,
      repeatTransactionPin,
    });
  }, [regPassword, confirmPassword, transactionPin, repeatTransactionPin]);

  // Real-time server-side invitation code verification
  const [inviteStatus, setInviteStatus] = useState<{
    checking: boolean;
    hasChecked: boolean;
    isValid: boolean;
    error?: string;
    remainingUses?: number;
    maxUsage?: number;
    usage?: number;
    code?: string;
  }>({
    checking: false,
    hasChecked: false,
    isValid: false,
  });

  useEffect(() => {
    const trimmed = invitationCode.trim().toUpperCase();
    if (!trimmed) {
      setInviteStatus({
        checking: false,
        hasChecked: false,
        isValid: false,
        error: EXACT_INVALID_INVITE_ERROR,
      });
      return;
    }

    let isMounted = true;
    setInviteStatus((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invites?code=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.valid) {
          setInviteStatus({
            checking: false,
            hasChecked: true,
            isValid: true,
            remainingUses: data.remainingUses,
            maxUsage: data.maxUsage,
            usage: data.usage ?? (data.maxUsage - data.remainingUses),
            code: data.code,
          });
        } else {
          setInviteStatus({
            checking: false,
            hasChecked: true,
            isValid: false,
            error: data.error || EXACT_INVALID_INVITE_ERROR,
            remainingUses: data.remainingUses ?? 0,
            maxUsage: data.maxUsage,
            usage: data.usage,
          });
        }
      } catch {
        if (!isMounted) return;
        setInviteStatus({
          checking: false,
          hasChecked: true,
          isValid: false,
          error: EXACT_INVALID_INVITE_ERROR,
        });
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [invitationCode]);

  useEffect(() => {
    if (initialMode === 'register') {
      setViewMode('register');
    } else if (initialMode === 'signin') {
      setViewMode('signin');
    }
  }, [initialMode]);

  useEffect(() => {
    if (queryInvite && !invitationCode) {
      setInvitationCode(queryInvite);
      markTouched('invitationCode');
    }
  }, [queryInvite]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setFeedback(null);

    const email = signInEmail.trim();
    const password = signInPassword;

    if (!email) {
      setSignInError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setSignInError('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/seller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSignInError(data.error || 'Authentication failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Save authenticated seller profile so dashboard displays their specific identity
      if (typeof window !== 'undefined' && data.seller) {
        localStorage.setItem('galleria_active_seller', JSON.stringify(data.seller));
        localStorage.removeItem('galleria_seller_kyc_status');
        localStorage.removeItem('galleria_seller_kyc_data');
        localStorage.removeItem('buyxoco_kyc_status');
        localStorage.removeItem('buyxoco_kyc_data');
        if (!hasSavedShopSettings()) {
          const currentSettings = getShopSettings();
          saveShopSettings({
            shopName: data.seller.shopName || currentSettings.shopName || 'Wholesale Shop',
            description: currentSettings.description || '',
          });
        }
      }

      setIsSubmitting(false);
      setFeedback('Signed in successfully! Opening Wholesale Dashboard...');
      setTimeout(() => {
        router.push('/seller/dashboard');
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setSignInError(err?.message || 'Failed to sign in. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // Mark all four password fields and invitation code as touched so any errors become visible
    setTouchedFields({
      password: true,
      confirmPassword: true,
      transactionPin: true,
      repeatTransactionPin: true,
      invitationCode: true,
    });

    // PRD: Invitation code is strictly mandatory
    if (!invitationCode.trim()) {
      setRegError(EXACT_INVALID_INVITE_ERROR);
      return;
    }

    if (inviteStatus.hasChecked && !inviteStatus.isValid) {
      setRegError(inviteStatus.error || EXACT_INVALID_INVITE_ERROR);
      return;
    }

    if (!agreedToTerms) {
      setRegError("Please agree to Reapex's Privacy Policy and Terms & Conditions to proceed.");
      return;
    }

    // Frontend validation gate
    if (!passwordValidation.isValid) {
      if (passwordValidation.errors.separation) {
        setRegError(passwordValidation.errors.separation);
      } else {
        const firstError =
          passwordValidation.errors.password ||
          passwordValidation.errors.confirmPassword ||
          passwordValidation.errors.transactionPin ||
          passwordValidation.errors.repeatTransactionPin;
        setRegError(firstError || 'Please fix the password validation errors below.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend validation & secure password hashing via API route
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: regEmail,
          shopName,
          password: regPassword,
          confirmPassword,
          transactionPin,
          repeatTransactionPin,
          invitationCode,
          agreedToTerms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRegError(data.error || 'Registration failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Save active seller profile immediately so dashboard displays their name dynamically
      if (typeof window !== 'undefined') {
        const sellerObj = {
          fullName: fullName.trim(),
          email: regEmail.trim(),
          shopName: shopName.trim(),
          invitationCode: String(invitationCode).trim().toUpperCase(),
          status: 'review',
          idStatus: 'No ID uploaded',
          isApproved: false,
        };
        localStorage.setItem('galleria_active_seller', JSON.stringify(sellerObj));
        localStorage.removeItem('galleria_seller_kyc_status');
        localStorage.removeItem('galleria_seller_kyc_data');
        localStorage.removeItem('buyxoco_kyc_status');
        localStorage.removeItem('buyxoco_kyc_data');
        saveShopSettings({
          shopName: shopName.trim() || 'Wholesale Shop',
          description: '',
        });
      }

      setIsSubmitting(false);
      setFeedback(data.message || 'Shop registered successfully! Welcome to the Wholesale Seller Portal.');
      setTimeout(() => {
        router.push('/seller/dashboard');
      }, 800);
    } catch (err: any) {
      setIsSubmitting(false);
      setRegError(err?.message || 'Failed to submit registration. Please try again.');
    }
  };

  const handleCopySupport = () => {
    navigator.clipboard.writeText('support@galleria.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] relative overflow-x-hidden overflow-y-auto flex flex-col justify-between items-center px-4 py-5 sm:py-8 font-sans">
      
      {/* Soft neutral and gold accents matching the admin sign-in page */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-[#d7bc68]/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-28 h-[520px] w-[520px] rounded-full bg-slate-300/30 blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 pt-0.5 pb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#9c7b25] font-medium transition-colors bg-white px-3.5 py-2 rounded-full border border-slate-200 shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
          <span>Return to Marketplace</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-white px-3.5 py-2 rounded-full border border-slate-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Merchant Server Active</span>
        </div>
      </header>

      {/* Center Content with Switcher & Cards */}
      <main className="w-full max-w-5xl flex flex-col items-center justify-center my-auto z-10 py-2 sm:py-3">
        
        {/* View Switcher Tabs: Seller Sign In / Register Your Shop */}
        <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-sm mb-5">
          <button
            type="button"
            onClick={() => setViewMode('signin')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'signin'
                ? 'bg-[#101b2d] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#9c7b25]'
            }`}
          >
            Seller Sign In
          </button>
          <button
            type="button"
            onClick={() => setViewMode('register')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'register'
                ? 'bg-[#101b2d] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#9c7b25]'
            }`}
          >
            Register Your Shop
          </button>
        </div>

        {/* ===================== VIEW 1: SELLER SIGN IN (COMPACT ONE-VIEW UI) ===================== */}
        {viewMode === 'signin' && (
          <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.42)] ring-1 ring-slate-200/80 md:grid md:grid-cols-[0.92fr_1.08fr] animate-fadeIn">
            <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-[#101b2d] p-10 text-white md:flex">
              <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
              <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#c7a756]/10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7bc68] text-[#101b2d] shadow-lg shadow-black/20">
                  <WholesalerStoreIcon className="h-9 w-9" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-[0.16em]">GALLERIA</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Seller workspace</p>
                </div>
              </div>
              <div className="relative max-w-sm">
                <p className="mb-4 inline-block border-b border-transparent pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7bc68]">Welcome to your store</p>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight">Your business, ready to move forward.</h1>
                <p className="mt-5 text-sm leading-7 text-slate-300">Sign in to manage your seller workspace, products, orders, and shop settings.</p>
              </div>
              <div className="relative flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-[#d7bc68]" />
                <span>Your seller account is protected by secure sign-in.</span>
              </div>
            </section>

            <section className="flex min-h-[620px] flex-col justify-center px-6 py-9 sm:px-12 sm:py-10 lg:px-14">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-7 md:hidden">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#101b2d] text-[#d7bc68]">
                    <Store className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold tracking-[0.16em] text-slate-700">GALLERIA · SELLER</p>
                </div>

                <div className="mb-7">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9c7b25]">Merchant access</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue to your seller workspace.</p>
                </div>

            {/* Error notification if any */}
            {signInError && (
                <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2 font-medium animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{signInError}</span>
              </div>
            )}

            {/* Success notification if any */}
            {feedback && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-center gap-1.5 font-medium animate-fadeIn">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-2.5">
              
              {/* Email Input Card */}
              <div className="text-left">
                <div className="rounded-xl border border-slate-200 hover:border-[#b39746] focus-within:border-[#b39746] focus-within:ring-4 focus-within:ring-[#d7bc68]/15 px-4 py-3 bg-white transition-all flex items-center gap-3 shadow-sm">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 stroke-[1.8]" />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="seller-email" className="block text-xs font-semibold text-slate-700 leading-tight">
                      Email *
                    </label>
                    <input
                      id="seller-email"
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent pt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Password Input Card with Eye Toggle */}
              <div className="text-left">
                <div className="rounded-xl border border-slate-200 hover:border-[#b39746] focus-within:border-[#b39746] focus-within:ring-4 focus-within:ring-[#d7bc68]/15 px-4 py-3 bg-white transition-all flex items-center gap-3 shadow-sm">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 stroke-[1.8]" />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="seller-password" className="block text-xs font-semibold text-slate-700 leading-tight">
                      Password *
                    </label>
                    <input
                      id="seller-password"
                      type={showSignInPass ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent pt-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignInPass(!showSignInPass)}
                    className="text-slate-400 hover:text-slate-700 focus:outline-none p-1 transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showSignInPass ? (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#101b2d] px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#1a2b44] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4 stroke-[2.2]" />
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>

              {/* Forgot your password? Compact Notification Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#b39746] shrink-0" viewBox="0 0 40 40" fill="currentColor">
                    <path d="M20 3L6 9v11c0 9.2 6 17.8 14 20 8-2.2 14-10.8 14-20V9L20 3z" />
                    <path
                      d="M17 19a3 3 0 016 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H16a1 1 0 01-1-1v-6a1 1 0 011-1h1v-2zm2 0a1 1 0 00-2 0v2h2v-2z"
                      fill="#ffffff"
                    />
                  </svg>
                  <span className="text-[11px] font-medium text-gray-700">Forgot password?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="text-[11px] font-semibold text-[#9c7b25] hover:underline cursor-pointer"
                >
                  Contact Support
                </button>
              </div>

              {/* Divider: NO ACCOUNT YET? */}
              <div className="flex items-center gap-2.5 my-2.5 pt-0.5">
                <div className="h-[1px] bg-gray-200/90 flex-1"></div>
                <span className="text-[9.5px] font-bold text-gray-400 tracking-wider uppercase">
                  NO ACCOUNT YET?
                </span>
                <div className="h-[1px] bg-gray-200/90 flex-1"></div>
              </div>

              {/* Create / Register Shop Button */}
              <button
                type="button"
                onClick={() => setViewMode('register')}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#101b2d] transition hover:bg-slate-50 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4 stroke-[2.2]" />
                <span>Register Your Shop</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>

            </form>
              </div>
            </section>
          </div>
        )}

        {/* ===================== VIEW 2: REGISTER YOUR SHOP (MATCHING REFERENCE IMAGE) ===================== */}
        {viewMode === 'register' && (
          <div className="w-full max-w-[620px] bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-9 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.12)] border border-slate-200/80 text-left animate-fadeIn relative">
            
            {/* Header: Title & Subtitle */}
            <div className="mb-5 sm:mb-6">
              <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#091e42] tracking-tight leading-tight">
                Register Your Shop
              </h1>
              <p className="text-xs sm:text-[13.5px] text-gray-600 mt-1">
                Join us, make and start selling your products.
              </p>
            </div>

            {/* Success / Feedback Notification */}
            {feedback && (
              <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center gap-1.5 font-medium animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Error Notification */}
            {regError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2 font-medium animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{regError}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38] bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38] bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showRegPass ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onBlur={() => markTouched('password')}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      markTouched('password');
                    }}
                    placeholder={`At least ${SELLER_REGISTRATION_PASSWORD_MIN_LENGTH} characters`}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 border rounded-xl focus:outline-none transition-all shadow-sm bg-white ${
                      touchedFields.password && passwordValidation.errors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touchedFields.password && regPassword && !passwordValidation.errors.password
                        ? 'border-emerald-500 focus:border-[#046a38]'
                        : 'border-gray-300 focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38]'
                    }`}
                  />
                  {touchedFields.password && passwordValidation.errors.password && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                      {passwordValidation.errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onBlur={() => markTouched('confirmPassword')}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      markTouched('confirmPassword');
                    }}
                    placeholder=""
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 border rounded-xl focus:outline-none transition-all shadow-sm bg-white ${
                      touchedFields.confirmPassword && passwordValidation.errors.confirmPassword
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touchedFields.confirmPassword && confirmPassword && !passwordValidation.errors.confirmPassword
                        ? 'border-emerald-500 focus:border-[#046a38]'
                        : 'border-gray-300 focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38]'
                    }`}
                  />
                  {touchedFields.confirmPassword && passwordValidation.errors.confirmPassword && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                      {passwordValidation.errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Transaction Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a]">
                      Transaction Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTransPass(!showTransPass)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Toggle transaction password visibility"
                    >
                      {showTransPass ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showTransPass ? 'text' : 'password'}
                    required
                    value={transactionPin}
                    onBlur={() => markTouched('transactionPin')}
                    onChange={(e) => {
                      setTransactionPin(e.target.value);
                      markTouched('transactionPin');
                    }}
                    placeholder={`At least ${SELLER_REGISTRATION_PASSWORD_MIN_LENGTH} characters`}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono text-gray-900 placeholder-gray-400 border rounded-xl focus:outline-none transition-all shadow-sm bg-white ${
                      (touchedFields.transactionPin && passwordValidation.errors.transactionPin) ||
                      passwordValidation.errors.separation
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touchedFields.transactionPin && transactionPin && !passwordValidation.errors.transactionPin
                        ? 'border-emerald-500 focus:border-[#046a38]'
                        : 'border-gray-300 focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38]'
                    }`}
                  />
                  {touchedFields.transactionPin && passwordValidation.errors.transactionPin && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                      {passwordValidation.errors.transactionPin}
                    </p>
                  )}
                </div>

                {/* Repeat Transaction Password */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a] mb-1.5">
                    Repeat Transaction Password
                  </label>
                  <input
                    type="password"
                    required
                    value={repeatTransactionPin}
                    onBlur={() => markTouched('repeatTransactionPin')}
                    onChange={(e) => {
                      setRepeatTransactionPin(e.target.value);
                      markTouched('repeatTransactionPin');
                    }}
                    placeholder=""
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono text-gray-900 placeholder-gray-400 border rounded-xl focus:outline-none transition-all shadow-sm bg-white ${
                      (touchedFields.repeatTransactionPin && passwordValidation.errors.repeatTransactionPin) ||
                      passwordValidation.errors.separation
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touchedFields.repeatTransactionPin && repeatTransactionPin && !passwordValidation.errors.repeatTransactionPin
                        ? 'border-emerald-500 focus:border-[#046a38]'
                        : 'border-gray-300 focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38]'
                    }`}
                  />
                  {touchedFields.repeatTransactionPin && passwordValidation.errors.repeatTransactionPin && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                      {passwordValidation.errors.repeatTransactionPin}
                    </p>
                  )}
                </div>

                {/* PRD Critical Requirement: Difference Warning Banner */}
                {passwordValidation.errors.separation && (
                  <div className="col-span-1 sm:col-span-2 p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">
                      {passwordValidation.errors.separation}
                    </span>
                  </div>
                )}

                {/* Helper info line under Transaction Passwords */}
                <div className="col-span-1 sm:col-span-2 -mt-1 text-[11.5px] text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Use a different password for transactions.</span>
                  </div>
                  <span className="text-[10.5px] text-gray-400">
                    Use at least {SELLER_REGISTRATION_PASSWORD_MIN_LENGTH} characters per password. Any character type is allowed.
                  </span>
                </div>

                {/* Shop Name */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a] mb-1.5">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="My Awesome Shop"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38] bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Invitation Code (PRD Mandatory) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-[13px] font-bold text-[#0f172a]">
                      Invitation Code <span className="text-red-500">*</span>
                    </label>
                    {invitationCode.trim() && inviteStatus.isValid && (
                      <span className="text-[11px] font-semibold text-[#046a38] flex items-center gap-1 animate-fadeIn">
                        <CheckCircle className="w-3 h-3 text-[#046a38]" />
                        <span>
                          Valid ({inviteStatus.remainingUses} left · used {inviteStatus.usage ?? 0} of {inviteStatus.maxUsage ?? (inviteStatus.remainingUses! + (inviteStatus.usage ?? 0))})
                        </span>
                      </span>
                    )}
                    {invitationCode.trim() && inviteStatus.checking && (
                      <span className="text-[10.5px] text-gray-400 animate-pulse">
                        Verifying code...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={invitationCode}
                    onBlur={() => markTouched('invitationCode')}
                    onChange={(e) => {
                      setInvitationCode(e.target.value.toUpperCase());
                      markTouched('invitationCode');
                    }}
                    placeholder="e.g. BX-SW2CQS (from Admin)"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono text-gray-900 placeholder-gray-400 border rounded-xl focus:outline-none transition-all shadow-sm bg-white ${
                      touchedFields.invitationCode && inviteStatus.hasChecked && !inviteStatus.isValid
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touchedFields.invitationCode && inviteStatus.isValid
                        ? 'border-emerald-500 focus:border-[#046a38]'
                        : 'border-gray-300 focus:border-[#046a38] focus:ring-1 focus:ring-[#046a38]'
                    }`}
                  />
                  {touchedFields.invitationCode && inviteStatus.hasChecked && !inviteStatus.isValid && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn leading-tight">
                      {inviteStatus.error}
                    </p>
                  )}
                  {(!touchedFields.invitationCode || !invitationCode) && (
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      Strictly mandatory. Please enter a valid invitation code provided by the Admin.
                    </p>
                  )}
                </div>

              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2.5 pt-1.5">
                <input
                  type="checkbox"
                  id="agree-reapex-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#046a38] focus:ring-[#046a38] accent-[#046a38] cursor-pointer shrink-0"
                />
                <label htmlFor="agree-reapex-terms" className="text-xs sm:text-[12.5px] text-gray-700 cursor-pointer select-none">
                  I agree to Reapex&apos;s{' '}
                  <span className="font-semibold text-[#046a38] underline hover:text-emerald-900">
                    Privacy Policy
                  </span>{' '}
                  and{' '}
                  <span className="font-semibold text-[#046a38] underline hover:text-emerald-900">
                    Terms &amp; Conditions
                  </span>
                  .
                </label>
              </div>

              {/* Same & Conditions Box */}
              <div className="bg-[#f8faff] border border-blue-200/90 rounded-2xl p-4 text-left">
                <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] mb-1.5">
                  Same &amp; Conditions
                </h4>
                <p className="text-[11px] sm:text-[11.5px] text-gray-600 leading-relaxed">
                  &ldquo;Legal Notice &amp; Conditions (&ldquo;T&amp;C&rdquo;) guides your access to and use of the Services platform, website and services. By registering, you agree to provide accurate and up-to-date information. You also agree to comply with all applicable laws. You understand that the platform may suspend or terminate your account if any information is found to be false, misleading, or in violation of our policies.
                </p>
                <p className="text-[11px] sm:text-[11.5px] text-gray-600 leading-relaxed mt-1.5">
                  Use of this platform constitutes acceptance of these Terms &amp; Conditions. Please read them carefully before proceeding.&rdquo;
                </p>
                <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center gap-2 text-[11.5px] font-bold text-[#046a38]">
                  <a href="#terms" className="hover:underline">Read the full Terms &amp; Conditions</a>
                  <span className="text-gray-300 font-normal">|</span>
                  <a href="#privacy" className="hover:underline">Privacy Policy</a>
                </div>
              </div>

              {/* Register Shop Green Outline Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 sm:py-3.5 border-2 border-[#046a38] text-[#046a38] hover:bg-emerald-50 font-bold text-sm sm:text-base rounded-full transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 mt-2"
              >
                <Store className="w-4 h-4 stroke-[2.2]" />
                <span>{isSubmitting ? 'Registering Shop...' : 'Register Shop'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>

              {/* Divider: ALREADY HAVE A REGISTERED SHOP? */}
              <div className="flex items-center gap-2.5 my-3 pt-1">
                <div className="h-[1px] bg-gray-200/90 flex-1"></div>
                <span className="text-[9.5px] font-bold text-gray-400 tracking-wider uppercase">
                  ALREADY HAVE A REGISTERED SHOP?
                </span>
                <div className="h-[1px] bg-gray-200/90 flex-1"></div>
              </div>

              {/* Back to Sign In Button */}
              <button
                type="button"
                onClick={() => setViewMode('signin')}
                className="w-full py-2.5 border-2 border-[#046a38] text-[#046a38] hover:bg-emerald-50 font-bold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <LogIn className="w-4 h-4 stroke-[2.2]" />
                <span>Sign in to your seller account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>

            </form>

          </div>
        )}

      </main>

      {/* Customer Service Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-left relative">
            
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#101b2d] text-[#d7bc68] flex items-center justify-center border border-slate-200">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Seller Account Recovery
                </h3>
                <p className="text-xs text-gray-500">
                  Galleria Wholesale Merchant Verification
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Due to strict escrow protection and commercial security on wholesaler accounts, passwords can be reset once your business identity is verified by our compliance team.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#9c7b25]" />
                  <span className="text-xs font-semibold text-gray-800">support@galleria.com</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySupport}
                  className="text-xs font-medium text-[#9c7b25] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-800">+1 234 567 8900 (Mon - Fri, 24/5)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full h-11 rounded-xl bg-[#101b2d] px-5 text-sm font-semibold text-white transition hover:bg-[#1a2b44] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Close Window</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full text-center text-[11px] text-slate-500 font-medium py-1 z-10 shrink-0">
        <p>© 2025 Galleria Enterprises, Inc. Wholesale & Merchant Division.</p>
      </footer>

    </div>
  );
}

export default function SellerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3f5f8] flex items-center justify-center text-sm font-semibold text-slate-700">
          Loading Seller Portal...
        </div>
      }
    >
      <SellerPortalContent />
    </Suspense>
  );
}
