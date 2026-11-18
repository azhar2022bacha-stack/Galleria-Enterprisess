import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { StorefrontPromotion } from '@/lib/storefrontPromotions';
import { readStorefrontOrders } from '@/lib/storefrontOrdersServer';

const PROMOTIONS_FILE = path.join(process.cwd(), 'src', 'data', 'storefront_promotions.json');

export function readStorefrontPromotions(): StorefrontPromotion[] {
  fs.mkdirSync(path.dirname(PROMOTIONS_FILE), { recursive: true });
  if (!fs.existsSync(PROMOTIONS_FILE)) fs.writeFileSync(PROMOTIONS_FILE, '[]', 'utf8');
  try {
    const parsed = JSON.parse(fs.readFileSync(PROMOTIONS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStorefrontPromotions(promotions: StorefrontPromotion[]) {
  fs.mkdirSync(path.dirname(PROMOTIONS_FILE), { recursive: true });
  fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(promotions, null, 2), 'utf8');
}

export function normalizePromotion(value: any, existingId?: string): { promotion?: StorefrontPromotion; error?: string } {
  const code = typeof value?.code === 'string' ? value.code.trim().toUpperCase() : '';
  const status = value?.status;
  const discountText = typeof value?.value === 'string' ? value.value.trim() : '';
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) return { error: 'Promotion codes must be 3 to 32 letters, numbers, hyphens, or underscores.' };
  if (!['Active', 'Draft', 'Disabled'].includes(status)) return { error: 'Choose Active, Draft, or Disabled.' };
  if (value?.method !== undefined && value.method !== 'Promotion code') return { error: 'Only promotion codes are connected to checkout right now.' };
  const match = discountText.match(/^(\d{1,2}(?:\.\d+)?)\s*%\s*off(?:\s+first\s+order)?$/i);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 90) return { error: 'Enter a discount from 1% to 90%, for example “10% off” or “15% off first order”.' };
  const now = new Date().toISOString();
  return {
    promotion: {
      id: existingId || `promo-${randomUUID()}`,
      code,
      method: 'Promotion code',
      status,
      value: `${match[1]}% off${/first\s+order/i.test(discountText) ? ' first order' : ''}`,
      createdAt: typeof value?.createdAt === 'string' ? value.createdAt : now,
      updatedAt: now,
    },
  };
}

export function calculatePromotion(codeInput: unknown, emailInput: unknown, subtotalInput: unknown) {
  const code = typeof codeInput === 'string' ? codeInput.trim().toUpperCase() : '';
  const email = typeof emailInput === 'string' ? emailInput.trim().toLowerCase() : '';
  const subtotal = Number(subtotalInput);
  if (!code || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isFinite(subtotal) || subtotal <= 0) {
    return { error: 'Enter a promotion code, checkout email, and a valid cart subtotal.' };
  }
  const promotion = readStorefrontPromotions().find((item) => item.code === code && item.method === 'Promotion code');
  if (!promotion || promotion.status !== 'Active') return { error: 'This promotion code is unavailable or inactive.' };
  const match = promotion.value.match(/^(\d{1,2}(?:\.\d+)?)% off/i);
  const discountPercent = match ? Number(match[1]) : 0;
  if (discountPercent < 1 || discountPercent > 90) return { error: 'This promotion does not have a supported discount.' };
  const firstOrderOnly = /first\s+order/i.test(promotion.value);
  if (firstOrderOnly && readStorefrontOrders().some((order) => order.buyerEmail === email)) {
    return { error: 'This code is available for a customer’s first order only.' };
  }
  const discountAmount = Math.round(subtotal * discountPercent) / 100;
  return { code: promotion.code, value: promotion.value, discountPercent, discountAmount, firstOrderOnly };
}
