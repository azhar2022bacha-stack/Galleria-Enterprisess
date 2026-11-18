import { NextResponse } from 'next/server';
import { readStorefrontOrders, writeStorefrontOrders } from '@/lib/storefrontOrdersServer';
import { retrieveStripeCheckoutSession } from '@/lib/stripeCheckout';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id') || '';
  if (!/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ success: false, error: 'A valid card checkout session is required.' }, { status: 400 });
  }
  let session: any;
  try { session = await retrieveStripeCheckoutSession(sessionId); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to verify card payment.' }, { status: 502 }); }

  const orderId = String(session?.metadata?.orderId || '');
  const orders = readStorefrontOrders();
  const index = orders.findIndex((order) => order.id === orderId && order.stripeSessionId === sessionId);
  if (index < 0) return NextResponse.json({ success: false, error: 'This payment session is not linked to a store order.' }, { status: 404 });
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ success: false, pending: true, error: 'The card payment is not confirmed yet. Refresh in a moment or check your order status.' }, { status: 409 });
  }

  const current = orders[index];
  if (current.paymentStatus !== 'PAID') {
    orders[index] = { ...current, paymentStatus: 'PAID', orderStatus: 'PROCESSING', status: 'processing', updatedAt: new Date().toISOString() };
    writeStorefrontOrders(orders);
  }
  const order = orders[index];
  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items.map(({ sellerEmail: _sellerEmail, sellerName: _sellerName, sellerStoreSlug: _sellerStoreSlug, ...item }) => item),
      subtotalAmount: order.subtotalAmount ?? order.totalAmount,
      discountAmount: order.discountAmount ?? 0,
      promotionCode: order.promotionCode,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      trackingCarrier: order.trackingCarrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      createdAt: order.createdAt,
    },
  });
}
