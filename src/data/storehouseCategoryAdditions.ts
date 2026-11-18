import { CURATED_BASE_PRODUCTS } from './curatedProducts';
import { BEAUTY_CATALOG_CATEGORIES } from './beautyCatalog';

export interface StorehouseProductFamily {
  title: string;
  imageBaseProductId: string;
  basePrice: number;
  material: string;
  image?: string;
  brand?: string;
  subcategory?: string;
  description?: string;
}

export interface StorehouseCategoryAddition {
  id: string;
  name: string;
  slug: string;
  code: string;
  subcategories: string[];
  palette: string[];
  variants: string[];
  families: StorehouseProductFamily[];
}

const colors = ['Black', 'Ivory', 'Navy', 'Sage', 'Rose', 'Sand', 'Charcoal', 'Sky Blue', 'Burgundy', 'Olive'];

export const STOREHOUSE_CATEGORY_ADDITIONS: StorehouseCategoryAddition[] = [
  {
    id: 'cat-20', name: 'Men’s Clothing', slug: 'mens-clothing', code: 'MCLT',
    subcategories: ["Men's Shirts & Polos", "Men's Casual Wear", "Trousers & Chinos", "Knitwear", "Jackets & Outerwear"],
    palette: colors, variants: ['Classic Fit', 'Relaxed Fit', 'Tailored Fit'],
    families: [
      { title: 'Oxford Cotton Button-Down Shirt', imageBaseProductId: 'base-dj-83', basePrice: 34, material: 'Cotton Oxford' },
      { title: 'Everyday Piqué Polo Shirt', imageBaseProductId: 'base-fs-2', basePrice: 29, material: 'Cotton Piqué' },
      { title: 'Heritage Plaid Casual Shirt', imageBaseProductId: 'base-dj-85', basePrice: 38, material: 'Brushed Cotton' },
      { title: 'Lightweight Canvas Field Jacket', imageBaseProductId: 'base-fs-3', basePrice: 78, material: 'Cotton Canvas' },
      { title: 'Soft Cotton Crewneck Tee', imageBaseProductId: 'base-dj-84', basePrice: 22, material: 'Combed Cotton' },
      { title: 'Long-Sleeve Henley Shirt', imageBaseProductId: 'base-fs-4', basePrice: 32, material: 'Cotton Jersey' },
      { title: 'Short-Sleeve Resort Shirt', imageBaseProductId: 'base-dj-86', basePrice: 31, material: 'Lightweight Cotton' },
      { title: 'Classic Check Button-Down', imageBaseProductId: 'base-dj-87', basePrice: 36, material: 'Cotton Poplin' },
      { title: 'Weekend Knit Pullover', imageBaseProductId: 'base-fs-2', basePrice: 45, material: 'Cotton Knit' },
      { title: 'Modern Casual Overshirt', imageBaseProductId: 'base-dj-85', basePrice: 49, material: 'Cotton Twill' },
    ],
  },
  {
    id: 'cat-21', name: 'Women’s Clothing', slug: 'womens-clothing', code: 'WCLT',
    subcategories: ['Dresses & Outfits', 'Tops & Blouses', 'Trousers & Skirts', 'Knitwear', 'Outerwear'],
    palette: colors, variants: ['Everyday', 'Weekend', 'Occasion'],
    families: [
      { title: 'Printed Summer Midi Dress', imageBaseProductId: 'base-dj-163', basePrice: 54, material: 'Lightweight Cotton' },
      { title: 'Soft Drape Evening Gown', imageBaseProductId: 'base-dj-177', basePrice: 96, material: 'Drape Crepe' },
      { title: 'Classic Long-Sleeve Blouse', imageBaseProductId: 'base-fs-18', basePrice: 39, material: 'Viscose Blend' },
      { title: 'Modern Wrap-Front Dress', imageBaseProductId: 'base-dj-180', basePrice: 68, material: 'Textured Crepe' },
      { title: 'Relaxed Cotton Tunic Top', imageBaseProductId: 'base-dj-162', basePrice: 42, material: 'Cotton Lawn' },
      { title: 'Tailored Everyday Jacket', imageBaseProductId: 'base-fs-16', basePrice: 74, material: 'Soft Faux Leather' },
      { title: 'Pleated Occasion Dress', imageBaseProductId: 'base-dj-181', basePrice: 88, material: 'Structured Crepe' },
      { title: 'Striped Lightweight Shirt', imageBaseProductId: 'base-fs-17', basePrice: 46, material: 'Breathable Cotton' },
      { title: 'A-Line Printed Frock', imageBaseProductId: 'base-dj-165', basePrice: 52, material: 'Cotton Blend' },
      { title: 'Soft Layering Cardigan', imageBaseProductId: 'base-fs-15', basePrice: 62, material: 'Knit Blend' },
    ],
  },
  {
    id: 'cat-22', name: 'Baby Clothing', slug: 'baby-clothing', code: 'BCLT',
    subcategories: ['Bodysuits & Vests', 'Rompers & Sleepsuits', 'Baby Sets', 'Infant Dresses', 'Newborn Essentials'],
    palette: ['Cloud White', 'Powder Blue', 'Blush', 'Buttercream', 'Sage', 'Lilac', 'Oatmeal', 'Soft Rose', 'Sky', 'Mint'],
    variants: ['Newborn', '0–3 Months', '3–6 Months'],
    families: [
      { title: 'Organic Cotton Baby Bodysuit', imageBaseProductId: 'base-dj-162', basePrice: 16, material: 'Cotton Jersey' },
      { title: 'Cozy Footed Sleepsuit', imageBaseProductId: 'base-dj-163', basePrice: 24, material: 'Soft Cotton Interlock' },
      { title: 'Everyday Baby Romper', imageBaseProductId: 'base-dj-164', basePrice: 22, material: 'Breathable Cotton' },
      { title: 'Newborn Coming-Home Set', imageBaseProductId: 'base-baby-2', basePrice: 34, material: 'Cotton Muslin' },
      { title: 'Little Day-Out Dress', imageBaseProductId: 'base-dj-166', basePrice: 28, material: 'Soft Cotton Blend' },
      { title: 'Two-Piece Baby Lounge Set', imageBaseProductId: 'base-dj-165', basePrice: 26, material: 'Cotton Jersey' },
      { title: 'Gentle Everyday Vest Set', imageBaseProductId: 'base-dj-162', basePrice: 19, material: 'Combed Cotton' },
      { title: 'Soft Knit Baby Cardigan Set', imageBaseProductId: 'base-dj-163', basePrice: 32, material: 'Cotton Knit' },
      { title: 'Printed Baby Playsuit', imageBaseProductId: 'base-dj-164', basePrice: 23, material: 'Lightweight Cotton' },
      { title: 'Muslin Swaddle and Hat Set', imageBaseProductId: 'base-baby-2', basePrice: 29, material: 'Cotton Muslin' },
    ],
  },
  {
    id: 'cat-23', name: "Men's Kurtas & Shalwar Kameez", slug: 'mens-kurtas-shalwar-kameez', code: 'KURT',
    subcategories: ["Men's Kurtas", 'Shalwar Kameez Sets', 'Waistcoats', 'Festive Wear', 'Casual Eastern Wear'],
    palette: ['White', 'Black', 'Navy', 'Cream', 'Olive', 'Maroon', 'Sand', 'Charcoal', 'Sky Blue', 'Forest Green'],
    variants: ['Classic Cut', 'Modern Cut', 'Festive Cut'],
    families: [
      { title: 'Premium Cotton Kurta', imageBaseProductId: 'base-dj-83', basePrice: 42, material: 'Cotton' },
      { title: 'Embroidered Festive Kurta', imageBaseProductId: 'base-dj-85', basePrice: 68, material: 'Textured Cotton' },
      { title: 'Classic Shalwar Kameez Set', imageBaseProductId: 'base-fs-4', basePrice: 74, material: 'Cotton Blend' },
      { title: 'Lightweight Summer Kurta', imageBaseProductId: 'base-dj-86', basePrice: 39, material: 'Cotton Lawn' },
      { title: 'Formal Collar Kurta', imageBaseProductId: 'base-dj-87', basePrice: 54, material: 'Cotton Poplin' },
      { title: 'Textured Waistcoat', imageBaseProductId: 'base-fs-3', basePrice: 82, material: 'Cotton Twill' },
      { title: 'Long-Sleeve Everyday Kurta', imageBaseProductId: 'base-dj-83', basePrice: 46, material: 'Soft Cotton' },
      { title: 'Jacquard Occasion Kameez', imageBaseProductId: 'base-dj-85', basePrice: 78, material: 'Jacquard Blend' },
      { title: 'Relaxed Fit Kurta Pajama', imageBaseProductId: 'base-fs-2', basePrice: 69, material: 'Cotton Jersey' },
      { title: 'Premium Two-Piece Eastern Set', imageBaseProductId: 'base-dj-86', basePrice: 88, material: 'Cotton Blend' },
    ],
  },
  {
    id: 'cat-24', name: "Woman's Nightwear", slug: 'womans-nightwear', code: 'NITE',
    subcategories: ['Nightdresses', 'Pajama Sets', 'Robes & Dressing Gowns', 'Loungewear', 'Sleep Shorts'],
    palette: ['Midnight', 'Rose', 'Ivory', 'Sage', 'Lavender', 'Pearl', 'Navy', 'Blush', 'Teal', 'Mauve'],
    variants: ['Short Sleeve', 'Long Sleeve', 'Relaxed Fit'],
    families: [
      { title: 'Soft Cotton Nightdress', imageBaseProductId: 'base-dj-180', basePrice: 34, material: 'Cotton Jersey' },
      { title: 'Satin Pajama Set', imageBaseProductId: 'base-dj-177', basePrice: 58, material: 'Satin Touch' },
      { title: 'Lightweight Button-Front Nightshirt', imageBaseProductId: 'base-dj-163', basePrice: 38, material: 'Cotton Poplin' },
      { title: 'Relaxed Lounge Co-Ord Set', imageBaseProductId: 'base-fs-18', basePrice: 52, material: 'Viscose Blend' },
      { title: 'Soft Wrap Dressing Gown', imageBaseProductId: 'base-dj-181', basePrice: 64, material: 'Brushed Knit' },
      { title: 'Printed Sleep Top and Shorts', imageBaseProductId: 'base-dj-162', basePrice: 42, material: 'Cotton Jersey' },
      { title: 'Long Sleeve Lounge Set', imageBaseProductId: 'base-fs-20', basePrice: 56, material: 'Cotton Modal' },
      { title: 'Modal Everyday Pajama Set', imageBaseProductId: 'base-dj-164', basePrice: 49, material: 'Modal Blend' },
      { title: 'Soft Knit Sleep Shirt', imageBaseProductId: 'base-dj-165', basePrice: 36, material: 'Cotton Knit' },
      { title: 'Premium Robe and Nightdress Set', imageBaseProductId: 'base-dj-179', basePrice: 78, material: 'Satin Blend' },
    ],
  },
  {
    id: 'cat-25', name: 'Sunglasses & Eyewear', slug: 'sunglasses-eyewear', code: 'EYEW',
    subcategories: ['Sunglasses', 'Optical Frames', 'Reading Glasses', 'Sports Eyewear', 'Kids Eyewear'],
    palette: ['Black', 'Tortoise', 'Silver', 'Gold', 'Smoke', 'Olive', 'Clear', 'Navy', 'Rose Gold', 'Burgundy'],
    variants: ['Classic Frame', 'Slim Frame', 'Statement Frame'],
    families: [
      { title: 'Classic Square Sunglasses', imageBaseProductId: 'base-dj-154', basePrice: 28, material: 'Acetate' },
      { title: 'Round Optical Glasses', imageBaseProductId: 'base-dj-155', basePrice: 36, material: 'Lightweight Acetate' },
      { title: 'Modern Aviator Sunglasses', imageBaseProductId: 'base-dj-156', basePrice: 42, material: 'Metal Alloy' },
      { title: 'Everyday Reading Glasses', imageBaseProductId: 'base-dj-158', basePrice: 22, material: 'TR90 Frame' },
      { title: 'Color Pop Party Eyewear', imageBaseProductId: 'base-dj-157', basePrice: 18, material: 'Lightweight Polymer' },
      { title: 'Slim Rectangle Optical Frame', imageBaseProductId: 'base-dj-155', basePrice: 34, material: 'Acetate Blend' },
      { title: 'Polarized Weekend Sunglasses', imageBaseProductId: 'base-dj-154', basePrice: 49, material: 'Metal and Acetate' },
      { title: 'Minimal Round Sunglasses', imageBaseProductId: 'base-dj-158', basePrice: 32, material: 'Stainless Steel' },
      { title: 'Sport Wrap Eyewear', imageBaseProductId: 'base-dj-156', basePrice: 39, material: 'Flexible Polymer' },
      { title: 'Retro Cat-Eye Sunglasses', imageBaseProductId: 'base-dj-157', basePrice: 35, material: 'Acetate' },
    ],
  },
  {
    id: 'cat-26', name: 'Accessories', slug: 'accessories', code: 'ACCS',
    subcategories: ['Fashion Jewelry', 'Watches', 'Belts & Wallets', 'Hair Accessories', 'Everyday Accessories'],
    palette: ['Gold', 'Silver', 'Rose Gold', 'Black', 'Champagne', 'Pearl', 'Bronze', 'Navy', 'Green', 'Clear'],
    variants: ['Polished Finish', 'Matte Finish', 'Gift Edition'],
    families: [
      { title: 'Minimal Pendant Necklace', imageBaseProductId: 'base-dj-182', basePrice: 34, material: 'Alloy and Crystal' },
      { title: 'Classic Leather Strap Watch', imageBaseProductId: 'base-dj-93', basePrice: 79, material: 'Stainless Steel and Leather' },
      { title: 'Everyday Crystal Earrings', imageBaseProductId: 'base-dj-183', basePrice: 26, material: 'Alloy and Crystal' },
      { title: 'Modern Mesh Wristwatch', imageBaseProductId: 'base-dj-191', basePrice: 88, material: 'Stainless Steel' },
      { title: 'Classic Jewelry Gift Set', imageBaseProductId: 'base-fs-8', basePrice: 56, material: 'Stainless Steel' },
      { title: 'Oval Stone Stud Earrings', imageBaseProductId: 'base-dj-184', basePrice: 29, material: 'Alloy and Crystal' },
      { title: 'Slim Everyday Belt', imageBaseProductId: 'base-dj-94', basePrice: 32, material: 'Leather Blend' },
      { title: 'Minimal Gold-Tone Watch', imageBaseProductId: 'base-dj-193', basePrice: 96, material: 'Stainless Steel' },
      { title: 'Classic Pendant Bracelet', imageBaseProductId: 'base-fs-5', basePrice: 62, material: 'Stainless Steel' },
      { title: 'Polished Signet Ring', imageBaseProductId: 'base-fs-6', basePrice: 48, material: 'Gold-Tone Alloy' },
    ],
  },
  {
    id: 'cat-27', name: 'Unstitched Fabric', slug: 'unstitched-fabric', code: 'UFAB',
    subcategories: ['Lawn', 'Cotton', 'Chiffon', 'Silk & Organza', 'Winter Fabrics'],
    palette: ['Ivory', 'Indigo', 'Rose', 'Sage', 'Sand', 'Maroon', 'Sky Blue', 'Charcoal', 'Lilac', 'Teal'],
    variants: ['Printed Design', 'Embroidered Border', 'Classic Solid'],
    families: [
      { title: 'Printed Cotton Lawn Suit Fabric', imageBaseProductId: 'base-dj-163', basePrice: 34, material: 'Cotton Lawn' },
      { title: 'Premium Cambric Unstitched Set', imageBaseProductId: 'base-dj-164', basePrice: 39, material: 'Cambric Cotton' },
      { title: 'Soft Chiffon Fabric Set', imageBaseProductId: 'base-dj-177', basePrice: 58, material: 'Chiffon Blend' },
      { title: 'Embroidered Lawn Three-Piece', imageBaseProductId: 'base-dj-181', basePrice: 76, material: 'Cotton Lawn' },
      { title: 'Classic Khaddar Winter Suit Fabric', imageBaseProductId: 'base-dj-165', basePrice: 49, material: 'Khaddar Cotton' },
      { title: 'Silk-Touch Occasion Fabric Set', imageBaseProductId: 'base-dj-179', basePrice: 92, material: 'Silk Blend' },
      { title: 'Printed Voile Unstitched Suit', imageBaseProductId: 'base-dj-162', basePrice: 36, material: 'Cotton Voile' },
      { title: 'Jacquard Festive Fabric Set', imageBaseProductId: 'base-dj-178', basePrice: 84, material: 'Jacquard Blend' },
      { title: 'Lightweight Cambric Two-Piece', imageBaseProductId: 'base-dj-166', basePrice: 32, material: 'Cambric Cotton' },
      { title: 'Premium Organza Occasion Fabric', imageBaseProductId: 'base-dj-180', basePrice: 99, material: 'Organza Blend' },
    ],
  },
  {
    id: 'cat-28', name: 'Muslim Wear', slug: 'muslim-wear', code: 'MUSL',
    subcategories: ['Abayas & Jilbabs', 'Hijabs & Khimars', 'Prayer Wear', 'Thobes & Jubbas', 'Modest Sets'],
    palette: ['Black', 'Ivory', 'Stone', 'Navy', 'Olive', 'Mocha', 'Sand', 'Charcoal', 'Plum', 'Forest Green'],
    variants: ['Everyday Style', 'Classic Style', 'Occasion Style'],
    families: [
      { title: 'Flowing Everyday Abaya', imageBaseProductId: 'base-dj-177', basePrice: 68, material: 'Nida Crepe' },
      { title: 'Lightweight Cotton Hijab', imageBaseProductId: 'base-dj-163', basePrice: 18, material: 'Cotton Voile' },
      { title: 'Modest Longline Tunic Set', imageBaseProductId: 'base-dj-162', basePrice: 54, material: 'Soft Cotton Blend' },
      { title: 'Classic Thobe', imageBaseProductId: 'base-dj-83', basePrice: 62, material: 'Cotton Poplin' },
      { title: 'Embroidered Occasion Abaya', imageBaseProductId: 'base-dj-181', basePrice: 98, material: 'Crepe with Embroidery' },
      { title: 'Everyday Prayer Garment', imageBaseProductId: 'base-dj-164', basePrice: 42, material: 'Breathable Cotton' },
      { title: 'Soft Jersey Khimar', imageBaseProductId: 'base-fs-18', basePrice: 28, material: 'Cotton Jersey' },
      { title: 'Modern Jubba Set', imageBaseProductId: 'base-dj-85', basePrice: 78, material: 'Cotton Blend' },
      { title: 'Open-Front Modest Layer', imageBaseProductId: 'base-fs-16', basePrice: 72, material: 'Soft Drape Blend' },
      { title: 'Festive Modest Dress', imageBaseProductId: 'base-dj-180', basePrice: 86, material: 'Textured Crepe' },
    ],
  },
  {
    id: 'cat-29', name: 'Gift & Customize Products', slug: 'gift-customize-products', code: 'GIFT',
    subcategories: ['Personalized Gifts', 'Gift Sets', 'Custom Homeware', 'Engraved Accessories', 'Packaging & Cards'],
    palette: ['Classic Black', 'Ivory', 'Gold', 'Silver', 'Rose', 'Navy', 'Sage', 'Blush', 'Walnut', 'Pearl'],
    variants: ['Personalized Edition', 'Premium Gift Box', 'Classic Edition'],
    families: [
      { title: 'Personalized Keepsake Notebook', imageBaseProductId: 'base-book-1', basePrice: 28, material: 'Hardcover Paper' },
      { title: 'Custom Message Gift Journal', imageBaseProductId: 'base-book-4', basePrice: 32, material: 'Textured Hardcover' },
      { title: 'Engraved-Style Gift Pen Set', imageBaseProductId: 'base-book-2', basePrice: 38, material: 'Metal and Lacquer' },
      { title: 'Minimal Jewelry Gift Box', imageBaseProductId: 'base-fs-8', basePrice: 46, material: 'Stainless Steel' },
      { title: 'Personalized Art Print Set', imageBaseProductId: 'base-book-3', basePrice: 35, material: 'Cotton Paper' },
      { title: 'Monogram Gift Keepsake', imageBaseProductId: 'base-fs-6', basePrice: 52, material: 'Gold-Tone Alloy' },
      { title: 'Celebration Gift Bundle', imageBaseProductId: 'base-dj-184', basePrice: 58, material: 'Gift-Ready Set' },
      { title: 'Custom Planner and Pen Set', imageBaseProductId: 'base-book-5', basePrice: 44, material: 'Paper and Stainless Steel' },
      { title: 'Personalized Travel Journal', imageBaseProductId: 'base-book-6', basePrice: 31, material: 'Hardcover Paper' },
      { title: 'Premium Occasion Gift Set', imageBaseProductId: 'base-dj-182', basePrice: 69, material: 'Gift-Ready Set' },
    ],
  },
  {
    id: 'cat-30', name: 'Party Supplies', slug: 'party-supplies', code: 'PART',
    subcategories: ['Party Decorations', 'Tableware', 'Balloon Kits', 'Party Favors', 'Celebration Accessories'],
    palette: ['Gold', 'Silver', 'Rose Gold', 'Black', 'White', 'Rainbow', 'Navy', 'Blush', 'Mint', 'Red'],
    variants: ['Small Set', 'Celebration Set', 'Premium Set'],
    families: [
      { title: 'Color Pop Celebration Eyewear', imageBaseProductId: 'base-dj-157', basePrice: 16, material: 'Lightweight Polymer' },
      { title: 'Party Favor Gift Pack', imageBaseProductId: 'base-dj-158', basePrice: 22, material: 'Assorted Party Set' },
      { title: 'Festive Tabletop Decoration Set', imageBaseProductId: 'base-toy-2', basePrice: 28, material: 'Paper and Card' },
      { title: 'Celebration Activity Bundle', imageBaseProductId: 'base-toy-3', basePrice: 24, material: 'Printed Cardstock' },
      { title: 'Statement Party Glasses Set', imageBaseProductId: 'base-dj-157', basePrice: 18, material: 'Lightweight Polymer' },
      { title: 'Premium Party Keepsake Pack', imageBaseProductId: 'base-toy-1', basePrice: 34, material: 'Paper and Wood' },
      { title: 'Colorful Celebration Accessory Kit', imageBaseProductId: 'base-dj-156', basePrice: 21, material: 'Assorted Party Set' },
      { title: 'Party Game Night Bundle', imageBaseProductId: 'base-toy-2', basePrice: 32, material: 'Printed Cardstock' },
      { title: 'Festive Table Accent Set', imageBaseProductId: 'base-toy-3', basePrice: 26, material: 'Paper and Card' },
      { title: 'Birthday Celebration Favor Set', imageBaseProductId: 'base-dj-157', basePrice: 19, material: 'Assorted Party Set' },
    ],
  },
  {
    id: 'cat-31', name: 'Women Bags', slug: 'women-bags', code: 'WBAG',
    subcategories: ['Handbags', 'Totes & Shoppers', 'Crossbody Bags', 'Clutches', 'Backpacks'],
    palette: ['Black', 'Tan', 'Cream', 'Burgundy', 'Navy', 'Blush', 'Sage', 'Cognac', 'Taupe', 'Red'],
    variants: ['Small', 'Medium', 'Large'],
    families: [
      { title: 'Structured Everyday Handbag', imageBaseProductId: 'base-dj-173', basePrice: 92, material: 'Vegan Leather' },
      { title: 'Soft Leather Shoulder Bag', imageBaseProductId: 'base-dj-174', basePrice: 128, material: 'Genuine Leather' },
      { title: 'Compact Crossbody Bag', imageBaseProductId: 'base-dj-172', basePrice: 68, material: 'Textured Faux Leather' },
      { title: 'Classic Canvas Shopper Tote', imageBaseProductId: 'base-fs-1', basePrice: 44, material: 'Canvas and Leather Trim' },
      { title: 'Minimal Evening Clutch', imageBaseProductId: 'base-dj-176', basePrice: 58, material: 'Faux Leather' },
      { title: 'Everyday Zip-Top Tote', imageBaseProductId: 'base-dj-175', basePrice: 72, material: 'Faux Leather' },
      { title: 'Compact Camera Crossbody', imageBaseProductId: 'base-dj-172', basePrice: 64, material: 'Vegan Leather' },
      { title: 'Modern City Backpack', imageBaseProductId: 'base-fs-1', basePrice: 84, material: 'Canvas' },
      { title: 'Soft Hobo Shoulder Bag', imageBaseProductId: 'base-dj-173', basePrice: 98, material: 'Textured Leather' },
      { title: 'Premium Top-Handle Bag', imageBaseProductId: 'base-dj-174', basePrice: 146, material: 'Genuine Leather' },
    ],
  },
  {
    id: 'cat-32', name: 'Dupattas Stoles & Shawls', slug: 'dupattas-stoles-shawls', code: 'DUPT',
    subcategories: ['Printed Dupattas', 'Embroidered Dupattas', 'Stoles', 'Shawls', 'Festive Wraps'],
    palette: ['Ivory', 'Indigo', 'Rose', 'Sage', 'Sand', 'Maroon', 'Sky Blue', 'Charcoal', 'Lilac', 'Teal'],
    variants: ['Lightweight', 'Embroidered Border', 'Festive Style'],
    families: [
      { title: 'Printed Cotton Dupatta', imageBaseProductId: 'base-dj-163', basePrice: 24, material: 'Cotton Voile' },
      { title: 'Embroidered Occasion Dupatta', imageBaseProductId: 'base-dj-181', basePrice: 48, material: 'Chiffon Blend' },
      { title: 'Lightweight Everyday Stole', imageBaseProductId: 'base-dj-162', basePrice: 22, material: 'Cotton Lawn' },
      { title: 'Soft Winter Shawl', imageBaseProductId: 'base-dj-164', basePrice: 56, material: 'Wool Blend' },
      { title: 'Festive Organza Wrap', imageBaseProductId: 'base-dj-180', basePrice: 62, material: 'Organza Blend' },
      { title: 'Classic Printed Lawn Dupatta', imageBaseProductId: 'base-dj-166', basePrice: 28, material: 'Cotton Lawn' },
      { title: 'Textured Evening Stole', imageBaseProductId: 'base-dj-177', basePrice: 42, material: 'Drape Crepe' },
      { title: 'Jacquard Border Shawl', imageBaseProductId: 'base-dj-178', basePrice: 68, material: 'Jacquard Blend' },
      { title: 'Soft Modal Scarf', imageBaseProductId: 'base-fs-18', basePrice: 32, material: 'Modal Blend' },
      { title: 'Embellished Celebration Wrap', imageBaseProductId: 'base-dj-179', basePrice: 74, material: 'Silk Blend' },
    ],
  },
  {
    id: 'cat-33', name: "Men's Accessories & Other", slug: 'mens-accessories-other', code: 'MACC',
    subcategories: ["Men's Watches", 'Belts & Wallets', 'Sunglasses', 'Ties & Cufflinks', 'Bags & Travel Accessories'],
    palette: ['Black', 'Brown', 'Silver', 'Gold', 'Navy', 'Tan', 'Gunmetal', 'Olive', 'Charcoal', 'Cognac'],
    variants: ['Classic Finish', 'Modern Finish', 'Gift Set'],
    families: [
      { title: 'Classic Leather Strap Watch', imageBaseProductId: 'base-dj-93', basePrice: 86, material: 'Stainless Steel and Leather' },
      { title: 'Minimal Stainless Steel Watch', imageBaseProductId: 'base-dj-94', basePrice: 112, material: 'Stainless Steel' },
      { title: 'Everyday Leather Belt', imageBaseProductId: 'base-dj-95', basePrice: 36, material: 'Leather Blend' },
      { title: 'Slim Card Holder Wallet', imageBaseProductId: 'base-dj-96', basePrice: 28, material: 'Vegan Leather' },
      { title: 'Modern Aviator Sunglasses', imageBaseProductId: 'base-dj-154', basePrice: 42, material: 'Metal Alloy' },
      { title: 'Textured Tie and Pocket Square Set', imageBaseProductId: 'base-dj-85', basePrice: 34, material: 'Woven Fabric' },
      { title: 'Polished Cufflink Set', imageBaseProductId: 'base-fs-5', basePrice: 46, material: 'Stainless Steel' },
      { title: 'Travel Organizer Wallet', imageBaseProductId: 'base-fs-1', basePrice: 39, material: 'Canvas and Leather Trim' },
      { title: 'Weekend Crossbody Bag', imageBaseProductId: 'base-dj-97', basePrice: 64, material: 'Textured Canvas' },
      { title: 'Slim Rectangle Sunglasses', imageBaseProductId: 'base-dj-158', basePrice: 35, material: 'Acetate Blend' },
    ],
  },
  ...BEAUTY_CATALOG_CATEGORIES,
];

export interface StorehouseCategoryProductSeed {
  category: StorehouseCategoryAddition;
  family: StorehouseProductFamily;
  familyIndex: number;
  mainImage: string;
  recordOffset: number;
}

export const LEGACY_PRODUCTS_PER_EXPANSION_CATEGORY = 300;

// Keep the seller catalog clear of placeholder listings for the 29 managed
// import categories. Verified rows are loaded from PostgreSQL after an admin
// import is completed.
for (const category of STOREHOUSE_CATEGORY_ADDITIONS) {
  const categoryNumber = Number(category.id.replace(/^cat-/, ''));
  if (categoryNumber >= 20 && categoryNumber <= 48) category.families = [];
}

const productCandidates = STOREHOUSE_CATEGORY_ADDITIONS.flatMap((category, categoryIndex) => {
  const seenImageProducts = new Set<string>();
  return category.families.flatMap((family, familyIndex) => {
    const imageKey = family.image ?? family.imageBaseProductId;
    if (seenImageProducts.has(imageKey)) return [];
    seenImageProducts.add(imageKey);
    const base = CURATED_BASE_PRODUCTS.find((product) => product.id === family.imageBaseProductId)
      ?? CURATED_BASE_PRODUCTS[0];
    return [{
      category,
      family,
      familyIndex,
      recordOffset: categoryIndex * LEGACY_PRODUCTS_PER_EXPANSION_CATEGORY + familyIndex,
      imageOptions: family.image
        ? [family.image]
        : (base.galleryImages.length > 0 ? base.galleryImages : [base.image]),
    }];
  });
});

const productByImage = new Map<string, number>();
const imageByProduct = new Map<number, string>();

function assignUniqueImage(productIndex: number, visitedImages: Set<string>): boolean {
  for (const image of productCandidates[productIndex].imageOptions) {
    if (visitedImages.has(image)) continue;
    visitedImages.add(image);

    const previousProduct = productByImage.get(image);
    if (previousProduct === undefined || assignUniqueImage(previousProduct, visitedImages)) {
      productByImage.set(image, productIndex);
      imageByProduct.set(productIndex, image);
      return true;
    }
  }

  return false;
}

productCandidates.forEach((_, index) => assignUniqueImage(index, new Set<string>()));

export const STOREHOUSE_CATEGORY_PRODUCTS: StorehouseCategoryProductSeed[] = productCandidates.flatMap(
  (candidate, index) => {
    const mainImage = imageByProduct.get(index);
    return mainImage
      ? [{
          category: candidate.category,
          family: candidate.family,
          familyIndex: candidate.familyIndex,
          mainImage,
          recordOffset: candidate.recordOffset,
        }]
      : [];
  }
);

export const EXPANSION_CATEGORY_RANGES: Record<string, { start: number; count: number }> = {};
let expansionProductCursor = 0;

for (const category of STOREHOUSE_CATEGORY_ADDITIONS) {
  const count = STOREHOUSE_CATEGORY_PRODUCTS.filter((product) => product.category.id === category.id).length;
  EXPANSION_CATEGORY_RANGES[category.id] = { start: expansionProductCursor, count };
  expansionProductCursor += count;
}

export const EXPANSION_PRODUCT_TOTAL = STOREHOUSE_CATEGORY_PRODUCTS.length;
export const STOREHOUSE_CATEGORY_PRODUCTS_BY_RECORD_OFFSET = new Map<number, StorehouseCategoryProductSeed>(
  STOREHOUSE_CATEGORY_PRODUCTS.map((product) => [product.recordOffset, product] as const)
);
