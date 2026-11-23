'use client';

import { RejectionReasonDialog } from './RejectionReasonDialog';
import { createPortal } from 'react-dom';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, AlertCircle, ExternalLink, ArrowUpDown } from 'lucide-react';

export type RechargeStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'All';

export interface WalletRechargeItem {
  id: string;
  reference: string;
  depositor: string;
  handle: string;
  coin: string;
  network: string;
  amount: number;
  creditedAmount?: number;
  txHash: string;
  walletAddress?: string;
  hasReceipt?: boolean;
  reviewReason?: string;
  submittedAt: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
}

// Initial state starts with 0 pending items to exactly match the screenshot
const INITIAL_RECHARGES: WalletRechargeItem[] = [
  {
    id: 'rec-1',
    reference: 'RC-8492019',
    depositor: 'The Modern Essentials',
    handle: '@modern_essentials',
    coin: 'USDT',
    network: 'TRC20',
    amount: 500.0,
    txHash: '0x8f7c10b4...3d9a',
    submittedAt: '10/24/2026, 4:15 PM',
    status: 'Confirmed',
  },
  {
    id: 'rec-2',
    reference: 'RC-7391024',
    depositor: 'Ansar collection',
    handle: '@ansar_store',
    coin: 'BTC',
    network: 'Bitcoin',
    amount: 1250.0,
    txHash: 'bc1q9a2f...81e2',
    submittedAt: '10/23/2026, 11:30 AM',
    status: 'Confirmed',
  },
  {
    id: 'rec-3',
    reference: 'RC-6281031',
    depositor: 'Princy creation',
    handle: '@princy_fashion',
    coin: 'USDT',
    network: 'TRC20',
    amount: 250.0,
    txHash: '0x3a4b5c...991e',
    submittedAt: '10/21/2026, 2:40 PM',
    status: 'Rejected',
  },
];

interface AdminWalletRechargesViewProps {
  notify?: (msg: string) => void;
  initialStatus?: RechargeStatus;
}

export function AdminWalletRechargesView({ notify, initialStatus = 'Pending' }: AdminWalletRechargesViewProps) {
  const [confirmRecharge,setConfirmRecharge] = useState<WalletRechargeItem|null>(null);
  const [creditedUsd,setCreditedUsd] = useState('');
  const [confirmBusy,setConfirmBusy] = useState(false);
  const [confirmError,setConfirmError] = useState('');
  const [receiptPreview,setReceiptPreview] = useState<{name:string;url:string}|null>(null);
  const [activeStatus, setActiveStatus] = useState<RechargeStatus>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [recharges, setRecharges] = useState<WalletRechargeItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => setActiveStatus(initialStatus), [initialStatus]);

  const refreshState = useRef({ version: 0, busy: false, retry: false, etag: '' });
  const handleRefresh = async (force = false) => {
    const state = refreshState.current;
    if (state.busy && !force) return;
    const version = ++state.version;
    state.busy = true;
    setIsRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (state.etag) headers['If-None-Match'] = state.etag;
      const response = await fetch('/api/recharges?view=queue', {cache:'no-store', headers});
      if (response.status === 304) {
        if (version === state.version) state.retry = false;
        return;
      }
      if (!response.ok) throw new Error('Unable to load recharges.');
      const data = await response.json();
      if (!Array.isArray(data.recharges)) throw new Error('Unable to load recharges.');
      if (version !== state.version) return;
      state.retry = false;
      state.etag = response.headers.get('ETag') || '';
      setRecharges(previous => {
        const ids = new Set(data.recharges.map((item: WalletRechargeItem) => item.id));
        return [...data.recharges, ...previous.filter(item => !ids.has(item.id))];
      });
    } catch (error) {
      if (version === state.version) {
        if (!state.retry) notify?.(error instanceof Error ? error.message : 'Unable to load recharges.');
        state.retry = true;
      }
    } finally {
      if (version === state.version) {
        state.busy = false;
        setIsRefreshing(false);
      }
    }
  };
  useEffect(() => {
    const refresh = () => { if (!document.hidden) void handleRefresh(); };
    refresh();
    const retryTimer = window.setInterval(() => { if (refreshState.current.retry) refresh(); }, 750);
    const changed = () => { if (!document.hidden) void handleRefresh(true); };
    window.addEventListener('galleria:recharges-changed', changed);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('galleria:recharges-changed', changed);
      window.clearInterval(retryTimer);
      refreshState.current.version++;
      refreshState.current.busy = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  async function viewReceipt(id: string) {
    try {
      const response = await fetch('/api/recharges?id=' + encodeURIComponent(id), { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const receipt = (await response.json()).recharges?.[0]?.receipt;
      if (!receipt?.url) throw new Error();
      setReceiptPreview(receipt);
    } catch {
      notify?.('Unable to load the receipt. Please try again.');
    }
  }

  const [rejectItem, setRejectItem] = useState<WalletRechargeItem | null>(null);
  const rejectRecharge = async (reason: string) => {
    if (!rejectItem) return;
    const response = await fetch('/api/recharges?view=queue', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'review',id:rejectItem.id,status:'Rejected',reason})});
    if (!response.ok) throw Error('Unable to reject this recharge. Refresh and try again.');
    refreshState.current.version++;
    setRecharges(previous => previous.map(item => item.id === rejectItem.id ? { ...item, status:'Rejected', reviewReason: reason } : item));
    void handleRefresh(true);
    window.dispatchEvent(new Event('galleria:admin-todo-changed'));
    notify?.('Recharge rejected.');
  };
  const handleConfirm=(item:WalletRechargeItem)=>{setConfirmRecharge(item);setCreditedUsd('');setConfirmError('');};


  const filteredRecharges = useMemo(() => {
    return recharges.filter((item) => {
      const matchesStatus =
        activeStatus === 'All' || item.status === activeStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.reference.toLowerCase().includes(q) ||
        item.depositor.toLowerCase().includes(q) ||
        item.handle.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [recharges, activeStatus, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      {rejectItem && <RejectionReasonDialog kind="recharge" onCancel={()=>setRejectItem(null)} onReject={rejectRecharge} />}
      {confirmRecharge && typeof document!=='undefined' && createPortal(<div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="confirm-recharge-title" className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 w-full max-w-sm"><h2 id="confirm-recharge-title" className="text-sm font-semibold text-gray-900">Confirm this recharge?</h2><p className="text-xs text-gray-500 mt-2 leading-relaxed">This confirms the customer's recharge. Verify the transfer and payment screenshot first. You may override the credited USD below. Leave blank to use the requested amount ({confirmRecharge.amount.toFixed(2)} USD).</p><label htmlFor="credited-usd" className="block text-xs text-gray-500 mt-5 mb-1">Credited USD (optional)</label><input id="credited-usd" autoFocus type="number" min="0.01" step="0.01" value={creditedUsd} onChange={e=>setCreditedUsd(e.target.value)} placeholder={confirmRecharge.amount.toFixed(2)} className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"/>{confirmError&&<p role="alert" className="text-xs text-red-600 mt-2">{confirmError}</p>}<div className="flex justify-end gap-2 mt-5"><button disabled={confirmBusy} onClick={()=>setConfirmRecharge(null)} className="px-3 py-1.5 border rounded text-xs text-gray-600">Cancel</button><button disabled={confirmBusy} onClick={async()=>{const amount=creditedUsd.trim()===''?confirmRecharge.amount:Number(creditedUsd);if(!Number.isFinite(amount)||amount<=0){setConfirmError('Enter a valid amount greater than zero.');return;}setConfirmBusy(true);try{const res=await fetch('/api/recharges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review',id:confirmRecharge.id,status:'Confirmed',creditedAmount:amount,sellerEmail:confirmRecharge.handle,rechargeReference:confirmRecharge.reference,requestedAmount:confirmRecharge.amount})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to confirm recharge.');refreshState.current.version++;setRecharges(previous=>previous.map(item=>item.id===confirmRecharge.id?{...item,status:'Confirmed',creditedAmount:amount}:item));void handleRefresh(true);window.dispatchEvent(new Event('galleria:admin-todo-changed'));notify?.('Recharge confirmed.');setConfirmRecharge(null);}catch(e:any){setConfirmError(e.message);}finally{setConfirmBusy(false);}}} className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50">{confirmBusy?'Confirming…':'Yes'}</button></div></section></div>,document.body)}
      {receiptPreview && typeof document!=='undefined' && createPortal(<div role="dialog" aria-modal="true" aria-label="Payment receipt" className="fixed inset-0 z-[100] bg-black/80 flex flex-col p-4" onClick={()=>setReceiptPreview(null)}><div className="flex items-center justify-between text-white mb-3"><span className="text-sm truncate">{receiptPreview.name}</span><button type="button" autoFocus aria-label="Close receipt" onClick={()=>setReceiptPreview(null)} className="p-2" onKeyDown={e=>{if(e.key==='Escape')setReceiptPreview(null);}}><X size={24}/></button></div><div className="flex-1 min-h-0 flex items-center justify-center overflow-auto"><img src={receiptPreview.url} alt="Uploaded payment receipt" className="max-w-full max-h-full object-contain bg-white rounded" onClick={e=>e.stopPropagation()}/></div></div>,document.body)}
      {/* Outer Card Container matching screenshot */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Top Header Row */}
        <div className="px-6 sm:px-8 py-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Wallet Recharges
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-2xs"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Informational Tip Strip */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-b border-gray-100/90 bg-[#fafafa]/80 text-xs text-gray-500 leading-relaxed">
          Tip: verify the on-chain transfer (amount / coin / reference) before confirming. Confirming credits the wallet immediately and cannot be undone; rejecting voids the recharge.
        </div>

        {/* Filter Tabs & Search Controls Row */}
        <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
          {/* Status Tabs: Pending, Confirmed, Rejected, All */}
          <div className="flex items-center gap-2">
            {(['Pending', 'Confirmed', 'Rejected', 'All'] as RechargeStatus[]).map((tab) => {
              const isSelected = activeStatus === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveStatus(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                    isSelected
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference / depositor / @handle"
              className="w-full pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-2xs transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Records Area or Empty State */}
        {filteredRecharges.length === 0 ? (
          <div className="px-6 sm:px-8 py-10 sm:py-12 text-sm text-gray-500 font-normal">
            No recharges in this status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-3 px-6 font-semibold">Reference</th>
                  <th className="py-3 px-6 font-semibold">Depositor</th>
                  <th className="py-3 px-6 font-semibold">Coin / Network</th>
                  <th className="py-3 px-6 font-semibold">Amount</th>
                  <th className="py-3 px-6 font-semibold">Submitted</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredRecharges.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-gray-900">
                      {item.reference}{item.hasReceipt&&<button type="button" onClick={()=>void viewReceipt(item.id)} className="block text-blue-600 hover:underline mt-1">View receipt</button>}{item.walletAddress&&<span className="block text-[10px] text-gray-400 break-all">{item.walletAddress}</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-gray-900">{item.depositor}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{item.handle}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-gray-900">{item.coin}</span>
                      <span className="text-[11px] text-gray-400 ml-1.5 font-mono">({item.network})</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-gray-900">
                      ${(item.status==='Confirmed' ? item.creditedAmount ?? item.amount : item.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 whitespace-nowrap">
                      {item.submittedAt}
                    </td>
                    <td className="py-3.5 px-6">
                      {item.status === 'Confirmed' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                      ) : item.status === 'Rejected' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                      {item.status === 'Rejected' && item.reviewReason && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-rose-700"><strong>Reason:</strong> {item.reviewReason}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      {item.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirm(item)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectItem(item)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 border border-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
