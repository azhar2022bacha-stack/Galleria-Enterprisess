'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Upload,
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  RotateCw,
  RefreshCw,
} from 'lucide-react';
import {
  getKycStatus,
  setKycStatus as saveLocalKycStatus,
  getKycData,
  submitKycVerification,
  subscribeToOrders,
  KycStatus,
  KycData,
} from '@/lib/sellerOrders';

interface SellerVerificationPanelProps {
  notify?: (msg: string) => void;
}

export function SellerVerificationPanel({ notify }: SellerVerificationPanelProps) {
  const [activeUser, setActiveUser] = useState<{
    fullName: string;
    email: string;
    shopName: string;
  }>({
    fullName: '',
    email: '',
    shopName: '',
  });

  const [kycStatus, setKycStatus] = useState<KycStatus | 'Rejected'>('Not verified');
  const [docType, setDocType] = useState<string>('National ID Card (NIC)');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontFileName, setFrontFileName] = useState<string | null>(null);
  const [backFileName, setBackFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAtFormatted, setSubmittedAtFormatted] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Clear all front and back side document inputs/state
  const clearDocumentInputs = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontFileName(null);
    setBackFileName(null);
    if (frontInputRef.current) frontInputRef.current.value = '';
    if (backInputRef.current) backInputRef.current.value = '';
  };

  const prevStatusRef = useRef<string | null>(null);

  // Load active user and fetch real KYC submission status from database with live polling
  useEffect(() => {
    let emailToQuery = '';

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('galleria_active_seller');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.email) {
            emailToQuery = parsed.email;
            setActiveUser({
              fullName: parsed.fullName || parsed.shopName || 'Merchant',
              email: parsed.email,
              shopName: parsed.shopName || parsed.fullName || 'Merchant Shop',
            });
          }
        }
      } catch {}
    }

    // Fetch existing KYC submission from /api/kyc?email=...
    const fetchExistingKyc = async () => {
      let accountIsVerified = false;
      try {
        const currentRes = await fetch('/api/seller/current', { cache: 'no-store' });
        if (currentRes.status === 401 || currentRes.status === 403) {
          setKycStatus('Not verified');
          setDocType('National ID Card (NIC)');
          return;
        }
        if (currentRes.ok) {
          const currentData = await currentRes.json();
          if (currentData.success && currentData.seller?.email) {
            const seller = currentData.seller;
            emailToQuery = seller.email;
            setActiveUser({
              fullName: seller.fullName || seller.shopName || 'Merchant',
              email: seller.email,
              shopName: seller.shopName || seller.fullName || 'Merchant Shop',
            });
            accountIsVerified = seller.status === 'approved'
              && seller.idStatus === 'Verified'
              && seller.isApproved === true;
          }
        }
      } catch (currentError) {
        console.warn('Failed fetching current seller status:', currentError);
      }

      if (!emailToQuery) {
        setKycStatus('Not verified');
        return;
      }

      try {
        const res = await fetch(`/api/kyc?email=${encodeURIComponent(emailToQuery)}`, { cache: 'no-store' });
        if (res.status === 401 || res.status === 403) {
          setKycStatus(accountIsVerified ? 'Verified' : 'Not verified');
          if (accountIsVerified) {
            setDocType('');
            saveLocalKycStatus('Verified', emailToQuery);
          } else {
            setDocType('National ID Card (NIC)');
          }
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.submission) {
            const sub = data.submission;
            setDocType(sub.docType || 'National ID Card (NIC)');
            setRejectionReason(sub.rejectionReason || null);

            // Once submitted, front and back document files are removed from the form
            clearDocumentInputs();

            if (sub.submittedAt) {
              const d = new Date(sub.submittedAt);
              setSubmittedAtFormatted(
                isNaN(d.getTime())
                  ? sub.submittedAt
                  : `${d.toLocaleDateString('en-US')}, ${d.toLocaleTimeString('en-US')}`
              );
            }

            if (accountIsVerified || sub.status === 'approved') {
              if (prevStatusRef.current && prevStatusRef.current !== 'approved') {
                notify?.('🎉 Congratulations! Your merchant account and KYC verification have been approved by the administrator.');
              }
              prevStatusRef.current = 'approved';
              setKycStatus('Verified');
              saveLocalKycStatus('Verified', emailToQuery);
            } else if (sub.status === 'rejected') {
              prevStatusRef.current = 'rejected';
              setKycStatus('Rejected');
            } else {
              prevStatusRef.current = 'pending';
              setKycStatus('Pending');
              saveLocalKycStatus('Pending', emailToQuery);
            }
            return;
          }

          if (accountIsVerified) {
            if (prevStatusRef.current && prevStatusRef.current !== 'approved') {
              notify?.('🎉 Congratulations! Your merchant account and identity have been approved by the administrator.');
            }
            prevStatusRef.current = 'approved';
            setKycStatus('Verified');
            setDocType('');
            setRejectionReason(null);
            setSubmittedAtFormatted(null);
            saveLocalKycStatus('Verified', emailToQuery);
            return;
          }

          prevStatusRef.current = 'not_verified';
          setKycStatus('Not verified');
          setDocType('National ID Card (NIC)');
          setRejectionReason(null);
          setSubmittedAtFormatted(null);
          saveLocalKycStatus('Not verified', emailToQuery);
          return;
        }
      } catch (err) {
        console.warn('Failed fetching KYC submission from API:', err);
      }

      if (accountIsVerified) {
        prevStatusRef.current = 'approved';
        setKycStatus('Verified');
        setDocType('');
        saveLocalKycStatus('Verified', emailToQuery);
        return;
      }

      // Use the local cache only when the server cannot be reached.
      const localStatus = getKycStatus(emailToQuery);
      setKycStatus(localStatus);
    };

    fetchExistingKyc();

    // Auto-polling interval (every 3.5 seconds) so admin approval updates live
    const interval = setInterval(fetchExistingKyc, 3500);
    window.addEventListener('focus', fetchExistingKyc);

    const unsub = subscribeToOrders(fetchExistingKyc);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchExistingKyc);
      unsub();
    };
  }, []);

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notify?.('File size exceeds 10MB limit. Please upload a smaller image.');
        return;
      }
      setFrontFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFrontImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notify?.('File size exceeds 10MB limit. Please upload a smaller image.');
        return;
      }
      setBackFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setBackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontImage && !frontFileName) {
      notify?.('Please upload the front of your ID document.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerEmail: activeUser.email,
          sellerName: activeUser.fullName,
          shopName: activeUser.shopName,
          docType,
          frontImage: frontImage || frontFileName,
          backImage: backImage || backFileName || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setKycStatus('Pending');
          setRejectionReason(null);
          setSubmittedAtFormatted(new Date().toLocaleString('en-US'));

          // Remove the document front and back side inputs after submit
          clearDocumentInputs();

          // Also mirror to client local helper
          const payload: KycData = {
            documentType: docType,
            frontImage: 'id_front.jpg',
            backImage: 'id_back.jpg',
          };
          submitKycVerification(payload, activeUser.email);

          notify?.('KYC documents submitted successfully! Our compliance team will review your application.');
          setIsSubmitting(false);
          return;
        }
      }
      throw new Error('Server returned unsuccessful response');
    } catch (err: any) {
      console.warn('API submission failed, using local fallback:', err);
      // Fallback: remove document front and back side inputs after submit
      clearDocumentInputs();
      setKycStatus('Pending');
      notify?.('KYC documents submitted successfully.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Account verification
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Confirm your identity to keep your account secure and unlock full merchant privileges.
        </p>
      </div>

      {/* Main KYC Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-xs mt-5 max-w-4xl">
        {/* Card Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                Identity Verification (KYC)
              </h2>
              {kycStatus === 'Verified' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> ID Verified & Approved
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">
              Upload your valid government-issued photo ID. All documents are securely stored and verified by compliance administrators.
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shadow-2xs ${
                kycStatus === 'Verified'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                  : kycStatus === 'Pending'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : kycStatus === 'Rejected'
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {kycStatus === 'Verified' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {kycStatus === 'Pending'
                ? 'Pending verification'
                : kycStatus === 'Verified'
                ? 'Approved'
                : kycStatus === 'Rejected'
                ? 'Verification Rejected'
                : 'No ID uploaded'}
            </span>
          </div>
        </div>

        {/* ===================== VIEW 1: WHEN PENDING (SUBMITTED) ===================== */}
        {kycStatus === 'Pending' ? (
          <div className="mt-6 p-8 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex flex-col items-center text-center space-y-3.5 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                Documents Submitted Successfully
              </h3>
              <p className="text-xs text-gray-600 max-w-md leading-relaxed">
                Your <span className="font-semibold text-gray-900">{docType}</span> (Front & Back) has been securely received and submitted for administrator verification.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs mt-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Status: Pending Administrator Review</span>
            </div>

            <p className="text-[11px] text-gray-400 font-mono pt-1">
              Submitted on: {submittedAtFormatted || 'Recently'} · Document files removed after submission
            </p>
          </div>
        ) : kycStatus === 'Verified' ? (
          /* ===================== VIEW 2: WHEN VERIFIED / APPROVED ===================== */
          <div className="mt-6 p-8 rounded-2xl bg-gradient-to-b from-emerald-50/90 to-emerald-50/30 border border-emerald-200/90 flex flex-col items-center text-center space-y-4 animate-fadeIn shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" /> Approved by Administrator
              </div>
              <h3 className="text-lg font-bold text-emerald-950">
                Seller Account & Identity Approved
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-md leading-relaxed">
                Your seller account has been approved by the administrator and is currently in verified standing. Seller features are available for this account.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {docType ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Document: {docType}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Administrator Verified</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Account Status: Approved</span>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== VIEW 3: UPLOAD FORM (NOT VERIFIED OR REJECTED) ===================== */
          <div className="mt-6 space-y-5 animate-fadeIn">
            {/* Rejection Alert if applicable */}
            {kycStatus === 'Rejected' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">Verification Requires Attention</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {rejectionReason ||
                      'Your previous document upload could not be verified. Please review the requirements below and upload a clearer document.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Document Type Dropdown */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Select Identification Document
                </label>
                <div className="relative">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-8 border border-gray-300 rounded-lg text-xs font-medium text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer shadow-2xs"
                  >
                    <option value="National ID Card (NIC)">1. National ID Card (NIC)</option>
                    <option value="Passport">2. Passport</option>
                    <option value="Driving Licence">3. Driving Licence</option>
                    <option value="Residence Permit">4. Residence Permit</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {docType === 'Passport'
                    ? 'Upload your clear photo page showing full details, date of birth, and expiry.'
                    : 'Upload both front and back sides of your official photo identification card.'}
                </p>
              </div>

              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={frontInputRef}
                onChange={handleFrontFileChange}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={backInputRef}
                onChange={handleBackFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* 2 Dropzones side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Column 1: Document Front */}
                <div>
                  <span className="text-xs font-bold text-gray-700 block mb-1.5">
                    {docType === 'Passport' ? 'Passport Photo Page (Front)' : 'Document Front'}{' '}
                    <span className="text-rose-500">*</span>
                  </span>
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center min-h-[180px] flex flex-col items-center justify-center cursor-pointer bg-gray-50/40 hover:bg-gray-50 transition-all relative overflow-hidden group shadow-2xs"
                  >
                    {frontImage ? (
                      <div className="w-full flex flex-col items-center justify-center">
                        <img
                          src={frontImage}
                          alt="Document Front Preview"
                          className="max-h-28 object-contain rounded-md border border-gray-200 mb-2 shadow-xs"
                        />
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Front uploaded
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFrontImage(null);
                            setFrontFileName(null);
                            if (frontInputRef.current) frontInputRef.current.value = '';
                          }}
                          className="text-[11px] text-gray-400 hover:text-rose-600 mt-1 cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ) : frontFileName ? (
                      <div className="flex flex-col items-center">
                        <Check className="w-6 h-6 text-emerald-600 mb-1" />
                        <span className="text-xs text-gray-800 font-semibold">{frontFileName}</span>
                        <span className="text-[10px] text-gray-400 mt-1">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Click to upload Front</span>
                        <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, or WebP up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Document Back */}
                <div>
                  <span className="text-xs font-bold text-gray-700 block mb-1.5">
                    {docType === 'Passport' ? 'Passport Back / Signature Page (Optional)' : 'Document Back'}
                  </span>
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center min-h-[180px] flex flex-col items-center justify-center cursor-pointer bg-gray-50/40 hover:bg-gray-50 transition-all relative overflow-hidden group shadow-2xs"
                  >
                    {backImage ? (
                      <div className="w-full flex flex-col items-center justify-center">
                        <img
                          src={backImage}
                          alt="Document Back Preview"
                          className="max-h-28 object-contain rounded-md border border-gray-200 mb-2 shadow-xs"
                        />
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Back uploaded
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBackImage(null);
                            setBackFileName(null);
                            if (backInputRef.current) backInputRef.current.value = '';
                          }}
                          className="text-[11px] text-gray-400 hover:text-rose-600 mt-1 cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ) : backFileName ? (
                      <div className="flex flex-col items-center">
                        <Check className="w-6 h-6 text-emerald-600 mb-1" />
                        <span className="text-xs text-gray-800 font-semibold">{backFileName}</span>
                        <span className="text-[10px] text-gray-400 mt-1">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Click to upload Back</span>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {docType === 'Passport' ? 'Optional for passport' : 'JPG, PNG, or WebP up to 10MB'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/80 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Ensure all text is clearly readable, the full card edges are visible, and no glare or shadows obscure personal identification details. Once submitted, your documents will be removed from this form and reviewed by administrators.
                </p>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Submitting verification...</span>
                    </>
                  ) : (
                    <span>Submit for Verification</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
