import { CRYPTO_WITHDRAW_METHODS } from './depositMethods';
import { PACKAGE_TIERS, type PackageTierId } from './packageTiers';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type SellerWalletAdjustmentEvent =
  | 'commission-payout'
  | 'withdrawal-request'
  | 'withdrawal-refund'
  | 'package-purchase'
  | 'manual-adjustment'
  | 'consign-order-payment'
  | 'consign-order-delivery';

export interface SellerWalletAdjustment {
  id: string;
  sellerEmail: string;
  accountType: 'wallet' | 'guarantee';
  amount: number;
  reason: string;
  createdAt: string;
  dedupeKey?: string;
  eventType?: SellerWalletAdjustmentEvent;
  withdrawal?: { method: string; address: string; status: 'pending' | 'completed' | 'rejected'; reviewReason?: string };
}

const FILE = path.join(process.cwd(), 'src', 'data', 'seller_wallet_adjustments.json');

function readAll(strict = false): SellerWalletAdjustment[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (!Array.isArray(parsed) && strict) throw new Error('Invalid wallet ledger.');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (strict) throw error;
    return [];
  }
}

function writeAll(rows: SellerWalletAdjustment[]): void {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const temporaryFile = `${FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(rows, null, 2), 'utf8');
  fs.renameSync(temporaryFile, FILE);
}

export function readSellerWalletAdjustments(sellerEmail?: string): SellerWalletAdjustment[] {
  const rows = readAll();
  if (!sellerEmail) return rows;
  const normalizedEmail = sellerEmail.trim().toLowerCase();
  return rows.filter((row) => String(row.sellerEmail || '').trim().toLowerCase() === normalizedEmail);
}

export function sellerWalletAdjustmentCents(rows: SellerWalletAdjustment[]): number {
  return rows.reduce((sum, row) => sum + Math.round(Number(row.amount || 0) * 100), 0);
}

export function getSellerWalletAdjustmentTotalCents(sellerEmail: string): number {
  return sellerWalletAdjustmentCents(
    readSellerWalletAdjustments(sellerEmail).filter((row) => row.accountType === 'wallet')
  );
}

export function findSellerWalletAdjustment(sellerEmail: string, dedupeKey: string): SellerWalletAdjustment | undefined {
  const normalizedEmail = sellerEmail.trim().toLowerCase();
  return readAll().find((row) =>
    String(row.sellerEmail || '').trim().toLowerCase() === normalizedEmail && row.dedupeKey === dedupeKey
  );
}

export function addSellerWalletAdjustment(input: {
  sellerEmail: string;
  amountCents: number;
  reason: string;
  dedupeKey: string;
  eventType: SellerWalletAdjustmentEvent;
  accountType?: 'wallet' | 'guarantee';
}): { adjustment: SellerWalletAdjustment; duplicate: boolean; totalCents: number } {
  const sellerEmail = input.sellerEmail.trim().toLowerCase();
  if (!sellerEmail) throw new Error('A seller email is required for a wallet adjustment.');
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents === 0) {
    throw new Error('A non-zero wallet adjustment in whole cents is required.');
  }
  const dedupeKey = input.dedupeKey.trim().slice(0, 200);
  if (!dedupeKey) throw new Error('A wallet adjustment dedupe key is required.');

  const rows = readAll();
  const existing = rows.find((row) => row.sellerEmail === sellerEmail && row.dedupeKey === dedupeKey);
  if (existing) {
    return {
      adjustment: existing,
      duplicate: true,
      totalCents: sellerWalletAdjustmentCents(rows.filter((row) => row.sellerEmail === sellerEmail && row.accountType === 'wallet')),
    };
  }

  const adjustment: SellerWalletAdjustment = {
    id: randomUUID(),
    sellerEmail,
    accountType: input.accountType || 'wallet',
    amount: input.amountCents / 100,
    reason: input.reason.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
    dedupeKey,
    eventType: input.eventType,
  };
  rows.unshift(adjustment);
  writeAll(rows);

  return {
    adjustment,
    duplicate: false,
    totalCents: sellerWalletAdjustmentCents(rows.filter((row) => row.sellerEmail === sellerEmail && row.accountType === 'wallet')),
  };
}

export function sellerPackage(email: string, rows = readSellerWalletAdjustments(email)) {
  const payments = rows.filter(row => row.sellerEmail === email && row.eventType === 'package-purchase' && row.accountType === 'wallet');
  const tier = [...PACKAGE_TIERS].reverse().find(t => payments.some(p => p.dedupeKey === 'package:' + t.id)) || PACKAGE_TIERS[0];
  return { tier, spend: -sellerWalletAdjustmentCents(payments) / 100 };
}

export function purchaseSellerPackage(email: string, id: PackageTierId, walletCents: number) {
  const rows = readAll();
  const own = rows.filter(row => row.sellerEmail === email);
  const current = sellerPackage(email, own);
  const tier = PACKAGE_TIERS.find(t => t.id === id);
  if (!tier || !tier.price || tier.price < current.tier.price) throw Error('Select a higher package.');
  const walletTotalCents = sellerWalletAdjustmentCents(own.filter(row => row.accountType === 'wallet'));
  if (current.tier.id === id) return { tierId: id, spend: current.spend, walletTotalCents };
  const depositCents = confirmedDeposits(email);
  const available = Math.min(walletCents, depositCents + walletTotalCents);
  if (!Number.isSafeInteger(available) || available < tier.price * 100) throw Error('Insufficient confirmed wallet funds.');
  const payment = { sellerEmail: email, reason: tier.name + ' package purchase', createdAt: new Date().toISOString(), eventType: 'package-purchase' as const };
  writeAll([
    { ...payment, id: randomUUID(), accountType: 'wallet', amount: -tier.price, dedupeKey: 'package:' + id },
    { ...payment, id: randomUUID(), accountType: 'guarantee', amount: tier.price, dedupeKey: 'package-grant:' + id },
    ...rows,
  ]);
  return { tierId: id, spend: current.spend + tier.price, walletTotalCents: walletTotalCents - tier.price * 100 };
}

function confirmedDeposits(email: string): number {
  const depositsFile = path.join(path.dirname(FILE), 'wallet_recharges.json');
  const deposits = fs.existsSync(depositsFile) ? JSON.parse(fs.readFileSync(depositsFile, 'utf8')) : [];
  const depositCents = deposits.filter((row: { handle: string; status: string }) => row.handle?.trim().toLowerCase() === email && row.status === 'Confirmed')
    .reduce((sum: number, row: { creditedAmount?: number; amount: number }) => sum + Math.round(Number(row.creditedAmount ?? row.amount) * 100), 0);
  return depositCents;
}

export function availableSellerWalletCents(email: string): number {
  const key = email.trim().toLowerCase();
  const wallet = readAll(true).filter(row => row.accountType === 'wallet' && row.sellerEmail.trim().toLowerCase() === key);
  const balance = confirmedDeposits(key) + sellerWalletAdjustmentCents(wallet);
  if (!Number.isSafeInteger(balance)) throw new Error('Invalid wallet balance.');
  return balance;
}

export class WithdrawalError extends Error {}

export function submitWithdrawal(email: string, id: string, cents: number, method: string, address: string) {
  if (!CRYPTO_WITHDRAW_METHODS.includes(method)) throw new WithdrawalError("Contact Support for digital-wallet withdrawals.");
  if (!Number.isSafeInteger(cents) || cents < 1 || !method || method.length > 80 || !address || address.length > 500 ||
      !/^[a-f0-9-]{36}$/i.test(id)) throw new WithdrawalError('Invalid withdrawal details.');
  const rows = readAll();
  const key = 'withdrawal-request:' + id;
  const own = rows.filter(row => row.sellerEmail === email && row.accountType === 'wallet');
  const prior = own.find(row => row.dedupeKey === key);
  if (prior) {
    if (prior.amount !== -cents / 100 || prior.withdrawal?.method !== method || prior.withdrawal?.address !== address)
      throw new WithdrawalError('This withdrawal reference is already in use.');
    return;
  }
  const available = confirmedDeposits(email) + sellerWalletAdjustmentCents(own);
  if (!Number.isSafeInteger(available) || available < cents) throw new WithdrawalError('Insufficient confirmed wallet balance.');
  writeAll([{id:randomUUID(), sellerEmail:email, accountType:'wallet', amount:-cents / 100,
    eventType:'withdrawal-request', dedupeKey:key, reason:'Withdrawal to ' + address, createdAt:new Date().toISOString(),
    withdrawal:{method,address,status:'pending'}}, ...rows]);
}

export function reviewWithdrawal(id: string, status: 'completed' | 'rejected', reason: string) {
  const rows = readAll();
  const row = rows.find(item => item.id === id && item.eventType === 'withdrawal-request');
  if (!row?.withdrawal) throw new WithdrawalError('Withdrawal not found.');
  if (row.withdrawal.status === status) return;
  if (row.withdrawal.status !== 'pending') throw new WithdrawalError('This withdrawal has already been reviewed.');
  if (status === 'rejected') {
    if (!reason || reason.length > 500) throw new WithdrawalError('Enter a rejection reason (up to 500 characters).');
    row.withdrawal.reviewReason = reason;
    rows.unshift({id:randomUUID(), sellerEmail:row.sellerEmail, accountType:'wallet', amount:-row.amount,
      reason, createdAt:new Date().toISOString(), eventType:'withdrawal-refund', dedupeKey:'withdrawal-refund:' + row.sellerEmail + ':' + row.id});
  }
  row.withdrawal.status = status;
  writeAll(rows);
}
