import type {
  SellerNotification,
  SellerNotificationCategory,
  SellerNotificationPart,
  SellerNotificationTone,
} from './sellerNotificationsServer';

export type { SellerNotification, SellerNotificationCategory, SellerNotificationPart, SellerNotificationTone };

export const SELLER_NOTIFICATIONS_CHANGED = 'galleria_seller_notifications_changed';

export interface SellerNotificationDraft {
  sellerEmail?: string;
  orderNumber?: string;
  category: SellerNotificationCategory;
  title: string;
  message: SellerNotificationPart[];
  tone?: SellerNotificationTone;
  href?: string;
  dedupeKey?: string;
}

export async function sendSellerNotification(draft: SellerNotificationDraft): Promise<boolean> {
  const sellerEmail = draft.sellerEmail?.trim().toLowerCase();
  if (!sellerEmail && !draft.orderNumber) return false;
  try {
    const response = await fetch('/api/seller/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, sellerEmail }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Unable to send seller notification.');
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SELLER_NOTIFICATIONS_CHANGED));
    return true;
  } catch (error) {
    console.warn('Seller notification could not be saved:', error);
    return false;
  }
}

export async function fetchSellerNotifications(email: string): Promise<SellerNotification[]> {
  const response = await fetch(`/api/seller/notifications?email=${encodeURIComponent(email)}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Unable to load notifications.');
  const data = await response.json();
  return Array.isArray(data.notifications) ? data.notifications : [];
}

export async function markSellerNotificationRead(email: string, id?: string): Promise<void> {
  const response = await fetch('/api/seller/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sellerEmail: email, notificationId: id, readAll: !id }),
  });
  if (!response.ok) throw new Error('Unable to update notification status.');
}
