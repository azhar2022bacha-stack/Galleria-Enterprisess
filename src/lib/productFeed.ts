export const PRODUCT_FEED_DESTINATION_NAMES = {
  'main-store': 'Main Store',
  'seller-storehouse': 'Seller Storehouse',
  'all-three': 'All Three Stores',
} as const;

export type ProductFeedDestination = keyof typeof PRODUCT_FEED_DESTINATION_NAMES;
export type ProductFeedSubcategory = { name: string; slug: string };
export type ProductFeedCategory = ProductFeedSubcategory & {
  subcategories: ProductFeedSubcategory[];
  isCustom?: boolean;
  customSubcategorySlugs?: string[];
};
export type ProductFeedTaxonomy = { categorySlug: string; subcategorySlug: string };
export const CONSIGN_CATALOG_PAGE_SIZE = 15;

export const REQUIRED_PRODUCT_FEED_COLUMNS = {
  title: ['title', 'product_name', 'name'],
  description: ['description', 'product_description'],
  price: ['price_usd', 'usd_price', 'price'],
  image: ['image_url', 'image', 'imageurl'],
  sku: ['sku', 'product_sku'],
};

export function normalizeProductFeedHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function isProductFeedDestination(value: unknown): value is ProductFeedDestination {
  return typeof value === 'string' && Object.hasOwn(PRODUCT_FEED_DESTINATION_NAMES, value);
}

export function normalizeProductFeedKey(value: unknown): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findProductFeedTaxonomy<T extends ProductFeedSubcategory>(options: T[], value: string): T | undefined {
  const key = normalizeProductFeedKey(value);
  return key ? options.find((item) => [item.slug, item.name].some((name) => normalizeProductFeedKey(name) === key)) : undefined;
}

export function matchProductFeedTaxonomy<T extends ProductFeedSubcategory>(options: T[], item: ProductFeedSubcategory | undefined): T | undefined {
  return item && (findProductFeedTaxonomy(options, item.slug) || findProductFeedTaxonomy(options, item.name));
}
