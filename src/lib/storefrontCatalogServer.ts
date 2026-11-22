import type { StoreCategoryData } from '@/data/storeCategories';
import type { RetailListing } from '@/lib/retailListings';
import { retailListingToProduct } from '@/lib/retailListingProduct';
import { filterProductsByActiveStoreTaxonomy, getStoreCategory, getStoreTaxonomyForProduct } from '@/lib/storeCatalog';
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

const PAGE_SIZE = 24;
const sorts: Record<string, (a: CatalogProduct, b: CatalogProduct) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-low': (a, b) => a.price - b.price,
  'price-high': (a, b) => b.price - a.price,
  'name-asc': (a, b) => a.title.localeCompare(b.title),
  'name-desc': (a, b) => b.title.localeCompare(a.title),
};

export async function getStorefrontCatalogPage(searchParams: URLSearchParams) {
  const { categories, products } = await getStorefrontCatalog();
  const category = (searchParams.get('category') || '').trim();
  const slug = categories.some((item) => item.slug === category) ? category : getStoreCategory(category)?.slug || category;
  const terms = (searchParams.get('search') || '').slice(0, 200).trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = products.filter((product) => {
    if (slug && product.storeCategorySlug !== slug) return false;
    if (!terms.length) return true;
    const searchable = [product.title, product.brand, product.sku, product.description, product.category].join(' ').toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
  const sort = searchParams.get('sort') || '';
  if (Object.hasOwn(sorts, sort)) matches.sort(sorts[sort]);
  const requested = Number(searchParams.get('page'));
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const start = (page - 1) * PAGE_SIZE;
  return { products: matches.slice(start, start + PAGE_SIZE), totalCount: matches.length, categoryName: categories.find((item) => item.slug === slug)?.name };
}
