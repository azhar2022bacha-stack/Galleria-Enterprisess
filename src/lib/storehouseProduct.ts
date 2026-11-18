import type { Product } from '@/types';
import type { DemoProduct } from '@/types/product';
import { getUniqueStorehouseProductById } from '@/lib/mock-products';

const STOREFRONT_IMAGE_OVERRIDES: Record<string, string> = {
  '/images/products/base-trav-2.jpg': '/images/products/catalog-travel-adapter.png',
  '/images/products/base-trav-3.jpg': '/images/products/catalog-packing-cubes.png',
  '/images/products/base-trav-4.jpg': '/images/products/catalog-travel-pillow.png',
};

/** Keeps Storehouse catalog records on the same Product shape used by storefront controls. */
export function storehouseDemoToProduct(product: DemoProduct): Product {
  const image = STOREFRONT_IMAGE_OVERRIDES[product.mainImage] || product.mainImage;
  const additionalImages = Array.from(new Set(product.galleryImages
    .filter((galleryImage) => galleryImage && galleryImage !== product.mainImage)
    .map((galleryImage) => STOREFRONT_IMAGE_OVERRIDES[galleryImage] || galleryImage)));

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    originalPrice: product.compareAtPrice > product.price ? product.compareAtPrice : undefined,
    rating: product.rating,
    reviewCount: product.reviewCount,
    description: product.description,
    shortDescription: product.shortDescription,
    features: Object.entries(product.attributes).map(([name, value]) => `${name}: ${value}`),
    category: product.category,
    categorySlug: product.categorySlug,
    subcategory: product.subcategory,
    subcategorySlug: product.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    image,
    additionalImages,
    inStock: product.stockQuantity > 0 && product.status !== 'Limited Availability',
    stockQuantity: product.stockQuantity,
    sku: product.sku,
    brand: product.brand,
    tags: ['storehouse-catalog'],
    specifications: Object.entries(product.attributes).map(([name, value]) => ({ name, value })),
  };
}

/** Resolves only canonical Storehouse IDs so older short IDs such as `prod-1` keep their meaning. */
export function getStorehouseProductById(id: string): Product | null {
  if (!/^prod-\d{6}$/.test(id)) return null;
  const product = getUniqueStorehouseProductById(id);
  return product ? storehouseDemoToProduct(product) : null;
}

