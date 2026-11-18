export type RetailListingStatus = 'pending' | 'published' | 'rejected';
export type RetailListingEditableFields = Pick<RetailListing,
  'sellerName' | 'sellerSlug' | 'sku' | 'upc' | 'title' | 'brand' | 'model' | 'description' | 'specifications' | 'priceSourceUrl' | 'priceCheckedAt' | 'price' | 'category' | 'categorySlug' | 'subcategory' | 'subcategorySlug' | 'stockQuantity' | 'colors' | 'sizes' | 'image' | 'additionalImages'
>;

export interface RetailListing {
  id: string;
  sellerEmail: string;
  sellerName: string;
  sellerSlug: string;
  sku: string;
  upc?: string;
  title: string;
  brand?: string;
  model?: string;
  slug: string;
  description: string;
  specifications?: Record<string, string>;
  price: number;
  priceSourceUrl?: string;
  priceCheckedAt?: string;
  category: string;
  categorySlug?: string;
  subcategory?: string;
  subcategorySlug?: string;
  stockQuantity: number;
  colors?: string[];
  sizes?: string[];
  image: string;
  additionalImages?: string[];
  status: RetailListingStatus;
  pendingChanges?: Partial<RetailListingEditableFields>;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
}
