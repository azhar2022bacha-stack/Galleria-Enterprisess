import type { Product } from '@/types';
import type { RetailListing } from '@/lib/retailListings';
import { CATEGORIES } from '@/services/mockData';
import { STORE_CATEGORIES } from '@/data/storeCategories';

export function retailListingToProduct(listing: RetailListing): Product {
  const storeCategory = STORE_CATEGORIES.find((category) => category.slug === listing.categorySlug || category.name === listing.category);
  const legacyCategory = CATEGORIES.find((category) => category.name === listing.category);
  const categorySlug = storeCategory?.slug || listing.categorySlug || legacyCategory?.slug || listing.category
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    price: listing.price,
    rating: 0,
    reviewCount: 0,
    description: listing.description,
    category: listing.category,
    categorySlug,
    storeCategorySlug: storeCategory?.slug || listing.categorySlug,
    subcategory: listing.subcategory,
    subcategorySlug: listing.subcategorySlug,
    model: listing.model,
    upc: listing.upc,
    priceSourceUrl: listing.priceSourceUrl,
    priceCheckedAt: listing.priceCheckedAt,
    image: listing.image,
    additionalImages: listing.additionalImages,
    inStock: listing.stockQuantity > 0,
    stockQuantity: listing.stockQuantity,
    colors: listing.colors,
    sizes: listing.sizes,
    sku: listing.sku,
    brand: listing.brand || listing.sellerName,
    specifications: listing.specifications
      ? Object.entries(listing.specifications).map(([name, value]) => ({ name, value }))
      : undefined,
    sellerStoreSlug: listing.sellerSlug,
    tags: ['seller listing'],
    isNewArrival: true,
  };
}
