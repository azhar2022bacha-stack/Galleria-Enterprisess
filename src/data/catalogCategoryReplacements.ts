type CatalogSubcategory = { name: string; slug: string };
type CatalogCategory = CatalogSubcategory & {
  id: string;
  subcategories: CatalogSubcategory[];
  isCustom?: boolean;
  customSubcategorySlugs?: string[];
};

const replacements = [
  ['Mobile Phones & Accessories', 'mobile-phones-accessories', ['mobile-accessories', 'smartphones-mobile']],
  ['Computers & Laptops', 'computers-laptops', ['computers-technology']],
  ['TVs & Entertainment', 'tvs-entertainment', ['tv-audio-video']],
  ['Headphones & Audio', 'headphones-audio', []],
  ['Cameras & Photography', 'cameras-photography', []],
  ['Video Games & Consoles', 'video-games-consoles', ['gaming-consoles']],
  ['Smartwatches & Wearables', 'smartwatches-wearables', []],
  ['Smart Home & Security', 'smart-home-security', ['home-automation', 'smart-security-surveillance']],
  ['Home Appliances', 'home-appliances', []],
  ['Kitchen & Dining', 'kitchen-dining', ['home-kitchen']],
  ['Furniture', 'furniture', ['furniture-products', 'furniture-decor', 'furniture-home-decor']],
  ['Home Décor & Lighting', 'home-decor-lighting', []],
  ['Bedding & Bath', 'bedding-bath', ['bathroom-sanitary-ware']],
  ['Storage & Organization', 'storage-organization', []],
  ['Cleaning & Laundry', 'cleaning-laundry', ['laundry-cleaning-equipment']],
  ['Clothing', 'clothing', ['cloths-products', 'clothing-products', 'clothing-apparel', 'fashion-clothing', 'womens-clothing', 'mens-kurtas-shalwar-kameez', 'womans-nightwear', 'muslim-wear', 'dupattas-stoles-shawls']],
  ['Shoes', 'shoes', ['shoes-footwear']],
  ['Bags & Luggage', 'bags-luggage', ['bags-accessories', 'bags-travel-luggage', 'travel-accessories', 'women-bags']],
  ['Jewelry & Watches', 'jewelry-watches', ['watches-jewelry', 'jewelry-fashion-accessories', 'sunglasses-eyewear', 'accessories', 'mens-accessories-other']],
  ['Beauty & Personal Care', 'beauty-personal-care', ['foundation-face-makeup', 'moisturizers', 'hair-styling-products', 'bath-body', 'personal-care-hygiene', 'mens-perfumes', 'lipsticks', 'eye-makeup', 'makeup-tools', 'face-wash', 'serums', 'sunscreens', 'shampoos', 'hair-oils', 'hair-tools']],
  ['Health & Wellness', 'health-wellness', []],
  ['Baby & Nursery', 'baby-nursery', ['baby-products', 'mother-baby', 'baby-clothing']],
  ['Toys & Games', 'toys-games', ['kids-toys-games']],
  ['Sports & Fitness', 'sports-fitness', ['sports-outdoors', 'sports-outdoor']],
  ['Camping & Outdoor', 'camping-outdoor', ['camping-survival-equipment']],
  ['Garden & Patio', 'garden-patio', ['garden-tools', 'agriculture-gardening']],
  ['Tools & Home Improvement', 'tools-home-improvement', ['automotive-tools', 'tools-hardware', 'home-improvement-renovation']],
  ['Office & School Supplies', 'office-school-supplies', ['books-stationery', 'stationery-office-supplies']],
  ['Arts, Crafts & Sewing', 'arts-crafts-sewing', ['handmade-craft-products', 'unstitched-fabric', 'gift-customize-products', 'party-supplies']],
  ['Pet Supplies', 'pet-supplies', ['pets-pet-accessories']],
] as const;

export const CATALOG_CATEGORY_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
  replacements.flatMap(([, slug, aliases]) => aliases.map((alias) => [alias, slug])),
);

const replacementNames = new Map<string, string>(replacements.map(([name, slug]) => [slug, name]));

export function catalogCategorySlug(slug: string): string {
  return Object.hasOwn(CATALOG_CATEGORY_ALIASES, slug) ? CATALOG_CATEGORY_ALIASES[slug] : slug;
}

export function catalogCategoryName(slug: string, fallback: string): string {
  return replacementNames.get(catalogCategorySlug(slug)) ?? fallback;
}

export function isReplacementCatalogCategory(slug: string): boolean {
  return replacementNames.has(slug);
}

export function catalogCategorySourceSlugs(slug: string): string[] {
  return [slug, ...Object.keys(CATALOG_CATEGORY_ALIASES).filter((alias) => CATALOG_CATEGORY_ALIASES[alias] === slug)];
}

export function addCatalogCategoryDefaults(categories: CatalogCategory[]): CatalogCategory[] {
  const existing = new Set(categories.map(({ slug }) => slug));
  return [...categories, ...replacements.filter(([, slug]) => !existing.has(slug)).map(([name, slug]) => ({
    id: `catalog-${slug}`, name, slug, subcategories: [{ name, slug }],
  }))];
}

export function replaceCatalogCategories(
  categories: CatalogCategory[],
  deletedCategories: string[] = [],
  deletedSubcategories: Record<string, string[]> = {},
): CatalogCategory[] {
  const deleted = new Set(deletedCategories);
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const aliasesByDestination = new Map<string, CatalogCategory[]>();
  for (const category of categories) {
    const target = catalogCategorySlug(category.slug);
    if (target === category.slug) continue;
    const aliases = aliasesByDestination.get(target) ?? [];
    aliases.push(category);
    aliasesByDestination.set(target, aliases);
  }

  const primary = replacements.flatMap(([name, slug]) => {
    const category = bySlug.get(slug);
    if (!category || deleted.has(slug)) return [];
    const aliases = aliasesByDestination.get(slug) ?? [];
    const subcategories = new Map(category.subcategories.map((item) => [item.slug, item]));
    const custom = new Set(category.customSubcategorySlugs);
    for (const alias of aliases) {
      const inherited = [{ name: alias.name, slug: alias.slug }, ...alias.subcategories];
      for (const item of inherited) if (!subcategories.has(item.slug)) subcategories.set(item.slug, item);
      for (const item of alias.customSubcategorySlugs ?? []) custom.add(item);
    }
    const removed = new Set(Object.hasOwn(deletedSubcategories, slug) ? deletedSubcategories[slug] : []);
    return [{
      ...category, name,
      subcategories: [...subcategories.values()].filter((item) => !removed.has(item.slug)),
      customSubcategorySlugs: [...custom].filter((item) => !removed.has(item)),
    }];
  });
  return [...primary, ...categories.filter(({ slug }) => !replacementNames.has(slug) && catalogCategorySlug(slug) === slug && !deleted.has(slug))];
}
