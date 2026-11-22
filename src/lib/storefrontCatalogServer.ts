import type { StoreCategoryData } from '@/data/storeCategories';
import type { RetailListing } from '@/lib/retailListings';
import { retailListingToProduct } from '@/lib/retailListingProduct';
import { filterProductsByActiveStoreTaxonomy, getStoreTaxonomyForProduct } from '@/lib/storeCatalog';
import { isReplacementCatalogCategory } from '@/data/catalogCategoryReplacements';
import { getStoreCategories } from '@/lib/storeCategoriesServer';
import { readRetailListings } from '@/lib/retailListingsServer';
import { readProductReviews } from '@/lib/productReviewsServer';
import type { Product } from '@/types';

export type CatalogCategory = StoreCategoryData & { catalogProductCount: number };
export type CatalogProduct = Product & { createdAt: string };
type Catalog = { categories: CatalogCategory[]; products: CatalogProduct[] };

function buildCatalog(listings: RetailListing[], taxonomy: StoreCategoryData[]): Catalog {
  const categorySlugs = new Set(taxonomy.map((category) => category.slug));
  const products = filterProductsByActiveStoreTaxonomy(listings.filter((listing) => listing.status === 'published').map((listing) => {
    const product = retailListingToProduct(listing);
    const storeCategorySlug = getStoreTaxonomyForProduct(product).categorySlug
      || (categorySlugs.has(product.categorySlug) ? product.categorySlug : undefined);
    return { ...product, storeCategorySlug, createdAt: listing.createdAt || '' };
  }), taxonomy);
  const categoryCounts = new Map<string, number>();
  const stockedSubcategories = new Map<string, Set<string>>();

  for (const product of products) {
    const { storeCategorySlug: categorySlug, subcategorySlug } = product;
    if (!categorySlug) continue;
    categoryCounts.set(categorySlug, (categoryCounts.get(categorySlug) ?? 0) + 1);
    if (subcategorySlug) {
      const subcategories = stockedSubcategories.get(categorySlug) ?? new Set<string>();
      subcategories.add(subcategorySlug);
      stockedSubcategories.set(categorySlug, subcategories);
    }
  }

  const categories = taxonomy.map((category) => {
    const published = stockedSubcategories.get(category.slug);
    const subcategories = category.subcategories.filter((subcategory) => (
      published?.has(subcategory.slug) || category.customSubcategorySlugs?.includes(subcategory.slug)
    ));
    return { ...category, subcategories, catalogProductCount: categoryCounts.get(category.slug) ?? 0 };
  }).filter((category) => isReplacementCatalogCategory(category.slug) || category.isCustom
    || category.catalogProductCount > 0 || category.subcategories.length > 0);

  return { categories, products };
}

const CATALOG_TTL_MS = 5_000;
let snapshot: { value: Catalog; expiresAt: number } | undefined;
let pending: Promise<Catalog> | undefined;

export async function getStorefrontCatalog(): Promise<Catalog> {
  if (snapshot && snapshot.expiresAt > Date.now()) return snapshot.value;
  if (!pending) {
    pending = readRetailListings().then((listings) => {
      const catalog = buildCatalog(listings, getStoreCategories());
      const ratings = new Map<string, { sum: number; count: number }>();
      for (const review of readProductReviews()) {
        if (review.status !== 'approved') continue;
        const current = ratings.get(review.productId) ?? { sum: 0, count: 0 };
        ratings.set(review.productId, { sum: current.sum + review.rating, count: current.count + 1 });
      }
      for (const product of catalog.products) {
        const rating = ratings.get(product.id);
        if (rating) {
          product.rating = Math.round(rating.sum / rating.count * 10) / 10;
          product.reviewCount = rating.count;
        }
      }
      snapshot = { value: catalog, expiresAt: Date.now() + CATALOG_TTL_MS };
      return catalog;
    }).finally(() => { pending = undefined; });
  }
  return pending;
}
