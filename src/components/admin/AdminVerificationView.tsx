'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  X,
  Eye,
  AlertTriangle,
  ZoomIn,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export interface VerificationItem {
  id: string;
  sellerEmail: string;
  sellerName: string;
  shopName: string;
  docType: 'National ID Card (NIC)' | 'Passport' | 'Driving Licence' | 'Residence Permit' | 'Shop registration';
  frontImage: string;
  backImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  source?: 'seller-registration';
  phone?: string;
}

const STORAGE_KEY = 'buyxoco_admin_verifications';

interface AdminVerificationViewProps {
  notify?: (msg: string) => void;
}

export function AdminVerificationView({ notify }: AdminVerificationViewProps) {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<VerificationItem | null>(null);
  const [activeSide, setActiveSide] = useState<'Front' | 'Back'>('Front');
  const [reviewMode, setReviewMode] = useState<'side-only' | 'full'>('side-only');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetRejectId, setTargetRejectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Fetch real KYC submissions from /api/kyc
  const fetchSubmissions = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('/api/kyc', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.submissions)) {
          setItems(data.submissions);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch KYC submissions from API:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Purge legacy mock data cache in localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (
          raw &&
          (raw.includes('Silva Trading') ||
            raw.includes('zee collections') ||
            raw.includes('idabagus') ||
            raw.includes('silva-trading-co'))
        ) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    }

    fetchSubmissions(true);

    // Auto-refresh interval (every 7 seconds) so newly submitted documents appear automatically
    const interval = setInterval(() => {
      fetchSubmissions(true);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchSubmissions(false);
    notify?.('Verification queue refreshed.');
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const item = items.find((entry) => entry.id === id);
          notify?.(item?.source === 'seller-registration' ? 'Shop application approved successfully.' : 'KYC verification approved successfully.');
          fetchSubmissions(true);
          if (selectedSubmission?.id === id) {
            setSelectedSubmission((prev) => (prev ? { ...prev, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'Administrator' } : null));
          }
          return;
        }
      }
      throw new Error('Approval request failed');
    } catch (err: any) {
      console.warn('Failed to approve KYC:', err);
      notify?.('Error approving verification.');
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setTargetRejectId(id);
    setRejectReason('Uploaded document photo is blurry or unreadable. Please upload a clear photo.');
    setIsRejecting(true);
  };

  const handleConfirmReject = async () => {
    if (!targetRejectId) return;

    try {
      const res = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetRejectId,
          status: 'rejected',
          reason: rejectReason.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          notify?.(`KYC verification marked as rejected.`);
          fetchSubmissions(true);
          if (selectedSubmission?.id === targetRejectId) {
            setSelectedSubmission((prev) =>
              prev ? { ...prev, status: 'rejected', rejectionReason: rejectReason } : null
            );
          }
          setIsRejecting(false);
          setTargetRejectId(null);
          return;
        }
      }
      throw new Error('Rejection request failed');
    } catch (err: any) {
      console.warn('Failed to reject KYC:', err);
      notify?.('Error rejecting verification.');
    }
  };

  const openReviewModal = (
    item: VerificationItem,
    side: 'Front' | 'Back' = 'Front',
    mode: 'side-only' | 'full' = 'side-only'
  ) => {
    setSelectedSubmission(item);
    setActiveSide(side);
    setReviewMode(mode);
  };

  const formatSubmittedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.toLocaleDateString('en-US')}, ${d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return dateStr;
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const rejectedCount = items.filter((i) => i.status === 'rejected').length;

  return (
    <div className="max-w-[1300px] mx-auto animate-fadeIn pb-12">
      {/* Outer Card */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Extensions</span>
              <span className="text-gray-400 font-normal">Â·</span>
              <span>Verification</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Review new shop applications and verify identity documents submitted by merchants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-amber-700'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-rose-700'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Verification Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11.5px] font-semibold text-gray-600 bg-gray-50/60 uppercase tracking-wider">
                <th className="py-3 px-6 sm:px-8 font-semibold">Merchant / Owner</th>
                <th className="py-3 px-4 font-semibold">Application / Document</th>
                <th className="py-3 px-4 font-semibold">Details / Files</th>
                <th className="py-3 px-4 font-semibold">Submission Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-6 sm:px-8 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-gray-400 stroke-[1.5]" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">No verification items found</span>
                      <p className="text-xs text-gray-400 max-w-md">
                        New shop applications appear here as pending. Identity documents appear here when sellers submit them from their account.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Merchant / Owner */}
                    <td className="py-4 px-6 sm:px-8 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0 uppercase shadow-2xs">
                          {item.sellerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">
                            {item.sellerName}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Shop: <span className="text-gray-700 font-semibold">{item.shopName}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {item.sellerEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Application / Document Type Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/90 text-[11px] font-semibold text-slate-700 font-sans tracking-wide">
                        {item.docType}
                      </span>
                    </td>

                    {/* ID files or shop application details */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {item.source === 'seller-registration' ? (
                        <span className="text-[11px] text-slate-500">Shop profile · ID not submitted</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openReviewModal(item, 'Front', 'side-only')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Front</span>
                          </button>

                          {item.backImage && (
                            <button
                              type="button"
                              onClick={() => openReviewModal(item, 'Back', 'side-only')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Back</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Submission Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {formatSubmittedDate(item.submittedAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs ${
                          item.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {item.status === 'approved'
                          ? item.source === 'seller-registration' ? 'Account approved' : 'Verified'
                          : item.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending'}
                      </span>
                    </td>

                    {/* Actions: Approve / Reject / View */}
                    <td className="py-4 px-6 sm:px-8 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReviewModal(item, 'Front', 'full')}
                          className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          {item.source === 'seller-registration' ? 'View application' : 'Review'}
                        </button>

                        {item.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(item.id)}
                            className="px-3.5 py-1.5 bg-[#18181b] hover:bg-black text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95"
                          >
                            {item.source === 'seller-registration' ? 'Approve account' : 'Approve'}
                          </button>
                        )}

                        {item.source !== 'seller-registration' && item.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(item.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= DOCUMENT PREVIEW / REVIEW MODAL ======================= */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 my-8 space-y-4 animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${
                      reviewMode === 'side-only'
                        ? activeSide === 'Front'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {selectedSubmission.source === 'seller-registration'
                      ? 'Shop application review'
                      : reviewMode === 'side-only'
                        ? activeSide === 'Front'
                          ? 'Front Side Screen'
                          : 'Back Side Screen'
                        : 'Full KYC Review'}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      selectedSubmission.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedSubmission.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    {selectedSubmission.status === 'approved'
                      ? selectedSubmission.source === 'seller-registration' ? 'Account approved' : 'Verified'
                      : selectedSubmission.status === 'rejected'
                      ? 'Rejected'
                      : 'Pending Review'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedSubmission.source === 'seller-registration'
                    ? `Shop application: ${selectedSubmission.sellerName}`
                    : reviewMode === 'side-only'
                      ? activeSide === 'Front'
                        ? `Front Side: ${selectedSubmission.docType}`
                        : `Back Side: ${selectedSubmission.docType}`
                      : `KYC Review: ${selectedSubmission.sellerName}`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Merchant: <strong className="text-gray-800">{selectedSubmission.sellerName}</strong> · Shop:{' '}
                  <strong className="text-gray-800">{selectedSubmission.shopName}</strong> · Email:{' '}
                  <strong className="text-gray-800 font-mono">{selectedSubmission.sellerEmail}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close Screen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  {selectedSubmission.source === 'seller-registration' ? 'Review type' : 'Document Type'}
                </span>
                <span className="font-bold text-gray-800 mt-0.5 block truncate">
                  {selectedSubmission.docType}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  {selectedSubmission.source === 'seller-registration' ? 'Application' : 'Current View'}
                </span>
                <span className="font-bold text-blue-700 mt-0.5 block truncate">
                  {selectedSubmission.source === 'seller-registration' ? 'Shop profile' : activeSide === 'Front' ? 'Front Side Only' : 'Back Side Only'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  {selectedSubmission.source === 'seller-registration' ? 'Shop created' : 'Submitted At'}
                </span>
                <span className="font-mono text-gray-700 mt-0.5 block truncate">
                  {formatSubmittedDate(selectedSubmission.submittedAt)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                  Reviewer
                </span>
                <span className="font-medium text-gray-700 mt-0.5 block truncate">
                  {selectedSubmission.reviewedBy || 'Pending'}
                </span>
              </div>
            </div>

            {/* Side Navigation: Tabs if full review, or dedicated single-view banner with optional switch */}
            {selectedSubmission.source === 'seller-registration' ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                This shop was added to the review queue at registration. Government ID documents are submitted separately from the seller account.
              </div>
            ) : reviewMode === 'full' ? (
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveSide('Front')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSide === 'Front'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Front Side
                </button>
                {selectedSubmission.backImage && (
                  <button
                    type="button"
                    onClick={() => setActiveSide('Back')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSide === 'Back'
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
                  <span>Showing {activeSide === 'Front' ? 'Front Side Document only' : 'Back Side Document only'}</span>
                </span>
                {activeSide === 'Front' && selectedSubmission.backImage && (
                  <button
                    type="button"
                    onClick={() => setActiveSide('Back')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View Back Side</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeSide === 'Back' && selectedSubmission.frontImage && (
                  <button
                    type="button"
                    onClick={() => setActiveSide('Front')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>View Front Side</span>
                  </button>
                )}
              </div>
            )}

            {/* Document Image Display */}
            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-center min-h-[380px] max-h-[560px] overflow-hidden border border-slate-800 relative group">
              {selectedSubmission.source === 'seller-registration' ? (
                <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-800 p-6 text-left text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shop profile</p>
                  <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><dt className="text-[10px] uppercase text-slate-400">Shop name</dt><dd className="mt-1 text-sm font-semibold">{selectedSubmission.shopName}</dd></div>
                    <div><dt className="text-[10px] uppercase text-slate-400">Owner</dt><dd className="mt-1 text-sm font-semibold">{selectedSubmission.sellerName}</dd></div>
                    <div><dt className="text-[10px] uppercase text-slate-400">Email</dt><dd className="mt-1 text-sm font-semibold break-all">{selectedSubmission.sellerEmail}</dd></div>
                    <div><dt className="text-[10px] uppercase text-slate-400">Phone</dt><dd className="mt-1 text-sm font-semibold">{selectedSubmission.phone || 'Not provided'}</dd></div>
                  </dl>
                  <p className="mt-5 border-t border-slate-700 pt-4 text-xs text-slate-300">No identity document was uploaded during shop registration. Approving this application approves the seller account; it does not mark an ID document as verified.</p>
                </div>
              ) : activeSide === 'Front' ? (
                selectedSubmission.frontImage ? (
                  <img
                    src={selectedSubmission.frontImage}
                    alt={`${selectedSubmission.sellerName} ID Front`}
                    className="max-h-[520px] max-w-full object-contain rounded-lg shadow-lg select-none"
                  />
                ) : (
                  <div className="text-gray-400 text-xs">No front image uploaded</div>
                )
              ) : selectedSubmission.backImage ? (
                <img
                  src={selectedSubmission.backImage}
                  alt={`${selectedSubmission.sellerName} ID Back`}
                  className="max-h-[520px] max-w-full object-contain rounded-lg shadow-lg select-none"
                />
              ) : (
                <div className="text-gray-400 text-xs">No back image uploaded</div>
              )}
            </div>

            {/* Rejection Note if Rejected */}
            {selectedSubmission.status === 'rejected' && selectedSubmission.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Rejection Reason:</strong> {selectedSubmission.rejectionReason}
              </div>
            )}

            {/* Actions */}
            <div className={`flex items-center pt-2 border-t border-gray-100 ${reviewMode === 'full' ? 'justify-between' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Screen
              </button>

              {selectedSubmission.source === 'seller-registration' && reviewMode === 'full' && selectedSubmission.status !== 'approved' ? (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedSubmission.id)}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Approve shop account
                </button>
              ) : selectedSubmission.source !== 'seller-registration' && reviewMode === 'full' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRejectModal(selectedSubmission.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Reject Document
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedSubmission.id)}
                    className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Approve Verification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= REJECT REASON MODAL ======================= */}
      {isRejecting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Specify Rejection Reason</span>
              </h3>
              <button
                onClick={() => setIsRejecting(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              This message will be shown to the merchant so they understand why their documents were rejected and how to resubmit.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="e.g. Uploaded document photo is blurry or unreadable..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
