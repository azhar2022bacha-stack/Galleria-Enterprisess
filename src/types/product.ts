// Types for the Storehouse demonstration catalog.

export type ProductCondition =
  | 'Brand New'
  | 'Factory Sealed'
  | 'Open Box - Like New'
  | 'Refurbished Grade A';

export type ProductStockStatus =
  | 'In Stock'
  | 'Low Stock'
  | 'Limited Availability';

export interface DemoProduct {
  /** Unique demo product ID (e.g. 'prod-000001') */
  id: string;
  /** Realistic product title */
  title: string;
  /** SEO-friendly slug */
  slug: string;
  /** Unique stable SKU (e.g. 'SKU-ELEC-000001') */
  sku: string;
  /** Short punchy description for cards */
  shortDescription: string;
  /** Detailed multi-paragraph product description */
  description: string;
  /** Primary category name */
  category: string;
  /** Category slug */
  categorySlug: string;
  /** Subcategory name */
  subcategory: string;
  /** Stable slug for deleting and filtering products by subcategory */
  subcategorySlug?: string;
  /** Brand name */
  brand: string;
  /** Current wholesale / retail unit price in USD */
  price: number;
  /** Compare-at original MSRP price */
  compareAtPrice: number;
  /** Currency code */
  currency: string;
  /** Current available stock quantity */
  stockQuantity: number;
  /** Minimum Order Quantity for B2B wholesale */
  minOrderQuantity: number;
  /** Physical product condition */
  condition: ProductCondition;
  /** Commercial inventory status */
  status: ProductStockStatus;
  /** Primary verified high-resolution product image URL */
  mainImage: string;
  /** Additional gallery image URLs */
  galleryImages: string[];
  /** Category-specific technical specifications and attributes */
  attributes: Record<string, string>;
  /** Star rating (1.0 to 5.0) */
  rating: number;
  /** Verified buyer review count */
  reviewCount: number;
  /** Demo dataset identifier */
  isDemo: boolean;
  demoBatch: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  code: string;
  subcategories: string[];
  itemCount?: number;
  /** Number of catalog listings shown for this category, when explicitly set. */
  catalogProductCount?: number;
}

export type PriceRangeFilter =
  | 'all'
  | 'under-25'
  | '25-50'
  | '50-100'
  | '100-250'
  | '250-plus';

export type SortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'discount'
  | 'stock-desc';

export interface ProductFilterState {
  searchQuery: string;
  category: string;
  subcategory: string;
  priceRange: PriceRangeFilter;
  status: 'all' | 'in-stock' | 'low-stock';
  sortBy: SortOption;
  hideAdded: boolean;
  page: number;
  pageSize: number;
}

export interface CatalogQueryResult {
  products: DemoProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalCatalogSize: number;
}
