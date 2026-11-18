import { NextResponse } from 'next/server';
import { readStorefrontOrders, writeStorefrontOrders } from '@/lib/storefrontOrdersServer';
import { verifyStripeWebhookSignature } from '@/lib/stripeCheckout';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!verifyStripeWebhookSignature(payload, signature)) {
    return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(payload); }
  catch { return NextResponse.json({ success: false, error: 'Invalid webhook payload.' }, { status: 400 }); }

  const session = event?.data?.object;
  if (!session?.metadata?.orderId || !['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) {
    return NextResponse.json({ received: true });
  }
  const orders = readStorefrontOrders();
  const index = orders.findIndex((order) =>
    order.id === String(session.metadata.orderId) && (!order.stripeSessionId || order.stripeSessionId === session.id)
  );
  if (index < 0) return NextResponse.json({ received: true });
  const current = orders[index];
  if (current.paymentStatus !== 'PAID') {
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && session.payment_status === 'paid') {
      orders[index] = { ...current, stripeSessionId: session.id, paymentStatus: 'PAID', orderStatus: 'PROCESSING', status: 'processing', updatedAt: new Date().toISOString() };
    } else if (['checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) {
      orders[index] = { ...current, stripeSessionId: session.id, paymentStatus: 'FAILED', status: current.orderStatus === 'CANCELLED' ? 'cancelled' : 'payment_failed', updatedAt: new Date().toISOString() };
    }
    writeStorefrontOrders(orders);
  }
  return NextResponse.json({ received: true });
}
