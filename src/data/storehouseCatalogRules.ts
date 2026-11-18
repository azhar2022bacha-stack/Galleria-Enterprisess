import { CURATED_BASE_PRODUCTS } from './curatedProducts';
import {
  LEGACY_PRODUCTS_PER_EXPANSION_CATEGORY,
  STOREHOUSE_CATEGORY_ADDITIONS,
  STOREHOUSE_CATEGORY_PRODUCTS,
  EXPANSION_PRODUCT_TOTAL,
} from './storehouseCategoryAdditions';

export const LEGACY_STOREHOUSE_RECORDS = 100_000;
export const EXPANSION_RECORD_SPAN = STOREHOUSE_CATEGORY_PRODUCTS.reduce(
  (span, product) => Math.max(span, product.recordOffset + 1),
  STOREHOUSE_CATEGORY_ADDITIONS.length * LEGACY_PRODUCTS_PER_EXPANSION_CATEGORY
);
export const TOTAL_STOREHOUSE_RECORDS =
  LEGACY_STOREHOUSE_RECORDS +
  EXPANSION_RECORD_SPAN;

export const FOOD_CATEGORY_NAMES = [
  'Vitamins & Supplements',
  'Grocery & Essentials',
] as const;

const foodRelatedTerms = /\b(?:food|foods|fruit|fruits|produce|grocery|groceries|nutrition|nutritional|supplement|supplements|vitamin|vitamins|diet|dietary|pantry|meat|beverage|beverages|juice|milk|rice|protein powder|plant protein|protein blend|ice cream|honey|chicken|beef)\b/i;

export function isFoodCatalogProduct(product: {
  category?: string;
  title?: string;
  subcategory?: string;
}): boolean {
  const category = product.category?.trim().toLowerCase() ?? '';
  if (FOOD_CATEGORY_NAMES.some((name) => name.toLowerCase() === category)) return true;

  const searchableText = `${product.title ?? ''} ${product.subcategory ?? ''} ${product.category ?? ''}`
    .replace(/\bmilk makeup\b/gi, '');
  return foodRelatedTerms.test(searchableText);
}

export function isUnverifiedBeautyDemoProduct(product: { category?: string }): boolean {
  return product.category?.trim().toLowerCase() === 'beauty & personal care';
}

export const NON_FOOD_LEGACY_BASE_INDICES = CURATED_BASE_PRODUCTS.flatMap((product, index) =>
  isFoodCatalogProduct(product) || isUnverifiedBeautyDemoProduct(product) ? [] : [index]
);

export const LEGACY_STOREHOUSE_FULL_CYCLES = Math.floor(
  LEGACY_STOREHOUSE_RECORDS / CURATED_BASE_PRODUCTS.length
);
export const LEGACY_STOREHOUSE_REMAINDER =
  LEGACY_STOREHOUSE_RECORDS % CURATED_BASE_PRODUCTS.length;
export const NON_FOOD_LEGACY_TAIL_BASE_INDICES = NON_FOOD_LEGACY_BASE_INDICES.filter(
  (index) => index < LEGACY_STOREHOUSE_REMAINDER
);
export const NON_FOOD_LEGACY_PRODUCTS_PER_FULL_CYCLE = NON_FOOD_LEGACY_BASE_INDICES.length;
export const TOTAL_NON_FOOD_LEGACY_PRODUCTS =
  LEGACY_STOREHOUSE_FULL_CYCLES * NON_FOOD_LEGACY_PRODUCTS_PER_FULL_CYCLE +
  NON_FOOD_LEGACY_TAIL_BASE_INDICES.length;

export const TOTAL_STOREHOUSE_PRODUCTS =
  TOTAL_NON_FOOD_LEGACY_PRODUCTS + EXPANSION_PRODUCT_TOTAL;

/** Counts visible catalog records by category from the same source as the catalog total. */
export const STOREHOUSE_CATEGORY_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {};

  for (const baseIndex of NON_FOOD_LEGACY_BASE_INDICES) {
    const categoryName = CURATED_BASE_PRODUCTS[baseIndex].category;
    const recordsForBaseProduct =
      LEGACY_STOREHOUSE_FULL_CYCLES + Number(baseIndex < LEGACY_STOREHOUSE_REMAINDER);
    counts[categoryName] = (counts[categoryName] ?? 0) + recordsForBaseProduct;
  }

  for (const product of STOREHOUSE_CATEGORY_PRODUCTS) {
    const categoryName = product.category.name;
    counts[categoryName] = (counts[categoryName] ?? 0) + 1;
  }

  return counts;
})();
