import fs from 'fs';
import path from 'path';
import type { StorefrontOrderRecord } from '@/lib/storefrontOrders';

const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'storefront_orders.json');

function ensureOrdersFile() {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}

export function readStorefrontOrders(): StorefrontOrderRecord[] {
  ensureOrdersFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStorefrontOrders(orders: StorefrontOrderRecord[]) {
  ensureOrdersFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}
