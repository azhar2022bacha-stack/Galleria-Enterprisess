'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StoreCategoryData } from '@/data/storeCategories';
import type { RetailListing } from '@/lib/retailListings';
import { retailListingToProduct } from '@/lib/retailListingProduct';
import { filterProductsByActiveStoreTaxonomy, getStoreTaxonomyForProduct } from '@/lib/storeCatalog';
import { isReplacementCatalogCategory } from '@/data/catalogCategoryReplacements';
import type { Product } from '@/types';

type CatalogCategory = StoreCategoryData & { catalogProductCount: number };
type CatalogProduct = Product & { createdAt: string };
type Catalog = { categories: CatalogCategory[]; products: CatalogProduct[] };

type RatingSummaries = Record<string, { count: number; ratingAverage: number }>;

const emptyCatalog: Catalog = { categories: [], products: [] };
const StorefrontCatalogContext = createContext({
  ...emptyCatalog,
  isLoading: true,
  error: '',
});

function buildCatalog(listings: RetailListing[], taxonomy: StoreCategoryData[]): Catalog {
  const categorySlugs = new Set(taxonomy.map((category) => category.slug));
  const products = filterProductsByActiveStoreTaxonomy(listings.map((listing) => {
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

export function StorefrontCatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<RatingSummaries>({});

  useEffect(() => {
    let request: AbortController | undefined;
    const refresh = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      const options = { cache: 'no-store' as const, signal: controller.signal };
      void fetch('/api/product-reviews?scope=summary', options)
        .then(async (response) => {
          if (!response.ok) return;
          const result = await response.json();
          if (!controller.signal.aborted && result.success) setRatings(result.summaries);
        })
        .catch(() => {});
      try {
        const [listingResponse, categoryResponse] = await Promise.all([
          fetch('/api/retail-listings?scope=public', options),
          fetch('/api/store-categories', options),
        ]);
        if (!listingResponse.ok || !categoryResponse.ok) throw new Error('Catalog request failed.');
        const [{ listings }, { categories }] = await Promise.all([listingResponse.json(), categoryResponse.json()]);
        if (!Array.isArray(listings) || !Array.isArray(categories)) throw new Error('Invalid catalog response.');
        if (controller.signal.aborted) return;
        setCatalog(buildCatalog(listings, categories));
        setError('');
      } catch {
        if (!controller.signal.aborted) setError('The catalog is temporarily unavailable. Please try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void refresh();
    window.addEventListener('focus', refresh);
    return () => {
      request?.abort();
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const products = useMemo(() => catalog.products.map((product) => ({
    ...product,
    rating: ratings[product.id]?.ratingAverage ?? 0,
    reviewCount: ratings[product.id]?.count ?? 0,
  })), [catalog.products, ratings]);

  return (
    <StorefrontCatalogContext.Provider value={{ ...catalog, products, isLoading, error }}>
      {children}
    </StorefrontCatalogContext.Provider>
  );
}

export function useStorefrontCatalog() {
  return useContext(StorefrontCatalogContext);
}
