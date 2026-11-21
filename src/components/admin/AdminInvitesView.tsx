'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Sparkles, Mail, Store, ChevronRight, Calendar } from 'lucide-react';
import {
  InviteCode,
  RegisteredUserInfo,
  parseRegisteredUser,
  getInviteCodes,
  saveInviteCodes,
  generateInviteCodes,
  clearInviteCodes,
  subscribeToInviteCodes,
} from '@/lib/inviteCodes';

interface AdminInvitesViewProps {
  notify?: (msg: string) => void;
}

export function AdminInvitesView({ notify }: AdminInvitesViewProps) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [howMany, setHowMany] = useState<number | string>(5);
  const [usesPerCode, setUsesPerCode] = useState<number | string>(1);
  const [note, setNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUsersCode, setSelectedUsersCode] = useState<InviteCode | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<RegisteredUserInfo | null>(null);

  // Fetch latest codes from persistent server API
  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/invites');
      const data = await res.json();
      if (Array.isArray(data.codes)) {
        setCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to load invites from server', err);
    }
  };

  useEffect(() => {
    fetchCodes();
    // Poll periodically while open; manual actions and focus still refresh immediately.
    const interval = setInterval(fetchCodes, 15_000);
    window.addEventListener('focus', fetchCodes);
    return () => { clearInterval(interval); window.removeEventListener('focus', fetchCodes); };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, Math.min(100, Number(howMany) || 1));
    const maxUses = Math.max(1, Number(usesPerCode) || 1);

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          howMany: count,
          usesPerCode: maxUses,
          note,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.codes)) {
        setCodes(data.codes);
      }
      const totalSlots = count * maxUses;
      notify?.(`Generated ${count} code${count > 1 ? 's' : ''}! (${totalSlots} total registration capacity)`);
      setNote('');
    } catch (err) {
      console.error('Failed to generate codes', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all existing invitation codes? You can generate new codes anytime.')) {
      try {
        const res = await fetch('/api/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' }),
        });
        const data = await res.json();
        setCodes(data.codes || []);
        notify?.('All invitation codes have been cleared.');
      } catch (err) {
        console.error('Failed to clear codes', err);
      }
    }
  };

  const handleCopy = (codeText: string, id: string) => {
    navigator.clipboard?.writeText(codeText);
    setCopiedId(id);
    notify?.(`Copied ${codeText} to clipboard`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      const data = await res.json();
      if (Array.isArray(data.codes)) {
        setCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to toggle code status', err);
    }
  };

  const totalCount = codes.length;
  const usableCount = codes.filter((c) => c.status === 'usable').length;
  const exhaustedCount = codes.filter((c) => c.status === 'exhausted').length;
  const totalRegistrations = codes.reduce((acc, c) => acc + (c.usage || 0), 0);
  const totalCapacityRemaining = codes.reduce(
    (acc, c) => acc + (c.status === 'usable' ? Math.max(0, c.maxUsage - c.usage) : 0),
    0
  );

  return (
    <div className="max-w-[1300px] mx-auto animate-fadeIn pb-12">
      {/* Outer Card */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Invite Codes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-[#046a38] font-semibold border border-emerald-200">
                PRD Verified
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control exclusive merchant onboarding via multi-use invitation codes
            </p>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-normal flex flex-wrap items-center gap-2">
            <span>Total: <strong className="text-gray-900">{totalCount}</strong></span>
            <span>·</span>
            <span className="text-emerald-700">Usable: <strong>{usableCount}</strong></span>
            <span>·</span>
            <span className="text-gray-600">Exhausted: <strong>{exhaustedCount}</strong></span>
            <span>·</span>
            <span className="text-blue-700">Capacity Left: <strong>{totalCapacityRemaining}</strong></span>

            {codes.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md border border-red-200 transition-colors cursor-pointer ml-1 font-medium"
              >
                Clear all codes
              </button>
            )}
          </div>
        </div>

        {/* Generator Controls Form */}
        <div className="px-6 sm:px-8 pb-6 pt-5 bg-gray-50/50 border-b border-gray-100">
          <form
            onSubmit={handleGenerate}
            className="flex flex-wrap items-end gap-3 sm:gap-4"
          >
            {/* How many */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                How many codes
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={howMany}
                onChange={(e) => setHowMany(e.target.value)}
                className="w-24 sm:w-28 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors"
                required
              />
            </div>

            {/* Uses per code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Uses per code
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={usesPerCode}
                onChange={(e) => setUsesPerCode(e.target.value)}
                className="w-24 sm:w-28 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors"
                required
              />
            </div>

            {/* Note (who it's for) */}
            <div className="flex-1 min-w-[240px] max-w-xl">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Note (who it&apos;s for)
              </label>
              <input
                type="text"
                placeholder="e.g. Prospect from TikTok DM, UAE Wholesalers"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors"
              />
            </div>

            {/* Generate button */}
            <div>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-[#18181b] hover:bg-black rounded-lg transition-colors shadow-2xs whitespace-nowrap h-[38px] flex items-center justify-center cursor-pointer gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate codes</span>
              </button>
            </div>
          </form>

          {/* Quick Info text matching PRD Example */}
          <div className="mt-2.5 text-[11.5px] text-gray-500">
            Generating <strong className="text-gray-800">{howMany}</strong> code(s) with <strong className="text-gray-800">{usesPerCode}</strong> use(s) each will create capacity for <strong className="text-emerald-700">{(Number(howMany) || 0) * (Number(usesPerCode) || 0)}</strong> new merchants.
          </div>
        </div>

        {/* Codes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30 text-xs font-semibold text-gray-700">
                <th className="py-3 px-6 sm:px-8 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Note</th>
                <th className="py-3 px-4 font-semibold">Usage</th>
                <th className="py-3 px-4 font-semibold">Remaining</th>
                <th className="py-3 px-4 font-semibold">Registered Users</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-6 sm:px-8 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-700">No invitation codes</p>
                      <p className="text-xs text-gray-400">
                        Use the form above to generate your first batch of invitation codes.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                codes.map((item) => {
                  const remaining = Math.max(0, item.maxUsage - item.usage);
                  const hasUsers = item.usedBy && item.usedBy.length > 0;
                  const isZeroRemaining = remaining <= 0 || item.status === 'exhausted';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                    {/* Code */}
                    <td className="py-3.5 px-6 sm:px-8 font-bold text-gray-900 font-mono tracking-tight whitespace-nowrap">
                      <span>{item.code}</span>
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap max-w-[160px] truncate">
                      {item.note || '—'}
                    </td>

                    {/* Usage */}
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap font-mono text-xs sm:text-sm">
                      <span className="font-semibold text-gray-900">{item.usage}</span>
                      <span className="text-gray-400">/{item.maxUsage}</span>
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono ${
                          remaining > 0
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {remaining} left
                      </span>
                    </td>

                    {/* Registered Users */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {hasUsers ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUsersCode(item)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#046a38] hover:text-emerald-900 hover:underline cursor-pointer bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.usedBy!.length} User{item.usedBy!.length === 1 ? '' : 's'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">None yet</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'usable' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-[#e6f8f0] text-[#0f9755]">
                          Usable
                        </span>
                      ) : item.status === 'exhausted' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-[#f3f4f6] text-[#6b7280]">
                          Exhausted
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-[#fee2e2] text-[#dc2626]">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Created timestamp */}
                    <td className="py-3.5 px-4 text-gray-600 text-xs sm:text-sm font-mono whitespace-nowrap">
                      {item.created}
                    </td>

                    {/* Actions: Copy & Disable */}
                    <td className="py-3.5 px-6 sm:px-8 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          disabled={isZeroRemaining}
                          onClick={() => !isZeroRemaining && handleCopy(item.code, item.id)}
                          title={isZeroRemaining ? 'No uses remaining (code exhausted)' : 'Copy invitation code'}
                          className={`px-3 py-1 border rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                            isZeroRemaining
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 select-none'
                              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-2xs cursor-pointer'
                          }`}
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <span>Copy</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id)}
                          className="text-gray-600 hover:text-gray-900 text-xs font-normal transition-colors cursor-pointer select-none"
                        >
                          {item.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal for viewing registered users of an invitation code */}
      {selectedUsersCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>Registered Users</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-[#046a38] font-semibold border border-emerald-200">
                    {selectedUsersCode.usedBy?.length || 0} Registered
                  </span>
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Code: <strong className="text-gray-900">{selectedUsersCode.code}</strong> {selectedUsersCode.note ? `(${selectedUsersCode.note})` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUsersCode(null);
                  setSelectedUserDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 mb-3 flex items-center justify-between">
              <span>
                Total registered: <strong className="text-[#046a38]">{selectedUsersCode.usedBy?.length || 0}</strong> of <strong className="text-gray-900">{selectedUsersCode.maxUsage}</strong> max capacity
              </span>
              <span className="text-gray-400 text-[11px]">Click user to view details</span>
            </div>

            {/* List of Registered Users */}
            <div className="max-h-80 overflow-y-auto space-y-2.5 border border-gray-100 rounded-xl p-2.5 bg-gray-50/40">
              {selectedUsersCode.usedBy && selectedUsersCode.usedBy.length > 0 ? (
                selectedUsersCode.usedBy.map((rawUser, idx) => {
                  const user = parseRegisteredUser(rawUser);
                  const isSelected = selectedUserDetail?.email === user.email;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedUserDetail(isSelected ? null : user)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                          : 'bg-white hover:bg-gray-50/90 border-gray-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* User Avatar Initial */}
                          <div className="w-8 h-8 rounded-full bg-[#e6f8f0] text-[#046a38] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0">
                            {/* Full Name */}
                            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <span className="truncate">{user.fullName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                                Slot #{idx + 1}
                              </span>
                            </div>

                            {/* Email Address */}
                            <div className="text-[11.5px] text-gray-600 flex items-center gap-1.5 mt-0.5 truncate">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="font-mono truncate">{user.email}</span>
                            </div>

                            {/* Shop Name */}
                            <div className="text-[11.5px] text-[#046a38] font-medium flex items-center gap-1.5 mt-0.5">
                              <Store className="w-3 h-3 text-[#046a38] shrink-0" />
                              <span className="truncate font-semibold">{user.shopName}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                            isSelected ? 'rotate-90 text-[#046a38]' : ''
                          }`}
                        />
                      </div>

                      {/* Expanded Detail View when user is clicked */}
                      {isSelected && (
                        <div className="mt-3 pt-2.5 border-t border-emerald-200/80 grid grid-cols-2 gap-2 text-[11px] animate-fadeIn">
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                              Full Name
                            </span>
                            <span className="font-bold text-gray-900">{user.fullName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                              Shop Name
                            </span>
                            <span className="font-bold text-[#046a38]">{user.shopName}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                              Email Address
                            </span>
                            <span className="font-mono text-gray-800 break-all">{user.email}</span>
                          </div>
                          {user.registeredAt && (
                            <div className="col-span-2 flex items-center gap-1 text-gray-500 text-[10.5px]">
                              <Calendar className="w-3 h-3" />
                              <span>Registered on {user.registeredAt}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">
                  No users have registered with this code yet.
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedUsersCode(null);
                  setSelectedUserDetail(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
