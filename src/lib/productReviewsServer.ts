import fs from 'fs';
import path from 'path';
import type { ProductReviewRecord } from '@/lib/productReviews';

const REVIEWS_FILE = path.join(process.cwd(), 'src', 'data', 'product_reviews.json');

export function readProductReviews(): ProductReviewRecord[] {
  fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
  if (!fs.existsSync(REVIEWS_FILE)) fs.writeFileSync(REVIEWS_FILE, '[]', 'utf8');
  try {
    const parsed = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeProductReviews(reviews: ProductReviewRecord[]) {
  fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
}
