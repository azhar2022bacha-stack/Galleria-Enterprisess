import type { DemoProduct } from '@/types/product';

type TravelAccessorySeed = {
  title: string;
  subcategory: string;
  price: number;
  material: string;
  feature: string;
};

const TRAVEL_ACCESSORY_SEEDS: TravelAccessorySeed[] = [
  { title: 'Premium Hard Shell Travel Suitcase', subcategory: 'Luggage & Suitcases', price: 189.99, material: 'Impact-resistant polycarbonate', feature: 'A rigid shell, four smooth spinner wheels, a telescoping handle, and a built-in combination lock.' },
  { title: 'Lightweight Cabin Trolley Bag', subcategory: 'Luggage & Suitcases', price: 89.99, material: 'Lightweight ABS composite', feature: 'A compact cabin-size case with quiet spinner wheels and an adjustable pull handle.' },
  { title: 'Expandable Travel Luggage', subcategory: 'Luggage & Suitcases', price: 149.99, material: 'Textured polycarbonate', feature: 'An expansion zipper adds packing room while interior dividers keep belongings organized.' },
  { title: 'Anti-Scratch Spinner Suitcase', subcategory: 'Luggage & Suitcases', price: 169.99, material: 'Scratch-resistant polycarbonate', feature: 'A fine-texture hard shell and 360-degree spinner wheels help protect and move luggage easily.' },
  { title: 'Waterproof Travel Duffel Bag', subcategory: 'Luggage & Suitcases', price: 64.99, material: 'Water-resistant coated nylon', feature: 'A weather-resistant main compartment, reinforced handles, and a detachable shoulder strap.' },
  { title: 'Foldable Travel Holdall Bag', subcategory: 'Luggage & Suitcases', price: 34.99, material: 'Ripstop polyester', feature: 'A lightweight holdall folds into its own pouch for compact storage between trips.' },
  { title: 'Large Capacity Travel Backpack', subcategory: 'Travel Comfort', price: 79.99, material: 'Durable recycled polyester', feature: 'A roomy main compartment, padded shoulder straps, and organized front storage.' },
  { title: 'Business Travel Laptop Backpack', subcategory: 'Travel Electronics', price: 94.99, material: 'Water-resistant ballistic nylon', feature: 'A padded laptop sleeve, document section, and luggage pass-through support work travel.' },
  { title: 'Anti-Theft Travel Backpack', subcategory: 'Travel Comfort', price: 74.99, material: 'Cut-resistant polyester blend', feature: 'Concealed rear access, lockable zippers, and an RFID-protected pocket help secure essentials.' },
  { title: 'Compact Weekend Travel Bag', subcategory: 'Luggage & Suitcases', price: 58.99, material: 'Cotton canvas with vegan-leather trim', feature: 'A structured overnight bag with a wide opening, shoe pocket, and detachable strap.' },
  { title: 'Rolling Travel Duffel', subcategory: 'Luggage & Suitcases', price: 119.99, material: 'Abrasion-resistant polyester', feature: 'A telescoping handle and inline wheels make this spacious duffel easy to move.' },
  { title: 'Underseat Carry-On Bag', subcategory: 'Luggage & Suitcases', price: 54.99, material: 'Lightweight polyester', feature: 'A compact personal-item bag with a trolley sleeve and quick-access front pocket.' },
  { title: 'Lightweight Boarding Bag', subcategory: 'Luggage & Suitcases', price: 42.99, material: 'Water-repellent nylon', feature: 'A slim flight bag keeps travel documents, a tablet, and in-flight essentials close at hand.' },
  { title: 'Vintage Leather Travel Bag', subcategory: 'Luggage & Suitcases', price: 174.99, material: 'Full-grain leather', feature: 'A classic weekender silhouette with reinforced handles and a detachable shoulder strap.' },
  { title: 'Multi-Compartment Travel Backpack', subcategory: 'Travel Comfort', price: 69.99, material: 'High-density polyester', feature: 'Separate clothing, accessory, and quick-access sections keep travel gear organized.' },
  { title: 'Wheeled Cabin Luggage', subcategory: 'Luggage & Suitcases', price: 99.99, material: 'ABS hard shell', feature: 'A compact rolling case with a divided interior and a two-stage telescoping handle.' },
  { title: 'Soft Shell Travel Suitcase', subcategory: 'Luggage & Suitcases', price: 109.99, material: 'Tightly woven polyester', feature: 'A flexible soft-side case with external pockets, corner guards, and smooth-rolling wheels.' },
  { title: 'ABS Hardcase Luggage', subcategory: 'Luggage & Suitcases', price: 79.99, material: 'Molded ABS', feature: 'A lightweight molded shell protects packed belongings and wipes clean after travel.' },
  { title: 'Polycarbonate Travel Suitcase', subcategory: 'Luggage & Suitcases', price: 199.99, material: 'Flexible polycarbonate', feature: 'A lightweight resilient shell, TSA-style combination lock, and four double spinner wheels.' },
  { title: 'Expandable Spinner Luggage', subcategory: 'Luggage & Suitcases', price: 139.99, material: 'Polycarbonate and ABS blend', feature: 'A zip-around expansion panel and multidirectional wheels adapt to longer trips.' },
  { title: 'Travel Garment Suit Bag', subcategory: 'Packing Organizers', price: 49.99, material: 'Water-resistant polyester', feature: 'A fold-over garment compartment helps reduce creasing and includes a hanger opening.' },
  { title: 'Waterproof Adventure Backpack', subcategory: 'Travel Comfort', price: 84.99, material: 'Waterproof coated ripstop nylon', feature: 'A roll-top closure, sealed seams, and adjustable chest strap suit outdoor journeys.' },
  { title: 'Compact Overnight Travel Bag', subcategory: 'Luggage & Suitcases', price: 39.99, material: 'Recycled polyester canvas', feature: 'A compact overnight design with a wide zip opening and an interior organizer pocket.' },
  { title: 'Large Family Travel Luggage', subcategory: 'Luggage & Suitcases', price: 219.99, material: 'Impact-resistant ABS and polycarbonate', feature: 'A spacious checked case with compression straps, divided compartments, and spinner wheels.' },
  { title: 'Minimalist Travel Backpack', subcategory: 'Travel Comfort', price: 59.99, material: 'Recycled nylon', feature: 'A clean, lightweight profile with a padded sleeve and discreet organization pockets.' },
  { title: 'Convertible Travel Duffel Backpack', subcategory: 'Luggage & Suitcases', price: 74.99, material: 'Water-resistant canvas', feature: 'Stowaway shoulder straps convert the duffel into a backpack for hands-free carrying.' },
  { title: 'Rolling Carry-On Luggage', subcategory: 'Luggage & Suitcases', price: 124.99, material: 'Textured polycarbonate', feature: 'A cabin case with four double spinner wheels, a reinforced handle, and interior compression.' },
  { title: 'Premium Leather Weekender Bag', subcategory: 'Luggage & Suitcases', price: 229.99, material: 'Top-grain leather', feature: 'A spacious weekend bag with a lined interior, sturdy base, and removable shoulder strap.' },
  { title: 'Foldable Shopping Travel Tote', subcategory: 'Packing Organizers', price: 19.99, material: 'Recycled ripstop polyester', feature: 'A reusable tote folds into a small pouch and opens wide for extra travel storage.' },
  { title: 'Lightweight Travel Shoulder Bag', subcategory: 'Travel Comfort', price: 36.99, material: 'Lightweight water-resistant nylon', feature: 'An adjustable crossbody strap and zip compartments keep everyday travel essentials close.' },
  { title: 'Multi-Purpose Travel Organizer Bag', subcategory: 'Packing Organizers', price: 29.99, material: 'Quilted polyester', feature: 'Multiple zip pockets organize toiletries, cables, documents, or small accessories.' },
  { title: 'Airline Approved Cabin Bag', subcategory: 'Luggage & Suitcases', price: 64.99, material: 'Durable polyester', feature: 'A structured cabin bag has a trolley sleeve, reinforced base, and easy-access pockets.' },
  { title: 'Extra Large Travel Duffel', subcategory: 'Luggage & Suitcases', price: 69.99, material: 'Heavy-duty canvas', feature: 'A roomy main compartment, reinforced seams, and padded carry handles support longer trips.' },
  { title: 'Travel Gym Holdall Bag', subcategory: 'Travel Comfort', price: 48.99, material: 'Water-resistant polyester', feature: 'A ventilated shoe compartment separates gym gear from clean clothing.' },
  { title: 'Waterproof Hiking Travel Pack', subcategory: 'Travel Comfort', price: 99.99, material: 'Waterproof ripstop nylon', feature: 'An adjustable support harness, rain cover, and hydration sleeve are built for day hikes.' },
  { title: 'Rolling Business Luggage', subcategory: 'Travel Electronics', price: 159.99, material: 'Ballistic nylon with reinforced frame', feature: 'A padded laptop section, document organizer, and smooth wheels support business trips.' },
  { title: 'Compact Travel Crossbody Bag', subcategory: 'Travel Comfort', price: 32.99, material: 'Recycled nylon', feature: 'A compact zip-top design with an adjustable strap carries daily travel essentials.' },
  { title: 'Travel Storage Tote Bag', subcategory: 'Packing Organizers', price: 27.99, material: 'Heavyweight cotton canvas', feature: 'A reinforced-base tote folds flat and provides extra room for souvenirs or overflow packing.' },
  { title: 'Anti-Theft Sling Travel Bag', subcategory: 'Travel Comfort', price: 44.99, material: 'Cut-resistant woven fabric', feature: 'A secure rear pocket, locking zipper pulls, and adjustable crossbody strap keep essentials close.' },
  { title: 'Heavy Duty Travel Suitcase', subcategory: 'Luggage & Suitcases', price: 189.99, material: 'Reinforced polycarbonate composite', feature: 'A reinforced shell, protective corner guards, and durable spinner wheels handle frequent trips.' },
  { title: 'Four Wheel Cabin Suitcase', subcategory: 'Luggage & Suitcases', price: 94.99, material: 'Lightweight ABS', feature: 'Four multidirectional wheels and a divided interior make short-haul packing straightforward.' },
  { title: 'Expandable Travel Backpack', subcategory: 'Travel Comfort', price: 89.99, material: 'Water-resistant polyester', feature: 'A wraparound expansion zipper adds capacity while compression straps secure the load.' },
  { title: 'Foldable Waterproof Travel Bag', subcategory: 'Luggage & Suitcases', price: 38.99, material: 'Waterproof ripstop fabric', feature: 'A packable duffel folds into its own pocket and has sealed seams for wet-weather use.' },
  { title: 'Premium Nylon Travel Backpack', subcategory: 'Travel Comfort', price: 109.99, material: 'High-density ballistic nylon', feature: 'A padded back panel, laptop sleeve, and reinforced stitching support everyday travel.' },
  { title: 'Executive Business Travel Bag', subcategory: 'Travel Electronics', price: 129.99, material: 'Nylon twill with vegan-leather trim', feature: 'A structured work bag separates a laptop, files, chargers, and personal travel items.' },
  { title: 'Lightweight Rolling Luggage', subcategory: 'Luggage & Suitcases', price: 114.99, material: 'Lightweight polycarbonate blend', feature: 'A balanced hard shell and smooth spinner wheels help reduce effort through terminals.' },
  { title: 'Travel Shoe Compartment Bag', subcategory: 'Packing Organizers', price: 34.99, material: 'Water-resistant polyester', feature: 'A ventilated lower compartment separates shoes from clothing and other packed items.' },
  { title: 'Multi-Pocket Travel Holdall', subcategory: 'Luggage & Suitcases', price: 54.99, material: 'Durable recycled polyester', feature: 'Several exterior pockets and an organized interior keep frequently used items accessible.' },
  { title: 'Compact Flight Travel Backpack', subcategory: 'Travel Comfort', price: 62.99, material: 'Water-resistant nylon', feature: 'A compact personal-item profile includes a padded tablet sleeve and trolley pass-through.' },
  { title: 'Premium Family Luggage Set', subcategory: 'Luggage & Suitcases', price: 299.99, material: 'Lightweight ABS composite', feature: 'Three coordinated case sizes nest together and include divided interiors and spinner wheels.' },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const TRAVEL_ACCESSORY_PRODUCTS: DemoProduct[] = TRAVEL_ACCESSORY_SEEDS.map((seed, index) => {
  const number = index + 1;
  const id = `travel-${number.toString().padStart(4, '0')}`;
  const sku = `TRAV-GS-${number.toString().padStart(4, '0')}`;
  const image = `/images/products/travel-accessories/${id}.png`;
  const stockQuantity = 24 + ((number * 37) % 180);

  return {
    id,
    title: seed.title,
    slug: slugify(seed.title),
    sku,
    shortDescription: `${seed.subcategory} · ${seed.material}.`,
    description: `${seed.title} is designed for practical packing and reliable use on trips. ${seed.feature} Made with ${seed.material.toLowerCase()}. The product image is AI-generated and illustrative; market pricing and product specifications are estimates that should be confirmed with a supplier before sale.`,
    category: 'Travel Accessories',
    categorySlug: 'travel-accessories',
    subcategory: seed.subcategory,
    brand: 'Unbranded',
    price: seed.price,
    compareAtPrice: Math.round(seed.price * 1.16 * 100) / 100,
    currency: 'USD',
    stockQuantity,
    minOrderQuantity: 1,
    condition: 'Brand New',
    status: 'In Stock',
    mainImage: image,
    galleryImages: [image],
    attributes: {
      Category: 'Travel Accessories',
      Subcategory: seed.subcategory,
      Material: seed.material,
      Feature: seed.feature,
      'Catalog status': 'AI-generated illustrative concept; supplier details not verified',
      'Wholesale SKU': sku,
    },
    rating: 0,
    reviewCount: 0,
    isDemo: true,
    demoBatch: 'AI-TRAVEL-ACCESSORIES-50-V1',
  };
});

