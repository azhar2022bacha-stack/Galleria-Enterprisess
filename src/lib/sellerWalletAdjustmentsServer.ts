import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type SellerWalletAdjustmentEvent =
  | 'commission-payout'
  | 'withdrawal-refund'
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
}

const FILE = path.join(process.cwd(), 'src', 'data', 'seller_wallet_adjustments.json');

function readAll(): SellerWalletAdjustment[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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
