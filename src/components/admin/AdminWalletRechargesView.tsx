'use client';

import { createPortal } from 'react-dom';
import React, { useState, useMemo, useEffect } from 'react';
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
  receipt?: {name:string;url:string};
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {const res=await fetch('/api/recharges',{cache:'no-store'});if(!res.ok)throw new Error('Unable to load recharges.');const data=await res.json();setRecharges(data.recharges);}catch(e:any){notify?.(e.message);}finally{setIsRefreshing(false);}
  };
  useEffect(()=>{handleRefresh();const timer=setInterval(handleRefresh,3500);return()=>clearInterval(timer);},[]);
  const review = async(item:WalletRechargeItem,status:string,creditedAmount?:number)=>{try{const res=await fetch('/api/recharges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review',id:item.id,status,creditedAmount,sellerEmail:item.handle,rechargeReference:item.reference,requestedAmount:item.amount})});if(!res.ok)throw new Error('Unable to update recharge.');await handleRefresh();window.dispatchEvent(new Event('galleria:admin-todo-changed'));notify?.('Recharge '+status.toLowerCase()+'.');}catch(e:any){notify?.(e.message);}};
  const handleConfirm=(item:WalletRechargeItem)=>{setConfirmRecharge(item);setCreditedUsd('');setConfirmError('');};
  const handleReject=(item:WalletRechargeItem)=>review(item,'Rejected');

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
      {confirmRecharge && typeof document!=='undefined' && createPortal(<div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="confirm-recharge-title" className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 w-full max-w-sm"><h2 id="confirm-recharge-title" className="text-sm font-semibold text-gray-900">Confirm this recharge?</h2><p className="text-xs text-gray-500 mt-2 leading-relaxed">This confirms the customer's recharge. Verify the transfer and payment screenshot first. You may override the credited USD below. Leave blank to use the requested amount ({confirmRecharge.amount.toFixed(2)} USD).</p><label htmlFor="credited-usd" className="block text-xs text-gray-500 mt-5 mb-1">Credited USD (optional)</label><input id="credited-usd" autoFocus type="number" min="0.01" step="0.01" value={creditedUsd} onChange={e=>setCreditedUsd(e.target.value)} placeholder={confirmRecharge.amount.toFixed(2)} className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"/>{confirmError&&<p role="alert" className="text-xs text-red-600 mt-2">{confirmError}</p>}<div className="flex justify-end gap-2 mt-5"><button disabled={confirmBusy} onClick={()=>setConfirmRecharge(null)} className="px-3 py-1.5 border rounded text-xs text-gray-600">Cancel</button><button disabled={confirmBusy} onClick={async()=>{const amount=creditedUsd.trim()===''?confirmRecharge.amount:Number(creditedUsd);if(!Number.isFinite(amount)||amount<=0){setConfirmError('Enter a valid amount greater than zero.');return;}setConfirmBusy(true);try{const res=await fetch('/api/recharges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review',id:confirmRecharge.id,status:'Confirmed',creditedAmount:amount,sellerEmail:confirmRecharge.handle,rechargeReference:confirmRecharge.reference,requestedAmount:confirmRecharge.amount})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to confirm recharge.');await handleRefresh();window.dispatchEvent(new Event('galleria:admin-todo-changed'));notify?.('Recharge confirmed.');setActiveStatus('All');setConfirmRecharge(null);}catch(e:any){setConfirmError(e.message);}finally{setConfirmBusy(false);}}} className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50">{confirmBusy?'Confirming…':'Yes'}</button></div></section></div>,document.body)}
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
              onClick={handleRefresh}
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
                      {item.reference}{item.receipt&&<button type="button" onClick={()=>setReceiptPreview(item.receipt!)} className="block text-blue-600 hover:underline mt-1">View receipt</button>}{item.walletAddress&&<span className="block text-[10px] text-gray-400 break-all">{item.walletAddress}</span>}
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
                            onClick={() => handleReject(item)}
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
