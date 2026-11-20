import type { Address, OrderItem, OrderStatus } from '@/types';
import type { StorefrontCryptoPayment } from '@/lib/storefrontCrypto';

export type StorefrontOrderStatus = 'payment_pending' | 'cod_pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';

export interface StorefrontOrderItem extends OrderItem {
  sellerEmail?: string;
  sellerName?: string;
  sellerStoreSlug?: string;
}

export interface StorefrontOrderRecord {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  items: StorefrontOrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  promotionCode?: string;
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: OrderStatus;
  status: StorefrontOrderStatus;
  stripeSessionId?: string;
  cryptoPayment?: StorefrontCryptoPayment;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cashCollectedAt?: string;
  updatedAt?: string;
  createdAt: string;
}
