import type { DemoProduct, ProductFilterState } from '@/types/product';

export const STOREHOUSE_MIX_LIMIT = 5000;
export const STOREHOUSE_MIX_BATCH_SIZE = 300;
export const HIDDEN_SELLER_STOREHOUSE_CATEGORY_SLUGS = new Set(['arts-craft-materials']);

export type StorehouseMixFilters = Pick<ProductFilterState, 'searchQuery' | 'priceRange' | 'status' | 'sortBy'> & {
  excludedIds?: string[];
};

export type StorehouseMixPage = {
  snapshotId: string;
  page: number;
  totalCount: number;
  products: DemoProduct[];
};
