# Storefront checkout setup

## Cash on Delivery

Cash on Delivery is available without an external gateway. The buyer enters shipping/contact details, selects Cash on Delivery, and places an order. The order stays unpaid until an admin records cash collection in **Admin → Store Orders**. Sellers see the payment and fulfillment state for their own order items.

## Visa and Mastercard through Stripe Checkout

The card flow uses Stripe-hosted Checkout. The store sends the server-calculated USD order total to Stripe and redirects the buyer to Stripe to enter card details. The store does not collect or store card numbers.

1. Copy `.env.example` to `.env.local` and set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY=usd`, and `NEXT_PUBLIC_SITE_URL`.
2. Start with a Stripe test secret key. Card checkout is only enabled when both the secret key and webhook secret are set.
3. Configure a Stripe webhook to `https://<your-host>/api/stripe/webhook` and subscribe to `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.
4. For local testing, forward Stripe CLI events to `http://localhost:3000/api/stripe/webhook` and use its generated signing secret as `STRIPE_WEBHOOK_SECRET`.
5. After configuring the keys, restart Next.js. The checkout page will enable the card option.

Stripe payment status is recorded from a signed webhook and rechecked server-side when the buyer returns from Checkout. Card orders cannot be marked as shipped until payment is confirmed. Admins can set fulfillment status and add a carrier, tracking number, and HTTPS tracking link. The store does not yet call carrier APIs.

## Current scope

- Prices and payments use USD, matching the current catalog.
- Shipping and tax are not calculated.
- COD collection is recorded manually by an admin after the delivery agent collects cash.
- The current order store uses local JSON fallback data; use a transactional database before handling production orders or inventory reservations.
