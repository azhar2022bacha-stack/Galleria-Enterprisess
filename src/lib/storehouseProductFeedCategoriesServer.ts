import { STOREHOUSE_IMPORT_CATEGORIES } from '@/data/storehouseImportCategories';
import { addCatalogCategoryDefaults, replaceCatalogCategories } from '@/data/catalogCategoryReplacements';
import { readProductFeedCategorySnapshot, writeProductFeedCategorySnapshot } from '@/lib/productFeedCategoryStorage';
import type { ProductFeedSubcategory } from '@/lib/productFeed';

export interface StorehouseFeedCategory {
  id: string;
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
  isCustom?: boolean;
  customSubcategorySlugs?: string[];
}

export interface StorehouseCategoryConflict {
  kind: 'category' | 'subcategory';
  name: string;
  slug: string;
  category?: string;
  categorySlug?: string;
}

export class StorehouseProductFeedCategoryConflictError extends Error {
  constructor(public readonly existing: StorehouseCategoryConflict) {
    super(existing.kind === 'category'
      ? `Main Storehouse category “${existing.name}” already exists.`
      : `Subcategory “${existing.name}” already exists under “${existing.category}”.`);
    this.name = 'StorehouseProductFeedCategoryConflictError';
  }
}

export interface StorehouseFeedCategoryOverrides {
  categories: { id: string; name: string; slug: string }[];
  subcategories: Record<string, { name: string; slug: string }[]>;
  deletedCategories: string[];
  deletedSubcategories: Record<string, string[]>;
}

const OVERRIDES_FILE = 'storehouse_product_feed_categories.json';

function normalizeName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-').slice(0, 80).replace(/-+$/g, '');
}

export function readStorehouseProductFeedCategoryOverrides(): StorehouseFeedCategoryOverrides {
  const parsed = readProductFeedCategorySnapshot<StorehouseFeedCategoryOverrides>(OVERRIDES_FILE);
  if (!parsed) return { categories: [], subcategories: {}, deletedCategories: [], deletedSubcategories: {} };
  const categories = Array.isArray(parsed.categories) ? parsed.categories.filter((item) => (
    item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.slug === 'string'
  )) : [];
  const subcategories = parsed.subcategories && typeof parsed.subcategories === 'object' && !Array.isArray(parsed.subcategories)
    ? Object.fromEntries(Object.entries(parsed.subcategories).map(([categorySlug, values]) => [
      categorySlug,
      Array.isArray(values) ? values.filter((item) => item && typeof item.name === 'string' && typeof item.slug === 'string') : [],
    ]))
    : {};
  const deletedCategories = Array.isArray(parsed.deletedCategories)
    ? parsed.deletedCategories.filter((slug): slug is string => typeof slug === 'string')
    : [];
  const deletedSubcategories = parsed.deletedSubcategories && typeof parsed.deletedSubcategories === 'object' && !Array.isArray(parsed.deletedSubcategories)
    ? Object.fromEntries(Object.entries(parsed.deletedSubcategories).map(([categorySlug, values]) => [
      categorySlug,
      Array.isArray(values) ? values.filter((item): item is string => typeof item === 'string') : [],
    ]))
    : {};
  return { categories, subcategories, deletedCategories, deletedSubcategories };
}

export function writeStorehouseProductFeedCategoryOverrides(overrides: StorehouseFeedCategoryOverrides): void {
  writeProductFeedCategorySnapshot(OVERRIDES_FILE, overrides);
}

export function readStorehouseProductFeedCategories(): StorehouseFeedCategory[] {
  return storehouseProductFeedCategories(readStorehouseProductFeedCategoryOverrides());
}

function storehouseProductFeedCategories(overrides: StorehouseFeedCategoryOverrides): StorehouseFeedCategory[] {
  const deletedCategories = new Set(overrides.deletedCategories);
  const categories: StorehouseFeedCategory[] = STOREHOUSE_IMPORT_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    isCustom: false,
    customSubcategorySlugs: [],
    subcategories: category.subcategories.map((name) => ({ name, slug: slugify(name) })),
  }));
  for (const category of overrides.categories) {
    categories.push({
      ...category,
      isCustom: true,
      customSubcategorySlugs: [],
      subcategories: [],
    });
  }
  const activeCategories = addCatalogCategoryDefaults(categories).filter((category) => !deletedCategories.has(category.slug)).map((category) => {
    const additions = Object.hasOwn(overrides.subcategories, category.slug) ? overrides.subcategories[category.slug] : [];
    const deletedSubcategories = new Set(
      Object.hasOwn(overrides.deletedSubcategories, category.slug) ? overrides.deletedSubcategories[category.slug] : [],
    );
    const seen = new Set(category.subcategories.map((item) => item.slug));
    const customSubcategories = additions.filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
    return {
      ...category,
      customSubcategorySlugs: customSubcategories.map((item) => item.slug).filter((slug) => !deletedSubcategories.has(slug)),
      subcategories: [
        ...category.subcategories,
        ...customSubcategories,
      ].filter((item) => !deletedSubcategories.has(item.slug)),
    };
  });
  return replaceCatalogCategories(activeCategories, overrides.deletedCategories, overrides.deletedSubcategories);
}

export function saveMissingStorehouseProductFeedTaxonomy(pairs: {
  category: ProductFeedSubcategory;
  subcategory: ProductFeedSubcategory;
}[]): (() => void) | undefined {
  const previous = readStorehouseProductFeedCategoryOverrides();
  const active = new Map(storehouseProductFeedCategories(previous).map((category) => [
    category.slug, new Set(category.subcategories.map((subcategory) => subcategory.slug)),
  ]));
  const missing = pairs.filter(({ category, subcategory }) => !active.get(category.slug)?.has(subcategory.slug));
  if (!missing.length) return;

  const known = new Map(storehouseProductFeedCategories({
    ...previous, deletedCategories: [], deletedSubcategories: {},
  }).map((category) => [category.slug, new Set(category.subcategories.map((subcategory) => subcategory.slug))]));
  const next: StorehouseFeedCategoryOverrides = {
    categories: [...previous.categories],
    subcategories: Object.assign(Object.create(null), previous.subcategories),
    deletedCategories: [...previous.deletedCategories],
    deletedSubcategories: Object.assign(Object.create(null), previous.deletedSubcategories),
  };
  for (const { category, subcategory } of missing) {
    let knownSubcategories = known.get(category.slug);
    if (!knownSubcategories) {
      next.categories.push({ id: `feed-${category.slug}`, name: category.name, slug: category.slug });
      knownSubcategories = new Set();
      known.set(category.slug, knownSubcategories);
    }
    if (!knownSubcategories.has(subcategory.slug)) {
      next.subcategories[category.slug] = [...(next.subcategories[category.slug] || []), subcategory];
      knownSubcategories.add(subcategory.slug);
    }
    next.deletedCategories = next.deletedCategories.filter((slug) => slug !== category.slug);
    if (next.deletedSubcategories[category.slug]?.includes(subcategory.slug)) {
      next.deletedSubcategories[category.slug] = next.deletedSubcategories[category.slug].filter((slug) => slug !== subcategory.slug);
    }
  }

  writeStorehouseProductFeedCategoryOverrides(next);
  return () => writeStorehouseProductFeedCategoryOverrides(previous);
}

export function readStorehouseProductFeedCategoryDeletionState(): {
  deletedCategorySlugs: string[];
  deletedSubcategories: Record<string, string[]>;
} {
  const overrides = readStorehouseProductFeedCategoryOverrides();
  return { deletedCategorySlugs: overrides.deletedCategories, deletedSubcategories: overrides.deletedSubcategories };
}

export function addStorehouseProductFeedCategory(input: {
  kind: 'category' | 'subcategory';
  name: string;
  categorySlug?: string;
  names?: string[];
}): StorehouseFeedCategory[] {
  const names = input.kind === 'subcategory' && input.names?.length
    ? input.names.map((name) => name.trim().replace(/\s+/g, ' '))
    : [input.name.trim().replace(/\s+/g, ' ')];
  if (!names.length || names.length > 50) throw new Error('Add between 1 and 50 names at a time.');
  for (const name of names) {
    if (name.length < 2 || name.length > 60) throw new Error('Each name must be between 2 and 60 characters.');
    if (!slugify(name)) throw new Error('Use letters or numbers in each name.');
  }
  const seenNames = new Set<string>();
  for (const name of names) {
    const normalized = normalizeName(name);
    if (seenNames.has(normalized)) {
      throw new StorehouseProductFeedCategoryConflictError({ kind: input.kind, name, slug: slugify(name), ...(input.kind === 'subcategory' ? { categorySlug: input.categorySlug } : {}) });
    }
    seenNames.add(normalized);
  }
  const categories = readStorehouseProductFeedCategories();
  const overrides = readStorehouseProductFeedCategoryOverrides();

  if (input.kind === 'category') {
    const name = names[0];
    const slug = slugify(name);
    const duplicate = categories.find((category) => category.slug === slug || normalizeName(category.name) === normalizeName(name));
    if (duplicate) {
      throw new StorehouseProductFeedCategoryConflictError({ kind: 'category', name: duplicate.name, slug: duplicate.slug });
    }
    overrides.deletedCategories = overrides.deletedCategories.filter((deletedSlug) => deletedSlug !== slug);
    delete overrides.deletedSubcategories[slug];
    overrides.categories.push({ id: `feed-${slug}`, name, slug });
  } else {
    const categorySlug = String(input.categorySlug || '').trim();
    const category = categories.find((item) => item.slug === categorySlug);
    if (!category) throw new Error('Choose an existing Storehouse category.');
    const additions = names.map((name) => ({ name, slug: slugify(name) }));
    for (const addition of additions) {
      const duplicate = category.subcategories.find((item) => item.slug === addition.slug || normalizeName(item.name) === normalizeName(addition.name));
      if (duplicate) {
        throw new StorehouseProductFeedCategoryConflictError({
          kind: 'subcategory',
          name: duplicate.name,
          slug: duplicate.slug,
          category: category.name,
          categorySlug: category.slug,
        });
      }
    }
    const additionSlugs = new Set(additions.map((item) => item.slug));
    overrides.deletedSubcategories[categorySlug] = (overrides.deletedSubcategories[categorySlug] || []).filter((slug) => !additionSlugs.has(slug));
    overrides.subcategories[categorySlug] = [...(overrides.subcategories[categorySlug] || []), ...additions];
  }

  writeStorehouseProductFeedCategoryOverrides(overrides);
  return readStorehouseProductFeedCategories();
}
