import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { STORE_CATEGORIES, type StoreCategoryData } from '@/data/storeCategories';

export interface StoreCategoryOverrides {
  categories: StoreCategoryData[];
  subcategories: Record<string, { name: string; slug: string }[]>;
  deletedCategories: string[];
  deletedSubcategories: Record<string, string[]>;
}

const OVERRIDES_FILE = path.join(process.cwd(), 'src', 'data', 'store_category_overrides.json');

function emptyOverrides(): StoreCategoryOverrides {
  return { categories: [], subcategories: {}, deletedCategories: [], deletedSubcategories: {} };
}

export function readStoreCategoryOverrides(): StoreCategoryOverrides {
  try {
    const parsed = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8')) as Partial<StoreCategoryOverrides>;
    const categories = Array.isArray(parsed.categories) ? parsed.categories.filter((category) => (
      category && typeof category.id === 'string' && typeof category.name === 'string' && typeof category.slug === 'string' && Array.isArray(category.subcategories)
    )) : [];
    const subcategories = parsed.subcategories && typeof parsed.subcategories === 'object' && !Array.isArray(parsed.subcategories)
      ? parsed.subcategories
      : {};
    const deletedCategories = Array.isArray(parsed.deletedCategories)
      ? parsed.deletedCategories.filter((slug): slug is string => typeof slug === 'string')
      : [];
    const deletedSubcategories = parsed.deletedSubcategories && typeof parsed.deletedSubcategories === 'object' && !Array.isArray(parsed.deletedSubcategories)
      ? Object.fromEntries(Object.entries(parsed.deletedSubcategories).map(([slug, values]) => [
        slug,
        Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : [],
      ]))
      : {};
    return { categories, subcategories, deletedCategories, deletedSubcategories };
  } catch {
    return emptyOverrides();
  }
}

export function writeStoreCategoryOverrides(overrides: StoreCategoryOverrides): void {
  fs.mkdirSync(path.dirname(OVERRIDES_FILE), { recursive: true });
  const temporaryFile = `${OVERRIDES_FILE}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(overrides, null, 2), { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryFile, OVERRIDES_FILE);
}

export function getStoreCategories(): StoreCategoryData[] {
  const overrides = readStoreCategoryOverrides();
  const deletedCategories = new Set(overrides.deletedCategories);
  const base = STORE_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    subcategories: category.subcategories.map((subcategory) => ({ name: subcategory.name, slug: subcategory.slug })),
  }));
  const merged = [...base, ...overrides.categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    subcategories: category.subcategories.map((subcategory) => ({ name: subcategory.name, slug: subcategory.slug })),
  }))].filter((category) => !deletedCategories.has(category.slug));
  return merged.map((category) => {
    const additions = overrides.subcategories[category.slug] || [];
    const deletedSubcategories = new Set(overrides.deletedSubcategories[category.slug] || []);
    const seen = new Set(category.subcategories.map((subcategory) => subcategory.slug));
    const customSubcategories = additions.filter((subcategory) => subcategory && typeof subcategory.name === 'string' && typeof subcategory.slug === 'string');
    const combinedSubcategories = [
      ...category.subcategories,
      ...customSubcategories.filter((subcategory) => {
        if (seen.has(subcategory.slug)) return false;
        seen.add(subcategory.slug);
        return true;
      }),
    ].filter((subcategory) => !deletedSubcategories.has(subcategory.slug));
    return {
      ...category,
      isCustom: category.id.startsWith('custom-'),
      customSubcategorySlugs: customSubcategories.map((subcategory) => subcategory.slug).filter((slug) => !deletedSubcategories.has(slug)),
      subcategories: combinedSubcategories,
    };
  });
}
