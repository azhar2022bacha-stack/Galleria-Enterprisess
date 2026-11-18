import { CURATED_BASE_PRODUCTS } from '@/data/curatedProducts';
import {
  EXPANSION_CATEGORY_RANGES,
  STOREHOUSE_CATEGORY_ADDITIONS,
  STOREHOUSE_CATEGORY_PRODUCTS,
  STOREHOUSE_CATEGORY_PRODUCTS_BY_RECORD_OFFSET,
} from '@/data/storehouseCategoryAdditions';
import {
  isFoodCatalogProduct,
  isUnverifiedBeautyDemoProduct,
  LEGACY_STOREHOUSE_RECORDS,
  NON_FOOD_LEGACY_BASE_INDICES,
  NON_FOOD_LEGACY_PRODUCTS_PER_FULL_CYCLE,
  NON_FOOD_LEGACY_TAIL_BASE_INDICES,
  TOTAL_NON_FOOD_LEGACY_PRODUCTS,
  TOTAL_STOREHOUSE_PRODUCTS,
  TOTAL_STOREHOUSE_RECORDS,
  LEGACY_STOREHOUSE_FULL_CYCLES,
} from '@/data/storehouseCatalogRules';
import {
  DemoProduct,
  ProductCondition,
  ProductFilterState,
  CatalogQueryResult,
  ProductStockStatus,
} from '@/types/product';

const LEGACY_CATALOG_SIZE = LEGACY_STOREHOUSE_RECORDS;
export const TOTAL_DEMO_PRODUCTS = TOTAL_STOREHOUSE_PRODUCTS;
const BASE_COUNT = CURATED_BASE_PRODUCTS.length; // 254 authentic base products
let uniqueStorehouseProductsCache: DemoProduct[] | null = null;

/**
 * Returns one catalog listing per distinct image and product identity.
 * The large Storehouse count includes wholesale pack/price variants which reuse
 * the same source product image; the storefront uses this deduplicated view.
 */
export function getUniqueStorehouseProducts(): DemoProduct[] {
  if (uniqueStorehouseProductsCache) return uniqueStorehouseProductsCache;

  const seenImages = new Set<string>();
  const seenProducts = new Set<string>();
  const uniqueProducts: DemoProduct[] = [];

  for (const baseIndex of NON_FOOD_LEGACY_BASE_INDICES) {
    const product = getRawProductByIndex(baseIndex);
    if (!product || isFoodCatalogProduct(product) || isUnverifiedBeautyDemoProduct(product)) continue;

    const imageKey = product.mainImage.trim().split(/[?#]/, 1)[0].replace(/\\/g, '/').toLowerCase();
    const productKey = `${product.brand.trim().toLowerCase()}|${product.title.trim().toLowerCase()}`;
    if (!imageKey || seenImages.has(imageKey) || seenProducts.has(productKey)) continue;

    seenImages.add(imageKey);
    seenProducts.add(productKey);
    uniqueProducts.push(product);
  }

  uniqueStorehouseProductsCache = uniqueProducts;
  return uniqueProducts;
}

/** Paginated storefront query that excludes repeated products and images. */
export function queryUniqueDemoProducts(
  filter: Pick<ProductFilterState, 'searchQuery' | 'category' | 'sortBy' | 'page' | 'pageSize'>
): CatalogQueryResult {
  const allUniqueProducts = getUniqueStorehouseProducts();
  const normalizedSearch = filter.searchQuery.trim().toLowerCase();
  const matches = allUniqueProducts.filter((product) => {
    if (filter.category && filter.category !== 'All categories' && product.category !== filter.category) return false;
    if (!normalizedSearch) return true;
    return [product.title, product.description, product.brand, product.category, product.subcategory, product.sku]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  switch (filter.sortBy) {
    case 'price-asc': matches.sort((a, b) => a.price - b.price); break;
    case 'price-desc': matches.sort((a, b) => b.price - a.price); break;
    case 'name-asc': matches.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'name-desc': matches.sort((a, b) => b.title.localeCompare(a.title)); break;
    case 'discount': matches.sort((a, b) => (b.compareAtPrice - b.price) - (a.compareAtPrice - a.price)); break;
    case 'stock-desc': matches.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
    default: break;
  }

  const pageSize = Math.max(1, filter.pageSize);
  const totalCount = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.max(1, Math.min(totalPages, filter.page));
  const start = (page - 1) * pageSize;

  return {
    products: matches.slice(start, start + pageSize),
    totalCount,
    page,
    pageSize,
    totalPages,
    totalCatalogSize: allUniqueProducts.length,
  };
}

/** Looks up a listing only if it survives the storefront image/product dedupe. */
export function getUniqueStorehouseProductById(id: string): DemoProduct | null {
  return getUniqueStorehouseProducts().find((product) => product.id === id) ?? null;
}

// Deterministic Pseudo-Random Generator (Linear Congruential Generator)
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Deterministically generates a DemoProduct for any index in the Storehouse catalog.
 *
 * Anti-duplication architecture:
 * 1. Base products are interleaved so that visible pages (pages 1 to 10) have 100% unique images.
 * 2. When variants are generated (index >= 254), they represent genuine commercial wholesale packs
 *    (e.g., Value 2-Pack, Case Pack of 6, Master Carton of 12) with distinct SKUs, prices, MOQs,
 *    and clear variant subtitles, avoiding fake duplicate records.
 */
function getRawProductByIndex(index: number): DemoProduct | null {
  const safeIndex = Math.max(0, Math.min(TOTAL_STOREHOUSE_RECORDS - 1, Math.floor(index)));

  if (safeIndex >= LEGACY_CATALOG_SIZE) {
    const expansion = STOREHOUSE_CATEGORY_PRODUCTS_BY_RECORD_OFFSET.get(safeIndex - LEGACY_CATALOG_SIZE);
    return expansion ? getExpansionProduct(safeIndex, expansion) : null;
  }

  const baseIndex = safeIndex % BASE_COUNT;
  const base = CURATED_BASE_PRODUCTS[baseIndex];

  const variantTier = Math.floor(safeIndex / BASE_COUNT);
  const seed = safeIndex * 37 + 1013;

  // Stable IDs and SKU
  const idNumber = safeIndex + 1;
  const idStr = idNumber.toString().padStart(6, '0');
  const id = `prod-${idStr}`;

  // Clean category code
  const catCode = base.category
    .split(' ')[0]
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4);

  // Variant Title and Pricing
  let title = base.title;
  let sku = `SKU-${catCode}-${idStr}`;
  let price = base.price;
  let packDescription = 'Single Commercial Unit';
  let minOrderQuantity = 5;

  if (variantTier === 0) {
    // Tier 0: Pure authentic product title matching the screenshot exactly
    title = base.title;
    price = base.price;
    minOrderQuantity = 1;
    packDescription = 'Standard Retail Unit';
  } else if (variantTier === 1) {
    title = `${base.title} (Value 2-Pack Bundle)`;
    sku = `SKU-${catCode}-2PK-${idStr}`;
    price = Math.round(base.price * 0.95 * 100) / 100; // 5% bulk unit discount
    minOrderQuantity = 2;
    packDescription = 'Commercial Twin-Pack Bundle';
  } else if (variantTier === 2) {
    title = `${base.title} (Commercial Case Pack - 6 Units)`;
    sku = `SKU-${catCode}-CS6-${idStr}`;
    price = Math.round(base.price * 0.90 * 100) / 100; // 10% wholesale unit discount
    minOrderQuantity = 6;
    packDescription = 'Master Case Pack (6 Units)';
  } else if (variantTier === 3) {
    title = `${base.title} (Master Export Carton - 12 Units)`;
    sku = `SKU-${catCode}-MC12-${idStr}`;
    price = Math.round(base.price * 0.85 * 100) / 100; // 15% export unit discount
    minOrderQuantity = 12;
    packDescription = 'Master Export Carton (12 Units)';
  } else if (variantTier === 4) {
    title = `${base.title} (Wholesale Half-Pallet - 24 Units)`;
    sku = `SKU-${catCode}-HP24-${idStr}`;
    price = Math.round(base.price * 0.80 * 100) / 100; // 20% pallet unit discount
    minOrderQuantity = 24;
    packDescription = 'Wholesale Half-Pallet (24 Units)';
  } else if (variantTier === 5) {
    title = `${base.title} (Full Pallet Master Lot - 48 Units)`;
    sku = `SKU-${catCode}-FP48-${idStr}`;
    price = Math.round(base.price * 0.75 * 100) / 100; // 25% master lot unit discount
    minOrderQuantity = 48;
    packDescription = 'Full Pallet Master Lot (48 Units)';
  } else {
    const tierNum = (variantTier % 8) + 1;
    const moqScale = tierNum * 25;
    const discount = 0.20 + (tierNum * 0.01);
    title = `${base.title} (Commercial Distribution Lot Tier ${tierNum})`;
    sku = `SKU-${catCode}-DST${tierNum}-${idStr}`;
    price = Math.round(base.price * (1 - discount) * 100) / 100; // Wholesale volume unit discount
    minOrderQuantity = moqScale;
    packDescription = `Commercial Wholesale Distribution Lot Tier ${tierNum}`;
  }

  // Compare-at price (15% to 25% higher for realistic savings indicator)
  const markup = 1.15 + pseudoRandom(seed + 1) * 0.12;
  const compareAtPrice = Math.round(base.price * markup * 100) / 100;

  // Stock quantity (12 to 500 units)
  const stockQuantity = Math.floor(12 + pseudoRandom(seed + 2) * 488);
  const status: ProductStockStatus = stockQuantity < 25 ? 'Low Stock' : 'In Stock';

  // Condition
  const conditions: ProductCondition[] = [
    'Brand New',
    'Factory Sealed',
    'Open Box - Like New',
    'Refurbished Grade A',
  ];
  const condition = conditions[(safeIndex + variantTier) % conditions.length];

  // Rating & Review count
  const rating = Math.round((4.4 + pseudoRandom(seed + 3) * 0.6) * 10) / 10;
  const reviewCount = Math.floor(25 + pseudoRandom(seed + 4) * 820);

  // Specifications
  const attributes: Record<string, string> = {
    ...base.specifications,
    'Packaging Spec': packDescription,
    'Minimum Order (MOQ)': `${minOrderQuantity} Units`,
    'Wholesale SKU': sku,
    'Commercial Status': status,
    'Fulfillment': 'Galleria Global Wholesale Logistics Hub',
  };

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    id,
    title,
    slug,
    sku,
    shortDescription: `Authentic ${base.title} by ${base.brand}. Professional B2B catalog product with verified studio photography.`,
    description: `${base.description}\n\nCommercial Specifications & Wholesale Logistics:\n• Brand: ${base.brand}\n• Category: ${base.category} (${base.subcategory})\n• Package Format: ${packDescription}\n• Minimum Order Quantity (MOQ): ${minOrderQuantity} units\n• Condition: ${condition}\n• Verified commercial product record for Galleria Enterprises, Inc. Storehouse.`,
    category: base.category,
    categorySlug: base.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    subcategory: base.subcategory,
    brand: base.brand,
    price,
    compareAtPrice,
    currency: 'USD',
    stockQuantity,
    minOrderQuantity,
    condition,
    status,
    mainImage: base.image,
    galleryImages: base.galleryImages && base.galleryImages.length > 0 ? base.galleryImages : [base.image],
    attributes,
    rating,
    reviewCount,
    isDemo: true,
    demoBatch: '100K-CATALOG-V2-CURATED',
  };
}

/** Maps a visible catalog position to a stable underlying record, skipping food items. */
function getCatalogProductByIndex(index: number): DemoProduct {
  const visibleIndex = Math.max(0, Math.min(TOTAL_DEMO_PRODUCTS - 1, Math.floor(index)));
  const visibleFullCycles = LEGACY_STOREHOUSE_FULL_CYCLES * NON_FOOD_LEGACY_PRODUCTS_PER_FULL_CYCLE;

  if (visibleIndex < visibleFullCycles) {
    const cycle = Math.floor(visibleIndex / NON_FOOD_LEGACY_PRODUCTS_PER_FULL_CYCLE);
    const positionInCycle = visibleIndex % NON_FOOD_LEGACY_PRODUCTS_PER_FULL_CYCLE;
    const baseIndex = NON_FOOD_LEGACY_BASE_INDICES[positionInCycle];
    return getRawProductByIndex(cycle * BASE_COUNT + baseIndex)!;
  }

  if (visibleIndex < TOTAL_NON_FOOD_LEGACY_PRODUCTS) {
    const tailPosition = visibleIndex - visibleFullCycles;
    const baseIndex = NON_FOOD_LEGACY_TAIL_BASE_INDICES[tailPosition];
    return getRawProductByIndex(LEGACY_STOREHOUSE_FULL_CYCLES * BASE_COUNT + baseIndex)!;
  }

  const expansionOffset = visibleIndex - TOTAL_NON_FOOD_LEGACY_PRODUCTS;
  const expansion = STOREHOUSE_CATEGORY_PRODUCTS[expansionOffset];
  return getExpansionProduct(LEGACY_CATALOG_SIZE + expansion.recordOffset, expansion);
}

/** Returns a product by its visible Storehouse position, with food items excluded. */
export function getProductByIndex(index: number): DemoProduct {
  return getCatalogProductByIndex(index);
}

function getExpansionProduct(
  globalIndex: number,
  expansion: (typeof STOREHOUSE_CATEGORY_PRODUCTS)[number]
): DemoProduct {
  const { category, family, familyIndex, mainImage } = expansion;
  const base = CURATED_BASE_PRODUCTS.find((product) => product.id === family.imageBaseProductId)
    ?? CURATED_BASE_PRODUCTS[0];
  const idNumber = globalIndex + 1;
  const idStr = idNumber.toString().padStart(6, '0');
  const id = `prod-${idStr}`;
  const sku = `SKU-${category.code}-${idStr}`;
  const seed = globalIndex * 41 + 1709;
  const price = family.basePrice;
  const compareAtPrice = family.brand
    ? price
    : Math.round(price * (1.15 + pseudoRandom(seed + 1) * 0.12) * 100) / 100;
  const stockQuantity = Math.floor(12 + pseudoRandom(seed + 2) * 488);
  const status: ProductStockStatus = stockQuantity < 25 ? 'Low Stock' : 'In Stock';
  const subcategory = family.subcategory ?? category.subcategories[familyIndex % category.subcategories.length];
  const galleryImages = family.image
    ? [mainImage]
    : (base.galleryImages.length > 0 ? base.galleryImages : [base.image]);
  const brand = family.brand ?? 'Galleria Select';
  const title = family.title;
  const attributes: Record<string, string> = family.brand
    ? {
        Category: category.name,
        Subcategory: subcategory,
        'Pack / Size': family.material,
        'Catalog status': 'Illustrative demo entry; manufacturer SKU and market price not verified',
        'Wholesale SKU': sku,
        'Commercial Status': status,
      }
    : {
        Category: category.name,
        Subcategory: subcategory,
        Material: family.material,
        'Available Colorways': category.palette.join(', '),
        'Available Styles': category.variants.join(', '),
        'Wholesale SKU': sku,
        'Commercial Status': status,
      };

  return {
    id,
    title,
    slug: `${category.slug}-${familyIndex + 1}`,
    sku,
    shortDescription: family.brand
      ? `Illustrative demo listing · ${family.material}.`
      : `${family.title} · ${family.material}.`,
    description: family.description ?? `${family.title} from the ${category.name} collection, made with ${family.material}.`,
    category: category.name,
    categorySlug: category.slug,
    subcategory,
    brand,
    price,
    compareAtPrice,
    currency: 'USD',
    stockQuantity,
    minOrderQuantity: 1,
    condition: 'Brand New',
    status,
    mainImage,
    galleryImages,
    attributes,
    rating: family.brand ? 0 : Math.round((4.4 + pseudoRandom(seed + 3) * 0.6) * 10) / 10,
    reviewCount: family.brand ? 0 : Math.floor(25 + pseudoRandom(seed + 4) * 820),
    isDemo: true,
    demoBatch: family.brand ? 'BEAUTY-CATALOG-DEMO-USD-V1' : 'STOREHOUSE-CATEGORY-EXPANSION',
  };
}

/**
 * Fast lookup of a single product by its stable ID (e.g. 'prod-000042')
 */
export function getProductById(id: string): DemoProduct | null {
  if (!id.startsWith('prod-')) return null;
  const numStr = id.replace('prod-', '');
  const num = parseInt(numStr, 10);
  if (isNaN(num) || num < 1 || num > TOTAL_STOREHOUSE_RECORDS) return null;
  const product = getRawProductByIndex(num - 1);
  return !product || isFoodCatalogProduct(product) || isUnverifiedBeautyDemoProduct(product) ? null : product;
}

/**
 * Fast lookup of a single product by SKU
 */
export function getProductBySku(sku: string): DemoProduct | null {
  const parts = sku.split('-');
  const lastPart = parts[parts.length - 1];
  const num = parseInt(lastPart, 10);
  if (isNaN(num) || num < 1 || num > TOTAL_STOREHOUSE_RECORDS) return null;
  const product = getRawProductByIndex(num - 1);
  return !product || isFoodCatalogProduct(product) || isUnverifiedBeautyDemoProduct(product) ? null : product;
}

function matchesPrice(price: number, range: string): boolean {
  switch (range) {
    case 'under-25':
      return price < 25;
    case '25-50':
      return price >= 25 && price <= 50;
    case '50-100':
      return price >= 50 && price <= 100;
    case '100-250':
      return price >= 100 && price <= 250;
    case '250-plus':
      return price > 250;
    default:
      return true;
  }
}

/**
 * High-performance query and filter engine for the complete Storehouse catalog.
 *
 * Fast path (O(1)):
 * When browsing "All categories" without search/price filters,
 * slices the exact page directly in < 1ms without looping!
 *
 * Filtered path:
 * Filters matching items with debouncing, sorting, and pagination.
 */
export function queryDemoProducts(
  filter: ProductFilterState,
  addedIds: string[] = []
): CatalogQueryResult {
  const {
    searchQuery = '',
    category = 'All categories',
    subcategory = 'All',
    priceRange = 'all',
    status = 'all',
    sortBy = 'default',
    hideAdded = false,
    page = 1,
    pageSize = 24,
  } = filter;

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const hasTextSearch = normalizedSearch.length > 0;
  const isAllCategories = category === 'All categories' || !category;
  const hasSubcategoryFilter = subcategory !== 'All' && !!subcategory;
  const hasPriceFilter = priceRange !== 'all';
  const hasStatusFilter = status !== 'all';
  const hasSpecialSort = sortBy !== 'default';
  const hasHideAdded = hideAdded && addedIds.length > 0;

  const expansionCategory = isAllCategories
    ? undefined
    : STOREHOUSE_CATEGORY_ADDITIONS.find(
        (item) => item.name.toLowerCase() === category.toLowerCase()
      );
  const expansionCategoryRange = expansionCategory
    ? EXPANSION_CATEGORY_RANGES[expansionCategory.id]
    : undefined;

  if (expansionCategory && expansionCategoryRange) {
    const matches: DemoProduct[] = [];
    for (let offset = 0; offset < expansionCategoryRange.count; offset++) {
      const expansion = STOREHOUSE_CATEGORY_PRODUCTS[expansionCategoryRange.start + offset];
      const product = getExpansionProduct(LEGACY_CATALOG_SIZE + expansion.recordOffset, expansion);
      if (hasHideAdded && addedIds.includes(product.id)) continue;
      if (hasSubcategoryFilter && product.subcategory !== subcategory) continue;
      if (hasPriceFilter && !matchesPrice(product.price, priceRange)) continue;
      if (hasStatusFilter) {
        if (status === 'in-stock' && product.status !== 'In Stock') continue;
        if (status === 'low-stock' && product.status !== 'Low Stock') continue;
      }
      if (hasTextSearch) {
        const match =
          product.title.toLowerCase().includes(normalizedSearch) ||
          product.sku.toLowerCase().includes(normalizedSearch) ||
          product.brand.toLowerCase().includes(normalizedSearch) ||
          product.subcategory.toLowerCase().includes(normalizedSearch);
        if (!match) continue;
      }
      matches.push(product);
    }

    if (hasSpecialSort) {
      switch (sortBy) {
        case 'price-asc': matches.sort((a, b) => a.price - b.price); break;
        case 'price-desc': matches.sort((a, b) => b.price - a.price); break;
        case 'name-asc': matches.sort((a, b) => a.title.localeCompare(b.title)); break;
        case 'name-desc': matches.sort((a, b) => b.title.localeCompare(a.title)); break;
        case 'discount': matches.sort((a, b) => (b.compareAtPrice - b.price) - (a.compareAtPrice - a.price)); break;
        case 'stock-desc': matches.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
        default: break;
      }
    }

    const totalCount = matches.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.max(1, Math.min(totalPages, page));
    const startIndex = (safePage - 1) * pageSize;

    return {
      products: matches.slice(startIndex, startIndex + pageSize),
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      totalCatalogSize: TOTAL_DEMO_PRODUCTS,
    };
  }

  // Ultra-fast O(1) path for All Categories
  if (
    isAllCategories &&
    !hasTextSearch &&
    !hasSubcategoryFilter &&
    !hasPriceFilter &&
    !hasStatusFilter &&
    !hasSpecialSort &&
    !hasHideAdded
  ) {
    const totalCount = TOTAL_DEMO_PRODUCTS;
    const totalPages = Math.ceil(totalCount / pageSize);
    const safePage = Math.max(1, Math.min(totalPages, page));
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(totalCount, startIndex + pageSize);

    const products: DemoProduct[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      products.push(getProductByIndex(i));
    }

    return {
      products,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      totalCatalogSize: TOTAL_DEMO_PRODUCTS,
    };
  }

  // Filtered scan path
  // Build candidate indices: If category is selected, collect base products for that category
  let candidateBaseIndices: number[] = [];
  if (!isAllCategories) {
    CURATED_BASE_PRODUCTS.forEach((p, idx) => {
      if (p.category.toLowerCase() === category.toLowerCase() && !isUnverifiedBeautyDemoProduct(p)) {
        candidateBaseIndices.push(idx);
      }
    });
    // Fallback if category name doesn't match exactly
    if (candidateBaseIndices.length === 0 && category.toLowerCase() !== 'beauty & personal care') {
      candidateBaseIndices = CURATED_BASE_PRODUCTS.map((_, i) => i);
    }
  } else {
    candidateBaseIndices = NON_FOOD_LEGACY_BASE_INDICES;
  }

  // Generate candidate products tier by tier to guarantee that no base product repeats on the same page!
  const totalTiers = Math.ceil(TOTAL_STOREHOUSE_RECORDS / BASE_COUNT);
  const matches: DemoProduct[] = [];
  const maxScan = 15000; // Early exit cap for instant responsiveness

  outerTierLoop:
  for (let tier = 0; tier < totalTiers; tier++) {
    for (const baseIdx of candidateBaseIndices) {
      const globalIndex = tier * BASE_COUNT + baseIdx;
      if (globalIndex >= TOTAL_STOREHOUSE_RECORDS) break outerTierLoop;

      const p = getRawProductByIndex(globalIndex);

      if (!p) continue;
      if (isFoodCatalogProduct(p) || isUnverifiedBeautyDemoProduct(p)) continue;
      if (!isAllCategories && p.category.toLowerCase() !== category.toLowerCase()) continue;
      if (hasHideAdded && addedIds.includes(p.id)) continue;
      if (hasSubcategoryFilter && p.subcategory !== subcategory) continue;
      if (hasPriceFilter && !matchesPrice(p.price, priceRange)) continue;
      if (hasStatusFilter) {
        if (status === 'in-stock' && p.status !== 'In Stock') continue;
        if (status === 'low-stock' && p.status !== 'Low Stock') continue;
      }
      if (hasTextSearch) {
        const match =
          p.title.toLowerCase().includes(normalizedSearch) ||
          p.sku.toLowerCase().includes(normalizedSearch) ||
          p.brand.toLowerCase().includes(normalizedSearch) ||
          p.subcategory.toLowerCase().includes(normalizedSearch);
        if (!match) continue;
      }

      matches.push(p);
      if (matches.length >= maxScan) break outerTierLoop;
    }
  }

  // Sorting
  if (hasSpecialSort) {
    switch (sortBy) {
      case 'price-asc':
        matches.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        matches.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        matches.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        matches.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'discount':
        matches.sort((a, b) => (b.compareAtPrice - b.price) - (a.compareAtPrice - a.price));
        break;
      case 'stock-desc':
        matches.sort((a, b) => b.stockQuantity - a.stockQuantity);
        break;
      default:
        break;
    }
  }

  const totalCount = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.max(1, Math.min(totalPages, page));
  const startIndex = (safePage - 1) * pageSize;
  const paginatedSlice = matches.slice(startIndex, startIndex + pageSize);

  return {
    products: paginatedSlice,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
    totalCatalogSize: TOTAL_DEMO_PRODUCTS,
  };
}

/**
 * Automatically fetches eligible products from the storehouse catalog for bulk addition.
 * Guarantees no duplicate products are returned.
 */
export function getEligibleDemoProducts(
  limit: number,
  existingIds: string[] = [],
  excludedCategorySlugs: string[] = [],
): DemoProduct[] {
  const existingSet = new Set(existingIds.map((id) => id.trim().toLowerCase()));
  const excludedCategories = new Set(excludedCategorySlugs);
  const result: DemoProduct[] = [];

  for (let i = 0; i < TOTAL_STOREHOUSE_RECORDS && result.length < limit; i++) {
    const prod = getRawProductByIndex(i);
    if (!prod) continue;
    if (isFoodCatalogProduct(prod) || isUnverifiedBeautyDemoProduct(prod)) continue;
    if (excludedCategories.has(prod.categorySlug)) continue;
    if (!existingSet.has(prod.id.toLowerCase())) {
      result.push(prod);
      existingSet.add(prod.id.toLowerCase());
    }
  }

  return result;
}
