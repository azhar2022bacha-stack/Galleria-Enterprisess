import { CATEGORIES } from './categories';
import IMPORT_CATEGORY_NAMES from './storehouseImportCategoryNames.json';

export const STOREHOUSE_IMPORT_TARGET_PER_CATEGORY = 300;

export const STOREHOUSE_IMPORT_CATEGORIES = IMPORT_CATEGORY_NAMES.map((name) =>
  CATEGORIES.find((category) => category.name === name)
).filter((category): category is (typeof CATEGORIES)[number] => Boolean(category));

export const STOREHOUSE_IMPORT_TARGET_TOTAL =
  STOREHOUSE_IMPORT_CATEGORIES.length * STOREHOUSE_IMPORT_TARGET_PER_CATEGORY;
