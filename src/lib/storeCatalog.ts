import type { Product } from '@/types';
import { STORE_CATEGORIES, type StoreCategoryData } from '@/data/storeCategories';

export const PRODUCTS_PER_SUBCATEGORY_TARGET = 300;

const LEGACY_CATEGORY_TO_STORE: Record<string, string> = {
  'womens-fashion': 'fashion-clothing',
  'mens-fashion': 'fashion-clothing',
  shoes: 'shoes-footwear',
  'bags-accessories': 'bags-travel-luggage',
  electronics: 'tv-audio-video',
  'home-living': 'home-living',
  'beauty-health': 'beauty-personal-care',
  'toys-games': 'kids-toys-games',
  'sports-fitness': 'sports-outdoor',
};

const SAMPLE_PRODUCT_TAXONOMY: Record<string, { categorySlug: string; subcategorySlug: string }> = {
  'prod-1': { categorySlug: 'bags-travel-luggage', subcategorySlug: 'handbags' },
  'prod-2': { categorySlug: 'shoes-footwear', subcategorySlug: 'sneakers' },
  'prod-3': { categorySlug: 'jewelry-fashion-accessories', subcategorySlug: 'watches' },
  'prod-4': { categorySlug: 'jewelry-fashion-accessories', subcategorySlug: 'sunglasses' },
  'prod-5': { categorySlug: 'fashion-clothing', subcategorySlug: 'hoodies-jackets' },
  'prod-6': { categorySlug: 'tv-audio-video', subcategorySlug: 'headphones' },
  'prod-7': { categorySlug: 'fashion-clothing', subcategorySlug: 'winter-clothing' },
  'prod-8': { categorySlug: 'bags-travel-luggage', subcategorySlug: 'wallets' },
  'prod-9': { categorySlug: 'sports-outdoor', subcategorySlug: 'sports-footwear' },
  'prod-10': { categorySlug: 'home-living', subcategorySlug: 'smart-home-devices' },
  'prod-11': { categorySlug: 'beauty-personal-care', subcategorySlug: 'serums' },
  'prod-12': { categorySlug: 'sports-outdoor', subcategorySlug: 'yoga-mats' },
};

export function getStoreCategory(slug: string) {
  const canonicalSlug = STORE_CATEGORIES.some((category) => category.slug === slug)
    ? slug
    : LEGACY_CATEGORY_TO_STORE[slug];
  return STORE_CATEGORIES.find((category) => category.slug === canonicalSlug);
}

export function getStoreTaxonomyForProduct(product: Product) {
  if (product.storeCategorySlug) {
    return {
      categorySlug: product.storeCategorySlug,
      subcategorySlug: product.subcategorySlug,
    };
  }
  const explicitCategory = product.storeCategorySlug || product.categorySlug;
  const explicitStoreCategory = STORE_CATEGORIES.find((category) => category.slug === explicitCategory);
  if (explicitStoreCategory) {
    return {
      categorySlug: explicitStoreCategory.slug,
      subcategorySlug: product.subcategorySlug,
    };
  }

  const sampleTaxonomy = SAMPLE_PRODUCT_TAXONOMY[product.id];
  if (sampleTaxonomy) return sampleTaxonomy;

  const mappedCategory = LEGACY_CATEGORY_TO_STORE[product.categorySlug];
  return { categorySlug: mappedCategory, subcategorySlug: undefined };
}

export function getProductsForStoreCategory(
  products: Product[],
  categorySlug: string,
  subcategorySlug?: string,
) {
  const selected: Product[] = [];
  const seenTitles = new Set<string>();
  const seenSkus = new Set<string>();
  for (const product of products) {
    const taxonomy = getStoreTaxonomyForProduct(product);
    if (taxonomy.categorySlug !== categorySlug) continue;
    if (subcategorySlug && taxonomy.subcategorySlug !== subcategorySlug) continue;
    const title = product.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const sku = (product.sku || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!title || seenTitles.has(title) || (sku && seenSkus.has(sku))) continue;
    seenTitles.add(title);
    if (sku) seenSkus.add(sku);
    selected.push(product);
    if (subcategorySlug && selected.length >= PRODUCTS_PER_SUBCATEGORY_TARGET) break;
  }
  return selected;
}

export function filterProductsByActiveStoreTaxonomy<T extends Product>(products: T[], categories: StoreCategoryData[]): T[] {
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, new Set(category.subcategories.map((subcategory) => subcategory.slug))]));
  return products.filter((product) => {
    const taxonomy = getStoreTaxonomyForProduct(product);
    if (!taxonomy.categorySlug) return true;
    const activeSubcategories = categoriesBySlug.get(taxonomy.categorySlug);
    if (!activeSubcategories) return false;
    return !taxonomy.subcategorySlug || activeSubcategories.has(taxonomy.subcategorySlug);
  });
}
