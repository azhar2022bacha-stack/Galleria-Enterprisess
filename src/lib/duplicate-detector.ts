import { DemoProduct } from '@/types/product';

export interface DuplicateAuditReport {
  totalProductsChecked: number;
  uniqueTitlesCount: number;
  uniqueSkusCount: number;
  uniqueImagesCount: number;
  duplicateTitles: string[];
  duplicateSkus: string[];
  duplicateImagesAcrossUnrelatedProducts: {
    imageUrl: string;
    productTitles: string[];
    categories: string[];
  }[];
  visiblePageDeduplicationRate: number; // Percentage of visible cards with 100% unique images
  summary: string;
}

/**
 * Multi-signal duplicate detection and validation engine.
 * Inspects products for duplicate titles, duplicate SKUs, and identical images assigned to unrelated products.
 */
export function auditProductCatalog(products: DemoProduct[]): DuplicateAuditReport {
  const titleMap = new Map<string, string[]>();
  const skuMap = new Map<string, string[]>();
  const imageMap = new Map<string, { titles: string[]; categories: string[]; ids: string[] }>();

  products.forEach((p) => {
    // 1. Normalized Title Check
    const normTitle = p.title.toLowerCase().trim();
    if (!titleMap.has(normTitle)) {
      titleMap.set(normTitle, []);
    }
    titleMap.get(normTitle)!.push(p.id);

    // 2. SKU Check
    const normSku = p.sku.toUpperCase().trim();
    if (!skuMap.has(normSku)) {
      skuMap.set(normSku, []);
    }
    skuMap.get(normSku)!.push(p.id);

    // 3. Image URL & Normalized Source Check
    const normImage = p.mainImage.split('?')[0].toLowerCase().trim();
    if (!imageMap.has(normImage)) {
      imageMap.set(normImage, { titles: [], categories: [], ids: [] });
    }
    const imgRecord = imageMap.get(normImage)!;
    if (!imgRecord.titles.includes(p.title)) {
      imgRecord.titles.push(p.title);
    }
    if (!imgRecord.categories.includes(p.category)) {
      imgRecord.categories.push(p.category);
    }
    imgRecord.ids.push(p.id);
  });

  const duplicateTitles: string[] = [];
  titleMap.forEach((ids, title) => {
    if (ids.length > 1) {
      duplicateTitles.push(`${title} (${ids.length} occurrences)`);
    }
  });

  const duplicateSkus: string[] = [];
  skuMap.forEach((ids, sku) => {
    if (ids.length > 1) {
      duplicateSkus.push(`${sku} (${ids.length} occurrences)`);
    }
  });

  // Check if unrelated products (different categories or completely different titles) share the same image
  const duplicateImagesAcrossUnrelatedProducts: {
    imageUrl: string;
    productTitles: string[];
    categories: string[];
  }[] = [];

  imageMap.forEach((data, imageUrl) => {
    // If an image appears in 2 or more completely different categories, that's an invalid unrelated reuse!
    if (data.categories.length > 1) {
      duplicateImagesAcrossUnrelatedProducts.push({
        imageUrl,
        productTitles: data.titles,
        categories: data.categories,
      });
    }
  });

  // Check the first 48 products (first 2 visible pages) for 100% visual uniqueness
  const sampleVisibleCards = products.slice(0, 48);
  const sampleImages = new Set(sampleVisibleCards.map((p) => p.mainImage));
  const visiblePageDeduplicationRate =
    sampleVisibleCards.length > 0
      ? Math.round((sampleImages.size / sampleVisibleCards.length) * 100)
      : 100;

  return {
    totalProductsChecked: products.length,
    uniqueTitlesCount: titleMap.size,
    uniqueSkusCount: skuMap.size,
    uniqueImagesCount: imageMap.size,
    duplicateTitles,
    duplicateSkus,
    duplicateImagesAcrossUnrelatedProducts,
    visiblePageDeduplicationRate,
    summary: `Audit complete. Checked ${products.length} products. Found ${skuMap.size} unique SKUs and ${imageMap.size} distinct product images. Visible page image uniqueness is ${visiblePageDeduplicationRate}%.`,
  };
}
