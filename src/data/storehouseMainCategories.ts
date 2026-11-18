import { CATEGORIES } from '@/data/categories';
import { CURATED_BASE_PRODUCTS } from '@/data/curatedProducts';
import { getUniqueStorehouseProducts } from '@/lib/mock-products';

const uniqueProducts = getUniqueStorehouseProducts();
const uniqueCountByCategory = uniqueProducts.reduce<Record<string, number>>((counts, product) => {
  counts[product.category] = (counts[product.category] || 0) + 1;
  return counts;
}, {});

/** The deduplicated departments and accurate visible counts for the main store. */
export const STOREHOUSE_MAIN_CATEGORIES = CATEGORIES
  .filter((category) => CURATED_BASE_PRODUCTS.some((product) => product.category === category.name))
  .map((category) => ({ ...category, catalogProductCount: uniqueCountByCategory[category.name] || 0 }));

export const TOTAL_MAIN_STOREHOUSE_PRODUCTS = uniqueProducts.length;

