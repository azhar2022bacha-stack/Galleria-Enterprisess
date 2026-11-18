'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendSellerNotification } from '@/lib/sellerNotifications';
import {
  RotateCw,
  Search,
  X,
  Plus,
  Store,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Trash2,
  DollarSign,
  User,
  Mail,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Key,
  Copy,
  Check,
  TrendingUp,
  Sliders,
  Edit2,
  Save,
  FileText,
  Eye,
  Package,
} from 'lucide-react';
import {
  AdminSeller,
  CreditScoreLog,
  INITIAL_ADMIN_SELLERS,
  getAdminSellers,
  saveAdminSellers,
} from '@/lib/adminData';

interface AdminOwnersViewProps {
  notify?: (msg: string) => void;
}

export function AdminOwnersView({ notify }: AdminOwnersViewProps) {
  const router = useRouter();

  const [sellers, setSellers] = useState<AdminSeller[]>(INITIAL_ADMIN_SELLERS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'review' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manage Screen State - when selectedSeller is set, displays dedicated Manage Page
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null);

  // Visitor & Exposure controls
  const [visitorCountInput, setVisitorCountInput] = useState<number>(599);

  // Password reset controls (Screenshot 3)
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);

  // Tier Granting & Credit Score controls (Screenshot 4)
  const [selectedTierToGrant, setSelectedTierToGrant] = useState('');
  const [creditPointsInput, setCreditPointsInput] = useState<number>(10);
  const [creditReasonInput, setCreditReasonInput] = useState('');

  // Editing state for selected seller
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editPromoteRate, setEditPromoteRate] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Add New Seller Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPackage, setNewPackage] = useState('Free Shop');
  const [newProductLimit, setNewProductLimit] = useState<number | 'Unlimited'>(300);
  const [newProfitMargin, setNewProfitMargin] = useState(15);
  const [newStatus, setNewStatus] = useState<'approved' | 'review' | 'suspended'>('approved');

  // KYC Review Card Modal State
  const [selectedKycSeller, setSelectedKycSeller] = useState<AdminSeller | null>(null);
  const [activeKycCardSide, setActiveKycCardSide] = useState<'Front' | 'Back'>('Front');
  const [kycCardMode, setKycCardMode] = useState<'side-only' | 'full'>('side-only');
  const [isRejectingKyc, setIsRejectingKyc] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');

  // Owner Products Modal State
  const [viewingProductsSeller, setViewingProductsSeller] = useState<AdminSeller | null>(null);
  const [ownerProductsList, setOwnerProductsList] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productPage, setProductPage] = useState(1);

  const handleOpenOwnerProducts = async (seller: AdminSeller) => {
    setViewingProductsSeller(seller);
    setProductSearchQuery('');
    setProductPage(1);

    let prods = seller.products || [];
    if (prods.length === 0) {
      if (typeof window !== 'undefined') {
        try {
          const keys = [
            `galleria_seller_products_${seller.email}`,
            `galleria_seller_products_default`,
            `galleria_seller_products`,
          ];
          for (const k of keys) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                prods = parsed;
                break;
              }
            }
          }
        } catch {}
      }

      if (prods.length === 0) {
        try {
          const res = await fetch(`/api/seller/products?email=${encodeURIComponent(seller.email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
              prods = data.products;
            }
          }
        } catch {}
      }
    }

    setOwnerProductsList(prods);
  };

  const filteredOwnerProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return ownerProductsList;
    const q = productSearchQuery.toLowerCase().trim();
    return ownerProductsList.filter(
      (p) =>
        (p.title && String(p.title).toLowerCase().includes(q)) ||
        (p.sku && String(p.sku).toLowerCase().includes(q)) ||
        (p.category && String(p.category).toLowerCase().includes(q))
    );
  }, [ownerProductsList, productSearchQuery]);

  const ownerProductsPageSize = 15;
  const ownerProductsTotalPages = Math.max(1, Math.ceil(filteredOwnerProducts.length / ownerProductsPageSize));
  const paginatedOwnerProducts = useMemo(() => {
    const start = (productPage - 1) * ownerProductsPageSize;
    return filteredOwnerProducts.slice(start, start + ownerProductsPageSize);
  }, [filteredOwnerProducts, productPage]);

  const openKycCard = async (
    seller: AdminSeller,
    side: 'Front' | 'Back' = 'Front',
    mode: 'side-only' | 'full' = 'side-only'
  ) => {
    setActiveKycCardSide(side);
    setKycCardMode(mode);
    if (seller.kycSubmission) {
      setSelectedKycSeller(seller);
      return;
    }

    try {
      const res = await fetch(`/api/kyc?email=${encodeURIComponent(seller.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.submission) {
          const sellerWithKyc = { ...seller, kycSubmission: data.submission };
          setSelectedKycSeller(sellerWithKyc);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed fetching KYC for seller:', err);
    }

    setSelectedKycSeller(seller);
  };

  const handleApproveKycFromOwners = async () => {
    if (!selectedKycSeller?.kycSubmission?.id) return;
    try {
      const res = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedKycSeller.kycSubmission.id, status: 'approved' }),
      });
      if (res.ok) {
        notify?.(`Approved KYC verification for ${selectedKycSeller.name}.`);
        fetchDynamicOwners(true);
        setSelectedKycSeller((prev) =>
          prev && prev.kycSubmission
            ? {
                ...prev,
                idStatus: 'Verified',
                kycSubmission: { ...prev.kycSubmission, status: 'approved' },
              }
            : null
        );
      }
    } catch (err) {
      console.warn('Failed to approve KYC:', err);
    }
  };

  const handleRejectKycFromOwners = async () => {
    if (!selectedKycSeller?.kycSubmission?.id) return;
    try {
      const res = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedKycSeller.kycSubmission.id,
          status: 'rejected',
          reason: kycRejectReason.trim() || 'Uploaded document could not be verified.',
        }),
      });
      if (res.ok) {
        notify?.(`Rejected KYC verification for ${selectedKycSeller.name}.`);
        fetchDynamicOwners(true);
        setSelectedKycSeller((prev) =>
          prev && prev.kycSubmission
            ? {
                ...prev,
                idStatus: 'Rejected',
                kycSubmission: {
                  ...prev.kycSubmission,
                  status: 'rejected',
                  rejectionReason: kycRejectReason,
                },
              }
            : null
        );
        setIsRejectingKyc(false);
      }
    } catch (err) {
      console.warn('Failed to reject KYC:', err);
    }
  };

  // Fetch dynamic shops from /api/admin/owners and purge legacy mock sellers
  const fetchDynamicOwners = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('/api/admin/owners');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.owners)) {
          // Enrich with client-side localStorage fallback for instant sync on same browser
          const enrichedOwners = data.owners.map((owner: AdminSeller) => {
            let localProducts: any[] = owner.products || [];
            if (typeof window !== 'undefined') {
              try {
                const keys = [
                  `galleria_seller_products_${owner.email}`,
                  `galleria_seller_products_default`,
                  `galleria_seller_products`,
                ];
                for (const k of keys) {
                  const raw = localStorage.getItem(k);
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      if (!localProducts || localProducts.length < parsed.length) {
                        localProducts = parsed;
                      }
                      break;
                    }
                  }
                }
              } catch {}
            }
            const emailKey=(owner.email||'').trim().toLowerCase();
            const synced=localStorage.getItem('galleria_approved_recharges_total:'+emailKey);
            const localBalance=localStorage.getItem('galleria_seller_wallet:'+emailKey);
            const approvedBalance=owner.usdBalance??owner.balances?.wallet??0;
            const balance=synced!==null&&localBalance!==null?Number(localBalance)+Math.max(0,approvedBalance-Number(synced)/100):approvedBalance;
            return {
              ...owner,
              usdBalance:balance,
              usdtBalance:balance,
              balances:{...owner.balances,wallet:balance},
              products: localProducts,
              productsCount: Math.max(owner.productsCount || 0, localProducts.length),
            };
          });

          setSellers(enrichedOwners);
          saveAdminSellers(enrichedOwners);
          setSelectedSeller((prev) => {
            if (!prev) return null;
            return (
              enrichedOwners.find((s: AdminSeller) => s.id === prev.id || s.email === prev.email) ||
              prev
            );
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic owners:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }

    // Fallback to local storage (with mock purging)
    const local = getAdminSellers();
    setSellers(local);
  };

  // Load from database on mount & poll automatically for new shop creations
  useEffect(() => {
    // Purge legacy mock storage key if it contains old mock sellers
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('buyxoco_admin_sellers');
        if (
          raw &&
          (raw.includes('seller-1') ||
            raw.includes('ansarkhan363@gmail.com') ||
            raw.includes('galleria.hub@example.com') ||
            raw.includes('Azhar collection'))
        ) {
          localStorage.removeItem('buyxoco_admin_sellers');
        }
      } catch {}
    }

    fetchDynamicOwners(true);

    // Auto-refresh interval (every 7 seconds) so newly registered shops automatically appear
    const interval = setInterval(() => {
      fetchDynamicOwners(true);
    }, 7000);

    // Re-fetch when admin switches tabs or window gains focus
    const handleFocus = () => fetchDynamicOwners(true);
    window.addEventListener('focus', handleFocus);

    // Check if URL has ?manage=seller-id
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const manageId = params.get('manage');
      if (manageId) {
        const local = getAdminSellers();
        const found = local.find((s) => s.id === manageId);
        if (found) {
          openManagePage(found, false);
        }
      }
    }

    const handleSync = () => {
      fetchDynamicOwners(true);
    };
    window.addEventListener('buyxoco_admin_data_changed', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('buyxoco_admin_data_changed', handleSync);
    };
  }, []);

  const openManagePage = (seller: AdminSeller, updateUrl = true) => {
    setSelectedSeller(seller);
    setEditEmail(seller.email);
    setEditShopName(seller.name);
    setEditDisplayName(seller.subtitle);
    setEditTiktok(seller.tiktok || '—');
    setEditPromoteRate(seller.promoteRate || `${seller.profitMargin}%`);
    setVisitorCountInput(seller.targetExposure || 500);
    setIsEditingAccount(false);

    if (updateUrl && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('manage', seller.id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const closeManagePage = () => {
    setSelectedSeller(null);
    setIsEditingAccount(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('manage');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Compute counts for top pills
  const counts = useMemo(() => {
    const all = sellers.length;
    const approved = sellers.filter((s) => s.status === 'approved').length;
    const review = sellers.filter((s) => s.status === 'review').length;
    const suspended = sellers.filter((s) => s.status === 'suspended').length;
    return { all, approved, review, suspended };
  }, [sellers]);

  // Filtered sellers
  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesSub = s.subtitle.toLowerCase().includes(query);
        const matchesEmail = s.email.toLowerCase().includes(query);
        const matchesId = s.id.toLowerCase().includes(query);
        const matchesPackage = s.packageTier.toLowerCase().includes(query);
        if (!matchesName && !matchesSub && !matchesEmail && !matchesId && !matchesPackage) {
          return false;
        }
      }
      return true;
    });
  }, [sellers, statusFilter, searchQuery]);

  // Handle Refresh Button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDynamicOwners(false);
    notify?.('Shops directory refreshed from database.');
  };

  // Direct Status Toggle Switch in Table Row
  const toggleSellerStatus = async (id: string) => {
    const target = sellers.find((s) => s.id === id);
    if (!target) return;
    const nextStatus: 'approved' | 'suspended' =
      target.status === 'approved' ? 'suspended' : 'approved';

    // Optimistic UI update
    const updated = sellers.map((s) => (s.id === id ? { ...s, status: nextStatus } : s));
    setSellers(updated);
    saveAdminSellers(updated);
    if (selectedSeller?.id === id) {
      setSelectedSeller({ ...selectedSeller, status: nextStatus });
    }

    try {
      await fetch('/api/admin/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, email: target.email, status: nextStatus }),
      });
    } catch (err) {
      console.warn('Failed to update seller status on server:', err);
    }

    const statusLabel = nextStatus === 'approved' ? 'Verified' : 'Suspended';
    notify?.(`${target.name} is now ${statusLabel}.`);
  };

  // Toggle Close/Open Shop inside Manage screen
  const toggleShopClose = async () => {
    if (!selectedSeller) return;
    const isCurrentlyActive = selectedSeller.status === 'approved';
    const nextStatus: 'approved' | 'suspended' = isCurrentlyActive ? 'suspended' : 'approved';

    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      status: nextStatus,
    };

    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);

    try {
      await fetch('/api/admin/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSeller.id,
          email: selectedSeller.email,
          status: nextStatus,
        }),
      });
    } catch (err) {
      console.warn('Failed to update shop status on server:', err);
    }

    if (isCurrentlyActive) {
      notify?.(`Shop "${selectedSeller.name}" has been closed / suspended.`);
    } else {
      notify?.(`Shop "${selectedSeller.name}" is now active and verified.`);
    }
  };

  // Set Target Exposure Drift
  const handleSetTargetDrift = () => {
    if (!selectedSeller) return;
    const target = Number(visitorCountInput) || 0;
    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      targetExposure: target,
    };
    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    notify?.(`Target exposure set to ${target}. Drifts up naturally each hour.`);
  };

  // Add Visitors Immediately
  const handleAddVisitorsNow = () => {
    if (!selectedSeller) return;
    const addAmt = Number(visitorCountInput) || 0;
    const current = selectedSeller.visitorsCount || 0;
    const newCount = current + addAmt;
    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      visitorsCount: newCount,
    };
    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    notify?.(`Added ${addAmt} immediate visitors to store exposure. Total: ${newCount}.`);
  };

  // Generate Temporary Password
  const handleGenerateTempPassword = () => {
    if (!selectedSeller) return;
    const randomPass = `Tmp#${Math.floor(100000 + Math.random() * 900000)}!`;
    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      tempPassword: randomPass,
    };
    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    notify?.(`Temporary password generated for ${selectedSeller.name}: ${randomPass}`);
  };

  // Reset or Change Password (Screenshot 3)
  const handleResetPassword = (forceChange: boolean) => {
    if (!selectedSeller) return;

    let finalPass = newPasswordInput.trim();
    if (!finalPass) {
      // Auto-generate strong password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
      let autoPass = 'Pass@';
      for (let i = 0; i < 7; i++) {
        autoPass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalPass = autoPass;
    }

    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      tempPassword: finalPass,
      forcePasswordChange: forceChange,
    };

    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    setNewPasswordInput('');

    const desc = forceChange ? 'Reset + force change on next login' : 'Password reset';
    setPasswordSuccessMsg(`New password: "${finalPass}" ${forceChange ? '(Must change on next login)' : ''}`);
    notify?.(`${desc} for ${selectedSeller.name}: "${finalPass}". Share this with the owner.`);
  };

  // Save Account Info Edits
  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;

    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      email: editEmail.trim() || selectedSeller.email,
      name: editShopName.trim() || selectedSeller.name,
      subtitle: editDisplayName.trim() || selectedSeller.subtitle,
      tiktok: editTiktok.trim() || selectedSeller.tiktok,
      promoteRate: editPromoteRate.trim() || selectedSeller.promoteRate,
    };

    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    setIsEditingAccount(false);
    notify?.(`Account information updated for ${updatedSeller.name}.`);
    void sendSellerNotification({
      sellerEmail: updatedSeller.email,
      category: 'Account Updates',
      title: 'Your seller account details were updated',
      message: [
        { text: 'Your shop profile has been updated. Shop name: ' },
        { text: updatedSeller.name, emphasis: 'blue' },
        { text: '. Sign in to review your updated account details.' },
      ],
      tone: 'info',
      href: '/seller/dashboard?tab=settings',
      dedupeKey: `seller-profile-updated:${updatedSeller.email}:${Date.now()}`,
    });
  };

  // Quick Wallet Adjustment
  const handleAdjustWallet = async (amount: number, type: 'wallet' | 'guarantee') => {
    if (!selectedSeller) return;
    const currentVal = selectedSeller.balances[type];
    const newVal = Math.max(0, currentVal + amount);
    const appliedAmount = Math.round((newVal - currentVal) * 100) / 100;
    if (appliedAmount === 0) {
      notify?.('The balance is already at the requested amount.');
      return;
    }
    try {
      const response = await fetch('/api/admin/wallet-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerEmail: selectedSeller.email,
          accountType: type,
          amount: appliedAmount,
          reason: type === 'wallet' ? 'Admin wallet balance adjustment' : 'Admin guarantee balance adjustment',
          dedupeKey: `admin-${type}-adjustment:${selectedSeller.id}:${Date.now()}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the balance adjustment.');
    } catch (error: any) {
      notify?.(error.message || 'Unable to save the balance adjustment.');
      return;
    }
    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      balances: {
        ...selectedSeller.balances,
        [type]: newVal,
      },
    };
    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    notify?.(
      `Adjusted ${type === 'wallet' ? 'Wallet' : 'Guarantee'} balance by $${amount.toFixed(2)}. New balance: $${newVal.toFixed(2)}.`
    );
  };

  // Grant a Tier (Screenshot 4)
  const handleGrantTier = () => {
    if (!selectedSeller) return;
    if (!selectedTierToGrant) {
      alert('Please pick a tier to grant.');
      return;
    }

    const tierConfig: Record<string, { limit: number | 'Unlimited'; rebate: number }> = {
      'Free Shop': { limit: 300, rebate: 15 },
      'Basic Shop': { limit: 500, rebate: 18 },
      'Silver Shop': { limit: 1000, rebate: 20 },
      'Gold Shop': { limit: 2500, rebate: 22 },
      'Diamond Shop': { limit: 'Unlimited', rebate: 25 },
    };

    const cfg = tierConfig[selectedTierToGrant] || { limit: 300, rebate: 15 };

    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      packageTier: selectedTierToGrant,
      productLimit: cfg.limit,
      profitMargin: cfg.rebate,
    };

    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    setSelectedTierToGrant('');
    notify?.(`Tier granted: ${selectedTierToGrant} for ${selectedSeller.name}.`);
    void sendSellerNotification({
      sellerEmail: selectedSeller.email,
      category: 'Account Updates',
      title: 'Your seller plan has been updated',
      message: [
        { text: 'Your plan is now ' },
        { text: selectedTierToGrant, emphasis: 'blue' },
        { text: `. Your product limit is ${cfg.limit === 'Unlimited' ? 'unlimited' : cfg.limit} and your resale rebate is ${cfg.rebate}%.` },
      ],
      tone: 'success',
      href: '/seller/dashboard?tab=package',
      dedupeKey: `seller-tier-updated:${selectedSeller.email}:${Date.now()}`,
    });
  };

  // Add Credit Score Points (Screenshot 4)
  const handleAddCreditPoints = () => {
    if (!selectedSeller) return;
    const pts = Number(creditPointsInput) || 10;
    const reason = creditReasonInput.trim() || 'Admin manual credit point addition';
    const oldScore = selectedSeller.creditScore !== undefined ? selectedSeller.creditScore : 100;
    const newScore = Math.min(100, oldScore + pts);

    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US')}`;

    const newLog: CreditScoreLog = {
      id: `cl-${Date.now()}`,
      timestamp: dateStr,
      change: pts,
      fromScore: oldScore,
      toScore: newScore,
      reason: reason,
      admin: 'user_01KZAH7...',
    };

    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      creditScore: newScore,
      creditLogs: [newLog, ...(selectedSeller.creditLogs || [])],
    };

    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    setCreditReasonInput('');
    notify?.(`Added ${pts} credit score points for ${selectedSeller.name}.`);
  };

  // Deduct Credit Score Points (Screenshot 4)
  const handleDeductCreditPoints = () => {
    if (!selectedSeller) return;
    const pts = Number(creditPointsInput) || 10;
    const reason = creditReasonInput.trim();
    if (!reason) {
      alert('Reason is required to deduct credit score points (recorded in audit log).');
      return;
    }
    const oldScore = selectedSeller.creditScore !== undefined ? selectedSeller.creditScore : 100;
    const newScore = Math.max(0, oldScore - pts);

    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US')}`;

    const newLog: CreditScoreLog = {
      id: `cl-${Date.now()}`,
      timestamp: dateStr,
      change: -pts,
      fromScore: oldScore,
      toScore: newScore,
      reason: reason,
      admin: 'user_01KZAH7...',
    };

    const updatedSeller: AdminSeller = {
      ...selectedSeller,
      creditScore: newScore,
      creditLogs: [newLog, ...(selectedSeller.creditLogs || [])],
    };

    const updated = sellers.map((s) => (s.id === selectedSeller.id ? updatedSeller : s));
    setSellers(updated);
    saveAdminSellers(updated);
    setSelectedSeller(updatedSeller);
    setCreditReasonInput('');
    notify?.(`Deducted ${pts} credit score points from ${selectedSeller.name}.`);
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    notify?.(`Copied ${fieldName} to clipboard.`);
  };

  // Add New Seller
  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newEmail.trim()) {
      alert('Shop Name and Email are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newOwnerName.trim() || newShopName.trim(),
          email: newEmail.trim(),
          shopName: newShopName.trim(),
          phone: newPhone.trim() || '+1 555-0100',
          packageTier: newPackage,
          productLimit: newProductLimit,
          profitMargin: Number(newProfitMargin) || 15,
          status: newStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.seller) {
          const updated = [
            data.seller,
            ...sellers.filter((s) => s.email.toLowerCase() !== data.seller.email.toLowerCase()),
          ];
          setSellers(updated);
          saveAdminSellers(updated);
          setIsAddModalOpen(false);
          setNewShopName('');
          setNewOwnerName('');
          setNewEmail('');
          setNewPhone('');
          notify?.(`Successfully created and registered shop "${data.seller.name}".`);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed creating seller via API:', err);
    }

    const newId = `seller-${Date.now()}`;
    const newSellerItem: AdminSeller = {
      id: newId,
      name: newShopName.trim(),
      subtitle: newOwnerName.trim() || newShopName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+1 555-0100',
      tiktok: '—',
      creatorId: `01M${Math.random().toString(36).substring(2, 10).toUpperCase()}BK8RG`,
      walletOwnerId: `01M${Math.random().toString(36).substring(2, 10).toUpperCase()}BK8RG`,
      tempPassword: 'no',
      createdAtFormatted: `${new Date().toLocaleDateString('en-US')}, ${new Date().toLocaleTimeString('en-US')}`,
      promoteRate: '10%',
      shopType: 'independent',
      visitorsCount: 0,
      targetExposure: 300,
      packageTier: newPackage,
      productLimit: newProductLimit,
      profitMargin: Number(newProfitMargin) || 15,
      status: newStatus,
      idStatus: 'No ID uploaded',
      productsCount: 0,
      balances: {
        pending: 0,
        wallet: 0,
        guarantee: 0,
      },
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      notes: 'Newly onboarded merchant.',
    };

    const updated = [newSellerItem, ...sellers];
    setSellers(updated);
    saveAdminSellers(updated);
    setIsAddModalOpen(false);
    setNewShopName('');
    setNewOwnerName('');
    setNewEmail('');
    setNewPhone('');
    notify?.(`Successfully created seller "${newSellerItem.name}".`);
  };

  // Delete Seller
  const handleDeleteSeller = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from sellers directory?`)) {
      const updated = sellers.filter((s) => s.id !== id);
      setSellers(updated);
      saveAdminSellers(updated);
      closeManagePage();
      notify?.(`Removed seller ${name}.`);
    }
  };

  const renderOwnerProductsModal = () => {
    if (!viewingProductsSeller) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-scaleUp overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#071324] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {(viewingProductsSeller.shopName || viewingProductsSeller.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    {viewingProductsSeller.shopName || viewingProductsSeller.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {viewingProductsSeller.productsCount ?? (viewingProductsSeller.products?.length || 0)} Products
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {viewingProductsSeller.email} · Attached inventory catalog
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingProductsSeller(null)}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or category..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setProductPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing {filteredOwnerProducts.length} of {viewingProductsSeller.productsCount ?? (viewingProductsSeller.products?.length || 0)} items
            </div>
          </div>

          {/* Modal Body / Products Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredOwnerProducts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-400 mb-3">
                  <Package className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800">No products found</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {productSearchQuery
                    ? `No products matched "${productSearchQuery}". Try another keyword.`
                    : 'This shop owner has not added any products from Storehouse yet.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-500 border-y border-gray-100 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Product</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Price</th>
                    <th className="py-2.5 px-3 font-semibold">Stock</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOwnerProducts.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                              <Package className="w-4 h-4 stroke-[1.5]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 block truncate max-w-xs">
                              {p.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                          {p.category || 'Storehouse'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">
                        ${typeof (p.price ?? p.pricePerKg) === 'number'
                          ? (p.price ?? p.pricePerKg).toFixed(2)
                          : (p.price ?? p.pricePerKg ?? '0.00')}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {p.stock ?? `${p.stockBags ?? 100} units`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {p.status || 'Published'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400 text-[11px]">
                        {p.addedDate || 'Recently'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Pagination / Footer */}
          {ownerProductsTotalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Page {productPage} of {ownerProductsTotalPages} ({filteredOwnerProducts.length} items)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={productPage <= 1}
                  onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={productPage >= ownerProductsTotalPages}
                  onClick={() => setProductPage((prev) => Math.min(ownerProductsTotalPages, prev + 1))}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // PAGE 2: SELLER MANAGE SCREEN (Shown when user clicks "Manage")
  // Strictly matches uploaded screenshot
  // =========================================================================
  if (selectedSeller) {
    const handleTag = `@${selectedSeller.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const isActive = selectedSeller.status === 'approved';

    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
        {/* BOX 1: Main Seller Profile & Credentials */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3.5">
            {/* Back Button */}
            <button
              onClick={closeManagePage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
              <span>Back</span>
            </button>

            {/* Shop Title and Handle */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {selectedSeller.name}
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {handleTag}
              </p>
            </div>
          </div>

          {/* Right Status Badges & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Active / Suspended Pill */}
            <span
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
                  : selectedSeller.status === 'review'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {isActive ? 'active' : selectedSeller.status === 'review' ? 'review' : 'suspended'}
            </span>

            {/* Close / Reopen Shop Button */}
            <button
              onClick={toggleShopClose}
              className="px-3 py-1 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 shadow-2xs transition-colors active:scale-95"
            >
              {isActive ? 'Close shop' : 'Reopen shop'}
            </button>

            {/* Independent Tag */}
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
              {selectedSeller.shopType || 'independent'}
            </span>

            {/* Free Shop / Package Pill */}
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#ffedd5] text-[#c2410c] border border-[#fed7aa]">
              {selectedSeller.packageTier}
            </span>
          </div>
        </div>

        {/* Section 1: Account */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Account</h2>
            <button
              onClick={() => setIsEditingAccount(!isEditingAccount)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingAccount ? 'Cancel Edit' : 'Edit details'}</span>
            </button>
          </div>

          {isEditingAccount ? (
            <form
              onSubmit={handleSaveAccountInfo}
              className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Login email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Shop name
                  </label>
                  <input
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={editTiktok}
                    onChange={(e) => setEditTiktok(e.target.value)}
                    className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Promote rate
                  </label>
                  <input
                    type="text"
                    value={editPromoteRate}
                    onChange={(e) => setEditPromoteRate(e.target.value)}
                    className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAccount(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-8 pt-1">
              {/* Row 1, Col 1 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Login email</span>
                <span className="block text-sm font-bold text-gray-900 mt-1">
                  {selectedSeller.email}
                </span>
              </div>

              {/* Row 1, Col 2 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Shop name</span>
                <span className="block text-sm font-bold text-gray-900 mt-1">
                  {selectedSeller.name}
                </span>
              </div>

              {/* Row 1, Col 3 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Display name</span>
                <span className="block text-sm font-bold text-gray-900 mt-1">
                  {selectedSeller.subtitle}
                </span>
              </div>

              {/* Row 2, Col 1 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">TikTok</span>
                <span className="block text-sm text-gray-800 mt-1">
                  {selectedSeller.tiktok || '—'}
                </span>
              </div>

              {/* Row 2, Col 2 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">
                  Promote rate (legacy · unused)
                </span>
                <span className="block text-sm font-bold text-gray-900 mt-1">
                  {selectedSeller.promoteRate || `${selectedSeller.profitMargin}%`}
                </span>
              </div>

              {/* Row 2, Col 3 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Created</span>
                <span className="block text-sm text-gray-800 mt-1">
                  {selectedSeller.createdAtFormatted || `${selectedSeller.joinedDate}/2026, 09:42:18 AM`}
                </span>
              </div>

              {/* Row 3, Col 1 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Temp password</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-800">
                    {selectedSeller.tempPassword || 'no'}
                  </span>
                  <button
                    onClick={handleGenerateTempPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                  >
                    {selectedSeller.tempPassword && selectedSeller.tempPassword !== 'no'
                      ? 'Reset'
                      : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Row 3, Col 2 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Creator ID</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-mono font-bold text-gray-900">
                    {selectedSeller.creatorId || '01M5086R7K1HYHPK6GDW0BK9AA'}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        selectedSeller.creatorId || '01M5086R7K1HYHPK6GDW0BK9AA',
                        'Creator ID'
                      )
                    }
                    className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    title="Copy Creator ID"
                  >
                    {copiedField === 'Creator ID' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Row 3, Col 3 */}
              <div>
                <span className="block text-xs text-gray-500 font-medium">Wallet owner id</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-mono font-bold text-gray-900">
                    {selectedSeller.walletOwnerId || '01M5086R7K1HYHPK6GDW0BK9AA'}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        selectedSeller.walletOwnerId || '01M5086R7K1HYHPK6GDW0BK9AA',
                        'Wallet Owner ID'
                      )
                    }
                    className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    title="Copy Wallet Owner ID"
                  >
                    {copiedField === 'Wallet Owner ID' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Section 2: Store visitors · exposure */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Store visitors · exposure</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Current: <strong className="text-gray-900">{selectedSeller.visitorsCount || 0}</strong>{' '}
              · Same source as the seller dashboard. &apos;Set target&apos; drifts up naturally each hour;
              a lower number applies immediately.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Count</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min="0"
                value={visitorCountInput}
                onChange={(e) => setVisitorCountInput(Number(e.target.value))}
                className="w-32 h-8 px-3 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSetTargetDrift}
                className="px-3.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Set target (drift)
              </button>
              <button
                type="button"
                onClick={handleAddVisitorsNow}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-800 shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Add now
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Section: Reset / change password (matches uploaded screenshot) */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Reset / change password</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Leave blank to auto-generate a strong password. Share the new password with the owner.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              New password (optional)
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="blank = auto-generate"
                className="w-64 h-8 px-3 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleResetPassword(false)}
                className="px-4 py-1.5 rounded-lg bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Reset password
              </button>
              <button
                type="button"
                onClick={() => handleResetPassword(true)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-800 shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Reset + force change
              </button>
            </div>
          </div>

          {/* Feedback banner showing current temporary / newly reset password */}
          {passwordSuccessMsg && (
            <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
              <button
                onClick={() => setPasswordSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOX 2: Wallet / deposit / tier (Screenshot)                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Wallet / deposit / tier
          </h2>
        </div>

        {/* Row 1: 4 Metric Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
          <div>
            <span className="block text-xs text-gray-500 font-medium">USD balance</span>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              ${(selectedSeller.usdBalance ?? selectedSeller.balances?.wallet ?? 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="block text-xs text-gray-500 font-medium">USDT balance</span>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              ${(selectedSeller.depositHeld ?? selectedSeller.balances?.guarantee ?? 0).toFixed(2)}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Tier / actual rebate</span>
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                ✓
              </span>
            </div>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              {selectedSeller.packageTier} · {selectedSeller.profitMargin}%
            </span>
          </div>
        </div>

        {/* Row 2: Middle Section (Product Limit, Grant a tier card, Credit score card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-1">
          {/* Left: Product limit (col-span-2) */}
          <div className="lg:col-span-2">
            <span className="block text-xs text-gray-500 font-medium">Product limit</span>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              {selectedSeller.productLimit}
            </span>
          </div>

          {/* Middle: Grant a tier card (col-span-5) */}
          <div className="lg:col-span-5 border border-gray-200 rounded-2xl p-5 bg-white space-y-3.5 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Grant a tier</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Pick a tier and the shop gets it. The merchant pays nothing and their wallet balance is unchanged — the ledger records it as a platform grant.
              </p>
            </div>

            <div>
              <select
                value={selectedTierToGrant}
                onChange={(e) => setSelectedTierToGrant(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— pick a tier —</option>
                <option value="Free Shop">Free Shop (15% · 300 products)</option>
                <option value="Basic Shop">Basic Shop (18% · 500 products)</option>
                <option value="Silver Shop">Silver Shop (20% · 1,000 products)</option>
                <option value="Gold Shop">Gold Shop (22% · 2,500 products)</option>
                <option value="Diamond Shop">Diamond Shop (25% · Unlimited products)</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleGrantTier}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Grant
              </button>
              <span className="text-xs text-gray-500 font-medium">
                Now: {selectedSeller.packageTier}
              </span>
            </div>
          </div>

          {/* Right: Credit score card (col-span-5) */}
          <div className="lg:col-span-5 border border-gray-200 rounded-2xl p-5 bg-white space-y-3.5 shadow-2xs">
            {/* Header with badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Credit score</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]">
                {(selectedSeller.creditScore ?? 100)} / 100
              </span>
              <span className="text-xs text-gray-500">
                Withdrawals allowed (threshold 80)
              </span>
            </div>

            {/* Inputs row */}
            <div className="flex items-end gap-2.5">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Points</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={creditPointsInput}
                  onChange={(e) => setCreditPointsInput(Number(e.target.value))}
                  className="w-16 h-8 px-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  Reason (required — goes into the audit log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. repeated shipping delays"
                  value={creditReasonInput}
                  onChange={(e) => setCreditReasonInput(e.target.value)}
                  className="w-full h-8 px-3 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddCreditPoints}
                className="h-8 px-3.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-medium text-gray-800 shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Deduct button */}
            <div>
              <button
                type="button"
                onClick={handleDeductCreditPoints}
                className="h-8 px-4 rounded-lg bg-[#ef4444] hover:bg-red-600 text-white text-xs font-semibold shadow-2xs transition-colors active:scale-95 cursor-pointer"
              >
                Deduct
              </button>
            </div>

            {/* Scrollable Audit log table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-gray-100">
                  {(selectedSeller.creditLogs && selectedSeller.creditLogs.length > 0) ? (
                    selectedSeller.creditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-gray-500 text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              log.change > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {log.change > 0 ? `+${log.change}` : log.change}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-gray-600 text-xs whitespace-nowrap font-medium">
                          {log.fromScore} → {log.toScore}
                        </td>
                        <td className="py-2.5 px-2 text-gray-800 text-xs font-medium max-w-[170px] truncate" title={log.reason}>
                          {log.reason}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px] whitespace-nowrap text-right">
                          {log.admin}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-xs text-gray-400">
                        No credit score changes recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 3: Bottom Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 pt-4 border-t border-gray-100">
          <div>
            <span className="block text-xs text-gray-500 font-medium">GMV</span>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              ${(selectedSeller.gmv ?? 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="block text-xs text-gray-500 font-medium">Commission</span>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              ${(selectedSeller.commission ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="col-span-2">
            <span className="block text-xs text-gray-500 font-medium">Referrals</span>
            <span className="block text-sm font-bold text-gray-900 mt-1">
              {selectedSeller.referrals
                ? `${selectedSeller.referrals.total} (pend ${selectedSeller.referrals.pending} / appr ${selectedSeller.referrals.approved} / paid ${selectedSeller.referrals.paid})`
                : '0 (pend 0 / appr 0 / paid 0)'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-2" />

        {/* Section: Inventory */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Inventory</h3>
            <span className="text-xs text-gray-500 font-medium">
              Distinct {selectedSeller.inventoryDistinct ?? 0} · Capital locked ${(selectedSeller.capitalLocked ?? 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            No stocked inventory.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Section: Consign orders */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Consign orders</h3>
            <span className="text-xs text-gray-500 font-medium">
              Total {selectedSeller.consignTotal ?? 0} · Unpaid {selectedSeller.consignUnpaid ?? 0} · Turnover ${(selectedSeller.consignTurnover ?? 0).toFixed(2)} · Profit ${(selectedSeller.consignProfit ?? 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            No consign orders.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Section: Published products */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Published products</h3>
            <span className="text-xs text-gray-500 font-medium">
              Total {selectedSeller.productsCount ?? 0} · Published {selectedSeller.productsCount ?? 0}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {selectedSeller.productsCount > 0
              ? `${selectedSeller.productsCount} products attached to this shop.`
              : 'No products yet.'}
          </p>

          {selectedSeller.productsCount > 0 && (
            <button
              type="button"
              onClick={() => handleOpenOwnerProducts(selectedSeller)}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#071324] hover:bg-[#11233b] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View All {selectedSeller.productsCount} Products</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Section: Wallet ledger (last 40) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Wallet ledger (last 40)</h3>
          </div>
          {(selectedSeller.walletLedger && selectedSeller.walletLedger.length > 0) ? (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Balance</th>
                    <th className="py-2 px-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSeller.walletLedger.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70">
                      <td className="py-2 px-3 text-gray-500">{item.date}</td>
                      <td className="py-2 px-3 font-medium text-gray-800">{item.type}</td>
                      <td className={`py-2 px-3 font-semibold ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.amount >= 0 ? `+$${item.amount.toFixed(2)}` : `-$${Math.abs(item.amount).toFixed(2)}`}
                      </td>
                      <td className="py-2 px-3 text-gray-700">${item.balanceAfter.toFixed(2)}</td>
                      <td className="py-2 px-3 text-gray-500">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              No ledger entries.
            </p>
          )}
        </div>
      </div>
      {renderOwnerProductsModal()}
    </div>
    );
  }

  // =========================================================================
  // PAGE 1: SELLERS TABLE LIST (Main View)
  // Strictly matches uploaded screenshot
  // =========================================================================
  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header strictly matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Sellers
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review storefront health, verification, packages, and financial access.
          </p>
        </div>

        {/* Filter Buttons & Controls */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition-colors"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>

          {/* ALL Tab */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              statusFilter === 'all'
                ? 'border-2 border-blue-500 text-blue-600 bg-white shadow-2xs'
                : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            ALL {counts.all}
          </button>

          {/* APPROVED Tab */}
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              statusFilter === 'approved'
                ? 'border-2 border-blue-500 text-blue-600 bg-white shadow-2xs'
                : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            APPROVED {counts.approved}
          </button>

          {/* REVIEW Tab */}
          <button
            onClick={() => setStatusFilter('review')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              statusFilter === 'review'
                ? 'border-2 border-blue-500 text-blue-600 bg-white shadow-2xs'
                : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            REVIEW {counts.review}
          </button>

          {/* SUSPENDED Tab */}
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              statusFilter === 'suspended'
                ? 'border-2 border-blue-500 text-blue-600 bg-white shadow-2xs'
                : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            SUSPENDED {counts.suspended}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, shop or id..."
          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sellers Table strictly matching screenshot */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-[11.5px] font-semibold text-gray-500 bg-gray-50/60">
              <th className="py-3 px-4 font-semibold text-gray-600">Seller</th>
              <th className="py-3 px-3 font-semibold text-gray-600">Package</th>
              <th className="py-3 px-3 font-semibold text-gray-600">Status</th>
              <th className="py-3 px-3 font-semibold text-gray-600">Products</th>
              <th className="py-3 px-3 font-semibold text-gray-600">Balances</th>
              <th className="py-3 px-3 font-semibold text-gray-600">Joined</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-400 stroke-[1.5]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">No sellers found</span>
                    <p className="text-xs text-gray-400 max-w-sm">
                      When merchants register and create wholesale shops, they will automatically appear here with their owner details and status.
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-blue-600 hover:underline font-semibold mt-1"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50/70 transition-colors">
                  {/* Column 1: Seller */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-white border border-gray-200/90 flex items-center justify-center font-bold text-gray-700 text-xs shrink-0 uppercase shadow-2xs mt-0.5">
                        {seller.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-950 text-xs leading-tight truncate">
                          {seller.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5 truncate">
                          {seller.subtitle}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate font-mono">
                          {seller.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Package */}
                  <td className="py-3.5 px-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                        {seller.packageTier || 'Free Shop'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {typeof seller.productLimit === 'number'
                          ? `${seller.productLimit} products`
                          : seller.productLimit} · {seller.profitMargin}% profit
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Status with Interactive Switch */}
                  <td className="py-3.5 px-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Interactive Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={seller.status === 'approved'}
                          onClick={() => toggleSellerStatus(seller.id)}
                          title={seller.status === 'approved' ? 'Click to suspend' : 'Click to approve'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            seller.status === 'approved' ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              seller.status === 'approved' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <span className="text-xs font-medium text-gray-600">
                          {seller.status === 'approved'
                            ? 'Verified'
                            : seller.status === 'review'
                            ? 'In review'
                            : 'Suspended'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex flex-col items-start gap-1">
                        <span
                          className={`inline-block text-[11px] font-semibold ${
                            seller.idStatus === 'Verified'
                              ? 'text-emerald-600 font-bold'
                              : seller.idStatus === 'Pending verification' || seller.idStatus === 'In review'
                              ? 'text-amber-600 font-bold'
                              : seller.idStatus === 'Rejected'
                              ? 'text-rose-600 font-bold'
                              : 'text-gray-400 font-normal'
                          }`}
                        >
                          {seller.idStatus || 'No ID uploaded'}
                        </span>
                        {(seller.kycSubmission || (seller.idStatus && seller.idStatus !== 'No ID uploaded')) && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <button
                              type="button"
                              onClick={() => openKycCard(seller, 'Front', 'side-only')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold transition-colors cursor-pointer"
                              title="View Front Side Screen"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Front</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openKycCard(seller, 'Back', 'side-only')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold transition-colors cursor-pointer"
                              title="View Back Side Screen"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Back</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openKycCard(seller, 'Front', 'full')}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer transition-colors ml-0.5"
                              title="View Full KYC Card"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span>Card</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Column 4: Products */}
                  <td className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOwnerProducts(seller);
                      }}
                      className="flex items-center gap-1.5 text-gray-800 hover:text-black font-semibold text-xs group cursor-pointer transition-colors p-1 rounded hover:bg-gray-100/80"
                      title={`View ${seller.productsCount ?? 0} products attached to ${seller.name}`}
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-600 group-hover:text-black stroke-[1.8] transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span className="font-bold underline-offset-2 group-hover:underline">
                        {seller.productsCount ?? 0}
                      </span>
                    </button>
                  </td>

                  {/* Column 5: Balances */}
                  <td className="py-3.5 px-3">
                    <div className="text-xs space-y-0.5 leading-tight font-mono">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-sans">
                          PENDING:
                        </span>{' '}
                        <span className="text-[#ea580c] font-bold">
                          ${(seller.balances?.pending ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-sans">
                          WALLET:
                        </span>{' '}
                        <span className="text-[#059669] font-bold">
                          ${(seller.balances?.wallet ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-sans">
                          GUARANTEE:
                        </span>{' '}
                        <span className="text-[#0284c7] font-bold">
                          ${(seller.balances?.guarantee ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 6: Joined */}
                  <td className="py-3.5 px-3 text-xs text-gray-600 font-medium whitespace-nowrap">
                    {seller.joinedDate || 'Nov 7'}
                  </td>

                  {/* Column 7: Actions */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSellerStatus(seller.id)}
                        className="px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors active:scale-95 cursor-pointer"
                      >
                        {seller.status === 'approved' ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        onClick={() => openManagePage(seller)}
                        className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== Add New Seller Modal ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 my-8 space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Add New Seller</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Register and onboard a new wholesale merchant shop.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeller} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. Royal Silks Store"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Owner / Contact Person
                </label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Wholesale Package
                  </label>
                  <select
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="Free Shop">Free Shop (300 products)</option>
                    <option value="Silver Shop">Silver Shop (500 products)</option>
                    <option value="Gold VIP">Gold VIP (1000 products)</option>
                    <option value="Diamond Enterprise">Diamond Enterprise (Unlimited)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="approved">Approved / Verified</option>
                    <option value="review">Review Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Create Seller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== KYC Verification Card Modal (View in Card) ===================== */}
      {selectedKycSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 my-8 space-y-4 animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${
                      kycCardMode === 'side-only'
                        ? activeKycCardSide === 'Front'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {kycCardMode === 'side-only'
                      ? activeKycCardSide === 'Front'
                        ? 'Front Side Screen'
                        : 'Back Side Screen'
                      : 'KYC Verification Card'}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      selectedKycSeller.kycSubmission?.status === 'approved' || selectedKycSeller.idStatus === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedKycSeller.kycSubmission?.status === 'rejected' || selectedKycSeller.idStatus === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    {selectedKycSeller.kycSubmission?.status === 'approved' || selectedKycSeller.idStatus === 'Verified'
                      ? 'Verified'
                      : selectedKycSeller.kycSubmission?.status === 'rejected' || selectedKycSeller.idStatus === 'Rejected'
                      ? 'Rejected'
                      : 'Pending Review'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>
                    {kycCardMode === 'side-only'
                      ? activeKycCardSide === 'Front'
                        ? `Front Side: ${selectedKycSeller.kycSubmission?.docType || 'ID Document'}`
                        : `Back Side: ${selectedKycSeller.kycSubmission?.docType || 'ID Document'}`
                      : `KYC Verification Card: ${selectedKycSeller.name}`}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Merchant: <strong className="text-gray-800">{selectedKycSeller.subtitle || selectedKycSeller.name}</strong> · Shop:{' '}
                  <strong className="text-gray-800">{selectedKycSeller.name}</strong> · Email:{' '}
                  <strong className="text-gray-800 font-mono">{selectedKycSeller.email}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKycSeller(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close Screen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Merchant Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  Full Name
                </span>
                <span className="font-bold text-gray-900 mt-0.5 block truncate">
                  {selectedKycSeller.subtitle || selectedKycSeller.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  Current View
                </span>
                <span className="font-bold text-blue-700 mt-0.5 block truncate">
                  {activeKycCardSide === 'Front' ? 'Front Side Only' : 'Back Side Only'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  Document Type
                </span>
                <span className="font-semibold text-gray-800 mt-0.5 block truncate">
                  {selectedKycSeller.kycSubmission?.docType || 'Government ID'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  Submitted At
                </span>
                <span className="font-mono text-gray-600 mt-0.5 block truncate">
                  {selectedKycSeller.kycSubmission?.submittedAt
                    ? new Date(selectedKycSeller.kycSubmission.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : selectedKycSeller.joinedDate || 'Recently'}
                </span>
              </div>
            </div>

            {/* Side Navigation: Tabs if full mode, or dedicated single-view banner with optional switch */}
            {kycCardMode === 'full' ? (
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveKycCardSide('Front')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeKycCardSide === 'Front'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Front Side
                </button>
                {selectedKycSeller.kycSubmission?.backImage && (
                  <button
                    type="button"
                    onClick={() => setActiveKycCardSide('Back')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeKycCardSide === 'Back'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Back Side
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Showing {activeKycCardSide === 'Front' ? 'Front Side Document only' : 'Back Side Document only'}</span>
                </span>
                {activeKycCardSide === 'Front' && selectedKycSeller.kycSubmission?.backImage && (
                  <button
                    type="button"
                    onClick={() => setActiveKycCardSide('Back')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View Back Side</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeKycCardSide === 'Back' && selectedKycSeller.kycSubmission?.frontImage && (
                  <button
                    type="button"
                    onClick={() => setActiveKycCardSide('Front')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>View Front Side</span>
                  </button>
                )}
              </div>
            )}

            {/* Image Preview Canvas */}
            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-center min-h-[380px] max-h-[560px] overflow-hidden border border-slate-800 relative group">
              {activeKycCardSide === 'Front' ? (
                selectedKycSeller.kycSubmission?.frontImage ? (
                  <img
                    src={selectedKycSeller.kycSubmission.frontImage}
                    alt={`${selectedKycSeller.name} Front ID`}
                    className="max-h-[520px] max-w-full object-contain rounded-lg shadow-lg select-none"
                  />
                ) : (
                  <div className="text-gray-400 text-xs flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-gray-600" />
                    <span>No document front image uploaded</span>
                  </div>
                )
              ) : selectedKycSeller.kycSubmission?.backImage ? (
                <img
                  src={selectedKycSeller.kycSubmission.backImage}
                  alt={`${selectedKycSeller.name} Back ID`}
                  className="max-h-[520px] max-w-full object-contain rounded-lg shadow-lg select-none"
                />
              ) : (
                <div className="text-gray-400 text-xs flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-gray-600" />
                  <span>No document back image uploaded</span>
                </div>
              )}
            </div>

            {/* Rejection Note if Rejected */}
            {selectedKycSeller.kycSubmission?.status === 'rejected' && selectedKycSeller.kycSubmission?.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Rejection Reason:</strong> {selectedKycSeller.kycSubmission.rejectionReason}
              </div>
            )}

            {/* Modal Actions */}
            <div className={`flex items-center pt-2 border-t border-gray-100 ${kycCardMode === 'full' ? 'justify-between' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setSelectedKycSeller(null)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Screen
              </button>

              {kycCardMode === 'full' && selectedKycSeller.kycSubmission && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setKycRejectReason('Uploaded document photo is blurry or unreadable.');
                      setIsRejectingKyc(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Reject KYC
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveKycFromOwners}
                    className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Approve KYC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== KYC Rejection Reason Prompt Modal ===================== */}
      {isRejectingKyc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Specify Rejection Reason</span>
              </h3>
              <button
                onClick={() => setIsRejectingKyc(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Provide feedback to the merchant on why their KYC submission was rejected.
            </p>

            <textarea
              rows={3}
              value={kycRejectReason}
              onChange={(e) => setKycRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="e.g. Uploaded document is unclear or expired..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectingKyc(false)}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectKycFromOwners}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================== Owner Products Modal ===================== */}
      {renderOwnerProductsModal()}
    </div>
  );
}
