'use client';

import { CRYPTO_WITHDRAW_METHODS } from '@/lib/depositMethods';
import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import {
  getWallet,
  subscribeToOrders,
  topUpWallet,
  requestWithdrawal,
  getTransactions,
  getResaleSettlements,
  getPackageSpend,
  WalletTransaction,
  ResaleSettlement,
} from '@/lib/sellerOrders';
import { sendSellerNotification } from '@/lib/sellerNotifications';
import { SELLER_CRYPTO_DEPOSIT_NETWORKS, type CryptoReceivingAddressMap } from '@/lib/cryptoReceivingAddresses';

interface SellerWalletPanelProps {
  onOpenSupport?: () => void;
  notify: (msg: string) => void;
  productCount?: number;
  capitalInStock?: number;
}

const CRYPTO_TOP_UP_METHODS = SELLER_CRYPTO_DEPOSIT_NETWORKS.map((network) => network.name);
const NONCRYPTO_TOP_UP_METHODS = ['UPI', 'Paytm', 'Debit Card', 'Credit Card', 'Visa Card', 'Mastercard', 'PayPal', 'Square', 'QuickBooks', 'Apple Pay', 'Zelle', 'Venmo'];

const DIGITAL_WALLET_WITHDRAW_METHODS = NONCRYPTO_TOP_UP_METHODS;

function getPayoutDetailsPlaceholder(method: string) {
  if (CRYPTO_WITHDRAW_METHODS.includes(method)) return `${method} wallet address`;
  if (method === 'PayPal') return 'PayPal email address';
  if (method === 'UPI') return 'UPI ID (e.g. name@bank)';
  if (['Paytm', 'Zelle', 'Venmo'].includes(method)) return `${method} phone number, email, or account ID`;
  if (['Debit Card', 'Credit Card', 'Visa Card', 'Mastercard'].includes(method)) return 'Name and linked payout account details';
  if (method === 'Apple Pay') return 'Apple Pay phone number or email';
  return `${method} account details`;
}

function PaymentLogo({ method }: { method: string }) {
 const box = 'w-10 h-7 shrink-0 rounded flex items-center justify-center overflow-hidden';
 if (method === 'Venmo') return <span className={box + ' bg-white text-[#008cff] italic font-black text-[11px]'}>venmo</span>;
 if (method === 'PayPal') return <span className={box + ' bg-white italic font-black text-[11px]'}><span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span></span>;
 if (method === 'Square') return <span className={box + ' bg-white'}><svg viewBox="0 0 32 32" className="w-7 h-7" aria-label="Square"><rect x="3" y="3" width="26" height="26" rx="6" fill="none" stroke="#111" strokeWidth="4"/><rect x="11" y="11" width="10" height="10" rx="2" fill="#111"/></svg></span>;
 if (method === 'QuickBooks') return <span className={box + ' bg-white'}><span className="w-7 h-7 rounded-full bg-[#2ca01c] text-white text-lg font-medium flex items-center justify-center tracking-tighter">qb</span></span>;
 if (method === 'Apple Pay') return <span className={box + ' bg-white text-black text-xs font-semibold'}><svg viewBox="0 0 20 24" className="w-4 h-5" aria-label="Apple"><path fill="currentColor" d="M14.1 3.8c.8-1 1.4-2.2 1.3-3.5-1.2.1-2.6.9-3.5 1.9-.8.9-1.5 2.1-1.3 3.4 1.3.1 2.6-.7 3.5-1.8ZM17.8 12.8c0-3 2.4-4.4 2.5-4.5-1.4-2.1-3.6-2.3-4.4-2.3-1.9-.2-3.7 1.1-4.6 1.1-1 0-2.5-1.1-4.1-1.1C5.1 6 3 7.3 1.9 9.3c-2.3 4-.6 10 1.6 13.2 1.1 1.5 2.3 3.1 4 3 1.6-.1 2.2-1 4.2-1s2.5 1 4.2 1c1.8 0 2.9-1.5 3.9-3 .9-1.3 1.3-2.5 1.4-2.6-.1 0-3.4-1.3-3.4-5.1Z" transform="scale(.85)"/></svg>Pay</span>;
 if (method === 'Zelle') return <span className={box + ' bg-white text-[#6d1ed4] text-[13px] font-bold'}>zelle<span className="text-[9px]">®</span></span>;
 if (method === 'Mastercard') return <span className={box + ' bg-gray-50'}><svg viewBox="0 0 48 28" className="w-10 h-6" aria-label="Mastercard"><circle cx="18" cy="14" r="11" fill="#eb001b"/><circle cx="30" cy="14" r="11" fill="#f79e1b" fillOpacity="0.9"/></svg></span>;
 if (method === 'Visa Card') return <span className={box + ' bg-white text-[#1434cb] font-black italic text-sm'}>VISA</span>;
 if (method === 'Paytm') return <span className={box + ' bg-white font-bold text-[11px]'}><span className="text-[#002970]">pay</span><span className="text-[#00baf2]">tm</span></span>;
 if (method === 'UPI') return <span className={box + ' bg-white italic font-black text-gray-700 text-sm'}>UPI<span className="text-orange-500">▸</span></span>;
 if (method.includes('Card')) return <span className={box + ' bg-slate-100 text-slate-600'}><CreditCard className="w-6 h-5" /></span>;
 const token = method.startsWith('USDT') ? '₮' : method.startsWith('USDC') ? '$' : method.startsWith('BTC') ? '₿' : '♦';
 const color = method.startsWith('USDT') ? '#26a17b' : method.startsWith('USDC') ? '#2775ca' : method.startsWith('BTC') ? '#f7931a' : '#627eea';
 return <span className={box}><span style={{backgroundColor: color}} className="w-7 h-7 rounded-full text-white text-xl font-bold flex items-center justify-center">{token}</span></span>;
}

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function SellerWalletPanel({
  notify,
  productCount = 0,
  capitalInStock = 0,
  onOpenSupport,
}: SellerWalletPanelProps) {
  const [wallet, setWallet] = useState(0);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [packageSpend, setPackageSpend] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [settlements, setSettlements] = useState<ResaleSettlement[]>([]);
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoReceivingAddressMap>({});
  const [depositAddressError, setDepositAddressError] = useState('');

  // Top up form state
  const [topUpAmount, setTopUpAmount] = useState('100');
  const [topUpNetwork, setTopUpNetwork] = useState('');
  const [openDepositSection, setOpenDepositSection] = useState<string | null>(null);
  const [depositReceipt, setDepositReceipt] = useState<{name:string;url:string}|null>(null);
  const [receiptLoading,setReceiptLoading] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const submissionInFlight = React.useRef(false);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('USDT (TRC20)');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [openWithdrawSection, setOpenWithdrawSection] = useState<string | null>('Crypto Withdraw');
  const isCryptoWithdrawal = CRYPTO_WITHDRAW_METHODS.includes(withdrawMethod);
  const isDigitalWalletWithdrawal = DIGITAL_WALLET_WITHDRAW_METHODS.includes(withdrawMethod);
  const selectedCryptoNetwork = SELLER_CRYPTO_DEPOSIT_NETWORKS.find((network) => network.name === topUpNetwork);
  const activeDepositAddress = selectedCryptoNetwork ? cryptoAddresses[selectedCryptoNetwork.id] || '' : '';

  // Live sync with localStorage
  useEffect(() => {
    const refresh = () => {
      setWallet(getWallet());
      setWalletLoaded(true);
      setPackageSpend(getPackageSpend());
      setTransactions(getTransactions());
      setSettlements(getResaleSettlements());
    };
    refresh();
    return subscribeToOrders(refresh);
  }, []);

  useEffect(() => {
    let active = true;
    const refreshCryptoAddresses = async () => {
      try {
        const response = await fetch('/api/receiving-addresses?scope=seller', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || data?.success === false) throw new Error(data?.error || 'Unable to load receiving addresses.');
        if (active) {
          setCryptoAddresses(data.addresses || {});
          setDepositAddressError('');
        }
      } catch (error) {
        if (active) {
          setCryptoAddresses({});
          setDepositAddressError(error instanceof Error ? error.message : 'Unable to load receiving addresses.');
        }
      }
    };
    void refreshCryptoAddresses();
    window.addEventListener('focus', refreshCryptoAddresses);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshCryptoAddresses);
    };
  }, []);

  const totalRebateEarned = settlements.reduce((sum, s) => sum + s.rebate, 0);

  // Handlers
  const handleGetDepositAddress = () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) {
      notify('Please enter a valid deposit amount.');
      return;
    }
    if (!topUpNetwork) { notify('Please select a payment method.'); return; }
    if (NONCRYPTO_TOP_UP_METHODS.includes(topUpNetwork)) {
      sessionStorage.setItem('seller_support_deposit_draft', 'I would like to make a deposit through ' + topUpNetwork + '. Please send me your account number and payment details.');
      if (onOpenSupport) onOpenSupport();
      else window.location.assign('/seller/dashboard?tab=support');
      return;
    }
    setDepositReceipt(null);
    setDepositModalOpen(true);
  };

  const handleCopyAddress = (addr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(addr);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      notify('Deposit address copied to clipboard.');
    }
  };

  const handleSubmitDeposit = async () => {
    if (submissionInFlight.current || receiptLoading || !depositReceipt || !activeDepositAddress) return;
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('Please enter a valid deposit amount.');
      return;
    }

    submissionInFlight.current = true;
    setSubmittingDeposit(true);
    try {
      const seller = JSON.parse(localStorage.getItem('galleria_active_seller') || '{}');
      const response = await fetch('/api/recharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: seller.email,
          name: seller.shopName || seller.fullName,
          amount,
          network: topUpNetwork,
          walletAddress: activeDepositAddress,
          receipt: depositReceipt,
        }),
      });
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.error || 'Unable to submit deposit.');
      }

      // The successful response includes a copy of the uploaded receipt.
      void response.body?.cancel().catch(() => {});
      setDepositReceipt(null);
      setDepositModalOpen(false);
      try {
        localStorage.setItem('galleria_admin_todo_signal', String(Date.now()));
      } catch { /* The recharge is already saved if browser storage is unavailable. */ }
      notify(`Deposit of ${money(amount)} via ${topUpNetwork} submitted for admin review.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to submit deposit.');
    } finally {
      submissionInFlight.current = false;
      setSubmittingDeposit(false);
    }
  };

  const withdrawalRef = React.useRef({busy:false, details:"", id:""});
  const [submittingWithdrawal,setSubmittingWithdrawal] = useState(false);
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      notify('Please enter a valid amount to withdraw.');
      return;
    }
    if (amt > wallet) {
      notify(`Your wallet balance is too low. You have ${money(wallet)} available, so you cannot withdraw ${money(amt)}.`);
      return;
    }

    if (isDigitalWalletWithdrawal) {
      const supportDraft = `Hello Support Team, I would like to withdraw ${money(amt)} using ${withdrawMethod}. Please let me know what account information or verification details you need from me to process this withdrawal. Thank you.`;
      sessionStorage.removeItem('seller_support_deposit_draft');
      sessionStorage.setItem('seller_support_withdrawal_draft', supportDraft);
      sessionStorage.setItem('seller_support_withdrawal_autosend', '1');
      setWithdrawAmount('');
      setWithdrawDetails('');
      if (onOpenSupport) onOpenSupport();
      else window.location.assign('/seller/dashboard?tab=support');
      return;
    }

    if (!withdrawDetails.trim()) {
      notify('Please enter your payout details.');
      return;
    }

    const current = withdrawalRef.current;
    if (current.busy) return;
    const details = JSON.stringify([amt, withdrawMethod, withdrawDetails]);
    if (current.details !== details) { current.details = details; current.id = crypto.randomUUID(); }
    current.busy = true;
    setSubmittingWithdrawal(true);
    const result = await requestWithdrawal(amt, withdrawMethod, withdrawDetails, current.id);
    current.busy = false;
    setSubmittingWithdrawal(false);
    if (result.success) current.details = '';

    if (!result.success) {
      notify(result.error || 'Failed to submit withdrawal.');
      return;
    }
    let sellerEmail = '';
    try {
      sellerEmail = JSON.parse(localStorage.getItem('galleria_active_seller') || '{}').email || '';
    } catch {}
    void sendSellerNotification({
      sellerEmail,
      category: 'Wallet & Payments',
      title: 'Withdrawal request received',
      message: [
        { text: 'Your withdrawal request for ' },
        { text: money(amt), emphasis: 'blue' },
        { text: ` via ${withdrawMethod} has been received and is awaiting review.` },
      ],
      tone: 'info',
      href: '/seller/dashboard?tab=wallet',
      dedupeKey: `seller-withdrawal-request:${sellerEmail}:${Date.now()}`,
    });
    notify(`Withdrawal request for ${money(amt)} submitted for review.`);
    setWithdrawAmount('');
    setWithdrawDetails('');
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Wallet &amp; earnings
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Capital recycles as your stock resells; rebate is your profit.
        </p>
      </div>

      {walletLoaded && wallet <= 10 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">Low wallet balance</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Your wallet has {money(wallet)}, at or below the $10.00 limit. Add funds to keep confirming orders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDepositModalOpen(true)}
            className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Add funds
          </button>
        </div>
      )}
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AVAILABLE BALANCE (distinct light green border matching screenshot) */}
        <div className="bg-white border-2 border-[#86efac] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            AVAILABLE BALANCE
          </span>
          <span className="text-2xl font-black text-[#059669] mt-1 block">
            {money(wallet)}
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Spendable on wholesale
          </span>
        </div>

        {/* Card 2: PACKAGE SPEND */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            PACKAGE SPEND
          </span>
          <span className="text-2xl font-black text-[#2563eb] mt-1 block">
            {money(packageSpend)}
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            One-time · sets your tier
          </span>
        </div>

        {/* Card 3: CAPITAL IN STOCK */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            CAPITAL IN STOCK
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">
            {money(capitalInStock)}
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {productCount} product(s)
          </span>
        </div>

        {/* Card 4: REBATE EARNED */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            REBATE EARNED
          </span>
          <span className="text-2xl font-black text-[#059669] mt-1 block">
            {money(totalRebateEarned)}
          </span>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Lifetime resale profit
          </span>
        </div>
      </div>

      {/* Top up wallet Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Top up wallet</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose a payment method and enter the amount to add to your USD wallet.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              WALLET BALANCE
            </span>
            <span className="text-base font-bold text-[#059669] block">
              {money(wallet)}
            </span>
          </div>
        </div>

        {/* Inner bordered form box */}
        <div className="max-w-md border border-gray-200 rounded-xl p-4 mt-4 space-y-3 bg-white">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Amount (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="100"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Payment method <span className="text-red-500">*</span>
            </label>
            <div className="space-y-4">
              {[
                { title: 'Crypto Deposit', methods: CRYPTO_TOP_UP_METHODS },
                { title: 'Digital Wallet Deposit', methods: NONCRYPTO_TOP_UP_METHODS },
              ].map(group => <section key={group.title} className="rounded-xl border border-gray-200 overflow-hidden">
                <button type="button" aria-expanded={openDepositSection === group.title} onClick={() => setOpenDepositSection(openDepositSection === group.title ? null : group.title)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-900">
                  {group.title}<ChevronDown className={`w-4 h-4 transition-transform ${openDepositSection === group.title ? 'rotate-180' : ''}`} />
                </button>
                {openDepositSection === group.title && <div className="grid grid-cols-2 gap-2 p-3" role="group" aria-label={group.title}>
              {group.methods.map(method => <button key={method} type="button" aria-pressed={topUpNetwork === method} onClick={() => setTopUpNetwork(method)} className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-semibold transition-colors ${topUpNetwork === method ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                <PaymentLogo method={method} /><span className="flex-1">{method}</span>{topUpNetwork === method && <Check className="w-3 h-3 shrink-0" />}
              </button>)}
                </div>}
              </section>)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetDepositAddress}
            disabled={!topUpNetwork}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors mt-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Withdraw Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Withdraw</h2>
          <span className="text-xs text-gray-500 font-medium">
            Available {money(wallet)}
          </span>
        </div>

        <form onSubmit={handleRequestWithdrawal} className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(wallet > 0 ? wallet.toFixed(2) : '0.00')}
                className="text-[11px] text-[#059669] hover:underline font-medium cursor-pointer mt-1 inline-block"
              >
                Withdraw all ({money(wallet)})
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Payout method
              </label>
              <div className="space-y-2">
                {[
                  { title: 'Crypto Withdraw', methods: CRYPTO_WITHDRAW_METHODS },
                  { title: 'Digital Wallet Withdraw', methods: DIGITAL_WALLET_WITHDRAW_METHODS },
                ].map((group) => (
                  <section key={group.title} className="rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      aria-expanded={openWithdrawSection === group.title}
                      onClick={() => setOpenWithdrawSection(openWithdrawSection === group.title ? null : group.title)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-900"
                    >
                      <span className="flex items-center gap-2">
                        {group.title}
                        {group.methods.includes(withdrawMethod) && (
                          <span className="font-medium text-gray-500">· {withdrawMethod}</span>
                        )}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openWithdrawSection === group.title ? 'rotate-180' : ''}`} />
                    </button>
                    {openWithdrawSection === group.title && (
                      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2" role="group" aria-label={group.title}>
                        {group.methods.map((method) => (
                          <button
                            key={method}
                            type="button"
                            aria-pressed={withdrawMethod === method}
                            onClick={() => {
                              if (method !== withdrawMethod) setWithdrawDetails('');
                              setWithdrawMethod(method);
                              setOpenWithdrawSection(group.title);
                            }}
                            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-semibold transition-colors ${withdrawMethod === method ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                          >
                            <PaymentLogo method={method} />
                            <span className="flex-1">{method}</span>
                            {withdrawMethod === method && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </div>

          {isCryptoWithdrawal ? (
            <div className="mt-3">
              <label htmlFor="withdraw-wallet-address" className="text-xs font-semibold text-gray-700 block mb-1">
                {isCryptoWithdrawal ? "Wallet address" : "Payout details"} <span className="text-red-500">*</span>
              </label>
              <input
                id="withdraw-wallet-address"
                type="text"
                required
                value={withdrawDetails}
                onChange={(e) => setWithdrawDetails(e.target.value)}
                placeholder={getPayoutDetailsPlaceholder(withdrawMethod)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submittingWithdrawal || (isCryptoWithdrawal && !withdrawDetails.trim())}
            className="px-4 py-2 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors mt-4 inline-block shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0f172a]"
          >
            Request withdrawal
          </button>
          {isCryptoWithdrawal && (
            <p className="text-[11px] text-gray-400 mt-2 block">
              The amount is held from your balance right away, then paid out after review. Rejected requests are refunded.
            </p>
          )}
        </form>
      </div>

      {/* Resale ledger */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-gray-900">Resale ledger</h3>
        {settlements.length === 0 ? (
          <p className="text-xs text-gray-500 mt-1">No resale settlements yet.</p>
        ) : (
          <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Capital</th>
                  <th className="py-2.5 px-3">Rebate</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{formatDate(s.date)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">{s.orderCode}</td>
                    <td className="py-3 px-3 text-gray-800">{s.productTitle}</td>
                    <td className="py-3 px-3 text-gray-600">{money(s.capital)}</td>
                    <td className="py-3 px-3 font-bold text-[#059669]">+{money(s.rebate)}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 text-right">{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fund statement */}
      <div className="pt-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Fund statement</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            All wallet movements — for reconciliation.
          </p>
        </div>
        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400 mt-2">No transactions yet.</p>
        ) : (
          <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-semibold text-gray-800">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700">{tx.description}
                      {tx.status === 'rejected' && tx.reviewReason && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-rose-700"><strong>Reason:</strong> {tx.reviewReason}</p>}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tx.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tx.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 font-bold text-right ${
                        tx.type === 'withdrawal' || tx.type === 'order_payment' ? 'text-rose-600' : 'text-[#059669]'
                      }`}
                    >
                      {tx.type === 'withdrawal' || tx.type === 'order_payment' ? '-' : '+'}
                      {money(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Get Deposit Address */}
      {depositModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => { if (!submissionInFlight.current) setDepositModalOpen(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-4 animate-slideUp relative"
          >
            <button
              disabled={submittingDeposit}
              onClick={() => { if (!submissionInFlight.current) setDepositModalOpen(false); }}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2"><PaymentLogo method={topUpNetwork} /> Deposit {topUpNetwork}</h3>
                <p className="text-[11px] text-gray-500">Top up your USD wallet</p>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Deposit Amount:</span>
                <span className="font-bold text-gray-900">{money(parseFloat(topUpAmount) || 100)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Payment method:</span>
                <span className="font-semibold text-gray-800">{topUpNetwork}</span>
              </div>
            </div>

            {activeDepositAddress ? <div className="mt-4 p-2 rounded-xl border border-dashed border-gray-300 text-center bg-gray-50/50">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"><PaymentLogo method={topUpNetwork} /></div>
              <p className="text-[11px] font-semibold text-gray-600 mb-1">Deposit Address ({topUpNetwork})</p>
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 mt-1">
                <span className="font-mono text-[11px] text-gray-700 truncate flex-1 select-all">
                  {activeDepositAddress}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyAddress(activeDepositAddress)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Send only {topUpNetwork} to this deposit address. Funds will be credited after network confirmation.
              </p>
            </div>

            : <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">{depositAddressError ? `Could not load the receiving address: ${depositAddressError}` : `Payment setup for ${topUpNetwork} is not configured yet. Contact Admin before sending crypto.`}</p>}

            <div className="mt-4 rounded-xl border border-gray-200 p-2">
              <label htmlFor="crypto-deposit-receipt" className="block text-xs font-bold text-gray-800 mb-2">Upload receipt <span className="text-red-500">*</span></label>
              <p className="text-[11px] text-gray-500 mb-1">Payment screenshot: PNG, JPEG or WebP, up to 5 MB.</p>
              <input id="crypto-deposit-receipt" disabled={submittingDeposit} type="file" accept="image/png,image/jpeg,image/webp" className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700" onChange={e=>{
                const file=e.target.files?.[0];setDepositReceipt(null);if(!file)return;
                if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){notify('Choose a PNG, JPEG or WebP receipt smaller than 5 MB.');e.target.value='';return;}
                setReceiptLoading(true);const reader=new FileReader();reader.onload=()=>{setDepositReceipt({name:file.name,url:String(reader.result)});setReceiptLoading(false);};reader.onerror=()=>{setReceiptLoading(false);notify('Unable to read the receipt. Please try again.');};reader.readAsDataURL(file);
              }}/>
              {receiptLoading&&<p className="text-xs text-gray-500 mt-2">Loading receipt…</p>}
              {depositReceipt&&<div className="mt-1 flex items-center gap-2"><img src={depositReceipt.url} alt="Payment receipt preview" className="max-h-14 mx-auto rounded-lg object-contain"/><p className="text-[11px] text-emerald-700 mt-2 break-all">{depositReceipt.name}</p><button type="button" disabled={submittingDeposit} onClick={()=>setDepositReceipt(null)} className="text-xs text-red-600 mt-1">Remove receipt</button></div>}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmitDeposit}
                aria-busy={submittingDeposit}
                disabled={submittingDeposit || !activeDepositAddress || !depositReceipt || receiptLoading}
                className="flex-1 disabled:opacity-40 disabled:cursor-not-allowed py-2 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {submittingDeposit ? <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span aria-live="polite">{submittingDeposit ? 'Submitting…' : 'Confirm & Continue'}</span>
              </button>
              <button
                type="button"
                disabled={submittingDeposit}
                onClick={() => { if (!submissionInFlight.current) setDepositModalOpen(false); }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
