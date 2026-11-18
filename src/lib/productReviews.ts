export type ProductReviewStatus = 'pending' | 'approved' | 'hidden';

export interface ProductReviewRecord {
  id: string;
  productId: string;
  productTitle: string;
  orderNumber: string;
  buyerEmail: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  status: ProductReviewStatus;
  createdAt: string;
  updatedAt: string;
}
