// Curated verified commercial product database with legitimate white-background product photography
export interface CuratedBaseProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  image: string;
  galleryImages: string[];
  description: string;
  specifications: Record<string, string>;
}

export const CURATED_BASE_PRODUCTS: CuratedBaseProduct[] = [
  {
    "id": "base-supp-1",
    "title": "Vitamin C 1000mg",
    "brand": "NatureWise",
    "category": "Vitamins & Supplements",
    "subcategory": "Immune Support Vitamins",
    "price": 14.99,
    "image": "/images/products/naturewise-vitamin-c.png",
    "galleryImages": [
      "/images/products/naturewise-vitamin-c.png"
    ],
    "description": "High-potency Vitamin C 1,000mg with Citrus Bioflavonoids & Rose Hips for advanced immune defense and antioxidant cellular protection.",
    "specifications": {
      "Dose": "1,000 mg",
      "Form": "Vegan Capsules",
      "Count": "120 Capsules",
      "Certification": "Non-GMO, Gluten-Free"
    }
  },
  {
    "id": "base-supp-2",
    "title": "Vitamin D3 5000 IU",
    "brand": "NOW Foods",
    "category": "Vitamins & Supplements",
    "subcategory": "Bone & Immune Health",
    "price": 12.99,
    "image": "/images/products/now-vitamin-d3.png",
    "galleryImages": [
      "/images/products/now-vitamin-d3.png"
    ],
    "description": "High potency structural bone and immune support softgels delivering 5,000 IU of pharmaceutical-grade Cholecalciferol.",
    "specifications": {
      "Potency": "5,000 IU (125 mcg)",
      "Form": "Liquid Softgels",
      "Count": "240 Softgels",
      "Origin": "USA GMP Facility"
    }
  },
  {
    "id": "base-supp-3",
    "title": "Plant Protein Blend",
    "brand": "Anthony's Goods",
    "category": "Vitamins & Supplements",
    "subcategory": "Plant Protein & Nutrition",
    "price": 34.99,
    "image": "/images/products/anthonys-plant-protein.png",
    "galleryImages": [
      "/images/products/anthonys-plant-protein.png"
    ],
    "description": "Premium organic unflavored pea protein isolate powder. Batch-tested gluten-free, vegan-friendly, rich in essential amino acids and BCAAs.",
    "specifications": {
      "Protein": "24g per serving",
      "Weight": "2 lbs (907g)",
      "Ingredients": "100% Pea Protein Isolate",
      "Diet": "Keto & Vegan"
    }
  },
  {
    "id": "base-supp-4",
    "title": "Creatine Monohydrate",
    "brand": "Optimum Nutrition",
    "category": "Vitamins & Supplements",
    "subcategory": "Sports Nutrition & Muscle",
    "price": 19.99,
    "image": "/images/products/optimum-nutrition-creatine.png",
    "galleryImages": [
      "/images/products/optimum-nutrition-creatine.png"
    ],
    "description": "Micronized pure Creatine Monohydrate powder designed to increase muscle strength, power output, and high-intensity workout performance.",
    "specifications": {
      "Serving": "5g Pure Creatine",
      "Servings": "60 Servings",
      "Flavor": "Unflavored",
      "Form": "Micronized Powder"
    }
  },
  {
    "id": "base-supp-5",
    "title": "Collagen Peptides",
    "brand": "Sports Research",
    "category": "Vitamins & Supplements",
    "subcategory": "Collagen & Anti-Aging",
    "price": 27.99,
    "image": "/images/products/sports-research-collagen.png",
    "galleryImages": [
      "/images/products/sports-research-collagen.png"
    ],
    "description": "Hydrolyzed Type I & III grass-fed bovine collagen peptides for radiant skin, strong nails, thick hair, and healthy joint mobility.",
    "specifications": {
      "Type": "Hydrolyzed Bovine Types I & III",
      "Weight": "16 oz (454g)",
      "Features": "Paleo & Keto Certified",
      "Mixes": "Hot or Cold"
    }
  },
  {
    "id": "base-supp-6",
    "title": "Hyaluronic Acid Serum",
    "brand": "Wolf Project",
    "category": "Beauty & Personal Care",
    "subcategory": "Facial Skincare & Serums",
    "price": 21.99,
    "image": "/images/products/wolf-project-hyaluronic.png",
    "galleryImages": [
      "/images/products/wolf-project-hyaluronic.png"
    ],
    "description": "Intense hydrating face mask & multi-molecular hyaluronic acid daily serum. Plumps and restores moisture barrier without residue.",
    "specifications": {
      "Volume": "50 ml / 1.7 oz",
      "Skin Type": "All Skin Types",
      "Cruelty Free": "Yes",
      "Packaging": "Recyclable Glass Dropper"
    }
  },
  {
    "id": "base-supp-7",
    "title": "Biotin Gummies",
    "brand": "Joy Nutrition",
    "category": "Vitamins & Supplements",
    "subcategory": "Hair, Skin & Nails",
    "price": 16.99,
    "image": "/images/products/joy-nutrition-biotin.png",
    "galleryImages": [
      "/images/products/joy-nutrition-biotin.png"
    ],
    "description": "Delicious natural strawberry pectin gummies packed with 10,000 mcg of maximum strength pure D-biotin plus Vitamins C & E.",
    "specifications": {
      "Dose": "10,000 mcg",
      "Count": "60 Pectin Gummies",
      "Flavor": "Natural Strawberry",
      "Gelatin-Free": "100% Pectin Vegan"
    }
  },
  {
    "id": "base-supp-8",
    "title": "Ashwagandha Root",
    "brand": "Gaia Herbs",
    "category": "Vitamins & Supplements",
    "subcategory": "Herbal & Stress Support",
    "price": 19.99,
    "image": "/images/products/gaia-herbs-ashwagandha.png",
    "galleryImages": [
      "/images/products/gaia-herbs-ashwagandha.png"
    ],
    "description": "Full-spectrum organic Ashwagandha root liquid phyto-caps designed to nourish the adrenal glands and help the body cope with stress.",
    "specifications": {
      "Count": "60 Liquid Phyto-Caps",
      "Concentration": "Full Spectrum Root",
      "Purity": "Heavy Metal Tested",
      "Packaging": "Amber Glass Bottle"
    }
  },
  {
    "id": "base-supp-9",
    "title": "Thorne Magnesium Bisglycinate Powder",
    "brand": "Thorne",
    "category": "Vitamins & Supplements",
    "subcategory": "Bone & Muscle Support",
    "price": 44,
    "image": "/images/products/base-supp-9.jpg",
    "galleryImages": [
      "/images/products/base-supp-9.jpg"
    ],
    "description": "Lightly sweetened monk-fruit flavored powder supporting cellular energy production, restful sleep, and deep muscle relaxation.",
    "specifications": {
      "Serving": "200 mg Elemental Magnesium",
      "Form": "True Bisglycinate Chelate",
      "Weight": "6.6 oz (187 g)",
      "Purity": "NSF Certified for Sport"
    }
  },
  {
    "id": "base-supp-10",
    "title": "Nordic Naturals Ultimate Omega 1280mg",
    "brand": "Nordic Naturals",
    "category": "Vitamins & Supplements",
    "subcategory": "Omega & Fish Oils",
    "price": 29.71,
    "image": "/images/products/base-supp-10.jpg",
    "galleryImages": [
      "/images/products/base-supp-10.jpg"
    ],
    "description": "High-intensity Omega-3s in true triglyceride form offering exceptional heart, brain, and joint support with fresh natural lemon taste.",
    "specifications": {
      "Omega-3 Total": "1,280 mg (650 EPA / 450 DHA)",
      "Count": "120 Softgels",
      "Flavor": "Natural Lemon",
      "Source": "100% Wild-Caught Sardines & Anchovies"
    }
  },
  {
    "id": "base-dj-1",
    "title": "Essence Mascara Lash Princess",
    "brand": "Essence",
    "category": "Beauty & Personal Care",
    "subcategory": "Cosmetics & Makeup",
    "price": 9.99,
    "image": "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp"
    ],
    "description": "The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this long-lasting and cruelty-free formula.",
    "specifications": {
      "Brand": "Essence",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "BEA-ESS-ESS-001",
      "Rating": "2.56 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-2",
    "title": "Eyeshadow Palette with Mirror",
    "brand": "Glamour Beauty",
    "category": "Beauty & Personal Care",
    "subcategory": "Cosmetics & Makeup",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/1.webp"
    ],
    "description": "The Eyeshadow Palette with Mirror offers a versatile range of eyeshadow shades for creating stunning eye looks. With a built-in mirror, it's convenient for on-the-go makeup application.",
    "specifications": {
      "Brand": "Glamour Beauty",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "BEA-GLA-EYE-002",
      "Rating": "2.86 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-3",
    "title": "Powder Canister",
    "brand": "Velvet Touch",
    "category": "Beauty & Personal Care",
    "subcategory": "Cosmetics & Makeup",
    "price": 14.99,
    "image": "https://cdn.dummyjson.com/product-images/beauty/powder-canister/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/beauty/powder-canister/1.webp"
    ],
    "description": "The Powder Canister is a finely milled setting powder designed to set makeup and control shine. With a lightweight and translucent formula, it provides a smooth and matte finish.",
    "specifications": {
      "Brand": "Velvet Touch",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "BEA-VEL-POW-003",
      "Rating": "4.64 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-4",
    "title": "Red Lipstick",
    "brand": "Chic Cosmetics",
    "category": "Beauty & Personal Care",
    "subcategory": "Cosmetics & Makeup",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/beauty/red-lipstick/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp"
    ],
    "description": "The Red Lipstick is a classic and bold choice for adding a pop of color to your lips. With a creamy and pigmented formula, it provides a vibrant and long-lasting finish.",
    "specifications": {
      "Brand": "Chic Cosmetics",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "BEA-CHI-LIP-004",
      "Rating": "4.36 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-5",
    "title": "Red Nail Polish",
    "brand": "Nail Couture",
    "category": "Beauty & Personal Care",
    "subcategory": "Cosmetics & Makeup",
    "price": 8.99,
    "image": "https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/1.webp"
    ],
    "description": "The Red Nail Polish offers a rich and glossy red hue for vibrant and polished nails. With a quick-drying formula, it provides a salon-quality finish at home.",
    "specifications": {
      "Brand": "Nail Couture",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "BEA-NAI-NAI-005",
      "Rating": "4.32 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-6",
    "title": "Calvin Klein CK One",
    "brand": "Calvin Klein",
    "category": "Beauty & Personal Care",
    "subcategory": "Eau de Parfum & Fragrances",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/1.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/2.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/3.webp"
    ],
    "description": "CK One by Calvin Klein is a classic unisex fragrance, known for its fresh and clean scent. It's a versatile fragrance suitable for everyday wear.",
    "specifications": {
      "Brand": "Calvin Klein",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "FRA-CAL-CAL-006",
      "Rating": "4.37 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-7",
    "title": "Chanel Coco Noir Eau De",
    "brand": "Chanel",
    "category": "Beauty & Personal Care",
    "subcategory": "Eau de Parfum & Fragrances",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/1.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/2.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/3.webp"
    ],
    "description": "Coco Noir by Chanel is an elegant and mysterious fragrance, featuring notes of grapefruit, rose, and sandalwood. Perfect for evening occasions.",
    "specifications": {
      "Brand": "Chanel",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "FRA-CHA-CHA-007",
      "Rating": "4.26 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-8",
    "title": "Dior J'adore",
    "brand": "Dior",
    "category": "Beauty & Personal Care",
    "subcategory": "Eau de Parfum & Fragrances",
    "price": 89.99,
    "image": "https://cdn.dummyjson.com/product-images/fragrances/dior-j'adore/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/fragrances/dior-j'adore/1.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/dior-j'adore/2.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/dior-j'adore/3.webp"
    ],
    "description": "J'adore by Dior is a luxurious and floral fragrance, known for its blend of ylang-ylang, rose, and jasmine. It embodies femininity and sophistication.",
    "specifications": {
      "Brand": "Dior",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "FRA-DIO-DIO-008",
      "Rating": "3.8 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-9",
    "title": "Dolce Shine Eau de",
    "brand": "Dolce & Gabbana",
    "category": "Beauty & Personal Care",
    "subcategory": "Eau de Parfum & Fragrances",
    "price": 69.99,
    "image": "https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/1.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/2.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/3.webp"
    ],
    "description": "Dolce Shine by Dolce & Gabbana is a vibrant and fruity fragrance, featuring notes of mango, jasmine, and blonde woods. It's a joyful and youthful scent.",
    "specifications": {
      "Brand": "Dolce & Gabbana",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "FRA-DOL-DOL-009",
      "Rating": "3.96 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-10",
    "title": "Gucci Bloom Eau de",
    "brand": "Gucci",
    "category": "Beauty & Personal Care",
    "subcategory": "Eau de Parfum & Fragrances",
    "price": 79.99,
    "image": "https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/1.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/2.webp",
      "https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/3.webp"
    ],
    "description": "Gucci Bloom by Gucci is a floral and captivating fragrance, with notes of tuberose, jasmine, and Rangoon creeper. It's a modern and romantic scent.",
    "specifications": {
      "Brand": "Gucci",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "FRA-GUC-GUC-010",
      "Rating": "2.74 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-11",
    "title": "Annibale Colombo Bed",
    "brand": "Annibale Colombo",
    "category": "Furniture & Decor",
    "subcategory": "Modern Living Furniture",
    "price": 1899,
    "image": "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/1.webp",
      "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/2.webp",
      "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/3.webp"
    ],
    "description": "The Annibale Colombo Bed is a luxurious and elegant bed frame, crafted with high-quality materials for a comfortable and stylish bedroom.",
    "specifications": {
      "Brand": "Annibale Colombo",
      "Category": "Furniture & Decor",
      "Model / SKU": "FUR-ANN-ANN-011",
      "Rating": "4.77 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-12",
    "title": "Annibale Colombo Sofa",
    "brand": "Annibale Colombo",
    "category": "Furniture & Decor",
    "subcategory": "Modern Living Furniture",
    "price": 1999,
    "image": "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/1.webp",
      "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/2.webp",
      "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/3.webp"
    ],
    "description": "The Annibale Colombo Sofa is a sophisticated and comfortable seating option, featuring exquisite design and premium upholstery for your living room.",
    "specifications": {
      "Brand": "Annibale Colombo",
      "Category": "Furniture & Decor",
      "Model / SKU": "FUR-ANN-ANN-012",
      "Rating": "3.92 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-13",
    "title": "Bedside Table African Cherry",
    "brand": "Furniture Co.",
    "category": "Furniture & Decor",
    "subcategory": "Modern Living Furniture",
    "price": 179,
    "image": "https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/1.webp",
      "https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/2.webp",
      "https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/3.webp"
    ],
    "description": "The Bedside Table in African Cherry is a stylish and functional addition to your bedroom, providing convenient storage space and a touch of elegance.",
    "specifications": {
      "Brand": "Furniture Co.",
      "Category": "Furniture & Decor",
      "Model / SKU": "FUR-FUR-BED-013",
      "Rating": "2.87 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-14",
    "title": "Knoll Saarinen Executive Conference Chair",
    "brand": "Knoll",
    "category": "Furniture & Decor",
    "subcategory": "Modern Living Furniture",
    "price": 289,
    "image": "https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/1.webp",
      "https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/2.webp",
      "https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/3.webp"
    ],
    "description": "The Knoll Saarinen Executive Conference Chair is a modern and ergonomic chair, perfect for your office or conference room with its timeless design.",
    "specifications": {
      "Brand": "Knoll",
      "Category": "Furniture & Decor",
      "Model / SKU": "FUR-KNO-KNO-014",
      "Rating": "4.88 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-15",
    "title": "Wooden Bathroom Sink With Mirror",
    "brand": "Bath Trends",
    "category": "Furniture & Decor",
    "subcategory": "Modern Living Furniture",
    "price": 549,
    "image": "https://cdn.dummyjson.com/product-images/furniture/wooden-bathroom-sink-with-mirror/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/furniture/wooden-bathroom-sink-with-mirror/1.webp",
      "https://cdn.dummyjson.com/product-images/furniture/wooden-bathroom-sink-with-mirror/2.webp",
      "https://cdn.dummyjson.com/product-images/furniture/wooden-bathroom-sink-with-mirror/3.webp"
    ],
    "description": "The Wooden Bathroom Sink with Mirror is a unique and stylish addition to your bathroom, featuring a wooden sink countertop and a matching mirror.",
    "specifications": {
      "Brand": "Bath Trends",
      "Category": "Furniture & Decor",
      "Model / SKU": "FUR-BAT-WOO-015",
      "Rating": "3.59 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-16",
    "title": "Apple",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 1.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/apple/1.webp"
    ],
    "description": "Fresh and crisp apples, perfect for snacking or incorporating into various recipes.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-APP-016",
      "Rating": "4.19 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-17",
    "title": "Beef Steak",
    "brand": "Prime Cuts",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/beef-steak/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/beef-steak/1.webp"
    ],
    "description": "High-quality beef steak, great for grilling or cooking to your preferred level of doneness.",
    "specifications": {
      "Brand": "Prime Cuts",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-BEE-017",
      "Rating": "4.47 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-18",
    "title": "Cat Food",
    "brand": "Purina",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 8.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/cat-food/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/cat-food/1.webp"
    ],
    "description": "Nutritious cat food formulated to meet the dietary needs of your feline friend.",
    "specifications": {
      "Brand": "Purina",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-FOO-018",
      "Rating": "3.13 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-19",
    "title": "Chicken Meat",
    "brand": "Prime Cuts",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 9.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/chicken-meat/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/chicken-meat/1.webp",
      "https://cdn.dummyjson.com/product-images/groceries/chicken-meat/2.webp"
    ],
    "description": "Fresh and tender chicken meat, suitable for various culinary preparations.",
    "specifications": {
      "Brand": "Prime Cuts",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-CHI-019",
      "Rating": "3.19 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-20",
    "title": "Cooking Oil",
    "brand": "Pantry Select",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 4.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/cooking-oil/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/cooking-oil/1.webp"
    ],
    "description": "Versatile cooking oil suitable for frying, sautéing, and various culinary applications.",
    "specifications": {
      "Brand": "Pantry Select",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-COO-020",
      "Rating": "4.8 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-21",
    "title": "Cucumber",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 1.49,
    "image": "https://cdn.dummyjson.com/product-images/groceries/cucumber/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/cucumber/1.webp"
    ],
    "description": "Crisp and hydrating cucumbers, ideal for salads, snacks, or as a refreshing side.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-CUC-021",
      "Rating": "4.07 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-22",
    "title": "Dog Food",
    "brand": "Pedigree",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 10.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/dog-food/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/dog-food/1.webp"
    ],
    "description": "Specially formulated dog food designed to provide essential nutrients for your canine companion.",
    "specifications": {
      "Brand": "Pedigree",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-FOO-022",
      "Rating": "4.55 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-23",
    "title": "Eggs",
    "brand": "Eggland's Best",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 2.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/eggs/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/eggs/1.webp"
    ],
    "description": "Fresh eggs, a versatile ingredient for baking, cooking, or breakfast.",
    "specifications": {
      "Brand": "Eggland's Best",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-EGG-023",
      "Rating": "2.53 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-24",
    "title": "Fish Steak",
    "brand": "Prime Cuts",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 14.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/fish-steak/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/fish-steak/1.webp"
    ],
    "description": "Quality fish steak, suitable for grilling, baking, or pan-searing.",
    "specifications": {
      "Brand": "Prime Cuts",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-FIS-024",
      "Rating": "3.78 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-25",
    "title": "Green Bell Pepper",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 1.29,
    "image": "https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/1.webp"
    ],
    "description": "Fresh and vibrant green bell pepper, perfect for adding color and flavor to your dishes.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-GRE-025",
      "Rating": "3.25 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-26",
    "title": "Green Chili Pepper",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 0.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/green-chili-pepper/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/green-chili-pepper/1.webp"
    ],
    "description": "Spicy green chili pepper, ideal for adding heat to your favorite recipes.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-GRE-026",
      "Rating": "3.66 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-27",
    "title": "Honey Jar",
    "brand": "Nature Nate's",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 6.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/honey-jar/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/honey-jar/1.webp"
    ],
    "description": "Pure and natural honey in a convenient jar, perfect for sweetening beverages or drizzling over food.",
    "specifications": {
      "Brand": "Nature Nate's",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-HON-027",
      "Rating": "3.97 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-28",
    "title": "Ice Cream",
    "brand": "Haagen-Dazs",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 5.49,
    "image": "https://cdn.dummyjson.com/product-images/groceries/ice-cream/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/ice-cream/1.webp",
      "https://cdn.dummyjson.com/product-images/groceries/ice-cream/2.webp",
      "https://cdn.dummyjson.com/product-images/groceries/ice-cream/3.webp",
      "https://cdn.dummyjson.com/product-images/groceries/ice-cream/4.webp"
    ],
    "description": "Creamy and delicious ice cream, available in various flavors for a delightful treat.",
    "specifications": {
      "Brand": "Haagen-Dazs",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-CRE-028",
      "Rating": "3.39 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-29",
    "title": "Juice",
    "brand": "Tropicana",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 3.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/juice/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/juice/1.webp"
    ],
    "description": "Refreshing fruit juice, packed with vitamins and great for staying hydrated.",
    "specifications": {
      "Brand": "Tropicana",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-JUI-029",
      "Rating": "3.94 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-30",
    "title": "Kiwi",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 2.49,
    "image": "https://cdn.dummyjson.com/product-images/groceries/kiwi/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/kiwi/1.webp"
    ],
    "description": "Nutrient-rich kiwi, perfect for snacking or adding a tropical twist to your dishes.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-KIW-030",
      "Rating": "4.93 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-31",
    "title": "Lemon",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 0.79,
    "image": "https://cdn.dummyjson.com/product-images/groceries/lemon/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/lemon/1.webp"
    ],
    "description": "Zesty and tangy lemons, versatile for cooking, baking, or making refreshing beverages.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-LEM-031",
      "Rating": "3.53 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-32",
    "title": "Milk",
    "brand": "Horizon Organic",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 3.49,
    "image": "https://cdn.dummyjson.com/product-images/groceries/milk/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/milk/1.webp"
    ],
    "description": "Fresh and nutritious milk, a staple for various recipes and daily consumption.",
    "specifications": {
      "Brand": "Horizon Organic",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-MIL-032",
      "Rating": "2.61 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-33",
    "title": "Mulberry",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 4.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/mulberry/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/mulberry/1.webp"
    ],
    "description": "Sweet and juicy mulberries, perfect for snacking or adding to desserts and cereals.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-MUL-033",
      "Rating": "4.95 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-34",
    "title": "Nescafe Coffee",
    "brand": "Nescafe",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 7.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/nescafe-coffee/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/nescafe-coffee/1.webp"
    ],
    "description": "Quality coffee from Nescafe, available in various blends for a rich and satisfying cup.",
    "specifications": {
      "Brand": "Nescafe",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-NES-034",
      "Rating": "4.82 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-35",
    "title": "Potatoes",
    "brand": "Farm Fresh",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 2.29,
    "image": "https://cdn.dummyjson.com/product-images/groceries/potatoes/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/potatoes/1.webp"
    ],
    "description": "Versatile and starchy potatoes, great for roasting, mashing, or as a side dish.",
    "specifications": {
      "Brand": "Farm Fresh",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-POT-035",
      "Rating": "4.81 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-36",
    "title": "Protein Powder",
    "brand": "Optimum Nutrition",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/protein-powder/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/protein-powder/1.webp"
    ],
    "description": "Nutrient-packed protein powder, ideal for supplementing your diet with essential proteins.",
    "specifications": {
      "Brand": "Optimum Nutrition",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-PRO-036",
      "Rating": "4.18 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-37",
    "title": "Red Onions",
    "brand": "Fresh Produce",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 1.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/red-onions/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/red-onions/1.webp"
    ],
    "description": "Flavorful and aromatic red onions, perfect for adding depth to your savory dishes.",
    "specifications": {
      "Brand": "Fresh Produce",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-ONI-037",
      "Rating": "4.2 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-38",
    "title": "Rice",
    "brand": "Mahatma",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 5.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/rice/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/rice/1.webp"
    ],
    "description": "High-quality rice, a staple for various cuisines and a versatile base for many dishes.",
    "specifications": {
      "Brand": "Mahatma",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-RIC-038",
      "Rating": "3.18 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-39",
    "title": "Soft Drinks",
    "brand": "Coca-Cola",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 1.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/soft-drinks/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/soft-drinks/1.webp"
    ],
    "description": "Assorted soft drinks in various flavors, perfect for refreshing beverages.",
    "specifications": {
      "Brand": "Coca-Cola",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-SOF-039",
      "Rating": "4.75 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-40",
    "title": "Strawberry",
    "brand": "Driscoll's",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 3.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/strawberry/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/strawberry/1.webp"
    ],
    "description": "Sweet and succulent strawberries, great for snacking, desserts, or blending into smoothies.",
    "specifications": {
      "Brand": "Driscoll's",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-STR-040",
      "Rating": "3.08 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-41",
    "title": "Tissue Paper Box",
    "brand": "Kleenex",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 2.49,
    "image": "https://cdn.dummyjson.com/product-images/groceries/tissue-paper-box/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/tissue-paper-box/1.webp",
      "https://cdn.dummyjson.com/product-images/groceries/tissue-paper-box/2.webp"
    ],
    "description": "Convenient tissue paper box for everyday use, providing soft and absorbent tissues.",
    "specifications": {
      "Brand": "Kleenex",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-TIS-041",
      "Rating": "2.69 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-42",
    "title": "Water",
    "brand": "Fiji",
    "category": "Grocery & Essentials",
    "subcategory": "Pantry & Gourmet Foods",
    "price": 0.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/water/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/water/1.webp"
    ],
    "description": "Pure and refreshing bottled water, essential for staying hydrated throughout the day.",
    "specifications": {
      "Brand": "Fiji",
      "Category": "Grocery & Essentials",
      "Model / SKU": "GRO-BRD-WAT-042",
      "Rating": "4.96 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-43",
    "title": "Decoration Swing",
    "brand": "Home Decor Co.",
    "category": "Furniture & Decor",
    "subcategory": "Home Decor & Lighting",
    "price": 59.99,
    "image": "https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/1.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/2.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/3.webp"
    ],
    "description": "The Decoration Swing is a charming addition to your home decor. Crafted with intricate details, it adds a touch of elegance and whimsy to any room.",
    "specifications": {
      "Brand": "Home Decor Co.",
      "Category": "Furniture & Decor",
      "Model / SKU": "HOM-BRD-DEC-043",
      "Rating": "3.16 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-44",
    "title": "Family Tree Photo Frame",
    "brand": "Home Decor Co.",
    "category": "Furniture & Decor",
    "subcategory": "Home Decor & Lighting",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/home-decoration/family-tree-photo-frame/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/home-decoration/family-tree-photo-frame/1.webp"
    ],
    "description": "The Family Tree Photo Frame is a sentimental and stylish way to display your cherished family memories. With multiple photo slots, it tells the story of your loved ones.",
    "specifications": {
      "Brand": "Home Decor Co.",
      "Category": "Furniture & Decor",
      "Model / SKU": "HOM-BRD-FAM-044",
      "Rating": "4.53 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-45",
    "title": "House Showpiece Plant",
    "brand": "Home Decor Co.",
    "category": "Furniture & Decor",
    "subcategory": "Home Decor & Lighting",
    "price": 39.99,
    "image": "https://cdn.dummyjson.com/product-images/home-decoration/house-showpiece-plant/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/home-decoration/house-showpiece-plant/1.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/house-showpiece-plant/2.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/house-showpiece-plant/3.webp"
    ],
    "description": "The House Showpiece Plant is an artificial plant that brings a touch of nature to your home without the need for maintenance. It adds greenery and style to any space.",
    "specifications": {
      "Brand": "Home Decor Co.",
      "Category": "Furniture & Decor",
      "Model / SKU": "HOM-BRD-HOU-045",
      "Rating": "4.67 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-46",
    "title": "Plant Pot",
    "brand": "Home Decor Co.",
    "category": "Furniture & Decor",
    "subcategory": "Home Decor & Lighting",
    "price": 14.99,
    "image": "https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/1.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/2.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/3.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/4.webp"
    ],
    "description": "The Plant Pot is a stylish container for your favorite plants. With a sleek design, it complements your indoor or outdoor garden, adding a modern touch to your plant display.",
    "specifications": {
      "Brand": "Home Decor Co.",
      "Category": "Furniture & Decor",
      "Model / SKU": "HOM-BRD-PLA-046",
      "Rating": "3.01 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-47",
    "title": "Table Lamp",
    "brand": "Home Decor Co.",
    "category": "Furniture & Decor",
    "subcategory": "Home Decor & Lighting",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/1.webp"
    ],
    "description": "The Table Lamp is a functional and decorative lighting solution for your living space. With a modern design, it provides both ambient and task lighting, enhancing the atmosphere.",
    "specifications": {
      "Brand": "Home Decor Co.",
      "Category": "Furniture & Decor",
      "Model / SKU": "HOM-BRD-TAB-047",
      "Rating": "3.55 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-48",
    "title": "Bamboo Spatula",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 7.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/bamboo-spatula/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/bamboo-spatula/1.webp"
    ],
    "description": "The Bamboo Spatula is a versatile kitchen tool made from eco-friendly bamboo. Ideal for flipping, stirring, and serving various dishes.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-BAM-048",
      "Rating": "3.27 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-49",
    "title": "Black Aluminium Cup",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 5.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/black-aluminium-cup/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/black-aluminium-cup/1.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/black-aluminium-cup/2.webp"
    ],
    "description": "The Black Aluminium Cup is a stylish and durable cup suitable for both hot and cold beverages. Its sleek black design adds a modern touch to your drinkware collection.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-BLA-049",
      "Rating": "4.46 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-50",
    "title": "Black Whisk",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 9.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/black-whisk/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/black-whisk/1.webp"
    ],
    "description": "The Black Whisk is a kitchen essential for whisking and beating ingredients. Its ergonomic handle and sleek design make it a practical and stylish tool.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-BLA-050",
      "Rating": "3.9 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-51",
    "title": "Boxed Blender",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 39.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/1.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/2.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/3.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/4.webp"
    ],
    "description": "The Boxed Blender is a powerful and compact blender perfect for smoothies, shakes, and more. Its convenient design and multiple functions make it a versatile kitchen appliance.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-BOX-051",
      "Rating": "4.56 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-52",
    "title": "Carbon Steel Wok",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/carbon-steel-wok/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/carbon-steel-wok/1.webp"
    ],
    "description": "The Carbon Steel Wok is a versatile cooking pan suitable for stir-frying, sautéing, and deep frying. Its sturdy construction ensures even heat distribution for delicious meals.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-CAR-052",
      "Rating": "4.05 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-53",
    "title": "Chopping Board",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/chopping-board/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/chopping-board/1.webp"
    ],
    "description": "The Chopping Board is an essential kitchen accessory for food preparation. Made from durable material, it provides a safe and hygienic surface for cutting and chopping.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-CHO-053",
      "Rating": "3.7 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-54",
    "title": "Citrus Squeezer Yellow",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 8.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/citrus-squeezer-yellow/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/citrus-squeezer-yellow/1.webp"
    ],
    "description": "The Citrus Squeezer in Yellow is a handy tool for extracting juice from citrus fruits. Its vibrant color adds a cheerful touch to your kitchen gadgets.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-CIT-054",
      "Rating": "4.63 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-55",
    "title": "Egg Slicer",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 6.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/egg-slicer/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/egg-slicer/1.webp"
    ],
    "description": "The Egg Slicer is a convenient tool for slicing boiled eggs evenly. It's perfect for salads, sandwiches, and other dishes where sliced eggs are desired.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-SLI-055",
      "Rating": "3.09 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-56",
    "title": "Electric Stove",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/electric-stove/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/electric-stove/1.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/electric-stove/2.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/electric-stove/3.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/electric-stove/4.webp"
    ],
    "description": "The Electric Stove provides a portable and efficient cooking solution. Ideal for small kitchens or as an additional cooking surface for various culinary needs.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-ELE-056",
      "Rating": "4.11 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-57",
    "title": "Fine Mesh Strainer",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 9.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/fine-mesh-strainer/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/fine-mesh-strainer/1.webp"
    ],
    "description": "The Fine Mesh Strainer is a versatile tool for straining liquids and sifting dry ingredients. Its fine mesh ensures efficient filtering for smooth cooking and baking.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-FIN-057",
      "Rating": "3.04 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-58",
    "title": "Fork",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 3.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/fork/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/fork/1.webp"
    ],
    "description": "The Fork is a classic utensil for various dining and serving purposes. Its durable and ergonomic design makes it a reliable choice for everyday use.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-FOR-058",
      "Rating": "3.11 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-59",
    "title": "Glass",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 4.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/glass/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/glass/1.webp"
    ],
    "description": "The Glass is a versatile and elegant drinking vessel suitable for a variety of beverages. Its clear design allows you to enjoy the colors and textures of your drinks.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-GLA-059",
      "Rating": "4.02 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-60",
    "title": "Grater Black",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 10.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/grater-black/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/grater-black/1.webp"
    ],
    "description": "The Grater in Black is a handy kitchen tool for grating cheese, vegetables, and more. Its sleek design and sharp blades make food preparation efficient and easy.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-GRA-060",
      "Rating": "3.21 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-61",
    "title": "Hand Blender",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 34.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/hand-blender/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/hand-blender/1.webp"
    ],
    "description": "The Hand Blender is a versatile kitchen appliance for blending, pureeing, and mixing. Its compact design and powerful motor make it a convenient tool for various recipes.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-HAN-061",
      "Rating": "3.86 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-62",
    "title": "Ice Cube Tray",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 5.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/ice-cube-tray/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/ice-cube-tray/1.webp"
    ],
    "description": "The Ice Cube Tray is a practical accessory for making ice cubes in various shapes. Perfect for keeping your drinks cool and adding a fun element to your beverages.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-CUB-062",
      "Rating": "4.71 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-63",
    "title": "Kitchen Sieve",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 7.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/kitchen-sieve/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/kitchen-sieve/1.webp"
    ],
    "description": "The Kitchen Sieve is a versatile tool for sifting and straining dry and wet ingredients. Its fine mesh design ensures smooth results in your cooking and baking.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-KIT-063",
      "Rating": "3.09 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-64",
    "title": "Knife",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 14.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/knife/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/knife/1.webp"
    ],
    "description": "The Knife is an essential kitchen tool for chopping, slicing, and dicing. Its sharp blade and ergonomic handle make it a reliable choice for food preparation.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-KNI-064",
      "Rating": "3.26 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-65",
    "title": "Lunch Box",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/lunch-box/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/lunch-box/1.webp"
    ],
    "description": "The Lunch Box is a convenient and portable container for packing and carrying your meals. With compartments for different foods, it's perfect for on-the-go dining.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-LUN-065",
      "Rating": "4.93 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-66",
    "title": "Microwave Oven",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 89.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/1.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/2.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/3.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/4.webp"
    ],
    "description": "The Microwave Oven is a versatile kitchen appliance for quick and efficient cooking, reheating, and defrosting. Its compact size makes it suitable for various kitchen setups.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-MIC-066",
      "Rating": "4.82 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-67",
    "title": "Mug Tree Stand",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 15.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/mug-tree-stand/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/mug-tree-stand/1.webp",
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/mug-tree-stand/2.webp"
    ],
    "description": "The Mug Tree Stand is a stylish and space-saving solution for organizing your mugs. Keep your favorite mugs easily accessible and neatly displayed in your kitchen.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-TRE-067",
      "Rating": "2.64 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-68",
    "title": "Pan",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 24.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/pan/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/pan/1.webp"
    ],
    "description": "The Pan is a versatile and essential cookware item for frying, sautéing, and cooking various dishes. Its non-stick coating ensures easy food release and cleanup.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-PRD-068",
      "Rating": "2.79 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-69",
    "title": "Plate",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 3.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/plate/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/plate/1.webp"
    ],
    "description": "The Plate is a classic and essential dishware item for serving meals. Its durable and stylish design makes it suitable for everyday use or special occasions.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-PLA-069",
      "Rating": "3.65 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-70",
    "title": "Red Tongs",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 6.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/red-tongs/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/red-tongs/1.webp"
    ],
    "description": "The Red Tongs are versatile kitchen tongs suitable for various cooking and serving tasks. Their vibrant color adds a pop of excitement to your kitchen utensils.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-TON-070",
      "Rating": "4.42 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-71",
    "title": "Silver Pot With Glass Cap",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 39.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/silver-pot-with-glass-cap/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/silver-pot-with-glass-cap/1.webp"
    ],
    "description": "The Silver Pot with Glass Cap is a stylish and functional cookware item for boiling, simmering, and preparing delicious meals. Its glass cap allows you to monitor cooking progress.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-SIL-071",
      "Rating": "3.22 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-72",
    "title": "Slotted Turner",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 129,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/slotted-turner/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/slotted-turner/1.webp"
    ],
    "description": "The Slotted Turner is a kitchen utensil designed for flipping and turning food items. Its slotted design allows excess liquid to drain, making it ideal for frying and sautéing.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-SLO-072",
      "Rating": "3.4 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-73",
    "title": "Spice Rack",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/spice-rack/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/spice-rack/1.webp"
    ],
    "description": "The Spice Rack is a convenient organizer for your spices and seasonings. Keep your kitchen essentials within reach and neatly arranged with this stylish spice rack.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-SPI-073",
      "Rating": "4.87 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-74",
    "title": "Spoon",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 4.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/spoon/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/spoon/1.webp"
    ],
    "description": "The Spoon is a versatile kitchen utensil for stirring, serving, and tasting. Its ergonomic design and durable construction make it an essential tool for every kitchen.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-SPO-074",
      "Rating": "4.03 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-75",
    "title": "Tray",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 16.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/tray/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/tray/1.webp"
    ],
    "description": "The Tray is a functional and decorative item for serving snacks, appetizers, or drinks. Its stylish design makes it a versatile accessory for entertaining guests.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-TRA-075",
      "Rating": "4.62 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-76",
    "title": "Wooden Rolling Pin",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 11.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/wooden-rolling-pin/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/wooden-rolling-pin/1.webp"
    ],
    "description": "The Wooden Rolling Pin is a classic kitchen tool for rolling out dough for baking. Its smooth surface and sturdy handles make it easy to achieve uniform thickness.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-WOO-076",
      "Rating": "2.92 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-77",
    "title": "Yellow Peeler",
    "brand": "Chef Master",
    "category": "Home & Kitchen",
    "subcategory": "Cookware & Chef Essentials",
    "price": 5.99,
    "image": "https://cdn.dummyjson.com/product-images/kitchen-accessories/yellow-peeler/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/kitchen-accessories/yellow-peeler/1.webp"
    ],
    "description": "The Yellow Peeler is a handy tool for peeling fruits and vegetables with ease. Its bright yellow color adds a cheerful touch to your kitchen gadgets.",
    "specifications": {
      "Brand": "Chef Master",
      "Category": "Home & Kitchen",
      "Model / SKU": "KIT-BRD-YEL-077",
      "Rating": "4.24 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-78",
    "title": "Apple MacBook Pro 14 Inch Space Grey",
    "brand": "Apple",
    "category": "Computers & Technology",
    "subcategory": "Laptops & Ultrabooks",
    "price": 1999,
    "image": "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp",
      "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/2.webp",
      "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/3.webp"
    ],
    "description": "The MacBook Pro 14 Inch in Space Grey is a powerful and sleek laptop, featuring Apple's M1 Pro chip for exceptional performance and a stunning Retina display.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Computers & Technology",
      "Model / SKU": "LAP-APP-APP-078",
      "Rating": "3.65 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-79",
    "title": "Asus Zenbook Pro Dual Screen Laptop",
    "brand": "Asus",
    "category": "Computers & Technology",
    "subcategory": "Laptops & Ultrabooks",
    "price": 1799.99,
    "image": "https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp",
      "https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/2.webp",
      "https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/3.webp"
    ],
    "description": "The Asus Zenbook Pro Dual Screen Laptop is a high-performance device with dual screens, providing productivity and versatility for creative professionals.",
    "specifications": {
      "Brand": "Asus",
      "Category": "Computers & Technology",
      "Model / SKU": "LAP-ASU-ASU-079",
      "Rating": "3.95 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-80",
    "title": "Huawei Matebook X Pro",
    "brand": "Huawei",
    "category": "Computers & Technology",
    "subcategory": "Laptops & Ultrabooks",
    "price": 1399,
    "image": "https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/1.webp",
      "https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/2.webp",
      "https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/3.webp"
    ],
    "description": "The Huawei Matebook X Pro is a slim and stylish laptop with a high-resolution touchscreen display, offering a premium experience for users on the go.",
    "specifications": {
      "Brand": "Huawei",
      "Category": "Computers & Technology",
      "Model / SKU": "LAP-HUA-HUA-080",
      "Rating": "4.98 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-81",
    "title": "Lenovo Yoga 920",
    "brand": "Lenovo",
    "category": "Computers & Technology",
    "subcategory": "Laptops & Ultrabooks",
    "price": 1249.99,
    "image": "https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/1.webp",
      "https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/2.webp",
      "https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/3.webp"
    ],
    "description": "The Lenovo Yoga 920 is a 2-in-1 convertible laptop with a flexible hinge, allowing you to use it as a laptop or tablet, offering versatility and portability.",
    "specifications": {
      "Brand": "Lenovo",
      "Category": "Computers & Technology",
      "Model / SKU": "LAP-LEN-LEN-081",
      "Rating": "2.86 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-82",
    "title": "New DELL XPS 13 9300 Laptop",
    "brand": "Dell",
    "category": "Computers & Technology",
    "subcategory": "Laptops & Ultrabooks",
    "price": 1499,
    "image": "https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/1.webp",
      "https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/2.webp",
      "https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/3.webp"
    ],
    "description": "The New DELL XPS 13 9300 Laptop is a compact and powerful device, featuring a virtually borderless InfinityEdge display and high-end performance for various tasks.",
    "specifications": {
      "Brand": "Dell",
      "Category": "Computers & Technology",
      "Model / SKU": "LAP-DEL-DEL-082",
      "Rating": "2.67 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-83",
    "title": "Blue & Black Check Shirt",
    "brand": "Fashion Trends",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Shirts & Polos",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/4.webp"
    ],
    "description": "The Blue & Black Check Shirt is a stylish and comfortable men's shirt featuring a classic check pattern. Made from high-quality fabric, it's suitable for both casual and semi-formal occasions.",
    "specifications": {
      "Brand": "Fashion Trends",
      "Category": "Clothing & Apparel",
      "Model / SKU": "MEN-FAS-BLU-083",
      "Rating": "3.64 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-84",
    "title": "Gigabyte Aorus Men Tshirt",
    "brand": "Gigabyte",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Shirts & Polos",
    "price": 24.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/4.webp"
    ],
    "description": "The Gigabyte Aorus Men Tshirt is a cool and casual shirt for gaming enthusiasts. With the Aorus logo and sleek design, it's perfect for expressing your gaming style.",
    "specifications": {
      "Brand": "Gigabyte",
      "Category": "Clothing & Apparel",
      "Model / SKU": "MEN-GIG-GIG-084",
      "Rating": "3.18 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-85",
    "title": "Man Plaid Shirt",
    "brand": "Classic Wear",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Shirts & Polos",
    "price": 34.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/4.webp"
    ],
    "description": "The Man Plaid Shirt is a timeless and versatile men's shirt with a classic plaid pattern. Its comfortable fit and casual style make it a wardrobe essential for various occasions.",
    "specifications": {
      "Brand": "Classic Wear",
      "Category": "Clothing & Apparel",
      "Model / SKU": "MEN-CLA-PLA-085",
      "Rating": "3.46 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-86",
    "title": "Man Short Sleeve Shirt",
    "brand": "Casual Comfort",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Shirts & Polos",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/4.webp"
    ],
    "description": "The Man Short Sleeve Shirt is a breezy and stylish option for warm days. With a comfortable fit and short sleeves, it's perfect for a laid-back yet polished look.",
    "specifications": {
      "Brand": "Casual Comfort",
      "Category": "Clothing & Apparel",
      "Model / SKU": "MEN-CAS-SHO-086",
      "Rating": "2.9 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-87",
    "title": "Men Check Shirt",
    "brand": "Urban Chic",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Shirts & Polos",
    "price": 27.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/4.webp"
    ],
    "description": "The Men Check Shirt is a classic and versatile shirt featuring a stylish check pattern. Suitable for various occasions, it adds a smart and polished touch to your wardrobe.",
    "specifications": {
      "Brand": "Urban Chic",
      "Category": "Clothing & Apparel",
      "Model / SKU": "MEN-URB-CHE-087",
      "Rating": "2.72 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-88",
    "title": "Nike Air Jordan 1 Red And Black",
    "brand": "Nike",
    "category": "Shoes & Footwear",
    "subcategory": "Men's Sneakers & Oxfords",
    "price": 149.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/4.webp"
    ],
    "description": "The Nike Air Jordan 1 in Red and Black is an iconic basketball sneaker known for its stylish design and high-performance features, making it a favorite among sneaker enthusiasts and athletes.",
    "specifications": {
      "Brand": "Nike",
      "Category": "Shoes & Footwear",
      "Model / SKU": "MEN-NIK-NIK-088",
      "Rating": "4.77 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-89",
    "title": "Nike Baseball Cleats",
    "brand": "Nike",
    "category": "Shoes & Footwear",
    "subcategory": "Men's Sneakers & Oxfords",
    "price": 79.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/4.webp"
    ],
    "description": "Nike Baseball Cleats are designed for maximum traction and performance on the baseball field. They provide stability and support for players during games and practices.",
    "specifications": {
      "Brand": "Nike",
      "Category": "Shoes & Footwear",
      "Model / SKU": "MEN-NIK-NIK-089",
      "Rating": "3.88 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-90",
    "title": "Puma Future Rider Trainers",
    "brand": "Puma",
    "category": "Shoes & Footwear",
    "subcategory": "Men's Sneakers & Oxfords",
    "price": 89.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/4.webp"
    ],
    "description": "The Puma Future Rider Trainers offer a blend of retro style and modern comfort. Perfect for casual wear, these trainers provide a fashionable and comfortable option for everyday use.",
    "specifications": {
      "Brand": "Puma",
      "Category": "Shoes & Footwear",
      "Model / SKU": "MEN-PUM-PUM-090",
      "Rating": "4.9 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-91",
    "title": "Sports Sneakers Off White & Red",
    "brand": "Off White",
    "category": "Shoes & Footwear",
    "subcategory": "Men's Sneakers & Oxfords",
    "price": 119.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/4.webp"
    ],
    "description": "The Sports Sneakers in Off White and Red combine style and functionality, making them a fashionable choice for sports enthusiasts. The red and off-white color combination adds a bold and energetic touch.",
    "specifications": {
      "Brand": "Off White",
      "Category": "Shoes & Footwear",
      "Model / SKU": "MEN-OFF-SPO-091",
      "Rating": "4.77 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-92",
    "title": "Sports Sneakers Off White Red",
    "brand": "Off White",
    "category": "Shoes & Footwear",
    "subcategory": "Men's Sneakers & Oxfords",
    "price": 109.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/3.webp",
      "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/4.webp"
    ],
    "description": "Another variant of the Sports Sneakers in Off White Red, featuring a unique design. These sneakers offer style and comfort for casual occasions.",
    "specifications": {
      "Brand": "Off White",
      "Category": "Shoes & Footwear",
      "Model / SKU": "MEN-OFF-SPO-092",
      "Rating": "4.69 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-93",
    "title": "Brown Leather Belt Watch",
    "brand": "Fashion Timepieces",
    "category": "Watches & Jewelry",
    "subcategory": "Men's Chronograph Watches",
    "price": 89.99,
    "image": "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/3.webp"
    ],
    "description": "The Brown Leather Belt Watch is a stylish timepiece with a classic design. Featuring a genuine leather strap and a sleek dial, it adds a touch of sophistication to your look.",
    "specifications": {
      "Brand": "Fashion Timepieces",
      "Category": "Watches & Jewelry",
      "Model / SKU": "MEN-FAS-BRO-093",
      "Rating": "4.19 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-94",
    "title": "Longines Master Collection",
    "brand": "Longines",
    "category": "Watches & Jewelry",
    "subcategory": "Men's Chronograph Watches",
    "price": 2450,
    "image": "https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/3.webp"
    ],
    "description": "The Longines Master Collection is an elegant and refined watch known for its precision and craftsmanship. With a timeless design, it's a symbol of luxury and sophistication.",
    "specifications": {
      "Brand": "Longines",
      "Category": "Watches & Jewelry",
      "Model / SKU": "MEN-LON-LON-094",
      "Rating": "3.87 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-95",
    "title": "Rolex Cellini Date Black Dial",
    "brand": "Rolex",
    "category": "Watches & Jewelry",
    "subcategory": "Men's Chronograph Watches",
    "price": 4950,
    "image": "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/3.webp"
    ],
    "description": "The Rolex Cellini Date with Black Dial is a classic and prestigious watch. With a black dial and date complication, it exudes sophistication and is a symbol of Rolex's heritage.",
    "specifications": {
      "Brand": "Rolex",
      "Category": "Watches & Jewelry",
      "Model / SKU": "MEN-ROL-ROL-095",
      "Rating": "4.97 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-96",
    "title": "Rolex Cellini Moonphase",
    "brand": "Rolex",
    "category": "Watches & Jewelry",
    "subcategory": "Men's Chronograph Watches",
    "price": 5850,
    "image": "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/3.webp"
    ],
    "description": "The Rolex Cellini Moonphase is a masterpiece of horology, featuring a moon phase complication and exquisite design. It reflects Rolex's commitment to precision and elegance.",
    "specifications": {
      "Brand": "Rolex",
      "Category": "Watches & Jewelry",
      "Model / SKU": "MEN-ROL-ROL-096",
      "Rating": "2.58 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-97",
    "title": "Rolex Datejust",
    "brand": "Rolex",
    "category": "Watches & Jewelry",
    "subcategory": "Men's Chronograph Watches",
    "price": 5400,
    "image": "https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/3.webp"
    ],
    "description": "The Rolex Datejust is an iconic and versatile timepiece with a date window. Known for its timeless design and reliability, it's a symbol of Rolex's watchmaking excellence.",
    "specifications": {
      "Brand": "Rolex",
      "Category": "Watches & Jewelry",
      "Model / SKU": "MEN-ROL-ROL-097",
      "Rating": "3.66 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-98",
    "title": "Rolex Submariner Watch",
    "brand": "Rolex",
    "category": "Watches & Jewelry",
    "subcategory": "Men's Chronograph Watches",
    "price": 6200,
    "image": "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/2.webp",
      "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/3.webp"
    ],
    "description": "The Rolex Submariner is a legendary dive watch with a rich history. Known for its durability and water resistance, it's a symbol of adventure and exploration.",
    "specifications": {
      "Brand": "Rolex",
      "Category": "Watches & Jewelry",
      "Model / SKU": "MEN-ROL-ROL-098",
      "Rating": "2.69 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-99",
    "title": "Amazon Echo Plus",
    "brand": "Amazon",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 99.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/2.webp"
    ],
    "description": "The Amazon Echo Plus is a smart speaker with built-in Alexa voice control. It features premium sound quality and serves as a hub for controlling smart home devices.",
    "specifications": {
      "Brand": "Amazon",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-AMA-AMA-099",
      "Rating": "4.99 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-100",
    "title": "Apple Airpods",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/2.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/3.webp"
    ],
    "description": "The Apple Airpods offer a seamless wireless audio experience. With easy pairing, high-quality sound, and Siri integration, they are perfect for on-the-go listening.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-100",
      "Rating": "4.15 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-101",
    "title": "Apple AirPods Max Silver",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 549.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp"
    ],
    "description": "The Apple AirPods Max in Silver are premium over-ear headphones with high-fidelity audio, adaptive EQ, and active noise cancellation. Experience immersive sound in style.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-101",
      "Rating": "3.47 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-102",
    "title": "Apple Airpower Wireless Charger",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 79.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpower-wireless-charger/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpower-wireless-charger/1.webp"
    ],
    "description": "The Apple AirPower Wireless Charger provides a convenient way to charge your compatible Apple devices wirelessly. Simply place your devices on the charging mat for effortless charging.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-102",
      "Rating": "3.68 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-103",
    "title": "Apple HomePod Mini Cosmic Grey",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 99.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-homepod-mini-cosmic-grey/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp"
    ],
    "description": "The Apple HomePod Mini in Cosmic Grey is a compact smart speaker that delivers impressive audio and integrates seamlessly with the Apple ecosystem for a smart home experience.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-103",
      "Rating": "4.62 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-104",
    "title": "Apple iPhone Charger",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/2.webp"
    ],
    "description": "The Apple iPhone Charger is a high-quality charger designed for fast and efficient charging of your iPhone. Ensure your device stays powered up and ready to go.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-104",
      "Rating": "4.15 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-105",
    "title": "Apple MagSafe Battery Pack",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 99.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/2.webp"
    ],
    "description": "The Apple MagSafe Battery Pack is a portable and convenient way to add extra battery life to your MagSafe-compatible iPhone. Attach it magnetically for a secure connection.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-105",
      "Rating": "3.62 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-106",
    "title": "Apple Watch Series 4 Gold",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 349.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/2.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/3.webp"
    ],
    "description": "The Apple Watch Series 4 in Gold is a stylish and advanced smartwatch with features like heart rate monitoring, fitness tracking, and a beautiful Retina display.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-APP-106",
      "Rating": "2.74 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-107",
    "title": "Beats Flex Wireless Earphones",
    "brand": "Beats",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/beats-flex-wireless-earphones/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/beats-flex-wireless-earphones/1.webp"
    ],
    "description": "The Beats Flex Wireless Earphones offer a comfortable and versatile audio experience. With magnetic earbuds and up to 12 hours of battery life, they are ideal for everyday use.",
    "specifications": {
      "Brand": "Beats",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-BEA-BEA-107",
      "Rating": "4.24 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-108",
    "title": "iPhone 12 Silicone Case with MagSafe Plum",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/2.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/3.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/4.webp"
    ],
    "description": "The iPhone 12 Silicone Case with MagSafe in Plum is a stylish and protective case designed for the iPhone 12. It features MagSafe technology for easy attachment of accessories.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-APP-IPH-108",
      "Rating": "3.62 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-109",
    "title": "Monopod",
    "brand": "TechGear",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/monopod/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/monopod/1.webp",
      "https://cdn.dummyjson.com/product-images/mobile-accessories/monopod/2.webp"
    ],
    "description": "The Monopod is a versatile camera accessory for stable and adjustable shooting. Perfect for capturing selfies, group photos, and videos with ease.",
    "specifications": {
      "Brand": "TechGear",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-TEC-MON-109",
      "Rating": "4.43 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-110",
    "title": "Selfie Lamp with iPhone",
    "brand": "GadgetMaster",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 14.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/selfie-lamp-with-iphone/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/selfie-lamp-with-iphone/1.webp"
    ],
    "description": "The Selfie Lamp with iPhone is a portable and adjustable LED light designed to enhance your selfies and video calls. Attach it to your iPhone for well-lit photos.",
    "specifications": {
      "Brand": "GadgetMaster",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-GAD-SEL-110",
      "Rating": "3.55 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-111",
    "title": "Selfie Stick Monopod",
    "brand": "SnapTech",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/selfie-stick-monopod/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/selfie-stick-monopod/1.webp"
    ],
    "description": "The Selfie Stick Monopod is a extendable and foldable device for capturing the perfect selfie or group photo. Compatible with smartphones and cameras.",
    "specifications": {
      "Brand": "SnapTech",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-SNA-SEL-111",
      "Rating": "3.88 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-112",
    "title": "TV Studio Camera Pedestal",
    "brand": "ProVision",
    "category": "Smartphones & Mobile",
    "subcategory": "Mobile Accessories & Chargers",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/mobile-accessories/tv-studio-camera-pedestal/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/mobile-accessories/tv-studio-camera-pedestal/1.webp"
    ],
    "description": "The TV Studio Camera Pedestal is a professional-grade camera support system for smooth and precise camera movements in a studio setting. Ideal for broadcast and production.",
    "specifications": {
      "Brand": "ProVision",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "MOB-PRO-STU-112",
      "Rating": "2.78 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-113",
    "title": "Generic Motorcycle",
    "brand": "Generic Motors",
    "category": "Automotive & Tools",
    "subcategory": "Motorcycle & Riding Gear",
    "price": 399.99,
    "image": "https://cdn.dummyjson.com/product-images/motorcycle/generic-motorcycle/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/motorcycle/generic-motorcycle/1.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/generic-motorcycle/2.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/generic-motorcycle/3.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/generic-motorcycle/4.webp"
    ],
    "description": "The Generic Motorcycle is a versatile and reliable bike suitable for various riding preferences. With a balanced design, it provides a comfortable and efficient riding experience.",
    "specifications": {
      "Brand": "Generic Motors",
      "Category": "Automotive & Tools",
      "Model / SKU": "MOT-GEN-GEN-113",
      "Rating": "4.91 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-114",
    "title": "Kawasaki Z800",
    "brand": "Kawasaki",
    "category": "Automotive & Tools",
    "subcategory": "Motorcycle & Riding Gear",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/motorcycle/kawasaki-z800/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/motorcycle/kawasaki-z800/1.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/kawasaki-z800/2.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/kawasaki-z800/3.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/kawasaki-z800/4.webp"
    ],
    "description": "The Kawasaki Z800 is a powerful and agile sportbike known for its striking design and performance. It's equipped with advanced features, making it a favorite among motorcycle enthusiasts.",
    "specifications": {
      "Brand": "Kawasaki",
      "Category": "Automotive & Tools",
      "Model / SKU": "MOT-KAW-KAW-114",
      "Rating": "3.98 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-115",
    "title": "MotoGP CI.H1",
    "brand": "MotoGP",
    "category": "Automotive & Tools",
    "subcategory": "Motorcycle & Riding Gear",
    "price": 299.99,
    "image": "https://cdn.dummyjson.com/product-images/motorcycle/motogp-ci.h1/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/motorcycle/motogp-ci.h1/1.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/motogp-ci.h1/2.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/motogp-ci.h1/3.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/motogp-ci.h1/4.webp"
    ],
    "description": "The MotoGP CI.H1 is a high-performance motorcycle inspired by MotoGP racing technology. It offers cutting-edge features and precision engineering for an exhilarating riding experience.",
    "specifications": {
      "Brand": "MotoGP",
      "Category": "Automotive & Tools",
      "Model / SKU": "MOT-MOT-MOT-115",
      "Rating": "2.97 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-116",
    "title": "Scooter Motorcycle",
    "brand": "ScootMaster",
    "category": "Automotive & Tools",
    "subcategory": "Motorcycle & Riding Gear",
    "price": 299.99,
    "image": "https://cdn.dummyjson.com/product-images/motorcycle/scooter-motorcycle/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/motorcycle/scooter-motorcycle/1.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/scooter-motorcycle/2.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/scooter-motorcycle/3.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/scooter-motorcycle/4.webp"
    ],
    "description": "The Scooter Motorcycle is a practical and fuel-efficient bike ideal for urban commuting. It features a step-through design and user-friendly controls for easy maneuverability.",
    "specifications": {
      "Brand": "ScootMaster",
      "Category": "Automotive & Tools",
      "Model / SKU": "MOT-SCO-SCO-116",
      "Rating": "2.53 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-117",
    "title": "Sportbike Motorcycle",
    "brand": "SpeedMaster",
    "category": "Automotive & Tools",
    "subcategory": "Motorcycle & Riding Gear",
    "price": 649.99,
    "image": "https://cdn.dummyjson.com/product-images/motorcycle/sportbike-motorcycle/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/motorcycle/sportbike-motorcycle/1.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/sportbike-motorcycle/2.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/sportbike-motorcycle/3.webp",
      "https://cdn.dummyjson.com/product-images/motorcycle/sportbike-motorcycle/4.webp"
    ],
    "description": "The Sportbike Motorcycle is designed for speed and agility, with a sleek and aerodynamic profile. It's suitable for riders looking for a dynamic and thrilling riding experience.",
    "specifications": {
      "Brand": "SpeedMaster",
      "Category": "Automotive & Tools",
      "Model / SKU": "MOT-SPE-SPO-117",
      "Rating": "3.94 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-118",
    "title": "Attitude Super Leaves Hand Soap",
    "brand": "Attitude",
    "category": "Beauty & Personal Care",
    "subcategory": "Facial Skincare & Serums",
    "price": 8.99,
    "image": "https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/1.webp",
      "https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/2.webp",
      "https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/3.webp"
    ],
    "description": "Attitude Super Leaves Hand Soap is a natural and nourishing hand soap enriched with the goodness of super leaves. It cleanses and moisturizes your hands, leaving them feeling fresh and soft.",
    "specifications": {
      "Brand": "Attitude",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "SKI-ATT-ATT-118",
      "Rating": "3.19 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-119",
    "title": "Olay Ultra Moisture Shea Butter Body Wash",
    "brand": "Olay",
    "category": "Beauty & Personal Care",
    "subcategory": "Facial Skincare & Serums",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/skin-care/olay-ultra-moisture-shea-butter-body-wash/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/skin-care/olay-ultra-moisture-shea-butter-body-wash/1.webp",
      "https://cdn.dummyjson.com/product-images/skin-care/olay-ultra-moisture-shea-butter-body-wash/2.webp",
      "https://cdn.dummyjson.com/product-images/skin-care/olay-ultra-moisture-shea-butter-body-wash/3.webp"
    ],
    "description": "Olay Ultra Moisture Shea Butter Body Wash is a luxurious body wash that hydrates and nourishes your skin with the moisturizing power of shea butter. Enjoy a rich lather and silky-smooth skin.",
    "specifications": {
      "Brand": "Olay",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "SKI-OLA-OLA-119",
      "Rating": "4.51 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-120",
    "title": "Vaseline Men Body and Face Lotion",
    "brand": "Vaseline",
    "category": "Beauty & Personal Care",
    "subcategory": "Facial Skincare & Serums",
    "price": 9.99,
    "image": "https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/1.webp",
      "https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/2.webp",
      "https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/3.webp"
    ],
    "description": "Vaseline Men Body and Face Lotion is a specially formulated lotion designed to provide long-lasting moisture to men's skin. It absorbs quickly and helps keep the skin hydrated and healthy.",
    "specifications": {
      "Brand": "Vaseline",
      "Category": "Beauty & Personal Care",
      "Model / SKU": "SKI-VAS-VAS-120",
      "Rating": "3.16 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-121",
    "title": "iPhone 5s",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/3.webp"
    ],
    "description": "The iPhone 5s is a classic smartphone known for its compact design and advanced features during its release. While it's an older model, it still provides a reliable user experience.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-APP-IPH-121",
      "Rating": "2.83 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-122",
    "title": "iPhone 6",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 69.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/iphone-6/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-6/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-6/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-6/3.webp"
    ],
    "description": "The iPhone 6 is a stylish and capable smartphone with a larger display and improved performance. It introduced new features and design elements, making it a popular choice in its time.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-APP-IPH-122",
      "Rating": "3.41 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-123",
    "title": "iPhone 13 Pro",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 649,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/3.webp"
    ],
    "description": "The iPhone 13 Pro is a cutting-edge smartphone with a powerful camera system, high-performance chip, and stunning display. It offers advanced features for users who demand top-notch technology.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-APP-IPH-123",
      "Rating": "4.12 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-124",
    "title": "iPhone X",
    "brand": "Apple",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 199,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/iphone-x/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-x/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-x/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/iphone-x/3.webp"
    ],
    "description": "The iPhone X is a flagship smartphone featuring a bezel-less OLED display, facial recognition technology (Face ID), and impressive performance. It represents a milestone in iPhone design and innovation.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-APP-IPH-124",
      "Rating": "2.51 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-125",
    "title": "Oppo A57",
    "brand": "Oppo",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 139.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/3.webp"
    ],
    "description": "The Oppo A57 is a mid-range smartphone known for its sleek design and capable features. It offers a balance of performance and affordability, making it a popular choice.",
    "specifications": {
      "Brand": "Oppo",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-OPP-OPP-125",
      "Rating": "3.94 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-126",
    "title": "Oppo F19 Pro Plus",
    "brand": "Oppo",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 179.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/3.webp"
    ],
    "description": "The Oppo F19 Pro Plus is a feature-rich smartphone with a focus on camera capabilities. It boasts advanced photography features and a powerful performance for a premium user experience.",
    "specifications": {
      "Brand": "Oppo",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-OPP-OPP-126",
      "Rating": "3.51 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-127",
    "title": "Oppo K1",
    "brand": "Oppo",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 149.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/3.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/4.webp"
    ],
    "description": "The Oppo K1 series offers a range of smartphones with various features and specifications. Known for their stylish design and reliable performance, the Oppo K1 series caters to diverse user preferences.",
    "specifications": {
      "Brand": "Oppo",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-OPP-OPP-127",
      "Rating": "4.25 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-128",
    "title": "Realme C35",
    "brand": "Realme",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/realme-c35/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/realme-c35/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/realme-c35/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/realme-c35/3.webp"
    ],
    "description": "The Realme C35 is a budget-friendly smartphone with a focus on providing essential features for everyday use. It offers a reliable performance and user-friendly experience.",
    "specifications": {
      "Brand": "Realme",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-REA-REA-128",
      "Rating": "4.2 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-129",
    "title": "Realme X",
    "brand": "Realme",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 159.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/realme-x/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/realme-x/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/realme-x/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/realme-x/3.webp"
    ],
    "description": "The Realme X is a mid-range smartphone known for its sleek design and impressive display. It offers a good balance of performance and camera capabilities for users seeking a quality device.",
    "specifications": {
      "Brand": "Realme",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-REA-REA-129",
      "Rating": "3.7 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-130",
    "title": "Realme XT",
    "brand": "Realme",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 169.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/realme-xt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/realme-xt/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/realme-xt/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/realme-xt/3.webp"
    ],
    "description": "The Realme XT is a feature-rich smartphone with a focus on camera technology. It comes equipped with advanced camera sensors, delivering high-quality photos and videos for photography enthusiasts.",
    "specifications": {
      "Brand": "Realme",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-REA-REA-130",
      "Rating": "4.58 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-131",
    "title": "Samsung Galaxy S7",
    "brand": "Samsung",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 89.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/3.webp"
    ],
    "description": "The Samsung Galaxy S7 is a flagship smartphone known for its sleek design and advanced features. It features a high-resolution display, powerful camera, and robust performance.",
    "specifications": {
      "Brand": "Samsung",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-SAM-SAM-131",
      "Rating": "3.3 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-132",
    "title": "Samsung Galaxy S8",
    "brand": "Samsung",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 119.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/3.webp"
    ],
    "description": "The Samsung Galaxy S8 is a premium smartphone with an Infinity Display, offering a stunning visual experience. It boasts advanced camera capabilities and cutting-edge technology.",
    "specifications": {
      "Brand": "Samsung",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-SAM-SAM-132",
      "Rating": "4.4 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-133",
    "title": "Samsung Galaxy S10",
    "brand": "Samsung",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 189.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/3.webp"
    ],
    "description": "The Samsung Galaxy S10 is a flagship device featuring a dynamic AMOLED display, versatile camera system, and powerful performance. It represents innovation and excellence in smartphone technology.",
    "specifications": {
      "Brand": "Samsung",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-SAM-SAM-133",
      "Rating": "3.06 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-134",
    "title": "Vivo S1",
    "brand": "Vivo",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 139.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/3.webp"
    ],
    "description": "The Vivo S1 is a stylish and mid-range smartphone offering a blend of design and performance. It features a vibrant display, capable camera system, and reliable functionality.",
    "specifications": {
      "Brand": "Vivo",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-VIV-VIV-134",
      "Rating": "3.5 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-135",
    "title": "Vivo V9",
    "brand": "Vivo",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 149.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/3.webp"
    ],
    "description": "The Vivo V9 is a smartphone known for its sleek design and emphasis on capturing high-quality selfies. It features a notch display, dual-camera setup, and a modern design.",
    "specifications": {
      "Brand": "Vivo",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-VIV-VIV-135",
      "Rating": "3.6 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-136",
    "title": "Vivo X21",
    "brand": "Vivo",
    "category": "Smartphones & Mobile",
    "subcategory": "Flagship Smartphones",
    "price": 169.99,
    "image": "https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/1.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/2.webp",
      "https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/3.webp"
    ],
    "description": "The Vivo X21 is a premium smartphone with a focus on cutting-edge technology. It features an in-display fingerprint sensor, a high-resolution display, and advanced camera capabilities.",
    "specifications": {
      "Brand": "Vivo",
      "Category": "Smartphones & Mobile",
      "Model / SKU": "SMA-VIV-VIV-136",
      "Rating": "4.26 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-137",
    "title": "American Football",
    "brand": "Wilson",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/american-football/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/american-football/1.webp"
    ],
    "description": "The American Football is a classic ball used in American football games. It is designed for throwing and catching, making it an essential piece of equipment for the sport.",
    "specifications": {
      "Brand": "Wilson",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-AME-137",
      "Rating": "4.91 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-138",
    "title": "Baseball Ball",
    "brand": "Rawlings",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 8.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-ball/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-ball/1.webp"
    ],
    "description": "The Baseball Ball is a standard baseball used in baseball games. It features a durable leather cover and is designed for pitching, hitting, and fielding in the game of baseball.",
    "specifications": {
      "Brand": "Rawlings",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-BAS-138",
      "Rating": "2.57 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-139",
    "title": "Baseball Glove",
    "brand": "Rawlings",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 24.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/1.webp",
      "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/2.webp",
      "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/3.webp"
    ],
    "description": "The Baseball Glove is a protective glove worn by baseball players. It is designed to catch and field the baseball, providing players with comfort and control during the game.",
    "specifications": {
      "Brand": "Rawlings",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-BAS-139",
      "Rating": "3.96 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-140",
    "title": "Basketball",
    "brand": "Spalding",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 14.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/basketball/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/basketball/1.webp"
    ],
    "description": "The Basketball is a standard ball used in basketball games. It is designed for dribbling, shooting, and passing in the game of basketball, suitable for both indoor and outdoor play.",
    "specifications": {
      "Brand": "Spalding",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-BAS-140",
      "Rating": "4.66 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-141",
    "title": "Basketball Rim",
    "brand": "Spalding",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 39.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/basketball-rim/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/basketball-rim/1.webp"
    ],
    "description": "The Basketball Rim is a sturdy hoop and net assembly mounted on a basketball backboard. It provides a target for shooting and scoring in the game of basketball.",
    "specifications": {
      "Brand": "Spalding",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-BAS-141",
      "Rating": "4.6 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-142",
    "title": "Cricket Ball",
    "brand": "Kookaburra",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 12.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-ball/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-ball/1.webp"
    ],
    "description": "The Cricket Ball is a hard leather ball used in the sport of cricket. It is bowled and batted in the game, and its hardness and seam contribute to the dynamics of cricket play.",
    "specifications": {
      "Brand": "Kookaburra",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-CRI-142",
      "Rating": "3.53 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-143",
    "title": "Cricket Bat",
    "brand": "Kookaburra",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-bat/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-bat/1.webp"
    ],
    "description": "The Cricket Bat is an essential piece of cricket equipment used by batsmen to hit the cricket ball. It is made of wood and comes in various sizes and designs.",
    "specifications": {
      "Brand": "Kookaburra",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-CRI-143",
      "Rating": "3.17 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-144",
    "title": "Cricket Helmet",
    "brand": "Kookaburra",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 44.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-helmet/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-helmet/1.webp",
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-helmet/2.webp",
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-helmet/3.webp",
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-helmet/4.webp"
    ],
    "description": "The Cricket Helmet is a protective headgear worn by cricket players, especially batsmen and wicketkeepers. It provides protection against fast bowling and bouncers.",
    "specifications": {
      "Brand": "Kookaburra",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-CRI-144",
      "Rating": "4.69 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-145",
    "title": "Cricket Wicket",
    "brand": "Kookaburra",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-wicket/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/cricket-wicket/1.webp"
    ],
    "description": "The Cricket Wicket is a set of three stumps and two bails, forming a wicket used in the sport of cricket. Batsmen aim to protect the wicket while scoring runs.",
    "specifications": {
      "Brand": "Kookaburra",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-CRI-145",
      "Rating": "4.73 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-146",
    "title": "Feather Shuttlecock",
    "brand": "Yonex",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 5.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/feather-shuttlecock/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/feather-shuttlecock/1.webp"
    ],
    "description": "The Feather Shuttlecock is used in the sport of badminton. It features natural feathers and is designed for high-speed play, providing stability and accuracy during matches.",
    "specifications": {
      "Brand": "Yonex",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-FEA-146",
      "Rating": "2.85 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-147",
    "title": "Football",
    "brand": "Wilson",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 17.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/football/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/football/1.webp"
    ],
    "description": "The Football, also known as a soccer ball, is the standard ball used in the sport of football (soccer). It is designed for kicking and passing in the game.",
    "specifications": {
      "Brand": "Wilson",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-FOO-147",
      "Rating": "3.28 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-148",
    "title": "Golf Ball",
    "brand": "Callaway",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 9.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/golf-ball/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/golf-ball/1.webp"
    ],
    "description": "The Golf Ball is a small ball used in the sport of golf. It features dimples on its surface, providing aerodynamic lift and distance when struck by a golf club.",
    "specifications": {
      "Brand": "Callaway",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-GOL-148",
      "Rating": "4.3 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-149",
    "title": "Iron Golf",
    "brand": "Callaway",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/iron-golf/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/iron-golf/1.webp"
    ],
    "description": "The Iron Golf is a type of golf club designed for various golf shots. It features a solid metal head and is used for approach shots, chipping, and other golfing techniques.",
    "specifications": {
      "Brand": "Callaway",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-IRO-149",
      "Rating": "4.41 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-150",
    "title": "Metal Baseball Bat",
    "brand": "Rawlings",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/metal-baseball-bat/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/metal-baseball-bat/1.webp"
    ],
    "description": "The Metal Baseball Bat is a durable and lightweight baseball bat made from metal alloys. It is commonly used in baseball games for hitting and batting practice.",
    "specifications": {
      "Brand": "Rawlings",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-MET-150",
      "Rating": "4.66 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-151",
    "title": "Tennis Ball",
    "brand": "Wilson",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 6.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/tennis-ball/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/tennis-ball/1.webp"
    ],
    "description": "The Tennis Ball is a standard ball used in the sport of tennis. It is designed for bouncing and hitting with tennis rackets during matches or practice sessions.",
    "specifications": {
      "Brand": "Wilson",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-TEN-151",
      "Rating": "4.06 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-152",
    "title": "Tennis Racket",
    "brand": "Wilson",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/tennis-racket/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/tennis-racket/1.webp"
    ],
    "description": "The Tennis Racket is an essential piece of equipment used in the sport of tennis. It features a frame with strings and a grip, allowing players to hit the tennis ball.",
    "specifications": {
      "Brand": "Wilson",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-TEN-152",
      "Rating": "4.03 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-153",
    "title": "Volleyball",
    "brand": "Mikasa",
    "category": "Sports & Outdoors",
    "subcategory": "Fitness & Sports Gear",
    "price": 11.99,
    "image": "https://cdn.dummyjson.com/product-images/sports-accessories/volleyball/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sports-accessories/volleyball/1.webp"
    ],
    "description": "The Volleyball is a standard ball used in the sport of volleyball. It is designed for passing, setting, and spiking over the net during volleyball matches.",
    "specifications": {
      "Brand": "Mikasa",
      "Category": "Sports & Outdoors",
      "Model / SKU": "SPO-BRD-VOL-153",
      "Rating": "3.84 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-154",
    "title": "Black Sun Glasses",
    "brand": "Fashion Shades",
    "category": "Bags & Accessories",
    "subcategory": "Designer Sunglasses",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/1.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/2.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/3.webp"
    ],
    "description": "The Black Sun Glasses are a classic and stylish choice, featuring a sleek black frame and tinted lenses. They provide both UV protection and a fashionable look.",
    "specifications": {
      "Brand": "Fashion Shades",
      "Category": "Bags & Accessories",
      "Model / SKU": "SUN-FAS-BLA-154",
      "Rating": "4.41 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-155",
    "title": "Classic Sun Glasses",
    "brand": "Fashion Shades",
    "category": "Bags & Accessories",
    "subcategory": "Designer Sunglasses",
    "price": 24.99,
    "image": "https://cdn.dummyjson.com/product-images/sunglasses/classic-sun-glasses/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sunglasses/classic-sun-glasses/1.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/classic-sun-glasses/2.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/classic-sun-glasses/3.webp"
    ],
    "description": "The Classic Sun Glasses offer a timeless design with a neutral frame and UV-protected lenses. These sunglasses are versatile and suitable for various occasions.",
    "specifications": {
      "Brand": "Fashion Shades",
      "Category": "Bags & Accessories",
      "Model / SKU": "SUN-FAS-CLA-155",
      "Rating": "3.86 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-156",
    "title": "Green and Black Glasses",
    "brand": "Fashion Shades",
    "category": "Bags & Accessories",
    "subcategory": "Designer Sunglasses",
    "price": 34.99,
    "image": "https://cdn.dummyjson.com/product-images/sunglasses/green-and-black-glasses/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sunglasses/green-and-black-glasses/1.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/green-and-black-glasses/2.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/green-and-black-glasses/3.webp"
    ],
    "description": "The Green and Black Glasses feature a bold combination of green and black colors, adding a touch of vibrancy to your eyewear collection. They are both stylish and eye-catching.",
    "specifications": {
      "Brand": "Fashion Shades",
      "Category": "Bags & Accessories",
      "Model / SKU": "SUN-FAS-GRE-156",
      "Rating": "4.55 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-157",
    "title": "Party Glasses",
    "brand": "Fashion Fun",
    "category": "Bags & Accessories",
    "subcategory": "Designer Sunglasses",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/sunglasses/party-glasses/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sunglasses/party-glasses/1.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/party-glasses/2.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/party-glasses/3.webp"
    ],
    "description": "The Party Glasses are designed to add flair to your party outfit. With unique shapes or colorful frames, they're perfect for adding a playful touch to your look during celebrations.",
    "specifications": {
      "Brand": "Fashion Fun",
      "Category": "Bags & Accessories",
      "Model / SKU": "SUN-FAS-PAR-157",
      "Rating": "2.79 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-158",
    "title": "Sunglasses",
    "brand": "Fashion Shades",
    "category": "Bags & Accessories",
    "subcategory": "Designer Sunglasses",
    "price": 22.99,
    "image": "https://cdn.dummyjson.com/product-images/sunglasses/sunglasses/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/sunglasses/sunglasses/1.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/sunglasses/2.webp",
      "https://cdn.dummyjson.com/product-images/sunglasses/sunglasses/3.webp"
    ],
    "description": "The Sunglasses offer a classic and simple design with a focus on functionality. These sunglasses provide essential UV protection while maintaining a timeless look.",
    "specifications": {
      "Brand": "Fashion Shades",
      "Category": "Bags & Accessories",
      "Model / SKU": "SUN-FAS-SUN-158",
      "Rating": "3.02 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-159",
    "title": "iPad Mini 2021 Starlight",
    "brand": "Apple",
    "category": "Computers & Technology",
    "subcategory": "Tablets & Displays",
    "price": 499.99,
    "image": "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/1.webp",
      "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/2.webp",
      "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/3.webp",
      "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/4.webp"
    ],
    "description": "The iPad Mini 2021 in Starlight is a compact and powerful tablet from Apple. Featuring a stunning Retina display, powerful A-series chip, and a sleek design, it offers a premium tablet experience.",
    "specifications": {
      "Brand": "Apple",
      "Category": "Computers & Technology",
      "Model / SKU": "TAB-APP-IPA-159",
      "Rating": "3.18 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-160",
    "title": "Samsung Galaxy Tab S8 Plus Grey",
    "brand": "Samsung",
    "category": "Computers & Technology",
    "subcategory": "Tablets & Displays",
    "price": 599.99,
    "image": "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/1.webp",
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/2.webp",
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/3.webp",
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/4.webp"
    ],
    "description": "The Samsung Galaxy Tab S8 Plus in Grey is a high-performance Android tablet by Samsung. With a large AMOLED display, powerful processor, and S Pen support, it's ideal for productivity and entertainment.",
    "specifications": {
      "Brand": "Samsung",
      "Category": "Computers & Technology",
      "Model / SKU": "TAB-SAM-SAM-160",
      "Rating": "4.68 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-161",
    "title": "Samsung Galaxy Tab White",
    "brand": "Samsung",
    "category": "Computers & Technology",
    "subcategory": "Tablets & Displays",
    "price": 349.99,
    "image": "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/1.webp",
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/2.webp",
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/3.webp",
      "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/4.webp"
    ],
    "description": "The Samsung Galaxy Tab in White is a sleek and versatile Android tablet. With a vibrant display, long-lasting battery, and a range of features, it offers a great user experience for various tasks.",
    "specifications": {
      "Brand": "Samsung",
      "Category": "Computers & Technology",
      "Model / SKU": "TAB-SAM-SAM-161",
      "Rating": "3.72 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-162",
    "title": "Blue Frock",
    "brand": "Blue",
    "category": "Clothing & Apparel",
    "subcategory": "Casual Tops & Sweaters",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/tops/blue-frock/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tops/blue-frock/1.webp",
      "https://cdn.dummyjson.com/product-images/tops/blue-frock/2.webp",
      "https://cdn.dummyjson.com/product-images/tops/blue-frock/3.webp",
      "https://cdn.dummyjson.com/product-images/tops/blue-frock/4.webp"
    ],
    "description": "The Blue Frock is a charming and stylish dress for various occasions. With a vibrant blue color and a comfortable design, it adds a touch of elegance to your wardrobe.",
    "specifications": {
      "Brand": "Blue",
      "Category": "Clothing & Apparel",
      "Model / SKU": "TOP-BRD-BLU-162",
      "Rating": "4.17 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-163",
    "title": "Girl Summer Dress",
    "brand": "Girl",
    "category": "Clothing & Apparel",
    "subcategory": "Casual Tops & Sweaters",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/1.webp",
      "https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/2.webp",
      "https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/3.webp",
      "https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/4.webp"
    ],
    "description": "The Girl Summer Dress is a cute and breezy dress designed for warm weather. With playful patterns and lightweight fabric, it's perfect for keeping cool and stylish during the summer.",
    "specifications": {
      "Brand": "Girl",
      "Category": "Clothing & Apparel",
      "Model / SKU": "TOP-BRD-GIR-163",
      "Rating": "4.77 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-164",
    "title": "Gray Dress",
    "brand": "Gray",
    "category": "Clothing & Apparel",
    "subcategory": "Casual Tops & Sweaters",
    "price": 34.99,
    "image": "https://cdn.dummyjson.com/product-images/tops/gray-dress/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tops/gray-dress/1.webp",
      "https://cdn.dummyjson.com/product-images/tops/gray-dress/2.webp",
      "https://cdn.dummyjson.com/product-images/tops/gray-dress/3.webp",
      "https://cdn.dummyjson.com/product-images/tops/gray-dress/4.webp"
    ],
    "description": "The Gray Dress is a versatile and chic option for various occasions. With a neutral gray color, it can be dressed up or down, making it a wardrobe staple for any fashion-forward individual.",
    "specifications": {
      "Brand": "Gray",
      "Category": "Clothing & Apparel",
      "Model / SKU": "TOP-BRD-GRA-164",
      "Rating": "2.72 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-165",
    "title": "Short Frock",
    "brand": "Short",
    "category": "Clothing & Apparel",
    "subcategory": "Casual Tops & Sweaters",
    "price": 24.99,
    "image": "https://cdn.dummyjson.com/product-images/tops/short-frock/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tops/short-frock/1.webp",
      "https://cdn.dummyjson.com/product-images/tops/short-frock/2.webp",
      "https://cdn.dummyjson.com/product-images/tops/short-frock/3.webp",
      "https://cdn.dummyjson.com/product-images/tops/short-frock/4.webp"
    ],
    "description": "The Short Frock is a playful and trendy dress with a shorter length. Ideal for casual outings or special occasions, it combines style and comfort for a fashionable look.",
    "specifications": {
      "Brand": "Short",
      "Category": "Clothing & Apparel",
      "Model / SKU": "TOP-BRD-SHO-165",
      "Rating": "3.23 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-166",
    "title": "Tartan Dress",
    "brand": "Tartan",
    "category": "Clothing & Apparel",
    "subcategory": "Casual Tops & Sweaters",
    "price": 39.99,
    "image": "https://cdn.dummyjson.com/product-images/tops/tartan-dress/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/tops/tartan-dress/1.webp",
      "https://cdn.dummyjson.com/product-images/tops/tartan-dress/2.webp",
      "https://cdn.dummyjson.com/product-images/tops/tartan-dress/3.webp",
      "https://cdn.dummyjson.com/product-images/tops/tartan-dress/4.webp"
    ],
    "description": "The Tartan Dress features a classic tartan pattern, bringing a timeless and sophisticated touch to your wardrobe. Perfect for fall and winter, it adds a hint of traditional charm.",
    "specifications": {
      "Brand": "Tartan",
      "Category": "Clothing & Apparel",
      "Model / SKU": "TOP-BRD-TAR-166",
      "Rating": "4.05 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-167",
    "title": "300 Touring",
    "brand": "Chrysler",
    "category": "Automotive & Tools",
    "subcategory": "Car Care & Detailing",
    "price": 69.99,
    "image": "https://cdn.dummyjson.com/product-images/vehicle/300-touring/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/vehicle/300-touring/1.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/300-touring/2.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/300-touring/3.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/300-touring/4.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/300-touring/5.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/300-touring/6.webp"
    ],
    "description": "The 300 Touring is a stylish and comfortable sedan, known for its luxurious features and smooth performance.",
    "specifications": {
      "Brand": "Chrysler",
      "Category": "Automotive & Tools",
      "Model / SKU": "VEH-CHR-TOU-167",
      "Rating": "4.05 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-168",
    "title": "Charger SXT RWD",
    "brand": "Dodge",
    "category": "Automotive & Tools",
    "subcategory": "Car Care & Detailing",
    "price": 69.99,
    "image": "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/1.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/2.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/3.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/4.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/5.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/charger-sxt-rwd/6.webp"
    ],
    "description": "The Charger SXT RWD is a powerful and sporty rear-wheel-drive sedan, offering a blend of performance and practicality.",
    "specifications": {
      "Brand": "Dodge",
      "Category": "Automotive & Tools",
      "Model / SKU": "VEH-DOD-CHA-168",
      "Rating": "2.58 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-169",
    "title": "Dodge Hornet GT Plus",
    "brand": "Dodge",
    "category": "Automotive & Tools",
    "subcategory": "Car Care & Detailing",
    "price": 59.99,
    "image": "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/1.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/2.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/3.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/4.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/5.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/dodge-hornet-gt-plus/6.webp"
    ],
    "description": "The Dodge Hornet GT Plus is a compact and agile hatchback, perfect for urban driving with a touch of sportiness.",
    "specifications": {
      "Brand": "Dodge",
      "Category": "Automotive & Tools",
      "Model / SKU": "VEH-DOD-DOD-169",
      "Rating": "2.65 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-170",
    "title": "Durango SXT RWD",
    "brand": "Dodge",
    "category": "Automotive & Tools",
    "subcategory": "Car Care & Detailing",
    "price": 69.99,
    "image": "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/1.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/2.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/3.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/4.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/5.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/durango-sxt-rwd/6.webp"
    ],
    "description": "The Durango SXT RWD is a spacious and versatile SUV, known for its strong performance and family-friendly features.",
    "specifications": {
      "Brand": "Dodge",
      "Category": "Automotive & Tools",
      "Model / SKU": "VEH-DOD-DUR-170",
      "Rating": "4.07 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-171",
    "title": "Pacifica Touring",
    "brand": "Chrysler",
    "category": "Automotive & Tools",
    "subcategory": "Car Care & Detailing",
    "price": 59.99,
    "image": "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/1.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/2.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/3.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/4.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/5.webp",
      "https://cdn.dummyjson.com/product-images/vehicle/pacifica-touring/6.webp"
    ],
    "description": "The Pacifica Touring is a stylish and well-equipped minivan, offering comfort and convenience for family journeys.",
    "specifications": {
      "Brand": "Chrysler",
      "Category": "Automotive & Tools",
      "Model / SKU": "VEH-CHR-PAC-171",
      "Rating": "3.62 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-172",
    "title": "Blue Women's Handbag",
    "brand": "Fashionista",
    "category": "Bags & Accessories",
    "subcategory": "Handbags & Totes",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-bags/blue-women's-handbag/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-bags/blue-women's-handbag/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/blue-women's-handbag/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/blue-women's-handbag/3.webp"
    ],
    "description": "The Blue Women's Handbag is a stylish and spacious accessory for everyday use. With a vibrant blue color and multiple compartments, it combines fashion and functionality.",
    "specifications": {
      "Brand": "Fashionista",
      "Category": "Bags & Accessories",
      "Model / SKU": "WOM-FAS-BLU-172",
      "Rating": "2.92 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-173",
    "title": "Heshe Women's Leather Bag",
    "brand": "Heshe",
    "category": "Bags & Accessories",
    "subcategory": "Handbags & Totes",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-bags/heshe-women's-leather-bag/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-bags/heshe-women's-leather-bag/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/heshe-women's-leather-bag/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/heshe-women's-leather-bag/3.webp"
    ],
    "description": "The Heshe Women's Leather Bag is a luxurious and high-quality leather bag for the sophisticated woman. With a timeless design and durable craftsmanship, it's a versatile accessory.",
    "specifications": {
      "Brand": "Heshe",
      "Category": "Bags & Accessories",
      "Model / SKU": "WOM-HES-HES-173",
      "Rating": "4.92 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-174",
    "title": "Prada Women Bag",
    "brand": "Prada",
    "category": "Bags & Accessories",
    "subcategory": "Handbags & Totes",
    "price": 299.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-bags/prada-women-bag/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-bags/prada-women-bag/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/prada-women-bag/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/prada-women-bag/3.webp"
    ],
    "description": "The Prada Women Bag is an iconic designer bag that exudes elegance and luxury. Crafted with precision and featuring the Prada logo, it's a statement piece for fashion enthusiasts.",
    "specifications": {
      "Brand": "Prada",
      "Category": "Bags & Accessories",
      "Model / SKU": "WOM-PRA-PRA-174",
      "Rating": "2.71 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-175",
    "title": "White Faux Leather Backpack",
    "brand": "Urban Chic",
    "category": "Bags & Accessories",
    "subcategory": "Handbags & Totes",
    "price": 39.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/3.webp"
    ],
    "description": "The White Faux Leather Backpack is a trendy and practical backpack for the modern woman. With a sleek white design and ample storage space, it's perfect for both casual and on-the-go styles.",
    "specifications": {
      "Brand": "Urban Chic",
      "Category": "Bags & Accessories",
      "Model / SKU": "WOM-URB-WHI-175",
      "Rating": "3.36 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-176",
    "title": "Women Handbag Black",
    "brand": "Elegance Collection",
    "category": "Bags & Accessories",
    "subcategory": "Handbags & Totes",
    "price": 59.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-bags/women-handbag-black/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-bags/women-handbag-black/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/women-handbag-black/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-bags/women-handbag-black/3.webp"
    ],
    "description": "The Women Handbag in Black is a classic and versatile accessory that complements various outfits. With a timeless black color and functional design, it's a must-have in every woman's wardrobe.",
    "specifications": {
      "Brand": "Elegance Collection",
      "Category": "Bags & Accessories",
      "Model / SKU": "WOM-ELE-WOM-176",
      "Rating": "2.89 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-177",
    "title": "Black Women's Gown",
    "brand": "Black",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Dresses & Outfits",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-dresses/black-women's-gown/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-dresses/black-women's-gown/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/black-women's-gown/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/black-women's-gown/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/black-women's-gown/4.webp"
    ],
    "description": "The Black Women's Gown is an elegant and timeless evening gown. With a sleek black design, it's perfect for formal events and special occasions, exuding sophistication and style.",
    "specifications": {
      "Brand": "Black",
      "Category": "Clothing & Apparel",
      "Model / SKU": "WOM-BRD-BLA-177",
      "Rating": "3.64 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-178",
    "title": "Corset Leather With Skirt",
    "brand": "Corset",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Dresses & Outfits",
    "price": 89.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/4.webp"
    ],
    "description": "The Corset Leather With Skirt is a bold and edgy ensemble that combines a stylish corset with a matching skirt. Ideal for fashion-forward individuals, it makes a statement at any event.",
    "specifications": {
      "Brand": "Corset",
      "Category": "Clothing & Apparel",
      "Model / SKU": "WOM-BRD-COR-178",
      "Rating": "3.05 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-179",
    "title": "Corset With Black Skirt",
    "brand": "Corset",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Dresses & Outfits",
    "price": 79.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/4.webp"
    ],
    "description": "The Corset With Black Skirt is a chic and versatile outfit that pairs a fashionable corset with a classic black skirt. It offers a trendy and coordinated look for various occasions.",
    "specifications": {
      "Brand": "Corset",
      "Category": "Clothing & Apparel",
      "Model / SKU": "WOM-BRD-COR-179",
      "Rating": "4.52 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-180",
    "title": "Dress Pea",
    "brand": "Dress",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Dresses & Outfits",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/4.webp"
    ],
    "description": "The Dress Pea is a stylish and comfortable dress with a pea pattern. Perfect for casual outings, it adds a playful and fun element to your wardrobe, making it a great choice for day-to-day wear.",
    "specifications": {
      "Brand": "Dress",
      "Category": "Clothing & Apparel",
      "Model / SKU": "WOM-BRD-DRE-180",
      "Rating": "4.88 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-181",
    "title": "Marni Red & Black Suit",
    "brand": "Marni",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Dresses & Outfits",
    "price": 179.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/4.webp"
    ],
    "description": "The Marni Red & Black Suit is a sophisticated and fashion-forward suit ensemble. With a combination of red and black tones, it showcases a modern design for a bold and confident look.",
    "specifications": {
      "Brand": "Marni",
      "Category": "Clothing & Apparel",
      "Model / SKU": "WOM-BRD-MAR-181",
      "Rating": "4.48 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-182",
    "title": "Green Crystal Earring",
    "brand": "Green",
    "category": "Watches & Jewelry",
    "subcategory": "Fine Jewelry & Necklaces",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/3.webp"
    ],
    "description": "The Green Crystal Earring is a dazzling accessory that features a vibrant green crystal. With a classic design, it adds a touch of elegance to your ensemble, perfect for formal or special occasions.",
    "specifications": {
      "Brand": "Green",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-BRD-GRE-182",
      "Rating": "3.96 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-183",
    "title": "Green Oval Earring",
    "brand": "Green",
    "category": "Watches & Jewelry",
    "subcategory": "Fine Jewelry & Necklaces",
    "price": 24.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-jewellery/green-oval-earring/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-jewellery/green-oval-earring/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-jewellery/green-oval-earring/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-jewellery/green-oval-earring/3.webp"
    ],
    "description": "The Green Oval Earring is a stylish and versatile accessory with a unique oval shape. Whether for casual or dressy occasions, its green hue and contemporary design make it a standout piece.",
    "specifications": {
      "Brand": "Green",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-BRD-GRE-183",
      "Rating": "3.57 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-184",
    "title": "Tropical Earring",
    "brand": "Tropical",
    "category": "Watches & Jewelry",
    "subcategory": "Fine Jewelry & Necklaces",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-jewellery/tropical-earring/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-jewellery/tropical-earring/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-jewellery/tropical-earring/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-jewellery/tropical-earring/3.webp"
    ],
    "description": "The Tropical Earring is a fun and playful accessory inspired by tropical elements. Featuring vibrant colors and a lively design, it's perfect for adding a touch of summer to your look.",
    "specifications": {
      "Brand": "Tropical",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-BRD-TRO-184",
      "Rating": "4.4 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-185",
    "title": "Black & Brown Slipper",
    "brand": "Comfort Trends",
    "category": "Shoes & Footwear",
    "subcategory": "Women's Shoes & Heels",
    "price": 19.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/4.webp"
    ],
    "description": "The Black & Brown Slipper is a comfortable and stylish choice for casual wear. Featuring a blend of black and brown colors, it adds a touch of sophistication to your relaxation.",
    "specifications": {
      "Brand": "Comfort Trends",
      "Category": "Shoes & Footwear",
      "Model / SKU": "WOM-COM-BLA-185",
      "Rating": "2.53 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-186",
    "title": "Calvin Klein Heel Shoes",
    "brand": "Calvin Klein",
    "category": "Shoes & Footwear",
    "subcategory": "Women's Shoes & Heels",
    "price": 79.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-shoes/calvin-klein-heel-shoes/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-shoes/calvin-klein-heel-shoes/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/calvin-klein-heel-shoes/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/calvin-klein-heel-shoes/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/calvin-klein-heel-shoes/4.webp"
    ],
    "description": "Calvin Klein Heel Shoes are elegant and sophisticated, designed for formal occasions. With a classic design and high-quality materials, they complement your stylish ensemble.",
    "specifications": {
      "Brand": "Calvin Klein",
      "Category": "Shoes & Footwear",
      "Model / SKU": "WOM-CAL-CAL-186",
      "Rating": "4.92 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-187",
    "title": "Golden Shoes Woman",
    "brand": "Fashion Diva",
    "category": "Shoes & Footwear",
    "subcategory": "Women's Shoes & Heels",
    "price": 49.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/4.webp"
    ],
    "description": "The Golden Shoes for Women are a glamorous choice for special occasions. Featuring a golden hue and stylish design, they add a touch of luxury to your outfit.",
    "specifications": {
      "Brand": "Fashion Diva",
      "Category": "Shoes & Footwear",
      "Model / SKU": "WOM-FAS-GOL-187",
      "Rating": "3.26 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-188",
    "title": "Pampi Shoes",
    "brand": "Pampi",
    "category": "Shoes & Footwear",
    "subcategory": "Women's Shoes & Heels",
    "price": 29.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-shoes/pampi-shoes/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-shoes/pampi-shoes/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/pampi-shoes/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/pampi-shoes/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/pampi-shoes/4.webp"
    ],
    "description": "Pampi Shoes offer a blend of comfort and style for everyday use. With a versatile design, they are suitable for various casual occasions, providing a trendy and relaxed look.",
    "specifications": {
      "Brand": "Pampi",
      "Category": "Shoes & Footwear",
      "Model / SKU": "WOM-PAM-PAM-188",
      "Rating": "3.05 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-189",
    "title": "Red Shoes",
    "brand": "Fashion Express",
    "category": "Shoes & Footwear",
    "subcategory": "Women's Shoes & Heels",
    "price": 34.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/3.webp",
      "https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/4.webp"
    ],
    "description": "The Red Shoes make a bold statement with their vibrant red color. Whether for a party or a casual outing, these shoes add a pop of color and style to your wardrobe.",
    "specifications": {
      "Brand": "Fashion Express",
      "Category": "Shoes & Footwear",
      "Model / SKU": "WOM-FAS-SHO-189",
      "Rating": "3.25 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-190",
    "title": "IWC Ingenieur Automatic Steel",
    "brand": "IWC",
    "category": "Watches & Jewelry",
    "subcategory": "Women's Minimalist Watches",
    "price": 3850,
    "image": "https://cdn.dummyjson.com/product-images/womens-watches/iwc-ingenieur-automatic-steel/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-watches/iwc-ingenieur-automatic-steel/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/iwc-ingenieur-automatic-steel/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/iwc-ingenieur-automatic-steel/3.webp"
    ],
    "description": "The IWC Ingenieur Automatic Steel watch is a durable and sophisticated timepiece. With a stainless steel case and automatic movement, it combines precision and style for watch enthusiasts.",
    "specifications": {
      "Brand": "IWC",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-IWC-ING-190",
      "Rating": "2.93 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-191",
    "title": "Women's Minimalist Rose Gold Mesh Wrist Watch",
    "brand": "Fashion Timepieces",
    "category": "Watches & Jewelry",
    "subcategory": "Women's Minimalist Watches",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/1.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/1.webp"
    ],
    "description": "Ultra-slim minimalist women's quartz watch featuring a sunray dial, stainless steel rose gold mesh strap, mineral crystal glass, and 3ATM water resistance.",
    "specifications": {
      "Brand": "Fashion Timepieces",
      "Case Diameter": "32 mm",
      "Case Thickness": "6.8 mm",
      "Strap Material": "Rose Gold PVD Stainless Steel Mesh",
      "Water Resistance": "30 Meters (3 ATM)"
    }
  },
  {
    "id": "base-dj-192",
    "title": "Rolex Datejust Women",
    "brand": "Rolex",
    "category": "Watches & Jewelry",
    "subcategory": "Women's Minimalist Watches",
    "price": 4500,
    "image": "https://cdn.dummyjson.com/product-images/womens-watches/rolex-datejust-women/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-watches/rolex-datejust-women/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/rolex-datejust-women/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/rolex-datejust-women/3.webp"
    ],
    "description": "The Rolex Datejust Women's watch is an iconic timepiece designed for women. With a timeless design and a date complication, it offers both elegance and functionality.",
    "specifications": {
      "Brand": "Rolex",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-ROL-ROL-192",
      "Rating": "2.86 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-193",
    "title": "Watch Gold for Women",
    "brand": "Fashion Gold",
    "category": "Watches & Jewelry",
    "subcategory": "Women's Minimalist Watches",
    "price": 450,
    "image": "https://cdn.dummyjson.com/product-images/womens-watches/watch-gold-for-women/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-watches/watch-gold-for-women/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/watch-gold-for-women/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/watch-gold-for-women/3.webp"
    ],
    "description": "The Gold Women's Watch is a stunning accessory that combines luxury and style. Featuring a gold-plated case and a chic design, it adds a touch of glamour to any outfit.",
    "specifications": {
      "Brand": "Fashion Gold",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-FAS-WAT-193",
      "Rating": "4.24 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-dj-194",
    "title": "Women's Wrist Watch",
    "brand": "Fashion Co.",
    "category": "Watches & Jewelry",
    "subcategory": "Women's Minimalist Watches",
    "price": 129.99,
    "image": "https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/1.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/2.webp",
      "https://cdn.dummyjson.com/product-images/womens-watches/women's-wrist-watch/3.webp"
    ],
    "description": "The Women's Wrist Watch is a versatile and fashionable timepiece for everyday wear. With a comfortable strap and a simple yet elegant design, it complements various styles.",
    "specifications": {
      "Brand": "Fashion Co.",
      "Category": "Watches & Jewelry",
      "Model / SKU": "WOM-FAS-WOM-194",
      "Rating": "3.52 / 5.0",
      "Condition": "Brand New Factory Sealed"
    }
  },
  {
    "id": "base-fs-1",
    "title": "Fjallraven Kanken Foldsack No. 1 Laptop Backpack",
    "brand": "Fjallraven",
    "category": "Bags & Accessories",
    "subcategory": "Handbags & Totes",
    "price": 109.95,
    "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png"
    ],
    "description": "Iconic durable outdoor daypack crafted from G-1000 HeavyDuty Eco fabric with dedicated padded 15-inch laptop sleeve and fold-over top closure.",
    "specifications": {
      "Brand": "Fjallraven",
      "Capacity": "16 Liters",
      "Material": "G-1000 HeavyDuty Eco (65% Polyester, 35% Cotton)",
      "Laptop Compartment": "Fits Up to 15 Inches",
      "Dimensions": "40 x 30 x 15 cm"
    }
  },
  {
    "id": "base-fs-2",
    "title": "Men's Casual Premium Slim Fit Cotton T-Shirt",
    "brand": "Urban Apparel",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Casual Wear",
    "price": 22.3,
    "image": "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png"
    ],
    "description": "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing. And Solid stitched shirts with round neck made for durability and a great fit for casual fashion wear and diehard baseball fans. The Henley style round neckline includes a three-button placket.",
    "specifications": {
      "Category": "men's clothing",
      "Rating": "4.1 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-3",
    "title": "Men's Heavyweight Cotton Canvas Military Jacket",
    "brand": "Urban Apparel",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Casual Wear",
    "price": 55.99,
    "image": "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png"
    ],
    "description": "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors. Good gift choice for you or your family member. A warm hearted love to Father, husband or son in this thanksgiving or Christmas Day.",
    "specifications": {
      "Category": "men's clothing",
      "Rating": "4.7 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-4",
    "title": "Men's Slim Fit Casual Long Sleeve Henley Shirt",
    "brand": "Urban Apparel",
    "category": "Clothing & Apparel",
    "subcategory": "Men's Casual Wear",
    "price": 15.99,
    "image": "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_t.png"
    ],
    "description": "The color could be slightly different between on the screen and in practice. / Please note that body builds vary by person, therefore, detailed size information should be reviewed below on the product description.",
    "specifications": {
      "Category": "men's clothing",
      "Rating": "2.1 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-5",
    "title": "John Hardy Women's Legends Naga Dragon Chain Bracelet",
    "brand": "John Hardy",
    "category": "Watches & Jewelry",
    "subcategory": "Luxury Jewelry",
    "price": 695,
    "image": "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png"
    ],
    "description": "From our Legends Collection, the Naga was inspired by the mythical water dragon that protects the ocean's pearl. Wear facing inward to be bestowed with love and abundance, or outward for protection.",
    "specifications": {
      "Category": "jewelery",
      "Rating": "4.6 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-6",
    "title": "Solid 14K Gold Petite Micropave Diamond Ring",
    "brand": "Fine Jewelry Co.",
    "category": "Watches & Jewelry",
    "subcategory": "Luxury Jewelry",
    "price": 168,
    "image": "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_t.png"
    ],
    "description": "Satisfaction Guaranteed. Return or exchange any order within 30 days.Designed and sold by Hafeez Center in the United States. Satisfaction Guaranteed. Return or exchange any order within 30 days.",
    "specifications": {
      "Category": "jewelery",
      "Rating": "3.9 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-7",
    "title": "White Gold Plated Princess Cut Solitaire Ring",
    "brand": "Princess Jewels",
    "category": "Watches & Jewelry",
    "subcategory": "Luxury Jewelry",
    "price": 19.99,
    "image": "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_t.png"
    ],
    "description": "Classic Created Wedding Engagement Solitaire Diamond Promise Ring for Her. Gifts to spoil your love more for Engagement, Wedding, Anniversary, Valentine's Day...",
    "specifications": {
      "Category": "jewelery",
      "Rating": "3 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-8",
    "title": "Pierced Owl Rose Gold Plated Stainless Steel Earrings",
    "brand": "Pierced Owl",
    "category": "Watches & Jewelry",
    "subcategory": "Luxury Jewelry",
    "price": 14.99,
    "image": "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_t.png"
    ],
    "description": "Rose Gold Plated Double Flared Tunnel Plug Earrings. Made of 316L Stainless Steel",
    "specifications": {
      "Category": "jewelery",
      "Rating": "1.9 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-9",
    "title": "WD 2TB Elements Portable External Hard Drive",
    "brand": "Western Digital",
    "category": "Computers & Technology",
    "subcategory": "Storage & Monitors",
    "price": 64.99,
    "image": "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_t.png"
    ],
    "description": "USB 3.0 and USB 2.0 Compatibility Fast data transfers Improve PC Performance High Capacity; Compatibility Formatted NTFS for Windows 10, Windows 8.1, Windows 7; Reformatting may be required for other operating systems; Compatibility may vary depending on user’s hardware configuration and operating system",
    "specifications": {
      "Category": "electronics",
      "Rating": "3.3 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-10",
    "title": "SanDisk SSD PLUS 1TB Internal SATA III SSD",
    "brand": "SanDisk",
    "category": "Computers & Technology",
    "subcategory": "Storage & Monitors",
    "price": 69.99,
    "image": "https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_t.png"
    ],
    "description": "Easy upgrade for faster boot up, shutdown, application load and response (As compared to 5400 RPM SATA 2.5” hard drive; Based on published specifications and internal benchmarking tests using PCMark vantage scores) Boosts burst write performance, making it ideal for typical PC workloads The perfect balance of performance and reliability Read/write speeds of up to 535MB/s/450MB/s (Based on internal testing; Performance may vary depending upon drive capacity, host device, OS and application.)",
    "specifications": {
      "Category": "electronics",
      "Rating": "2.9 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-11",
    "title": "Silicon Power 256GB SSD 3D NAND SATA III",
    "brand": "Silicon Power",
    "category": "Computers & Technology",
    "subcategory": "Storage & Monitors",
    "price": 21.99,
    "image": "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_t.png"
    ],
    "description": "3D NAND flash are applied to deliver high transfer speeds Remarkable transfer speeds that enable faster bootup and improved overall system performance. The advanced SLC Cache Technology allows performance boost and longer lifespan 7mm slim design suitable for Ultrabooks and Ultra-slim notebooks. Supports TRIM command, Garbage Collection technology, RAID, and ECC (Error Checking & Correction) to provide the optimized performance and enhanced reliability.",
    "specifications": {
      "Category": "electronics",
      "Rating": "4.8 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-12",
    "title": "WD 4TB Gaming External Hard Drive",
    "brand": "Western Digital",
    "category": "Computers & Technology",
    "subcategory": "Storage & Monitors",
    "price": 119.99,
    "image": "https://fakestoreapi.com/img/61mtL65D4cL._AC_SX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/61mtL65D4cL._AC_SX679_t.png"
    ],
    "description": "Expand your PS4 gaming experience, Play anywhere Fast and easy, setup Sleek design with high capacity, 3-year manufacturer's limited warranty",
    "specifications": {
      "Category": "electronics",
      "Rating": "4.8 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-13",
    "title": "Acer SB220Q 21.5-inch Full HD Ultra-Thin Monitor",
    "brand": "Acer",
    "category": "Computers & Technology",
    "subcategory": "Storage & Monitors",
    "price": 89.99,
    "image": "https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_t.png"
    ],
    "description": "21. 5 inches Full HD (1920 x 1080) widescreen IPS display And Radeon free Sync technology. No compatibility for VESA Mount Refresh Rate: 75Hz - Using HDMI port Zero-frame design | ultra-thin | 4ms response time | IPS panel Aspect ratio - 16: 9. Color Supported - 16. 7 million colors. Brightness - 250 nit Tilt angle -5 degree to 15 degree. Horizontal viewing angle-178 degree. Vertical viewing angle-178 degree 75 hertz",
    "specifications": {
      "Category": "electronics",
      "Rating": "2.9 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-14",
    "title": "Samsung 49-Inch Odyssey Curved Gaming Monitor",
    "brand": "Samsung",
    "category": "Computers & Technology",
    "subcategory": "Storage & Monitors",
    "price": 1099.99,
    "image": "https://fakestoreapi.com/img/81Zt42ioCgL._AC_SX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/81Zt42ioCgL._AC_SX679_t.png"
    ],
    "description": "49 INCH SUPER ULTRAWIDE 32:9 CURVED GAMING MONITOR with dual 27 inch screen side by side QUANTUM DOT (QLED) TECHNOLOGY, HDR support and factory calibration provides stunningly realistic and accurate color and contrast 144HZ HIGH REFRESH RATE and 1ms ultra fast response time work to eliminate motion blur, ghosting, and reduce input lag",
    "specifications": {
      "Category": "electronics",
      "Rating": "2.2 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-15",
    "title": "BIYLACLESEN Women's 3-in-1 Snowboard Jacket Winter Coats",
    "brand": "BIYLACLESEN",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Fashion",
    "price": 56.99,
    "image": "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_t.png"
    ],
    "description": "Note:The Jackets is US standard size, Please choose size as your usual wear Material: 100% Polyester; Detachable Liner Fabric: Warm Fleece. Detachable Functional Liner: Skin Friendly, Lightweigt and Warm.Stand Collar Liner jacket, keep you warm in cold weather. Zippered Pockets: 2 Zippered Hand Pockets, 2 Zippered Pockets on Chest (enough to keep cards or keys)and 1 Hidden Pocket Inside.Zippered Hand Pockets and Hidden Pocket keep your things secure. Humanized Design: Adjustable and Detachable Hood and Adjustable cuff to prevent the wind and water,for a comfortable fit. 3 in 1 Detachable Design provide more convenience, you can separate the coat and inner as needed, or wear it together. It is suitable for different season and help you adapt to different climates",
    "specifications": {
      "Category": "women's clothing",
      "Rating": "2.6 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-16",
    "title": "Lock and Love Women's Removable Hooded Faux Leather Jacket",
    "brand": "Lock and Love",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Fashion",
    "price": 39.95,
    "image": "https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_t.png"
    ],
    "description": "100% POLYURETHANE(shell) 100% POLYESTER(lining) 75% POLYESTER 25% COTTON (SWEATER), Faux leather material for style and comfort / 2 pockets of front, 2-For-One Hooded denim style faux leather jacket, Button detail on waist / Detail stitching at sides, HAND WASH ONLY / DO NOT BLEACH / LINE DRY / DO NOT IRON",
    "specifications": {
      "Category": "women's clothing",
      "Rating": "2.9 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-17",
    "title": "Women's Lightweight Striped Waterproof Windbreaker Raincoat",
    "brand": "Outdoor Tech",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Fashion",
    "price": 39.99,
    "image": "https://fakestoreapi.com/img/71HblAHs5xL._AC_UY879_-2t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71HblAHs5xL._AC_UY879_-2t.png"
    ],
    "description": "Lightweight perfet for trip or casual wear---Long sleeve with hooded, adjustable drawstring waist design. Button and zipper front closure raincoat, fully stripes Lined and The Raincoat has 2 side pockets are a good size to hold all kinds of things, it covers the hips, and the hood is generous but doesn't overdo it.Attached Cotton Lined Hood with Adjustable Drawstrings give it a real styled look.",
    "specifications": {
      "Category": "women's clothing",
      "Rating": "3.8 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-18",
    "title": "MBJ Women's Solid Short Sleeve Boat Neck V",
    "brand": "MBJ",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Fashion",
    "price": 9.85,
    "image": "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_t.png"
    ],
    "description": "95% RAYON 5% SPANDEX, Made in USA or Imported, Do Not Bleach, Lightweight fabric with great stretch for comfort, Ribbed on sleeves and neckline / Double stitching on bottom hem",
    "specifications": {
      "Category": "women's clothing",
      "Rating": "4.7 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-19",
    "title": "Opna Women's Short Sleeve Moisture",
    "brand": "Opna",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Fashion",
    "price": 7.95,
    "image": "https://fakestoreapi.com/img/51eg55uWmdL._AC_UX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/51eg55uWmdL._AC_UX679_t.png"
    ],
    "description": "100% Polyester, Machine wash, 100% cationic polyester interlock, Machine Wash & Pre Shrunk for a Great Fit, Lightweight, roomy and highly breathable with moisture wicking fabric which helps to keep moisture away, Soft Lightweight Fabric with comfortable V-neck collar and a slimmer fit, delivers a sleek, more feminine silhouette and Added Comfort",
    "specifications": {
      "Category": "women's clothing",
      "Rating": "4.5 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-fs-20",
    "title": "DANVOUY Womens T Shirt Casual Cotton Short",
    "brand": "DANVOUY",
    "category": "Clothing & Apparel",
    "subcategory": "Women's Fashion",
    "price": 12.99,
    "image": "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_t.png",
    "galleryImages": [
      "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_t.png"
    ],
    "description": "95%Cotton,5%Spandex, Features: Casual, Short Sleeve, Letter Print,V-Neck,Fashion Tees, The fabric is soft and has some stretch., Occasion: Casual/Office/Beach/School/Home/Street. Season: Spring,Summer,Autumn,Winter.",
    "specifications": {
      "Category": "women's clothing",
      "Rating": "3.6 / 5.0",
      "Authentic": "Direct Studio Packshot"
    }
  },
  {
    "id": "base-book-1",
    "title": "Leuchtturm1917 Medium A5 Dotted Hardcover Notebook",
    "brand": "Leuchtturm1917",
    "category": "Books & Stationery",
    "subcategory": "Journals & Planners",
    "price": 24.95,
    "image": "/images/products/base-book-1.jpg",
    "galleryImages": [
      "/images/products/base-book-1.jpg"
    ],
    "description": "Thread-bound lay-flat journal with 251 numbered pages, 80 gsm acid-free ink-proof paper, expandable pocket and dual ribbon bookmarks.",
    "specifications": {
      "Ruling": "Dot Grid 5mm",
      "Size": "Medium A5 (145 x 210 mm)",
      "Pages": "251 Numbered Pages",
      "Paper Weight": "80 gsm Acid-Free"
    }
  },
  {
    "id": "base-book-2",
    "title": "Lamy Safari Fountain Pen - Charcoal Medium Nib",
    "brand": "Lamy",
    "category": "Books & Stationery",
    "subcategory": "Writing Instruments",
    "price": 29.6,
    "image": "/images/products/base-book-2.jpg",
    "galleryImages": [
      "/images/products/base-book-2.jpg"
    ],
    "description": "Ergonomic fountain pen crafted from sturdy ABS plastic with matte charcoal finish, flexible chrome clip, and black steel medium nib.",
    "specifications": {
      "Nib Size": "Medium (M)",
      "Material": "Sturdy ABS Plastic",
      "Filling": "Cartridge / Converter Z28",
      "Origin": "Made in Germany"
    }
  },
  {
    "id": "base-book-3",
    "title": "Arches Cold Pressed 100% Cotton Watercolor Block",
    "brand": "Arches",
    "category": "Books & Stationery",
    "subcategory": "Art Supplies",
    "price": 42.5,
    "image": "/images/products/base-book-3.jpg",
    "galleryImages": [
      "/images/products/base-book-3.jpg"
    ],
    "description": "French cylinder-mould made 100% natural cotton watercolor block glued on 4 sides, providing uniform grain and excellent pigment retention.",
    "specifications": {
      "Weight": "140 lb / 300 gsm",
      "Texture": "Cold Pressed (Not)",
      "Sheet Count": "20 Sheets",
      "Size": "9 x 12 Inches"
    }
  },
  {
    "id": "base-pet-1",
    "title": "Bedsure Orthopedic Foam Dog Bed with Washable Cover",
    "brand": "Bedsure",
    "category": "Pet Supplies",
    "subcategory": "Pet Beds & Furniture",
    "price": 49.99,
    "image": "/images/products/base-pet-1.jpg",
    "galleryImages": [
      "/images/products/base-pet-1.jpg"
    ],
    "description": "High-density egg crate orthopedic foam dog mattress designed to relieve joint pressure, complete with water-resistant lining and non-skid bottom.",
    "specifications": {
      "Size": "Large (36 x 27 x 3 in)",
      "Foam": "High-Density Egg Crate",
      "Cover": "Removable Sherpa / Oxford",
      "Care": "Machine Washable"
    }
  },
  {
    "id": "base-pet-2",
    "title": "PETKIT Ultra-Quiet Stainless Steel Pet Fountain 2L",
    "brand": "PETKIT",
    "category": "Pet Supplies",
    "subcategory": "Feeding & Water",
    "price": 39.99,
    "image": "/images/products/base-pet-2.jpg",
    "galleryImages": [
      "/images/products/base-pet-2.jpg"
    ],
    "description": "SUS304 food-grade stainless steel cat and dog drinking fountain with quadruple filtration system and ultra-silent submersible water pump.",
    "specifications": {
      "Capacity": "2.0 Liters (68 oz)",
      "Material": "SUS304 Stainless Steel",
      "Noise Level": "Under 20 dB",
      "Filter": "Quadruple Activated Carbon"
    }
  },
  {
    "id": "base-gard-1",
    "title": "DeWalt 20V MAX Cordless Drill Driver Kit",
    "brand": "DeWalt",
    "category": "Garden & Tools",
    "subcategory": "Power Tools",
    "price": 99,
    "image": "/images/products/base-gard-1.jpg",
    "galleryImages": [
      "/images/products/base-gard-1.jpg"
    ],
    "description": "Compact lightweight high-performance 20V drill motor delivering 300 unit watts out of power, with 2-speed transmission (0-450 / 0-1500 RPM).",
    "specifications": {
      "Voltage": "20V MAX Lithium",
      "Chuck Size": "1/2 Inch Keyless",
      "Speed": "Dual Speed 0-450 / 1500 RPM",
      "Includes": "Battery & Charger"
    }
  },
  {
    "id": "base-gard-2",
    "title": "Fiskars Heavy-Duty Stainless Steel Garden Trowel",
    "brand": "Fiskars",
    "category": "Garden & Tools",
    "subcategory": "Hand Tools",
    "price": 13.99,
    "image": "/images/products/base-gard-2.jpg",
    "galleryImages": [
      "/images/products/base-gard-2.jpg"
    ],
    "description": "Rust-resistant cast aluminum garden trowel with oversized curved blade for moving more soil and sculpted soft-grip ergonomic handle.",
    "specifications": {
      "Material": "Rust-Resistant Cast Aluminum",
      "Handle": "Softgrip Ergonomic Contour",
      "Blade Width": "3.25 Inches",
      "Warranty": "Full Lifetime"
    }
  },
  {
    "id": "base-baby-1",
    "title": "Philips Avent Anti-Colic Baby Bottle 4-Pack (9oz)",
    "brand": "Philips Avent",
    "category": "Baby Products",
    "subcategory": "Feeding & Nursing",
    "price": 26.99,
    "image": "/images/products/base-baby-1.jpg",
    "galleryImages": [
      "/images/products/base-baby-1.jpg"
    ],
    "description": "Clinically proven anti-colic venting system integrated into the nipple draws air into the bottle rather than baby stomach.",
    "specifications": {
      "Capacity": "9 oz (260 ml) Each",
      "Pack Count": "4 Bottles with Slow Flow Nipples",
      "Safety": "BPA-Free Polypropylene",
      "Cleaning": "Dishwasher Safe"
    }
  },
  {
    "id": "base-baby-2",
    "title": "Aden + Anais 100% Cotton Muslin Swaddle Blankets 4-Pack",
    "brand": "Aden + Anais",
    "category": "Baby Products",
    "subcategory": "Nursery & Swaddles",
    "price": 39.95,
    "image": "/images/products/base-baby-2.jpg",
    "galleryImages": [
      "/images/products/base-baby-2.jpg"
    ],
    "description": "Breathable lightweight 100% natural cotton muslin swaddles that get softer with every wash.",
    "specifications": {
      "Size": "44 x 44 Inches (111 x 111 cm)",
      "Material": "100% Natural Cotton Muslin",
      "Pack": "4 Coordinated Prints",
      "Certification": "OEKO-TEX Certified"
    }
  },
  {
    "id": "base-toy-1",
    "title": "LEGO Architecture New York City Skyline Building Set",
    "brand": "LEGO",
    "category": "Toys & Games",
    "subcategory": "Building Sets",
    "price": 59.99,
    "image": "/images/products/base-toy-1.jpg",
    "galleryImages": [
      "/images/products/base-toy-1.jpg"
    ],
    "description": "Detailed architectural scale model featuring the Flatiron Building, Chrysler Building, Empire State Building, One World Trade Center, and Statue of Liberty.",
    "specifications": {
      "Piece Count": "598 Pieces",
      "Age Level": "12 Years and Up",
      "Dimensions": "10 High x 9 Wide",
      "Includes": "Collectible Booklet"
    }
  },
  {
    "id": "base-toy-2",
    "title": "Catan Board Game (5th Edition)",
    "brand": "Catan Studio",
    "category": "Toys & Games",
    "subcategory": "Board Games",
    "price": 43.99,
    "image": "/images/products/base-toy-2.jpg",
    "galleryImages": [
      "/images/products/base-toy-2.jpg"
    ],
    "description": "Award-winning civilization building strategy game. Players trade resources like ore, brick, grain, lumber, and wool to expand settlements across Catan.",
    "specifications": {
      "Players": "3 - 4 Players",
      "Play Time": "60 - 90 Minutes",
      "Age": "Ages 10+",
      "Components": "19 Terrain Hexes & 95 Resource Cards"
    }
  },
  {
    "id": "base-trav-1",
    "title": "Samsonite Omni PC Hardside 20 Carry-On Spinner",
    "brand": "Samsonite",
    "category": "Travel Accessories",
    "subcategory": "Luggage & Suitcases",
    "price": 129.99,
    "image": "/images/products/base-trav-1.jpg",
    "galleryImages": [
      "/images/products/base-trav-1.jpg"
    ],
    "description": "Micro-diamond textured 100% polycarbonate spinner luggage with side-mounted TSA lock, effortless 360-degree wheels, and zippered expansion gusset.",
    "specifications": {
      "Overall Size": "22.0 x 15.0 x 9.5 in",
      "Weight": "6.8 lbs",
      "Shell": "100% Polycarbonate",
      "Warranty": "10 Year Global Warranty"
    }
  },
  {
    "id": "base-trav-2",
    "title": "EPICKA Universal All-in-One Worldwide Travel Adapter",
    "brand": "EPICKA",
    "category": "Travel Accessories",
    "subcategory": "Travel Electronics",
    "price": 24.99,
    "image": "/images/products/base-trav-2.jpg",
    "galleryImages": [
      "/images/products/base-trav-2.jpg"
    ],
    "description": "International power adapter equipped with 4 USB ports, 1 USB-C port, and multi-national AC socket. Compatible in over 160 countries.",
    "specifications": {
      "AC Rating": "6A max (660W at 110V, 1440W at 240V)",
      "USB Output": "5.6A total shared",
      "Fuse": "Dual 8A Overload Fuses Built-In",
      "Countries": "160+ Worldwide"
    }
  },
  {
    "id": "base-supp-11",
    "title": "Pure Encapsulations Zinc Picolinate 30mg",
    "brand": "Pure Encapsulations",
    "category": "Vitamins & Supplements",
    "subcategory": "Essential Minerals",
    "price": 18.2,
    "image": "/images/products/base-supp-11.jpg",
    "galleryImages": [
      "/images/products/base-supp-11.jpg"
    ],
    "description": "Hypoallergenic zinc picolinate supporting healthy digestion, immune defense, and enzymatic cellular repair.",
    "specifications": {
      "Potency": "30 mg Elemental Zinc",
      "Form": "Vegetarian Capsules",
      "Count": "60 Capsules",
      "Certifications": "Non-GMO, Hypoallergenic"
    }
  },
  {
    "id": "base-supp-12",
    "title": "Doctor's Best High Absorption CoQ10 100mg",
    "brand": "Doctor's Best",
    "category": "Vitamins & Supplements",
    "subcategory": "Heart & Cardiovascular",
    "price": 16.49,
    "image": "/images/products/base-supp-12.jpg",
    "galleryImages": [
      "/images/products/base-supp-12.jpg"
    ],
    "description": "USP verified naturally fermented Coenzyme Q10 combined with BioPerine black pepper extract for enhanced nutrient absorption.",
    "specifications": {
      "Dose": "100 mg CoQ10 + 5 mg BioPerine",
      "Count": "120 Softgels",
      "Form": "Gluten-Free Softgels",
      "Feature": "USP Verified Purity"
    }
  },
  {
    "id": "base-supp-13",
    "title": "Garden of Life Raw Organic Protein & Greens Vanilla Powder",
    "brand": "Garden of Life",
    "category": "Vitamins & Supplements",
    "subcategory": "Plant Protein & Nutrition",
    "price": 36.99,
    "image": "https://cdn.dummyjson.com/product-images/groceries/protein-powder/thumbnail.webp",
    "galleryImages": [
      "https://cdn.dummyjson.com/product-images/groceries/protein-powder/thumbnail.webp"
    ],
    "description": "Certified USDA Organic vegan protein powder with organic greens, delivering 20g of clean plant protein and 1.5 billion CFU live probiotics per serving.",
    "specifications": {
      "Protein": "22g Raw Sprouted Protein",
      "Weight": "20 oz (560g)",
      "Flavor": "Vanilla Organic",
      "Certifications": "USDA Organic, Non-GMO Verified"
    }
  },
  {
    "id": "base-supp-14",
    "title": "California Gold Nutrition LactoBif 30 Probiotics",
    "brand": "California Gold Nutrition",
    "category": "Vitamins & Supplements",
    "subcategory": "Digestive Health & Probiotics",
    "price": 21,
    "image": "/images/products/base-supp-14.jpg",
    "galleryImages": [
      "/images/products/base-supp-14.jpg"
    ],
    "description": "Clinically researched 8 active probiotic strains delivering 30 Billion CFU per veggie capsule in individually foil blister sealed packs.",
    "specifications": {
      "CFU": "30 Billion CFU",
      "Count": "60 Veggie Capsules",
      "Packaging": "Double-Foil Blister Sealed",
      "Storage": "Shelf-Stable No Refrigeration"
    }
  },
  {
    "id": "base-book-4",
    "title": "Moleskine Classic Hardcover Ruled Notebook Large",
    "brand": "Moleskine",
    "category": "Books & Stationery",
    "subcategory": "Journals & Planners",
    "price": 22.95,
    "image": "/images/products/base-book-4.jpg",
    "galleryImages": [
      "/images/products/base-book-4.jpg"
    ],
    "description": "Timeless black hardcover notebook featuring ivory acid-free paper, elastic closure band, matching ribbon placeholder, and expandable inner pocket.",
    "specifications": {
      "Size": "Large 5 x 8.25 in (13 x 21 cm)",
      "Ruling": "College Ruled",
      "Pages": "240 Pages",
      "Cover": "Bound Hardcover"
    }
  },
  {
    "id": "base-book-5",
    "title": "Parker Jotter Ballpoint Pen Stainless Steel with Chrome Trim",
    "brand": "Parker",
    "category": "Books & Stationery",
    "subcategory": "Writing Instruments",
    "price": 15.99,
    "image": "/images/products/base-book-5.jpg",
    "galleryImages": [
      "/images/products/base-book-5.jpg"
    ],
    "description": "Iconic stainless steel barrel with high-shine chrome trim and signature arrowhead clip. Quinkflow ballpoint technology for smooth ink delivery.",
    "specifications": {
      "Body": "Full Stainless Steel",
      "Point": "Medium (1.0 mm)",
      "Ink": "Quinkflow Blue Refill Included",
      "Closure": "Signature Click Mechanism"
    }
  },
  {
    "id": "base-book-6",
    "title": "Faber-Castell Polychromos Colored Pencils Set of 24",
    "brand": "Faber-Castell",
    "category": "Books & Stationery",
    "subcategory": "Art Supplies",
    "price": 49.99,
    "image": "/images/products/base-book-6.jpg",
    "galleryImages": [
      "/images/products/base-book-6.jpg"
    ],
    "description": "Artist-grade colored pencils featuring thick 3.8mm oil-based leads with unsurpassed lightfastness and break resistance via SV bonding.",
    "specifications": {
      "Set Count": "24 Tin Box Assortment",
      "Core": "3.8mm Oil-Based Lead",
      "Water Resistance": "Water-Resistant & Smudge-Proof",
      "Origin": "Germany"
    }
  },
  {
    "id": "base-pet-3",
    "title": "KONG Classic Durable Natural Rubber Dog Chew Toy",
    "brand": "KONG",
    "category": "Pet Supplies",
    "subcategory": "Pet Toys",
    "price": 14.99,
    "image": "/images/products/base-pet-3.jpg",
    "galleryImages": [
      "/images/products/base-pet-3.jpg"
    ],
    "description": "Veterinarian recommended ultra-durable red natural rubber toy for chewing, fetching, and mental enrichment with treat stuffing cavity.",
    "specifications": {
      "Size": "Large (Dogs 30-65 lbs)",
      "Material": "Natural All-Weather Rubber",
      "Feature": "Erratic Bounce & Stuffable",
      "Made In": "USA"
    }
  },
  {
    "id": "base-pet-4",
    "title": "Stainless Steel Double Dog & Cat Feeding Station",
    "brand": "URPOWER",
    "category": "Pet Supplies",
    "subcategory": "Feeding & Water",
    "price": 23.99,
    "image": "/images/products/base-pet-4.jpg",
    "galleryImages": [
      "/images/products/base-pet-4.jpg"
    ],
    "description": "Rust-resistant double stainless steel pet food and water bowls housed in non-skid silicone spill-proof mat tray.",
    "specifications": {
      "Bowl Capacity": "2x 26.4 oz (750 ml)",
      "Material": "Food-Grade SUS304 + Silicone",
      "Features": "Dishwasher Safe & Anti-Spill",
      "Design": "Zero Tip"
    }
  },
  {
    "id": "base-gard-3",
    "title": "Solar Outdoor Motion Sensor LED Floodlights 4-Pack",
    "brand": "Aootek",
    "category": "Garden & Tools",
    "subcategory": "Outdoor Lighting",
    "price": 35.99,
    "image": "/images/products/base-gard-3.jpg",
    "galleryImages": [
      "/images/products/base-gard-3.jpg"
    ],
    "description": "Ultra-bright solar-powered security lights featuring 120 high-output LEDs, 26-foot detection range, and IP65 waterproof rating.",
    "specifications": {
      "LED Count": "120 LEDs per Unit",
      "Pack Size": "4 Complete Light Units",
      "Sensors": "PIR Wide 120 Degree Motion Sensor",
      "Rating": "IP65 All-Weather Waterproof"
    }
  },
  {
    "id": "base-gard-4",
    "title": "Expandable Heavy-Duty Garden Water Hose 100ft",
    "brand": "FlexiHose",
    "category": "Garden & Tools",
    "subcategory": "Garden Equipment",
    "price": 49.99,
    "image": "/images/products/base-gard-4.jpg",
    "galleryImages": [
      "/images/products/base-gard-4.jpg"
    ],
    "description": "Extra strength triple-layer latex core expandable hose with 3/4-inch solid brass fittings and 8-pattern ergonomic spray nozzle.",
    "specifications": {
      "Length": "Expands up to 100 Feet",
      "Fittings": "3/4\" Solid Brass Connectors",
      "Pressure": "Withstands up to 12 Bar Pressure",
      "Included": "8-Function Spray Nozzle"
    }
  },
  {
    "id": "base-baby-3",
    "title": "Graco SlimFit 3-in-1 Convertible Car Seat",
    "brand": "Graco",
    "category": "Baby Products",
    "subcategory": "Car Seats & Travel",
    "price": 199.99,
    "image": "/images/products/base-baby-3.jpg",
    "galleryImages": [
      "/images/products/base-baby-3.jpg"
    ],
    "description": "Space-saving slim design car seat that grows with your child from rear-facing harness (5-40 lbs) to forward-facing booster (40-100 lbs).",
    "specifications": {
      "Weight Capacity": "5 to 100 lbs (3-in-1 System)",
      "Profile": "Slim Profile Saves Backseat Space",
      "Safety": "Graco ProtectPlus Engineered",
      "Cup Holders": "Dual Rotating Integrated"
    }
  },
  {
    "id": "base-baby-4",
    "title": "Ergobaby Omni 360 All-Position Baby Carrier",
    "brand": "Ergobaby",
    "category": "Baby Products",
    "subcategory": "Carriers & Wraps",
    "price": 179,
    "image": "/images/products/base-baby-4.jpg",
    "galleryImages": [
      "/images/products/base-baby-4.jpg"
    ],
    "description": "Ergonomic 4-position carrier with dynamic lumbar support and breathable Cool Air Mesh. No infant insert required (7-45 lbs).",
    "specifications": {
      "Positions": "Front Facing In, Front Out, Hip, Back",
      "Weight Range": "7 - 45 lbs (Newborn to Toddler)",
      "Fabric": "Breathable Cool Air Mesh",
      "Certification": "Hip Dysplasia Institute Certified"
    }
  },
  {
    "id": "base-toy-3",
    "title": "Ravensburger 1000 Piece Jigsaw Puzzle - World Map",
    "brand": "Ravensburger",
    "category": "Toys & Games",
    "subcategory": "Puzzles",
    "price": 21.99,
    "image": "/images/products/base-toy-3.jpg",
    "galleryImages": [
      "/images/products/base-toy-3.jpg"
    ],
    "description": "Precision cut pieces with Softclick technology featuring historical vintage world map art printed on glare-free linen structured paper.",
    "specifications": {
      "Pieces": "1,000 Precision Pieces",
      "Finished Size": "27 x 20 Inches (70 x 50 cm)",
      "Material": "Extra-Thick FSC Recycled Cardboard",
      "Age": "Ages 14+"
    }
  },
  {
    "id": "base-toy-4",
    "title": "Holy Stone GPS Quadcopter Drone with 4K UHD Camera",
    "brand": "Holy Stone",
    "category": "Toys & Games",
    "subcategory": "Remote Control & Drones",
    "price": 169.99,
    "image": "/images/products/base-toy-4.jpg",
    "galleryImages": [
      "/images/products/base-toy-4.jpg"
    ],
    "description": "Foldable GPS return drone equipped with 4K EIS anti-shake camera, brushless motors, and 46-minute dual battery flight time.",
    "specifications": {
      "Camera": "4K UHD with 90° Adjustable Lens",
      "Flight Time": "46 Mins (2 Modular Batteries)",
      "Range": "3,000 Feet FPV Transmission",
      "Safety": "GPS Auto Return to Home"
    }
  },
  {
    "id": "base-trav-3",
    "title": "Bagsmart Compression Packing Cubes 6-Piece Set",
    "brand": "Bagsmart",
    "category": "Travel Accessories",
    "subcategory": "Packing Organizers",
    "price": 39.99,
    "image": "/images/products/base-trav-3.jpg",
    "galleryImages": [
      "/images/products/base-trav-3.jpg"
    ],
    "description": "Ultra-lightweight expandable double-zipper compression organizers that compress clothing volume by up to 60% in luggage.",
    "specifications": {
      "Pieces": "6 Cubes (XL, L, M, S, Shoe Bag, Laundry)",
      "Material": "High-Density Water-Resistant Nylon",
      "Zippers": "Reinforced YKK Compression Dual Zips",
      "Color": "Graphite Grey"
    }
  },
  {
    "id": "base-trav-4",
    "title": "Cabeau Evolution S3 Memory Foam Travel Pillow",
    "brand": "Cabeau",
    "category": "Travel Accessories",
    "subcategory": "Travel Comfort",
    "price": 39.99,
    "image": "/images/products/base-trav-4.jpg",
    "galleryImages": [
      "/images/products/base-trav-4.jpg"
    ],
    "description": "Patented seat strap system attaches to airplane headrests to prevent head bobbing and forward neck drop with cooling moisture-wicking cover.",
    "specifications": {
      "Core": "High-Density Dual-Density Memory Foam",
      "Attachment": "Seat Strap Safety Attachment",
      "Cover": "Machine Washable Quick-Dry",
      "Pouch": "Includes Compact Travel Case"
    }
  }
];
