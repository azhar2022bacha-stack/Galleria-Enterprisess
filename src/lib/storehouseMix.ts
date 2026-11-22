import type { DemoProduct, ProductFilterState } from '@/types/product';

export const STOREHOUSE_MIX_LIMIT = 5000;
export const STOREHOUSE_MIX_BATCH_SIZE = 300;
export const HIDDEN_SELLER_STOREHOUSE_CATEGORY_SLUGS = new Set(['arts-craft-materials']);

export type StorehouseMixFilters = Pick<ProductFilterState, 'searchQuery' | 'priceRange' | 'status' | 'sortBy'> & {
  subcategory?: string;
  excludedIds?: string[];
};

export type StorehouseMixPage = {
  snapshotId: string;
  page: number;
  totalCount: number;
  products: DemoProduct[];
};

export function getStorehouseSearchTerms(query: string): string[] {
  return [...new Set(query.trim().toLowerCase().slice(0, 200).split(/\s+/).filter(Boolean))];
}

export function getStorehouseSavingsRate(product: Pick<DemoProduct, 'price' | 'compareAtPrice'>): number {
  return product.compareAtPrice > 0 ? Math.max(0, 1 - product.price / product.compareAtPrice) : 0;
}
