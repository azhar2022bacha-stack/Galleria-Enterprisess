# Galleria Enterprises

Galleria is a Next.js 14 ecommerce site with a public storefront and admin and seller portals.

## Local setup

1. Install Node.js 18.17 or newer.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local` and fill in the local PostgreSQL connection and unique session secrets.
4. Start the development site with `npm run dev`.

Keep `.env.local` private. Generate separate, random values of at least 32 characters for `ADMIN_SESSION_SECRET` and `SELLER_SESSION_SECRET`. Add Stripe values only if payment processing is configured.

## GitHub and production deployment

GitHub stores the application source; it does not deploy the Next.js app or include the local PostgreSQL database. Configure a Next.js hosting provider and a separate PostgreSQL database, then set the required environment variables in the hosting provider's private settings. Use the production URL for `NEXT_PUBLIC_SITE_URL` and keep session secrets stable across restarts.

Local database files, uploaded files, product import CSVs, temporary files, and operational account/order/KYC/support records are intentionally excluded from Git. Back up or migrate required database records separately, and use durable storage for uploaded files in production.

The product images under `public/images` are application assets and are included in the source repository.
