import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type SellerNotificationCategory =
  | 'Account & Verification'
  | 'Wallet & Payments'
  | 'Products & Stock'
  | 'Orders & Shipping'
  | 'Earnings & Settlements'
  | 'Refunds & Disputes'
  | 'Consignment & Handover'
  | 'Support'
  | 'Account Updates';

export type SellerNotificationTone = 'info' | 'success' | 'warning' | 'rejection';

export interface SellerNotificationPart {
  text: string;
  emphasis?: 'blue' | 'red';
}

export interface SellerNotification {
  id: string;
  sellerEmail: string;
  sender: 'Galleria Enterprises, Inc.';
  category: SellerNotificationCategory;
  title: string;
  message: SellerNotificationPart[];
  tone: SellerNotificationTone;
  createdAt: string;
  readAt?: string;
  href?: string;
  dedupeKey?: string;
}

const FILE = path.join(process.cwd(), 'src', 'data', 'seller_notifications.json');

function readNotifications(): SellerNotification[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: SellerNotification[]): void {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const temporaryFile = `${FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(notifications, null, 2), 'utf8');
  fs.renameSync(temporaryFile, FILE);
}

export function getSellerNotificationsServer(email: string): SellerNotification[] {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];
  return readNotifications()
    .filter((item) => item.sellerEmail === normalizedEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createSellerNotificationServer(
  input: Omit<SellerNotification, 'id' | 'sender' | 'createdAt' | 'readAt'> & {
    createdAt?: string;
  }
): SellerNotification {
  const sellerEmail = input.sellerEmail.trim().toLowerCase();
  if (!sellerEmail) throw new Error('A seller email is required for a notification.');
  if (!input.title.trim()) throw new Error('A notification title is required.');

  const notifications = readNotifications();
  if (input.dedupeKey) {
    const duplicate = notifications.find(
      (item) => item.sellerEmail === sellerEmail && item.dedupeKey === input.dedupeKey
    );
    if (duplicate) return duplicate;
  }

  const notification: SellerNotification = {
    id: randomUUID(),
    sellerEmail,
    sender: 'Galleria Enterprises, Inc.',
    category: input.category,
    title: input.title.trim().slice(0, 160),
    message: input.message
      .filter((part) => typeof part.text === 'string' && part.text.length > 0)
      .slice(0, 40)
      .map((part) => ({
        text: part.text.slice(0, 1200),
        ...(part.emphasis ? { emphasis: part.emphasis } : {}),
      })),
    tone: input.tone,
    createdAt: input.createdAt || new Date().toISOString(),
    ...(input.href ? { href: input.href.slice(0, 300) } : {}),
    ...(input.dedupeKey ? { dedupeKey: input.dedupeKey.slice(0, 200) } : {}),
  };

  notifications.unshift(notification);
  writeNotifications(notifications.slice(0, 10000));
  return notification;
}

export function markSellerNotificationReadServer(
  email: string,
  notificationId?: string
): number {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return 0;
  const notifications = readNotifications();
  const now = new Date().toISOString();
  let changed = 0;
  const updated = notifications.map((item) => {
    if (
      item.sellerEmail === normalizedEmail &&
      !item.readAt &&
      (!notificationId || item.id === notificationId)
    ) {
      changed += 1;
      return { ...item, readAt: now };
    }
    return item;
  });
  if (changed) writeNotifications(updated);
  return changed;
}
