import { NextResponse } from 'next/server';
import { isStripeCheckoutConfigured, storefrontCurrency } from '@/lib/stripeCheckout';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    methods: {
      cashOnDelivery: true,
      card: isStripeCheckoutConfigured(),
    },
    currency: storefrontCurrency(),
  });
}
