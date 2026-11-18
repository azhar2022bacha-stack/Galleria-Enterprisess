import { createHmac, timingSafeEqual } from 'crypto';
import type { StorefrontOrderRecord } from '@/lib/storefrontOrders';

const STRIPE_API = 'https://api.stripe.com/v1';

export function isStripeCheckoutConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function storefrontCurrency(): string {
  const currency = (process.env.STRIPE_CURRENCY || 'usd').trim().toLowerCase();
  return /^[a-z]{3}$/.test(currency) ? currency : 'usd';
}

function stripeAuthHeader(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Card checkout is not configured.');
  return `Bearer ${secretKey}`;
}

function siteBaseUrl(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  return configured || new URL(requestUrl).origin;
}

export async function createStripeCheckoutSession(order: StorefrontOrderRecord, requestUrl: string) {
  const params = new URLSearchParams();
  const currency = storefrontCurrency();
  const description = order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ').slice(0, 480);
  const amountInMinorUnits = Math.round(order.totalAmount * 100);
  params.set('mode', 'payment');
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][price_data][currency]', currency);
  params.set('line_items[0][price_data][unit_amount]', String(amountInMinorUnits));
  params.set('line_items[0][price_data][product_data][name]', `Galleria order ${order.orderNumber}`);
  if (description) params.set('line_items[0][price_data][product_data][description]', description);
  params.set('line_items[0][quantity]', '1');
  params.set('customer_email', order.buyerEmail);
  params.set('billing_address_collection', 'auto');
  params.set('client_reference_id', order.id);
  params.set('metadata[orderId]', order.id);
  params.set('metadata[orderNumber]', order.orderNumber);
  params.set('payment_intent_data[metadata][orderId]', order.id);
  params.set('success_url', `${siteBaseUrl(requestUrl)}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${siteBaseUrl(requestUrl)}/checkout?payment=cancelled`);

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: { Authorization: stripeAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result?.url !== 'string' || typeof result?.id !== 'string') {
    console.error('Stripe Checkout Session creation failed:', result?.error?.message || response.statusText);
    throw new Error('We could not start secure card checkout. Please try again or choose Cash on Delivery.');
  }
  return { id: result.id as string, url: result.url as string, expiresAt: Number(result.expires_at) || undefined };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: stripeAuthHeader() },
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('We could not verify the card payment session.');
  return result;
}

export async function expireStripeCheckoutSession(sessionId: string) {
  const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}/expire`, {
    method: 'POST',
    headers: { Authorization: stripeAuthHeader() },
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.status !== 'expired') throw new Error('The card checkout session is no longer open. Verify its payment status before cancelling the order.');
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const pieces = signatureHeader.split(',').map((part) => part.trim().split('=', 2));
  const timestamp = pieces.find(([key]) => key === 't')?.[1];
  const signatures = pieces.filter(([key]) => key === 'v1').map(([, value]) => value).filter(Boolean);
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300 || signatures.length === 0) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest();
  return signatures.some((signature) => {
    try {
      const actual = Buffer.from(signature, 'hex');
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  });
}
