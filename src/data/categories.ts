import { CategoryDefinition } from '@/types/product';
import {
  EXPANSION_CATEGORY_RANGES,
  STOREHOUSE_CATEGORY_ADDITIONS,
} from './storehouseCategoryAdditions';
import {
  FOOD_CATEGORY_NAMES,
  STOREHOUSE_CATEGORY_COUNTS,
  TOTAL_STOREHOUSE_PRODUCTS,
} from './storehouseCatalogRules';

export const DEMO_TOTAL_PRODUCTS = TOTAL_STOREHOUSE_PRODUCTS;

export const CATEGORIES: CategoryDefinition[] = [
  {
    "id": "cat-1",
    "name": "Vitamins & Supplements",
    "slug": "vitamins-supplements",
    "code": "VITA",
    "subcategories": [
      "Immune Support Vitamins",
      "Bone & Immune Health",
      "Plant Protein & Nutrition",
      "Sports Nutrition & Muscle",
      "Collagen & Anti-Aging",
      "Hair, Skin & Nails",
      "Herbal & Stress Support",
      "Bone & Muscle Support",
      "Omega & Fish Oils",
      "Essential Minerals",
      "Heart & Cardiovascular",
      "Digestive Health & Probiotics"
    ],
    "itemCount": 13
  },
  {
    "id": "cat-3",
    "name": "Furniture & Decor",
    "slug": "furniture-decor",
    "code": "FURN",
    "subcategories": [
      "Modern Living Furniture",
      "Home Decor & Lighting"
    ],
    "itemCount": 10
  },
  {
    "id": "cat-4",
    "name": "Grocery & Essentials",
    "slug": "grocery-essentials",
    "code": "GROC",
    "subcategories": [
      "Pantry & Gourmet Foods"
    ],
    "itemCount": 27
  },
  {
    "id": "cat-5",
    "name": "Home & Kitchen",
    "slug": "home-kitchen",
    "code": "HOME",
    "subcategories": [
      "Cookware & Chef Essentials"
    ],
    "itemCount": 30
  },
  {
    "id": "cat-6",
    "name": "Computers & Technology",
    "slug": "computers-technology",
    "code": "COMP",
    "subcategories": [
      "Laptops & Ultrabooks",
      "Tablets & Displays",
      "Storage & Monitors"
    ],
    "itemCount": 14
  },
  {
    "id": "cat-7",
    "name": "Clothing & Apparel",
    "slug": "clothing-apparel",
    "code": "CLOT",
    "subcategories": [
      "Men's Shirts & Polos",
      "Casual Tops & Sweaters",
      "Women's Dresses & Outfits",
      "Men's Casual Wear",
      "Women's Fashion"
    ],
    "itemCount": 24
  },
  {
    "id": "cat-8",
    "name": "Shoes & Footwear",
    "slug": "shoes-footwear",
    "code": "SHOE",
    "subcategories": [
      "Men's Sneakers & Oxfords",
      "Women's Shoes & Heels"
    ],
    "itemCount": 10
  },
  {
    "id": "cat-9",
    "name": "Watches & Jewelry",
    "slug": "watches-jewelry",
    "code": "WATC",
    "subcategories": [
      "Men's Chronograph Watches",
      "Fine Jewelry & Necklaces",
      "Women's Minimalist Watches",
      "Luxury Jewelry"
    ],
    "itemCount": 18
  },
  {
    "id": "cat-10",
    "name": "Smartphones & Mobile",
    "slug": "smartphones-mobile",
    "code": "SMAR",
    "subcategories": [
      "Mobile Accessories & Chargers",
      "Flagship Smartphones"
    ],
    "itemCount": 30
  },
  {
    "id": "cat-11",
    "name": "Automotive & Tools",
    "slug": "automotive-tools",
    "code": "AUTO",
    "subcategories": [
      "Motorcycle & Riding Gear",
      "Car Care & Detailing"
    ],
    "itemCount": 10
  },
  {
    "id": "cat-12",
    "name": "Sports & Outdoors",
    "slug": "sports-outdoors",
    "code": "SPOR",
    "subcategories": [
      "Fitness & Sports Gear"
    ],
    "itemCount": 17
  },
  {
    "id": "cat-13",
    "name": "Bags & Accessories",
    "slug": "bags-accessories",
    "code": "BAGS",
    "subcategories": [
      "Designer Sunglasses",
      "Handbags & Totes"
    ],
    "itemCount": 11
  },
  {
    "id": "cat-14",
    "name": "Books & Stationery",
    "slug": "books-stationery",
    "code": "BOOK",
    "subcategories": [
      "Journals & Planners",
      "Writing Instruments",
      "Art Supplies"
    ],
    "itemCount": 6
  },
  {
    "id": "cat-15",
    "name": "Pet Supplies",
    "slug": "pet-supplies",
    "code": "PET",
    "subcategories": [
      "Pet Beds & Furniture",
      "Feeding & Water",
      "Pet Toys"
    ],
    "itemCount": 4
  },
  {
    "id": "cat-16",
    "name": "Garden & Tools",
    "slug": "garden-tools",
    "code": "GARD",
    "subcategories": [
      "Power Tools",
      "Hand Tools",
      "Outdoor Lighting",
      "Garden Equipment"
    ],
    "itemCount": 4
  },
  {
    "id": "cat-17",
    "name": "Baby Products",
    "slug": "baby-products",
    "code": "BABY",
    "subcategories": [
      "Feeding & Nursing",
      "Nursery & Swaddles",
      "Car Seats & Travel",
      "Carriers & Wraps"
    ],
    "itemCount": 4
  },
  {
    "id": "cat-18",
    "name": "Toys & Games",
    "slug": "toys-games",
    "code": "TOYS",
    "subcategories": [
      "Building Sets",
      "Board Games",
      "Puzzles",
      "Remote Control & Drones"
    ],
    "itemCount": 4
  },
  {
    "id": "cat-19",
    "name": "Travel Accessories",
    "slug": "travel-accessories",
    "code": "TRAV",
    "subcategories": [
      "Luggage & Suitcases",
      "Travel Electronics",
      "Packing Organizers",
      "Travel Comfort"
    ],
    "itemCount": 4
  },
  ...STOREHOUSE_CATEGORY_ADDITIONS.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    code: category.code,
    subcategories: category.subcategories,
    itemCount: EXPANSION_CATEGORY_RANGES[category.id].count,
    catalogProductCount: EXPANSION_CATEGORY_RANGES[category.id].count,
  })),
]
  .filter((category) => !FOOD_CATEGORY_NAMES.some((foodCategory) => foodCategory === category.name))
  .map((category) => ({
    ...category,
    catalogProductCount: STOREHOUSE_CATEGORY_COUNTS[category.name]
      ?? ('catalogProductCount' in category ? category.catalogProductCount : undefined)
      ?? 0,
  }));
