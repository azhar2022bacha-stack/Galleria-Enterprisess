import type {
  StorehouseCategoryAddition,
  StorehouseProductFamily,
} from './storehouseCategoryAdditions';

export const BEAUTY_SUBCATEGORIES = [
  'Foundation & Face Makeup',
  'Moisturizers',
  'Hair Styling Products',
  'Bath & Body',
  'Personal Care & Hygiene',
  'Men’s Perfumes',
  'Lipsticks',
  'Eye Makeup',
  'Makeup Tools',
  'Face Wash',
  'Serums',
  'Sunscreens',
  'Shampoos',
  'Hair Oils',
  'Hair Tools',
] as const;

const categoryCodes = [
  'BFAC', 'BMOI', 'BHSP', 'BBTH', 'BHYI', 'BPER', 'BLIP', 'BEYE',
  'BMTO', 'BFWA', 'BSER', 'BSUN', 'BSHM', 'BHOI', 'BHTL',
];

// These categories intentionally contain no generated sample records. Only
// genuine catalog imports should populate their Seller Storehouse listings.
export const BEAUTY_CATALOG_FAMILIES: StorehouseProductFamily[] = [];
export const BEAUTY_CATALOG_PRODUCT_COUNT = 0;

export const BEAUTY_CATALOG_CATEGORIES: StorehouseCategoryAddition[] = BEAUTY_SUBCATEGORIES.map(
  (name, index) => ({
    id: `cat-${34 + index}`,
    name,
    slug: name.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    code: categoryCodes[index],
    subcategories: [name],
    palette: ['Pearl', 'Rose', 'Berry', 'Ivory', 'Coral', 'Sage', 'Plum', 'Sand', 'Aqua', 'Champagne'],
    variants: ['Daily Care', 'Sensitive Skin', 'Professional', 'Travel Size', 'Premium'],
    families: [],
  })
);
