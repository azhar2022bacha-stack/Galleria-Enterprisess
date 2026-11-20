import { getStoreCategories, readStoreCategoryOverrides, writeStoreCategoryOverrides } from '@/lib/storeCategoriesServer';
import {
  readStorehouseProductFeedCategories,
  readStorehouseProductFeedCategoryOverrides,
  writeStorehouseProductFeedCategoryOverrides,
} from '@/lib/storehouseProductFeedCategoriesServer';
import { withProductFeedCategoryWrite } from '@/lib/productFeedCategoryStorage';
import { findProductFeedTaxonomy, normalizeProductFeedKey, type ProductFeedCategory } from '@/lib/productFeed';
import { catalogCategoryName, catalogCategorySlug, isReplacementCatalogCategory } from '@/data/catalogCategoryReplacements';
import { BASE_STORE_CATEGORIES } from '@/data/storeCategories';
import { STOREHOUSE_IMPORT_CATEGORIES } from '@/data/storehouseImportCategories';

type CategoryInput = {
  kind?: unknown;
  name?: unknown;
  names?: unknown;
  categorySlug?: unknown;
  categoryName?: unknown;
  subcategorySlug?: unknown;
  subcategoryName?: unknown;
};

const text = (value: unknown) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
const slugify = (value: string) => normalizeProductFeedKey(value).replaceAll(' ', '-').slice(0, 80).replace(/-+$/, '');

export function readProductFeedCategoryLists() {
  return { mainStoreCategories: getStoreCategories(), storehouseCategories: readStorehouseProductFeedCategories() };
}

export function updateProductFeedCategoriesEverywhere(action: 'add' | 'delete', input: CategoryInput) {
  return withProductFeedCategoryWrite(() => {
    if (input.kind !== 'category' && input.kind !== 'subcategory') throw new Error('Choose a category or subcategory.');
    const kind = input.kind;
    const { mainStoreCategories, storehouseCategories } = readProductFeedCategoryLists();
    const previousMain = readStoreCategoryOverrides();
    const main = structuredClone(previousMain);
    const storehouse = readStorehouseProductFeedCategoryOverrides();
    const find = (categories: ProductFeedCategory[]) => findProductFeedTaxonomy(categories, text(input.categorySlug))
      ?? findProductFeedTaxonomy(categories, text(input.categoryName));
    const mainParent = find(mainStoreCategories);
    const storehouseParent = find(storehouseCategories);

    if (action === 'delete') {
      const category = mainParent ?? storehouseParent;
      if (!category) throw new Error('Category was not found. Refresh and try again.');
      const findChild = (parent: ProductFeedCategory | undefined) => parent && (
        findProductFeedTaxonomy(parent.subcategories, text(input.subcategorySlug))
        ?? findProductFeedTaxonomy(parent.subcategories, text(input.subcategoryName))
      );
      const mainChild = findChild(mainParent);
      const storehouseChild = findChild(storehouseParent);
      const child = mainChild ?? storehouseChild;
      if (kind === 'subcategory' && !child) throw new Error('Subcategory was not found. Refresh and try again.');
      for (const [overrides, parent, subcategory] of [
        [main, mainParent, mainChild], [storehouse, storehouseParent, storehouseChild],
      ] as const) {
        const categorySlug = parent?.slug ?? category.slug;
        if (kind === 'category') {
          overrides.deletedCategories = [...new Set([...overrides.deletedCategories, categorySlug])];
        } else if (child) {
          const previous = ownSubcategories(overrides.deletedSubcategories, categorySlug);
          Object.defineProperty(overrides.deletedSubcategories, categorySlug, {
            value: [...new Set([...previous, child.slug, subcategory?.slug ?? child.slug])], enumerable: true, configurable: true, writable: true,
          });
        }
      }
    } else {
      const names = kind === 'subcategory' && Array.isArray(input.names) ? input.names.map(text) : [text(input.name)];
      const additions = names.map((name) => ({ name, slug: slugify(name) }));
      if (!additions.length || additions.length > 50 || additions.some(({ name, slug }) => name.length < 2 || name.length > 60 || !slug)) {
        throw new Error('Enter between 1 and 50 names with 2 to 60 characters each.');
      }
      if (new Set(additions.map(({ slug }) => slug)).size !== additions.length) throw new Error('Remove duplicate names before saving.');

      const addedCategory = { slug: catalogCategorySlug(additions[0].slug), name: catalogCategoryName(additions[0].slug, additions[0].name) };
      const category = kind === 'category' ? addedCategory : mainParent ?? storehouseParent;
      if (!category) throw new Error('Choose an existing parent category.');
      const existingMain = kind === 'category' ? findProductFeedTaxonomy(mainStoreCategories, category.slug) : mainParent;
      const existingSeller = kind === 'category' ? findProductFeedTaxonomy(storehouseCategories, category.slug) : storehouseParent;
      if (kind === 'category' && existingMain && existingSeller) throw new Error(`Category “${category.name}” already exists in all catalogs.`);
      if (kind === 'subcategory' && existingMain && existingSeller && additions.every(({ name }) => (
        findProductFeedTaxonomy(existingMain.subcategories, name) && findProductFeedTaxonomy(existingSeller.subcategories, name)
      ))) throw new Error('These subcategories already exist in all catalogs.');

      const mainSlug = existingMain?.slug ?? category.slug;
      const sellerSlug = existingSeller?.slug ?? category.slug;
      if (!existingMain && !isReplacementCatalogCategory(mainSlug)
        && ![...main.categories, ...BASE_STORE_CATEGORIES].some(({ slug }) => slug === mainSlug)) {
        main.categories.push({ name: category.name, slug: mainSlug, id: `custom-${mainSlug}`, subcategories: [] });
      }
      if (!existingSeller && !isReplacementCatalogCategory(sellerSlug)
        && ![...storehouse.categories, ...STOREHOUSE_IMPORT_CATEGORIES].some(({ slug }) => slug === sellerSlug)) {
        storehouse.categories.push({ name: category.name, slug: sellerSlug, id: `feed-${sellerSlug}` });
      }
      main.deletedCategories = main.deletedCategories.filter((slug) => slug !== mainSlug);
      storehouse.deletedCategories = storehouse.deletedCategories.filter((slug) => slug !== sellerSlug);

      if (kind === 'subcategory') {
        for (const [overrides, parent, slug] of [[main, existingMain, mainSlug], [storehouse, existingSeller, sellerSlug]] as const) {
          const saved = ownSubcategories(overrides.subcategories, slug);
          const added = additions.filter((item) => !findProductFeedTaxonomy(parent?.subcategories ?? [], item.name)
            && !saved.some(({ slug }) => slug === item.slug));
          Object.defineProperty(overrides.subcategories, slug, {
            value: [...saved, ...added], enumerable: true, configurable: true, writable: true,
          });
          const removed = ownSubcategories(overrides.deletedSubcategories, slug);
          Object.defineProperty(overrides.deletedSubcategories, slug, {
            value: removed.filter((removedSlug) => !additions.some((item) => item.slug === removedSlug)), enumerable: true, configurable: true, writable: true,
          });
        }
      }
    }

    writeStoreCategoryOverrides(main);
    try {
      writeStorehouseProductFeedCategoryOverrides(storehouse);
    } catch (error) {
      writeStoreCategoryOverrides(previousMain);
      throw error;
    }
    return readProductFeedCategoryLists();
  });
}

function ownSubcategories<T>(values: Record<string, T[]>, slug: string): T[] {
  return Object.hasOwn(values, slug) ? values[slug] : [];
}
