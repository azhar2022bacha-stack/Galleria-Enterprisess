import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { ALL_PRODUCTS } from '@/services/mockData';
import { getRequestAdmin } from '@/lib/adminSession';
import { readProductReviews, writeProductReviews } from '@/lib/productReviewsServer';
import { readRetailListings } from '@/lib/retailListingsServer';
import { readStorefrontOrders } from '@/lib/storefrontOrdersServer';
import type { ProductReviewRecord } from '@/lib/productReviews';

export const dynamic = 'force-dynamic';

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function publicReview(review: ProductReviewRecord) {
  const nameParts = review.customerName.trim().split(/\s+/).filter(Boolean);
  const publicName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` : nameParts[0] || 'Customer';
  return {
    id: review.id,
    productId: review.productId,
    productTitle: review.productTitle,
    publicName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    purchaseMatched: true,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'public';
  const reviews = readProductReviews();

  if (scope === 'public') {
    const productId = (searchParams.get('productId') || '').trim();
    if (!productId || productId.length > 120) return NextResponse.json({ success: false, error: 'Choose a product to load reviews.' }, { status: 400 });
    const approved = reviews.filter((review) => review.productId === productId && review.status === 'approved');
    const ratingAverage = approved.length ? Math.round(approved.reduce((sum, review) => sum + review.rating, 0) / approved.length * 10) / 10 : 0;
    return NextResponse.json({ success: true, reviews: approved.map(publicReview), count: approved.length, ratingAverage });
  }

  if (scope === 'summary') {
    const summaries: Record<string, { count: number; ratingAverage: number }> = {};
    for (const review of reviews) {
      if (review.status !== 'approved') continue;
      const summary = summaries[review.productId] || { count: 0, ratingAverage: 0 };
      summary.ratingAverage = (summary.ratingAverage * summary.count + review.rating) / (summary.count + 1);
      summary.count += 1;
      summaries[review.productId] = summary;
    }
    for (const summary of Object.values(summaries)) summary.ratingAverage = Math.round(summary.ratingAverage * 10) / 10;
    return NextResponse.json({ success: true, summaries });
  }

  if (scope === 'admin') {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    return NextResponse.json({ success: true, reviews: reviews.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  }

  return NextResponse.json({ success: false, error: 'Unsupported review scope.' }, { status: 400 });
}

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid review data.' }, { status: 400 }); }

  const productId = String(body?.productId || '').trim();
  const orderNumber = String(body?.orderNumber || '').trim().toUpperCase();
  const buyerEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rating = Number(body?.rating);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const reviewBody = typeof body?.body === 'string' ? body.body.trim() : '';
  if (!productId || productId.length > 120 || !/^GAL-(?:[A-F0-9]{16}|\d{9})$/.test(orderNumber) || !validEmail(buyerEmail)) {
    return NextResponse.json({ success: false, error: 'Enter a valid product, order number, and checkout email.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ success: false, error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 });
  if (title.length < 3 || title.length > 100 || reviewBody.length < 10 || reviewBody.length > 1500) {
    return NextResponse.json({ success: false, error: 'Review title must be 3 to 100 characters and review text 10 to 1,500 characters.' }, { status: 400 });
  }

  const order = readStorefrontOrders().find((item) => item.orderNumber === orderNumber && item.buyerEmail === buyerEmail);
  if (!order || !order.items.some((item) => item.productId === productId)) {
    return NextResponse.json({ success: false, error: 'We could not match that product to an order with those details.' }, { status: 403 });
  }
  const catalogProduct = ALL_PRODUCTS.find((product) => product.id === productId);
  const sellerListing = (await readRetailListings()).find((listing) => listing.id === productId && listing.status === 'published');
  const productTitle = catalogProduct?.title || sellerListing?.title;
  if (!productTitle) return NextResponse.json({ success: false, error: 'This product is no longer available for reviews.' }, { status: 404 });

  const reviews = readProductReviews();
  if (reviews.some((review) => review.orderNumber === orderNumber && review.productId === productId)) {
    return NextResponse.json({ success: false, error: 'A review for this product is already linked to that order.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const review: ProductReviewRecord = {
    id: `rev-${randomUUID()}`,
    productId,
    productTitle,
    orderNumber,
    buyerEmail,
    customerName: order.buyerName,
    rating,
    title,
    body: reviewBody,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  reviews.unshift(review);
  writeProductReviews(reviews);
  return NextResponse.json({ success: true, message: 'Review submitted for admin moderation.', review: { id: review.id, status: review.status } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await getRequestAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid moderation decision.' }, { status: 400 }); }
  const decision = body?.decision;
  if (!['approved', 'hidden'].includes(decision)) return NextResponse.json({ success: false, error: 'Choose approve or hide.' }, { status: 400 });
  const reviews = readProductReviews();
  const index = reviews.findIndex((review) => review.id === String(body?.id || ''));
  if (index < 0) return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
  reviews[index] = { ...reviews[index], status: decision, updatedAt: new Date().toISOString() };
  writeProductReviews(reviews);
  return NextResponse.json({ success: true, review: reviews[index] });
}
