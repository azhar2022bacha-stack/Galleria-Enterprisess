import { addCatalogCategoryDefaults, replaceCatalogCategories } from './catalogCategoryReplacements';

export const BASE_STORE_CATEGORIES = [
  {
    "id": "store-cat-1",
    "name": "Mobile Phones & Accessories",
    "slug": "mobile-phones-accessories",
    "subcategories": [
      {
        "name": "Smartphones",
        "slug": "smartphones"
      },
      {
        "name": "Tablets",
        "slug": "tablets"
      },
      {
        "name": "Feature Phones",
        "slug": "feature-phones"
      },
      {
        "name": "Mobile Covers & Cases",
        "slug": "mobile-covers-cases"
      },
      {
        "name": "Screen Protectors",
        "slug": "screen-protectors"
      },
      {
        "name": "Chargers & Cables",
        "slug": "chargers-cables"
      },
      {
        "name": "Power Banks",
        "slug": "power-banks"
      },
      {
        "name": "Earphones & Headsets",
        "slug": "earphones-headsets"
      },
      {
        "name": "Mobile Holders & Mounts",
        "slug": "mobile-holders-mounts"
      },
      {
        "name": "Mobile Gadgets",
        "slug": "mobile-gadgets"
      },
      {
        "name": "Smart Watches",
        "slug": "smart-watches"
      },
      {
        "name": "Wearables",
        "slug": "wearables"
      }
    ]
  },
  {
    "id": "store-cat-2",
    "name": "Fashion & Clothing",
    "slug": "fashion-clothing",
    "subcategories": [
      {
        "name": "Men's Clothing",
        "slug": "men-s-clothing"
      },
      {
        "name": "Women's Clothing",
        "slug": "women-s-clothing"
      },
      {
        "name": "Kids' Clothing",
        "slug": "kids-clothing"
      },
      {
        "name": "Baby Clothing",
        "slug": "baby-clothing"
      },
      {
        "name": "Shirts",
        "slug": "shirts"
      },
      {
        "name": "T-Shirts",
        "slug": "t-shirts"
      },
      {
        "name": "Jeans & Pants",
        "slug": "jeans-pants"
      },
      {
        "name": "Hoodies & Jackets",
        "slug": "hoodies-jackets"
      },
      {
        "name": "Shorts",
        "slug": "shorts"
      },
      {
        "name": "Kurtas & Shalwar Kameez",
        "slug": "kurtas-shalwar-kameez"
      },
      {
        "name": "Women's Dresses & Suits",
        "slug": "women-s-dresses-suits"
      },
      {
        "name": "Kurtis & Tops",
        "slug": "kurtis-tops"
      },
      {
        "name": "Abayas & Hijabs",
        "slug": "abayas-hijabs"
      },
      {
        "name": "Sarees",
        "slug": "sarees"
      },
      {
        "name": "Nightwear",
        "slug": "nightwear"
      },
      {
        "name": "Innerwear",
        "slug": "innerwear"
      },
      {
        "name": "Sportswear & Activewear",
        "slug": "sportswear-activewear"
      },
      {
        "name": "Winter Clothing",
        "slug": "winter-clothing"
      },
      {
        "name": "Unstitched Fabric",
        "slug": "unstitched-fabric"
      },
      {
        "name": "Dupattas, Stoles & Shawls",
        "slug": "dupattas-stoles-shawls"
      },
      {
        "name": "Muslim Wear",
        "slug": "muslim-wear"
      }
    ]
  },
  {
    "id": "store-cat-3",
    "name": "Beauty & Personal Care",
    "slug": "beauty-personal-care",
    "subcategories": [
      {
        "name": "Makeup",
        "slug": "makeup"
      },
      {
        "name": "Foundation & Face Makeup",
        "slug": "foundation-face-makeup"
      },
      {
        "name": "Lipsticks",
        "slug": "lipsticks"
      },
      {
        "name": "Eye Makeup",
        "slug": "eye-makeup"
      },
      {
        "name": "Makeup Tools",
        "slug": "makeup-tools"
      },
      {
        "name": "Skincare",
        "slug": "skincare"
      },
      {
        "name": "Face Wash",
        "slug": "face-wash"
      },
      {
        "name": "Moisturizers",
        "slug": "moisturizers"
      },
      {
        "name": "Serums",
        "slug": "serums"
      },
      {
        "name": "Sunscreens",
        "slug": "sunscreens"
      },
      {
        "name": "Hair Care",
        "slug": "hair-care"
      },
      {
        "name": "Shampoos",
        "slug": "shampoos"
      },
      {
        "name": "Hair Oils",
        "slug": "hair-oils"
      },
      {
        "name": "Hair Styling Products",
        "slug": "hair-styling-products"
      },
      {
        "name": "Hair Color & Dye",
        "slug": "hair-color-dye"
      },
      {
        "name": "Hair Tools",
        "slug": "hair-tools"
      },
      {
        "name": "Bath & Body",
        "slug": "bath-body"
      },
      {
        "name": "Personal Hygiene",
        "slug": "personal-hygiene"
      },
      {
        "name": "Men's Grooming",
        "slug": "men-s-grooming"
      },
      {
        "name": "Women's Grooming",
        "slug": "women-s-grooming"
      },
      {
        "name": "Perfumes",
        "slug": "perfumes"
      },
      {
        "name": "Body Sprays",
        "slug": "body-sprays"
      },
      {
        "name": "Attars",
        "slug": "attars"
      },
      {
        "name": "Beauty Accessories",
        "slug": "beauty-accessories"
      }
    ]
  },
  {
    "id": "store-cat-4",
    "name": "Home & Living",
    "slug": "home-living",
    "subcategories": [
      {
        "name": "Kitchen Accessories",
        "slug": "kitchen-accessories"
      },
      {
        "name": "Kitchen Appliances",
        "slug": "kitchen-appliances"
      },
      {
        "name": "Microwaves & Ovens",
        "slug": "microwaves-ovens"
      },
      {
        "name": "Air Fryers",
        "slug": "air-fryers"
      },
      {
        "name": "Blenders & Juicers",
        "slug": "blenders-juicers"
      },
      {
        "name": "Electric Kettles",
        "slug": "electric-kettles"
      },
      {
        "name": "Coffee Machines",
        "slug": "coffee-machines"
      },
      {
        "name": "Cooking Pots & Pans",
        "slug": "cooking-pots-pans"
      },
      {
        "name": "Kitchen Utensils",
        "slug": "kitchen-utensils"
      },
      {
        "name": "Dinner Sets",
        "slug": "dinner-sets"
      },
      {
        "name": "Drinkware & Glassware",
        "slug": "drinkware-glassware"
      },
      {
        "name": "Refrigerators",
        "slug": "refrigerators"
      },
      {
        "name": "Washing Machines",
        "slug": "washing-machines"
      },
      {
        "name": "Air Conditioners",
        "slug": "air-conditioners"
      },
      {
        "name": "Fans",
        "slug": "fans"
      },
      {
        "name": "Heaters & Cooling Devices",
        "slug": "heaters-cooling-devices"
      },
      {
        "name": "Vacuum Cleaners",
        "slug": "vacuum-cleaners"
      },
      {
        "name": "Irons & Garment Care",
        "slug": "irons-garment-care"
      },
      {
        "name": "Smart Home Devices",
        "slug": "smart-home-devices"
      },
      {
        "name": "Cleaning Supplies",
        "slug": "cleaning-supplies"
      },
      {
        "name": "Bathroom Accessories",
        "slug": "bathroom-accessories"
      },
      {
        "name": "Storage & Organizers",
        "slug": "storage-organizers"
      },
      {
        "name": "Bedsheets",
        "slug": "bedsheets"
      },
      {
        "name": "Blankets",
        "slug": "blankets"
      },
      {
        "name": "Pillows",
        "slug": "pillows"
      },
      {
        "name": "Towels",
        "slug": "towels"
      },
      {
        "name": "Rugs & Carpets",
        "slug": "rugs-carpets"
      },
      {
        "name": "Lighting & Lamps",
        "slug": "lighting-lamps"
      },
      {
        "name": "Decorative Items",
        "slug": "decorative-items"
      },
      {
        "name": "Wall Art",
        "slug": "wall-art"
      },
      {
        "name": "Clocks",
        "slug": "clocks"
      },
      {
        "name": "Curtains",
        "slug": "curtains"
      },
      {
        "name": "Home Utility Products",
        "slug": "home-utility-products"
      },
      {
        "name": "Garden Tools",
        "slug": "garden-tools"
      }
    ]
  },
  {
    "id": "store-cat-5",
    "name": "Computers & Laptops",
    "slug": "computers-laptops",
    "subcategories": [
      {
        "name": "Laptops",
        "slug": "laptops"
      },
      {
        "name": "Desktop Computers",
        "slug": "desktop-computers"
      },
      {
        "name": "Monitors",
        "slug": "monitors"
      },
      {
        "name": "Keyboards",
        "slug": "keyboards"
      },
      {
        "name": "Computer Mice",
        "slug": "computer-mice"
      },
      {
        "name": "Computer Accessories",
        "slug": "computer-accessories"
      },
      {
        "name": "Printers & Scanners",
        "slug": "printers-scanners"
      },
      {
        "name": "External Hard Drives",
        "slug": "external-hard-drives"
      },
      {
        "name": "SSDs",
        "slug": "ssds"
      },
      {
        "name": "USB Flash Drives",
        "slug": "usb-flash-drives"
      },
      {
        "name": "Laptop Bags",
        "slug": "laptop-bags"
      },
      {
        "name": "Cooling Pads",
        "slug": "cooling-pads"
      },
      {
        "name": "Routers & Modems",
        "slug": "routers-modems"
      },
      {
        "name": "Networking Devices",
        "slug": "networking-devices"
      },
      {
        "name": "Webcams",
        "slug": "webcams"
      },
      {
        "name": "Computer Components",
        "slug": "computer-components"
      },
      {
        "name": "Graphics Cards",
        "slug": "graphics-cards"
      },
      {
        "name": "RAM",
        "slug": "ram"
      },
      {
        "name": "Motherboards",
        "slug": "motherboards"
      },
      {
        "name": "PC Cases",
        "slug": "pc-cases"
      }
    ]
  },
  {
    "id": "store-cat-6",
    "name": "Mother & Baby",
    "slug": "mother-baby",
    "subcategories": [
      {
        "name": "Baby Care",
        "slug": "baby-care"
      },
      {
        "name": "Baby Diapers",
        "slug": "baby-diapers"
      },
      {
        "name": "Baby Bathing",
        "slug": "baby-bathing"
      },
      {
        "name": "Baby Clothing",
        "slug": "baby-clothing"
      },
      {
        "name": "Baby Shoes",
        "slug": "baby-shoes"
      },
      {
        "name": "Baby Feeding Accessories",
        "slug": "baby-feeding-accessories"
      },
      {
        "name": "Baby Strollers",
        "slug": "baby-strollers"
      },
      {
        "name": "Baby Car Seats",
        "slug": "baby-car-seats"
      },
      {
        "name": "Baby Carriers",
        "slug": "baby-carriers"
      },
      {
        "name": "Baby Cribs",
        "slug": "baby-cribs"
      },
      {
        "name": "Baby Bedding",
        "slug": "baby-bedding"
      },
      {
        "name": "Maternity Care",
        "slug": "maternity-care"
      },
      {
        "name": "Nursing Accessories",
        "slug": "nursing-accessories"
      },
      {
        "name": "Baby Toys",
        "slug": "baby-toys"
      },
      {
        "name": "Baby Safety Products",
        "slug": "baby-safety-products"
      },
      {
        "name": "Diaper Bags",
        "slug": "diaper-bags"
      }
    ]
  },
  {
    "id": "store-cat-7",
    "name": "Shoes & Footwear",
    "slug": "shoes-footwear",
    "subcategories": [
      {
        "name": "Men's Shoes",
        "slug": "men-s-shoes"
      },
      {
        "name": "Women's Shoes",
        "slug": "women-s-shoes"
      },
      {
        "name": "Kids' Shoes",
        "slug": "kids-shoes"
      },
      {
        "name": "Sports Shoes",
        "slug": "sports-shoes"
      },
      {
        "name": "Sneakers",
        "slug": "sneakers"
      },
      {
        "name": "Formal Shoes",
        "slug": "formal-shoes"
      },
      {
        "name": "Casual Shoes",
        "slug": "casual-shoes"
      },
      {
        "name": "Sandals",
        "slug": "sandals"
      },
      {
        "name": "Slippers",
        "slug": "slippers"
      },
      {
        "name": "Boots",
        "slug": "boots"
      },
      {
        "name": "Heels",
        "slug": "heels"
      },
      {
        "name": "Flats",
        "slug": "flats"
      },
      {
        "name": "Shoe Accessories",
        "slug": "shoe-accessories"
      }
    ]
  },
  {
    "id": "store-cat-8",
    "name": "Jewelry & Fashion Accessories",
    "slug": "jewelry-fashion-accessories",
    "subcategories": [
      {
        "name": "Watches",
        "slug": "watches"
      },
      {
        "name": "Smart Watches",
        "slug": "smart-watches"
      },
      {
        "name": "Necklaces & Pendants",
        "slug": "necklaces-pendants"
      },
      {
        "name": "Rings & Bands",
        "slug": "rings-bands"
      },
      {
        "name": "Earrings",
        "slug": "earrings"
      },
      {
        "name": "Bracelets & Bangles",
        "slug": "bracelets-bangles"
      },
      {
        "name": "Jewelry Sets",
        "slug": "jewelry-sets"
      },
      {
        "name": "Sunglasses",
        "slug": "sunglasses"
      },
      {
        "name": "Eyeglasses",
        "slug": "eyeglasses"
      },
      {
        "name": "Hair Accessories",
        "slug": "hair-accessories"
      },
      {
        "name": "Belts",
        "slug": "belts"
      },
      {
        "name": "Wallets",
        "slug": "wallets"
      },
      {
        "name": "Men's Accessories",
        "slug": "men-s-accessories"
      },
      {
        "name": "Women's Accessories",
        "slug": "women-s-accessories"
      }
    ]
  },
  {
    "id": "store-cat-9",
    "name": "Bags, Travel & Luggage",
    "slug": "bags-travel-luggage",
    "subcategories": [
      {
        "name": "Handbags",
        "slug": "handbags"
      },
      {
        "name": "Tote Bags",
        "slug": "tote-bags"
      },
      {
        "name": "Backpacks",
        "slug": "backpacks"
      },
      {
        "name": "School Bags",
        "slug": "school-bags"
      },
      {
        "name": "Laptop Bags",
        "slug": "laptop-bags"
      },
      {
        "name": "Suitcases",
        "slug": "suitcases"
      },
      {
        "name": "Trolleys",
        "slug": "trolleys"
      },
      {
        "name": "Travel Bags",
        "slug": "travel-bags"
      },
      {
        "name": "Wallets",
        "slug": "wallets"
      },
      {
        "name": "Travel Accessories",
        "slug": "travel-accessories"
      },
      {
        "name": "Luggage Scales",
        "slug": "luggage-scales"
      },
      {
        "name": "Passport Holders",
        "slug": "passport-holders"
      },
      {
        "name": "Travel Organizers",
        "slug": "travel-organizers"
      }
    ]
  },
  {
    "id": "store-cat-10",
    "name": "Kids, Toys & Games",
    "slug": "kids-toys-games",
    "subcategories": [
      {
        "name": "Educational Toys",
        "slug": "educational-toys"
      },
      {
        "name": "Action Figures",
        "slug": "action-figures"
      },
      {
        "name": "Vehicle Toys",
        "slug": "vehicle-toys"
      },
      {
        "name": "Baby & Toddler Toys",
        "slug": "baby-toddler-toys"
      },
      {
        "name": "Electronic Toys",
        "slug": "electronic-toys"
      },
      {
        "name": "Smart Toys",
        "slug": "smart-toys"
      },
      {
        "name": "Creative & Art Toys",
        "slug": "creative-art-toys"
      },
      {
        "name": "Remote Control Toys",
        "slug": "remote-control-toys"
      },
      {
        "name": "Board Games",
        "slug": "board-games"
      },
      {
        "name": "Puzzles",
        "slug": "puzzles"
      },
      {
        "name": "Dolls",
        "slug": "dolls"
      },
      {
        "name": "Building Blocks",
        "slug": "building-blocks"
      },
      {
        "name": "Outdoor Play Equipment",
        "slug": "outdoor-play-equipment"
      },
      {
        "name": "Play & Swing Sets",
        "slug": "play-swing-sets"
      },
      {
        "name": "Kids' Learning Materials",
        "slug": "kids-learning-materials"
      }
    ]
  },
  {
    "id": "store-cat-11",
    "name": "Gaming & Consoles",
    "slug": "gaming-consoles",
    "subcategories": [
      {
        "name": "Gaming Consoles",
        "slug": "gaming-consoles"
      },
      {
        "name": "PlayStation",
        "slug": "playstation"
      },
      {
        "name": "Xbox",
        "slug": "xbox"
      },
      {
        "name": "Nintendo",
        "slug": "nintendo"
      },
      {
        "name": "Gaming Controllers",
        "slug": "gaming-controllers"
      },
      {
        "name": "Gaming Headsets",
        "slug": "gaming-headsets"
      },
      {
        "name": "Gaming Keyboards",
        "slug": "gaming-keyboards"
      },
      {
        "name": "Gaming Mice",
        "slug": "gaming-mice"
      },
      {
        "name": "Gaming Chairs",
        "slug": "gaming-chairs"
      },
      {
        "name": "Gaming Desks",
        "slug": "gaming-desks"
      },
      {
        "name": "Gaming Accessories",
        "slug": "gaming-accessories"
      },
      {
        "name": "Video Games",
        "slug": "video-games"
      },
      {
        "name": "VR Headsets",
        "slug": "vr-headsets"
      }
    ]
  },
  {
    "id": "store-cat-12",
    "name": "TV, Audio & Video",
    "slug": "tv-audio-video",
    "subcategories": [
      {
        "name": "LED TVs",
        "slug": "led-tvs"
      },
      {
        "name": "Smart TVs",
        "slug": "smart-tvs"
      },
      {
        "name": "Speakers",
        "slug": "speakers"
      },
      {
        "name": "Bluetooth Speakers",
        "slug": "bluetooth-speakers"
      },
      {
        "name": "Headphones",
        "slug": "headphones"
      },
      {
        "name": "Home Theater Systems",
        "slug": "home-theater-systems"
      },
      {
        "name": "Projectors",
        "slug": "projectors"
      },
      {
        "name": "Soundbars",
        "slug": "soundbars"
      },
      {
        "name": "Streaming Devices",
        "slug": "streaming-devices"
      },
      {
        "name": "TV Accessories",
        "slug": "tv-accessories"
      },
      {
        "name": "Microphones",
        "slug": "microphones"
      },
      {
        "name": "Audio Equipment",
        "slug": "audio-equipment"
      }
    ]
  },
  {
    "id": "store-cat-13",
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "subcategories": [
      {
        "name": "Medical Supplies",
        "slug": "medical-supplies"
      },
      {
        "name": "First Aid Kits",
        "slug": "first-aid-kits"
      },
      {
        "name": "Thermometers",
        "slug": "thermometers"
      },
      {
        "name": "Blood Pressure Monitors",
        "slug": "blood-pressure-monitors"
      },
      {
        "name": "Glucose Monitors",
        "slug": "glucose-monitors"
      },
      {
        "name": "Health Monitoring Devices",
        "slug": "health-monitoring-devices"
      },
      {
        "name": "Mobility Aids",
        "slug": "mobility-aids"
      },
      {
        "name": "Orthopedic Supports",
        "slug": "orthopedic-supports"
      },
      {
        "name": "Personal Safety Equipment",
        "slug": "personal-safety-equipment"
      },
      {
        "name": "Fitness Monitoring Devices",
        "slug": "fitness-monitoring-devices"
      },
      {
        "name": "Massage Devices",
        "slug": "massage-devices"
      },
      {
        "name": "Heating Pads",
        "slug": "heating-pads"
      }
    ]
  },
  {
    "id": "store-cat-14",
    "name": "Sports & Outdoor",
    "slug": "sports-outdoor",
    "subcategories": [
      {
        "name": "Exercise & Fitness Equipment",
        "slug": "exercise-fitness-equipment"
      },
      {
        "name": "Treadmills",
        "slug": "treadmills"
      },
      {
        "name": "Dumbbells",
        "slug": "dumbbells"
      },
      {
        "name": "Resistance Bands",
        "slug": "resistance-bands"
      },
      {
        "name": "Yoga Mats",
        "slug": "yoga-mats"
      },
      {
        "name": "Exercise Bikes",
        "slug": "exercise-bikes"
      },
      {
        "name": "Sports Apparel",
        "slug": "sports-apparel"
      },
      {
        "name": "Sports Footwear",
        "slug": "sports-footwear"
      },
      {
        "name": "Football Equipment",
        "slug": "football-equipment"
      },
      {
        "name": "Cricket Equipment",
        "slug": "cricket-equipment"
      },
      {
        "name": "Basketball Equipment",
        "slug": "basketball-equipment"
      },
      {
        "name": "Badminton Equipment",
        "slug": "badminton-equipment"
      },
      {
        "name": "Tennis Equipment",
        "slug": "tennis-equipment"
      },
      {
        "name": "Cycling Accessories",
        "slug": "cycling-accessories"
      },
      {
        "name": "Hiking Equipment",
        "slug": "hiking-equipment"
      },
      {
        "name": "Camping Equipment",
        "slug": "camping-equipment"
      },
      {
        "name": "Fishing Accessories",
        "slug": "fishing-accessories"
      },
      {
        "name": "Outdoor Games",
        "slug": "outdoor-games"
      },
      {
        "name": "Sports Accessories",
        "slug": "sports-accessories"
      }
    ]
  },
  {
    "id": "store-cat-15",
    "name": "Automotive & Motorcycles",
    "slug": "automotive-motorcycles",
    "subcategories": [
      {
        "name": "Car Interior Accessories",
        "slug": "car-interior-accessories"
      },
      {
        "name": "Car Exterior Accessories",
        "slug": "car-exterior-accessories"
      },
      {
        "name": "Car Electronics",
        "slug": "car-electronics"
      },
      {
        "name": "Car Audio Systems",
        "slug": "car-audio-systems"
      },
      {
        "name": "Car Cameras",
        "slug": "car-cameras"
      },
      {
        "name": "Car Covers",
        "slug": "car-covers"
      },
      {
        "name": "Bike Covers",
        "slug": "bike-covers"
      },
      {
        "name": "Motorcycle Parts",
        "slug": "motorcycle-parts"
      },
      {
        "name": "Bike Accessories",
        "slug": "bike-accessories"
      },
      {
        "name": "Helmets",
        "slug": "helmets"
      },
      {
        "name": "Tires & Wheels",
        "slug": "tires-wheels"
      },
      {
        "name": "Batteries",
        "slug": "batteries"
      },
      {
        "name": "Car Lighting",
        "slug": "car-lighting"
      },
      {
        "name": "Car Cleaning Tools",
        "slug": "car-cleaning-tools"
      },
      {
        "name": "Car Care Products",
        "slug": "car-care-products"
      },
      {
        "name": "Safety & Emergency Equipment",
        "slug": "safety-emergency-equipment"
      },
      {
        "name": "Key Chains",
        "slug": "key-chains"
      },
      {
        "name": "Vehicle Tools",
        "slug": "vehicle-tools"
      }
    ]
  },
  {
    "id": "store-cat-16",
    "name": "Cameras & Photography",
    "slug": "cameras-photography",
    "subcategories": [
      {
        "name": "DSLR Cameras",
        "slug": "dslr-cameras"
      },
      {
        "name": "Mirrorless Cameras",
        "slug": "mirrorless-cameras"
      },
      {
        "name": "Digital Cameras",
        "slug": "digital-cameras"
      },
      {
        "name": "Drone Cameras",
        "slug": "drone-cameras"
      },
      {
        "name": "CCTV Cameras",
        "slug": "cctv-cameras"
      },
      {
        "name": "Security Systems",
        "slug": "security-systems"
      },
      {
        "name": "Tripods",
        "slug": "tripods"
      },
      {
        "name": "Camera Lenses",
        "slug": "camera-lenses"
      },
      {
        "name": "Camera Bags",
        "slug": "camera-bags"
      },
      {
        "name": "Photography Lighting",
        "slug": "photography-lighting"
      },
      {
        "name": "Stabilizers & Gimbals",
        "slug": "stabilizers-gimbals"
      },
      {
        "name": "Memory Cards",
        "slug": "memory-cards"
      },
      {
        "name": "Camera Accessories",
        "slug": "camera-accessories"
      }
    ]
  },
  {
    "id": "store-cat-17",
    "name": "Furniture & Home Decor",
    "slug": "furniture-home-decor",
    "subcategories": [
      {
        "name": "Sofas",
        "slug": "sofas"
      },
      {
        "name": "Beds",
        "slug": "beds"
      },
      {
        "name": "Mattresses",
        "slug": "mattresses"
      },
      {
        "name": "Dining Tables",
        "slug": "dining-tables"
      },
      {
        "name": "Office Chairs",
        "slug": "office-chairs"
      },
      {
        "name": "Office Desks",
        "slug": "office-desks"
      },
      {
        "name": "Computer Desks",
        "slug": "computer-desks"
      },
      {
        "name": "Study Tables",
        "slug": "study-tables"
      },
      {
        "name": "Shelves",
        "slug": "shelves"
      },
      {
        "name": "Cabinets",
        "slug": "cabinets"
      },
      {
        "name": "Wardrobes",
        "slug": "wardrobes"
      },
      {
        "name": "Chairs",
        "slug": "chairs"
      },
      {
        "name": "Stools",
        "slug": "stools"
      },
      {
        "name": "Sofa Covers",
        "slug": "sofa-covers"
      },
      {
        "name": "Furniture Accessories",
        "slug": "furniture-accessories"
      },
      {
        "name": "Curtains",
        "slug": "curtains"
      },
      {
        "name": "Home Decoration",
        "slug": "home-decoration"
      },
      {
        "name": "Furniture Polish",
        "slug": "furniture-polish"
      }
    ]
  },
  {
    "id": "store-cat-18",
    "name": "Tools & Hardware",
    "slug": "tools-hardware",
    "subcategories": [
      {
        "name": "Power Tools",
        "slug": "power-tools"
      },
      {
        "name": "Drills",
        "slug": "drills"
      },
      {
        "name": "Screwdrivers",
        "slug": "screwdrivers"
      },
      {
        "name": "Hammers",
        "slug": "hammers"
      },
      {
        "name": "Wrenches",
        "slug": "wrenches"
      },
      {
        "name": "Tool Kits",
        "slug": "tool-kits"
      },
      {
        "name": "Welding Tools",
        "slug": "welding-tools"
      },
      {
        "name": "Electrical Tools",
        "slug": "electrical-tools"
      },
      {
        "name": "Construction Equipment",
        "slug": "construction-equipment"
      },
      {
        "name": "Safety Equipment",
        "slug": "safety-equipment"
      },
      {
        "name": "Measuring Tools",
        "slug": "measuring-tools"
      },
      {
        "name": "Painting Tools",
        "slug": "painting-tools"
      },
      {
        "name": "Sealants",
        "slug": "sealants"
      },
      {
        "name": "Hangers & Hooks",
        "slug": "hangers-hooks"
      },
      {
        "name": "Door Hardware & Locks",
        "slug": "door-hardware-locks"
      },
      {
        "name": "Flashlights & Torches",
        "slug": "flashlights-torches"
      },
      {
        "name": "Batteries",
        "slug": "batteries"
      },
      {
        "name": "Hardware Accessories",
        "slug": "hardware-accessories"
      }
    ]
  },
  {
    "id": "store-cat-19",
    "name": "Pets & Pet Accessories",
    "slug": "pets-pet-accessories",
    "subcategories": [
      {
        "name": "Pet Clothing",
        "slug": "pet-clothing"
      },
      {
        "name": "Pet Beds",
        "slug": "pet-beds"
      },
      {
        "name": "Pet Furniture",
        "slug": "pet-furniture"
      },
      {
        "name": "Pet Toys",
        "slug": "pet-toys"
      },
      {
        "name": "Feeding & Water Supplies",
        "slug": "feeding-water-supplies"
      },
      {
        "name": "Collars & Leashes",
        "slug": "collars-leashes"
      },
      {
        "name": "Pet Carriers",
        "slug": "pet-carriers"
      },
      {
        "name": "Grooming Products",
        "slug": "grooming-products"
      },
      {
        "name": "Pet Hygiene",
        "slug": "pet-hygiene"
      },
      {
        "name": "Aquarium Accessories",
        "slug": "aquarium-accessories"
      },
      {
        "name": "Bird Accessories",
        "slug": "bird-accessories"
      },
      {
        "name": "Cat Accessories",
        "slug": "cat-accessories"
      },
      {
        "name": "Dog Accessories",
        "slug": "dog-accessories"
      }
    ]
  },
  {
    "id": "store-cat-20",
    "name": "Gifts & Customized Products",
    "slug": "gifts-customized-products",
    "subcategories": [
      {
        "name": "Gift Boxes",
        "slug": "gift-boxes"
      },
      {
        "name": "Birthday Gifts",
        "slug": "birthday-gifts"
      },
      {
        "name": "Anniversary Gifts",
        "slug": "anniversary-gifts"
      },
      {
        "name": "Wedding Gifts",
        "slug": "wedding-gifts"
      },
      {
        "name": "Personalized Gifts",
        "slug": "personalized-gifts"
      },
      {
        "name": "Customized Photo Frames",
        "slug": "customized-photo-frames"
      },
      {
        "name": "Photo Collages",
        "slug": "photo-collages"
      },
      {
        "name": "Customized Mugs",
        "slug": "customized-mugs"
      },
      {
        "name": "Customized T-Shirts",
        "slug": "customized-t-shirts"
      },
      {
        "name": "Name Decorations",
        "slug": "name-decorations"
      },
      {
        "name": "Gift Cards",
        "slug": "gift-cards"
      },
      {
        "name": "Greeting Cards",
        "slug": "greeting-cards"
      },
      {
        "name": "Party Supplies",
        "slug": "party-supplies"
      },
      {
        "name": "Event Decorations",
        "slug": "event-decorations"
      },
      {
        "name": "Handmade Gifts",
        "slug": "handmade-gifts"
      }
    ]
  },
  {
    "id": "store-cat-21",
    "name": "Books & Education",
    "slug": "books-education",
    "subcategories": [
      {
        "name": "Fiction Books",
        "slug": "fiction-books"
      },
      {
        "name": "Non-Fiction Books",
        "slug": "non-fiction-books"
      },
      {
        "name": "Educational Books",
        "slug": "educational-books"
      },
      {
        "name": "Academic Books",
        "slug": "academic-books"
      },
      {
        "name": "Children's Books",
        "slug": "children-s-books"
      },
      {
        "name": "Religious Books",
        "slug": "religious-books"
      },
      {
        "name": "Islamic Books",
        "slug": "islamic-books"
      },
      {
        "name": "Magazines",
        "slug": "magazines"
      },
      {
        "name": "E-books",
        "slug": "e-books"
      },
      {
        "name": "Learning Materials",
        "slug": "learning-materials"
      },
      {
        "name": "Educational Toys",
        "slug": "educational-toys"
      }
    ]
  },
  {
    "id": "store-cat-22",
    "name": "Stationery & Office Supplies",
    "slug": "stationery-office-supplies",
    "subcategories": [
      {
        "name": "Pens & Pencils",
        "slug": "pens-pencils"
      },
      {
        "name": "Notebooks",
        "slug": "notebooks"
      },
      {
        "name": "Paper Products",
        "slug": "paper-products"
      },
      {
        "name": "Office Supplies",
        "slug": "office-supplies"
      },
      {
        "name": "School Supplies",
        "slug": "school-supplies"
      },
      {
        "name": "Files & Folders",
        "slug": "files-folders"
      },
      {
        "name": "Desk Organizers",
        "slug": "desk-organizers"
      },
      {
        "name": "Staplers",
        "slug": "staplers"
      },
      {
        "name": "Adhesives",
        "slug": "adhesives"
      },
      {
        "name": "Art & Craft Supplies",
        "slug": "art-craft-supplies"
      },
      {
        "name": "Drawing Materials",
        "slug": "drawing-materials"
      },
      {
        "name": "Office Equipment",
        "slug": "office-equipment"
      },
      {
        "name": "Calculators",
        "slug": "calculators"
      },
      {
        "name": "Whiteboards",
        "slug": "whiteboards"
      }
    ]
  },
  {
    "id": "store-cat-23",
    "name": "Agriculture & Gardening",
    "slug": "agriculture-gardening",
    "subcategories": [
      {
        "name": "Gardening Tools",
        "slug": "gardening-tools"
      },
      {
        "name": "Flower Seeds",
        "slug": "flower-seeds"
      },
      {
        "name": "Plant Seeds",
        "slug": "plant-seeds"
      },
      {
        "name": "Indoor Plants",
        "slug": "indoor-plants"
      },
      {
        "name": "Outdoor Plants",
        "slug": "outdoor-plants"
      },
      {
        "name": "Plant Pots",
        "slug": "plant-pots"
      },
      {
        "name": "Gardening Accessories",
        "slug": "gardening-accessories"
      },
      {
        "name": "Watering Equipment",
        "slug": "watering-equipment"
      },
      {
        "name": "Plant Stands",
        "slug": "plant-stands"
      },
      {
        "name": "Lawn Equipment",
        "slug": "lawn-equipment"
      },
      {
        "name": "Fertilizers",
        "slug": "fertilizers"
      },
      {
        "name": "Plant Care Tools",
        "slug": "plant-care-tools"
      }
    ]
  },
  {
    "id": "store-cat-24",
    "name": "Antiques, Art & Collectibles",
    "slug": "antiques-art-collectibles",
    "subcategories": [
      {
        "name": "Antique Furniture",
        "slug": "antique-furniture"
      },
      {
        "name": "Antique Decorations",
        "slug": "antique-decorations"
      },
      {
        "name": "Art Paintings",
        "slug": "art-paintings"
      },
      {
        "name": "Sculptures",
        "slug": "sculptures"
      },
      {
        "name": "Collectible Items",
        "slug": "collectible-items"
      },
      {
        "name": "Ceramics",
        "slug": "ceramics"
      },
      {
        "name": "Glassware",
        "slug": "glassware"
      },
      {
        "name": "Handmade Art",
        "slug": "handmade-art"
      },
      {
        "name": "Traditional Handicrafts",
        "slug": "traditional-handicrafts"
      },
      {
        "name": "Calligraphy Art",
        "slug": "calligraphy-art"
      }
    ]
  },
  {
    "id": "store-cat-25",
    "name": "Islamic & Religious Products",
    "slug": "islamic-religious-products",
    "subcategories": [
      {
        "name": "Prayer Mats",
        "slug": "prayer-mats"
      },
      {
        "name": "Tasbeeh",
        "slug": "tasbeeh"
      },
      {
        "name": "Islamic Books",
        "slug": "islamic-books"
      },
      {
        "name": "Quran Accessories",
        "slug": "quran-accessories"
      },
      {
        "name": "Quran Stands",
        "slug": "quran-stands"
      },
      {
        "name": "Prayer Caps",
        "slug": "prayer-caps"
      },
      {
        "name": "Ihram",
        "slug": "ihram"
      },
      {
        "name": "Islamic Wall Art",
        "slug": "islamic-wall-art"
      },
      {
        "name": "Islamic Decorations",
        "slug": "islamic-decorations"
      },
      {
        "name": "Attar",
        "slug": "attar"
      },
      {
        "name": "Hijabs",
        "slug": "hijabs"
      },
      {
        "name": "Religious Gifts",
        "slug": "religious-gifts"
      }
    ]
  },
  {
    "id": "store-cat-26",
    "name": "Electrical & Solar Products",
    "slug": "electrical-solar-products",
    "subcategories": [
      {
        "name": "Generators",
        "slug": "generators"
      },
      {
        "name": "UPS Systems",
        "slug": "ups-systems"
      },
      {
        "name": "Solar Panels",
        "slug": "solar-panels"
      },
      {
        "name": "Solar Inverters",
        "slug": "solar-inverters"
      },
      {
        "name": "Solar Batteries",
        "slug": "solar-batteries"
      },
      {
        "name": "Voltage Stabilizers",
        "slug": "voltage-stabilizers"
      },
      {
        "name": "Extension Boards",
        "slug": "extension-boards"
      },
      {
        "name": "Switches & Sockets",
        "slug": "switches-sockets"
      },
      {
        "name": "Electrical Cables",
        "slug": "electrical-cables"
      },
      {
        "name": "Circuit Breakers",
        "slug": "circuit-breakers"
      },
      {
        "name": "LED Bulbs",
        "slug": "led-bulbs"
      },
      {
        "name": "Emergency Lights",
        "slug": "emergency-lights"
      },
      {
        "name": "Power Banks",
        "slug": "power-banks"
      }
    ]
  },
  {
    "id": "store-cat-27",
    "name": "Handmade & Craft Products",
    "slug": "handmade-craft-products",
    "subcategories": [
      {
        "name": "Handmade Jewelry",
        "slug": "handmade-jewelry"
      },
      {
        "name": "Handmade Bags",
        "slug": "handmade-bags"
      },
      {
        "name": "Handmade Clothing",
        "slug": "handmade-clothing"
      },
      {
        "name": "Handmade Decorations",
        "slug": "handmade-decorations"
      },
      {
        "name": "Handmade Furniture",
        "slug": "handmade-furniture"
      },
      {
        "name": "Handmade Paintings",
        "slug": "handmade-paintings"
      },
      {
        "name": "Handmade Accessories",
        "slug": "handmade-accessories"
      },
      {
        "name": "Embroidery Products",
        "slug": "embroidery-products"
      },
      {
        "name": "Customized Crafts",
        "slug": "customized-crafts"
      },
      {
        "name": "DIY Craft Kits",
        "slug": "diy-craft-kits"
      }
    ]
  },
  {
    "id": "store-cat-28",
    "name": "Musical Instruments",
    "slug": "musical-instruments",
    "subcategories": [
      {
        "name": "Guitars",
        "slug": "guitars"
      },
      {
        "name": "Keyboards",
        "slug": "keyboards"
      },
      {
        "name": "Pianos",
        "slug": "pianos"
      },
      {
        "name": "Drums",
        "slug": "drums"
      },
      {
        "name": "Violins",
        "slug": "violins"
      },
      {
        "name": "Flutes",
        "slug": "flutes"
      },
      {
        "name": "Microphones",
        "slug": "microphones"
      },
      {
        "name": "Musical Accessories",
        "slug": "musical-accessories"
      },
      {
        "name": "Instrument Cases",
        "slug": "instrument-cases"
      },
      {
        "name": "Audio Recording Equipment",
        "slug": "audio-recording-equipment"
      }
    ]
  },
  {
    "id": "store-cat-29",
    "name": "Industrial & Business Supplies",
    "slug": "industrial-business-supplies",
    "subcategories": [
      {
        "name": "Office Equipment",
        "slug": "office-equipment"
      },
      {
        "name": "Commercial Furniture",
        "slug": "commercial-furniture"
      },
      {
        "name": "Industrial Tools",
        "slug": "industrial-tools"
      },
      {
        "name": "Safety Equipment",
        "slug": "safety-equipment"
      },
      {
        "name": "Packaging Materials",
        "slug": "packaging-materials"
      },
      {
        "name": "Storage Equipment",
        "slug": "storage-equipment"
      },
      {
        "name": "Measuring Instruments",
        "slug": "measuring-instruments"
      },
      {
        "name": "Commercial Electronics",
        "slug": "commercial-electronics"
      },
      {
        "name": "Retail POS Equipment",
        "slug": "retail-pos-equipment"
      },
      {
        "name": "Barcode Scanners",
        "slug": "barcode-scanners"
      },
      {
        "name": "Label Printers",
        "slug": "label-printers"
      }
    ]
  },
  {
    "id": "store-cat-30",
    "name": "Other & Miscellaneous",
    "slug": "other-miscellaneous",
    "subcategories": [
      {
        "name": "Unique Products",
        "slug": "unique-products"
      },
      {
        "name": "General Accessories",
        "slug": "general-accessories"
      },
      {
        "name": "Customized Products",
        "slug": "customized-products"
      },
      {
        "name": "Seasonal Products",
        "slug": "seasonal-products"
      },
      {
        "name": "Unclassified Products",
        "slug": "unclassified-products"
      }
    ]
  },
  {
    "id": "store-cat-31",
    "name": "Musical & DJ Equipment",
    "slug": "musical-dj-equipment",
    "subcategories": [
      {
        "name": "DJ Mixers",
        "slug": "dj-mixers"
      },
      {
        "name": "DJ Controllers",
        "slug": "dj-controllers"
      },
      {
        "name": "Amplifiers",
        "slug": "amplifiers"
      },
      {
        "name": "Studio Monitors",
        "slug": "studio-monitors"
      },
      {
        "name": "Audio Interfaces",
        "slug": "audio-interfaces"
      },
      {
        "name": "MIDI Controllers",
        "slug": "midi-controllers"
      },
      {
        "name": "DJ Lighting",
        "slug": "dj-lighting"
      }
    ]
  },
  {
    "id": "store-cat-32",
    "name": "Baby Safety & Monitoring",
    "slug": "baby-safety-monitoring",
    "subcategories": [
      {
        "name": "Baby Monitors",
        "slug": "baby-monitors"
      },
      {
        "name": "Video Baby Monitors",
        "slug": "video-baby-monitors"
      },
      {
        "name": "Baby Safety Gates",
        "slug": "baby-safety-gates"
      },
      {
        "name": "Corner Protectors",
        "slug": "corner-protectors"
      },
      {
        "name": "Cabinet Locks",
        "slug": "cabinet-locks"
      },
      {
        "name": "Childproofing Kits",
        "slug": "childproofing-kits"
      }
    ]
  },
  {
    "id": "store-cat-33",
    "name": "Smart Office & Productivity",
    "slug": "smart-office-productivity",
    "subcategories": [
      {
        "name": "Standing Desks",
        "slug": "standing-desks"
      },
      {
        "name": "Desk Lamps",
        "slug": "desk-lamps"
      },
      {
        "name": "Document Cameras",
        "slug": "document-cameras"
      },
      {
        "name": "Presentation Clickers",
        "slug": "presentation-clickers"
      },
      {
        "name": "Conference Phones",
        "slug": "conference-phones"
      },
      {
        "name": "Video Conferencing Equipment",
        "slug": "video-conferencing-equipment"
      }
    ]
  },
  {
    "id": "store-cat-34",
    "name": "Networking & Server Equipment",
    "slug": "networking-server-equipment",
    "subcategories": [
      {
        "name": "Network Switches",
        "slug": "network-switches"
      },
      {
        "name": "Server Racks",
        "slug": "server-racks"
      },
      {
        "name": "Network Cables",
        "slug": "network-cables"
      },
      {
        "name": "Fiber Optic Equipment",
        "slug": "fiber-optic-equipment"
      },
      {
        "name": "Wi-Fi Extenders",
        "slug": "wi-fi-extenders"
      },
      {
        "name": "Access Points",
        "slug": "access-points"
      },
      {
        "name": "NAS Storage",
        "slug": "nas-storage"
      }
    ]
  },
  {
    "id": "store-cat-35",
    "name": "Drones & Robotics",
    "slug": "drones-robotics",
    "subcategories": [
      {
        "name": "Educational Robots",
        "slug": "educational-robots"
      },
      {
        "name": "Industrial Robots",
        "slug": "industrial-robots"
      },
      {
        "name": "Drone Accessories",
        "slug": "drone-accessories"
      },
      {
        "name": "Robot Kits",
        "slug": "robot-kits"
      },
      {
        "name": "Robotic Arms",
        "slug": "robotic-arms"
      },
      {
        "name": "Drone Batteries",
        "slug": "drone-batteries"
      },
      {
        "name": "Drone Controllers",
        "slug": "drone-controllers"
      }
    ]
  },
  {
    "id": "store-cat-36",
    "name": "3D Printing & Manufacturing",
    "slug": "3d-printing-manufacturing",
    "subcategories": [
      {
        "name": "3D Printers",
        "slug": "3d-printers"
      },
      {
        "name": "3D Printer Parts",
        "slug": "3d-printer-parts"
      },
      {
        "name": "3D Printing Filaments",
        "slug": "3d-printing-filaments"
      },
      {
        "name": "Laser Engravers",
        "slug": "laser-engravers"
      },
      {
        "name": "CNC Machines",
        "slug": "cnc-machines"
      },
      {
        "name": "3D Scanners",
        "slug": "3d-scanners"
      }
    ]
  },
  {
    "id": "store-cat-37",
    "name": "Smart Security & Surveillance",
    "slug": "smart-security-surveillance",
    "subcategories": [
      {
        "name": "Smart Doorbells",
        "slug": "smart-doorbells"
      },
      {
        "name": "Digital Door Locks",
        "slug": "digital-door-locks"
      },
      {
        "name": "Biometric Locks",
        "slug": "biometric-locks"
      },
      {
        "name": "Motion Sensors",
        "slug": "motion-sensors"
      },
      {
        "name": "Alarm Systems",
        "slug": "alarm-systems"
      },
      {
        "name": "Security Sensors",
        "slug": "security-sensors"
      },
      {
        "name": "Video Intercoms",
        "slug": "video-intercoms"
      }
    ]
  },
  {
    "id": "store-cat-38",
    "name": "Bathroom & Sanitary Ware",
    "slug": "bathroom-sanitary-ware",
    "subcategories": [
      {
        "name": "Washbasins",
        "slug": "washbasins"
      },
      {
        "name": "Bathroom Faucets",
        "slug": "bathroom-faucets"
      },
      {
        "name": "Shower Systems",
        "slug": "shower-systems"
      },
      {
        "name": "Bathtubs",
        "slug": "bathtubs"
      },
      {
        "name": "Toilet Seats",
        "slug": "toilet-seats"
      },
      {
        "name": "Bathroom Cabinets",
        "slug": "bathroom-cabinets"
      },
      {
        "name": "Shower Curtains",
        "slug": "shower-curtains"
      }
    ]
  },
  {
    "id": "store-cat-39",
    "name": "Doors, Windows & Building Materials",
    "slug": "doors-windows-building-materials",
    "subcategories": [
      {
        "name": "Wooden Doors",
        "slug": "wooden-doors"
      },
      {
        "name": "Security Doors",
        "slug": "security-doors"
      },
      {
        "name": "Window Frames",
        "slug": "window-frames"
      },
      {
        "name": "Glass Panels",
        "slug": "glass-panels"
      },
      {
        "name": "Door Handles",
        "slug": "door-handles"
      },
      {
        "name": "Door Hinges",
        "slug": "door-hinges"
      },
      {
        "name": "Building Accessories",
        "slug": "building-accessories"
      }
    ]
  },
  {
    "id": "store-cat-40",
    "name": "Plumbing & Water Systems",
    "slug": "plumbing-water-systems",
    "subcategories": [
      {
        "name": "Water Pumps",
        "slug": "water-pumps"
      },
      {
        "name": "Water Filters",
        "slug": "water-filters"
      },
      {
        "name": "Water Purifiers",
        "slug": "water-purifiers"
      },
      {
        "name": "Water Tanks",
        "slug": "water-tanks"
      },
      {
        "name": "Plumbing Pipes",
        "slug": "plumbing-pipes"
      },
      {
        "name": "Pipe Fittings",
        "slug": "pipe-fittings"
      },
      {
        "name": "Valves",
        "slug": "valves"
      }
    ]
  },
  {
    "id": "store-cat-41",
    "name": "Home Improvement & Renovation",
    "slug": "home-improvement-renovation",
    "subcategories": [
      {
        "name": "Wallpapers",
        "slug": "wallpapers"
      },
      {
        "name": "Wall Panels",
        "slug": "wall-panels"
      },
      {
        "name": "Floor Tiles",
        "slug": "floor-tiles"
      },
      {
        "name": "Ceiling Materials",
        "slug": "ceiling-materials"
      },
      {
        "name": "Paint Supplies",
        "slug": "paint-supplies"
      },
      {
        "name": "Decorative Mouldings",
        "slug": "decorative-mouldings"
      },
      {
        "name": "Home Repair Kits",
        "slug": "home-repair-kits"
      }
    ]
  },
  {
    "id": "store-cat-42",
    "name": "Laundry & Cleaning Equipment",
    "slug": "laundry-cleaning-equipment",
    "subcategories": [
      {
        "name": "Steam Cleaners",
        "slug": "steam-cleaners"
      },
      {
        "name": "Pressure Washers",
        "slug": "pressure-washers"
      },
      {
        "name": "Carpet Cleaners",
        "slug": "carpet-cleaners"
      },
      {
        "name": "Laundry Baskets",
        "slug": "laundry-baskets"
      },
      {
        "name": "Drying Racks",
        "slug": "drying-racks"
      },
      {
        "name": "Cleaning Machines",
        "slug": "cleaning-machines"
      },
      {
        "name": "Cleaning Accessories",
        "slug": "cleaning-accessories"
      }
    ]
  },
  {
    "id": "store-cat-43",
    "name": "Sewing & Textile Equipment",
    "slug": "sewing-textile-equipment",
    "subcategories": [
      {
        "name": "Sewing Machines",
        "slug": "sewing-machines"
      },
      {
        "name": "Embroidery Machines",
        "slug": "embroidery-machines"
      },
      {
        "name": "Fabric Cutting Tools",
        "slug": "fabric-cutting-tools"
      },
      {
        "name": "Knitting Machines",
        "slug": "knitting-machines"
      },
      {
        "name": "Sewing Accessories",
        "slug": "sewing-accessories"
      },
      {
        "name": "Measuring Tapes",
        "slug": "measuring-tapes"
      },
      {
        "name": "Textile Equipment",
        "slug": "textile-equipment"
      }
    ]
  },
  {
    "id": "store-cat-44",
    "name": "Art & Professional Craft Supplies",
    "slug": "art-professional-craft-supplies",
    "subcategories": [
      {
        "name": "Canvas",
        "slug": "canvas"
      },
      {
        "name": "Paint Brushes",
        "slug": "paint-brushes"
      },
      {
        "name": "Acrylic Paints",
        "slug": "acrylic-paints"
      },
      {
        "name": "Oil Paints",
        "slug": "oil-paints"
      },
      {
        "name": "Calligraphy Pens",
        "slug": "calligraphy-pens"
      },
      {
        "name": "Sculpting Tools",
        "slug": "sculpting-tools"
      },
      {
        "name": "Resin Art Supplies",
        "slug": "resin-art-supplies"
      }
    ]
  },
  {
    "id": "store-cat-45",
    "name": "Professional Photography Studio",
    "slug": "professional-photography-studio",
    "subcategories": [
      {
        "name": "Studio Lighting",
        "slug": "studio-lighting"
      },
      {
        "name": "Softboxes",
        "slug": "softboxes"
      },
      {
        "name": "Light Stands",
        "slug": "light-stands"
      },
      {
        "name": "Photography Backdrops",
        "slug": "photography-backdrops"
      },
      {
        "name": "Reflectors",
        "slug": "reflectors"
      },
      {
        "name": "Teleprompters",
        "slug": "teleprompters"
      },
      {
        "name": "Studio Props",
        "slug": "studio-props"
      }
    ]
  },
  {
    "id": "store-cat-46",
    "name": "Optical & Vision Accessories",
    "slug": "optical-vision-accessories",
    "subcategories": [
      {
        "name": "Prescription Eyeglass Frames",
        "slug": "prescription-eyeglass-frames"
      },
      {
        "name": "Contact Lens Cases",
        "slug": "contact-lens-cases"
      },
      {
        "name": "Lens Cleaning Kits",
        "slug": "lens-cleaning-kits"
      },
      {
        "name": "Reading Glasses",
        "slug": "reading-glasses"
      },
      {
        "name": "Magnifying Glasses",
        "slug": "magnifying-glasses"
      },
      {
        "name": "Optical Accessories",
        "slug": "optical-accessories"
      }
    ]
  },
  {
    "id": "store-cat-47",
    "name": "Personal Mobility",
    "slug": "personal-mobility",
    "subcategories": [
      {
        "name": "Electric Scooters",
        "slug": "electric-scooters"
      },
      {
        "name": "Electric Bicycles",
        "slug": "electric-bicycles"
      },
      {
        "name": "Wheelchairs",
        "slug": "wheelchairs"
      },
      {
        "name": "Mobility Walkers",
        "slug": "mobility-walkers"
      },
      {
        "name": "Walking Canes",
        "slug": "walking-canes"
      },
      {
        "name": "Mobility Accessories",
        "slug": "mobility-accessories"
      }
    ]
  },
  {
    "id": "store-cat-48",
    "name": "Baby Transportation",
    "slug": "baby-transportation",
    "subcategories": [
      {
        "name": "Baby Carriages",
        "slug": "baby-carriages"
      },
      {
        "name": "Travel Strollers",
        "slug": "travel-strollers"
      },
      {
        "name": "Baby Bicycle Seats",
        "slug": "baby-bicycle-seats"
      },
      {
        "name": "Baby Carriers",
        "slug": "baby-carriers"
      },
      {
        "name": "Stroller Accessories",
        "slug": "stroller-accessories"
      }
    ]
  },
  {
    "id": "store-cat-49",
    "name": "Watchmaking & Repair",
    "slug": "watchmaking-repair",
    "subcategories": [
      {
        "name": "Watch Straps",
        "slug": "watch-straps"
      },
      {
        "name": "Watch Repair Kits",
        "slug": "watch-repair-kits"
      },
      {
        "name": "Watch Winders",
        "slug": "watch-winders"
      },
      {
        "name": "Watch Boxes",
        "slug": "watch-boxes"
      },
      {
        "name": "Watch Tools",
        "slug": "watch-tools"
      },
      {
        "name": "Watch Display Cases",
        "slug": "watch-display-cases"
      }
    ]
  },
  {
    "id": "store-cat-50",
    "name": "Collectible & Hobby Equipment",
    "slug": "collectible-hobby-equipment",
    "subcategories": [
      {
        "name": "Model Cars",
        "slug": "model-cars"
      },
      {
        "name": "Model Aircraft",
        "slug": "model-aircraft"
      },
      {
        "name": "Miniature Models",
        "slug": "miniature-models"
      },
      {
        "name": "Collectible Figures",
        "slug": "collectible-figures"
      },
      {
        "name": "Coin Collecting Supplies",
        "slug": "coin-collecting-supplies"
      },
      {
        "name": "Stamp Collecting Supplies",
        "slug": "stamp-collecting-supplies"
      },
      {
        "name": "Hobby Kits",
        "slug": "hobby-kits"
      }
    ]
  },
  {
    "id": "store-cat-51",
    "name": "Camping & Survival Equipment",
    "slug": "camping-survival-equipment",
    "subcategories": [
      {
        "name": "Camping Tents",
        "slug": "camping-tents"
      },
      {
        "name": "Sleeping Bags",
        "slug": "sleeping-bags"
      },
      {
        "name": "Camping Furniture",
        "slug": "camping-furniture"
      },
      {
        "name": "Portable Lanterns",
        "slug": "portable-lanterns"
      },
      {
        "name": "Camping Backpacks",
        "slug": "camping-backpacks"
      },
      {
        "name": "Camping Tools",
        "slug": "camping-tools"
      },
      {
        "name": "Outdoor Cooking Equipment (non-food products)",
        "slug": "outdoor-cooking-equipment-non-food-products"
      }
    ]
  },
  {
    "id": "store-cat-52",
    "name": "Marine & Boating Accessories",
    "slug": "marine-boating-accessories",
    "subcategories": [
      {
        "name": "Boat Covers",
        "slug": "boat-covers"
      },
      {
        "name": "Life Jackets",
        "slug": "life-jackets"
      },
      {
        "name": "Marine Lighting",
        "slug": "marine-lighting"
      },
      {
        "name": "Boat Hardware",
        "slug": "boat-hardware"
      },
      {
        "name": "Marine Electronics",
        "slug": "marine-electronics"
      },
      {
        "name": "Fishing Rod Holders",
        "slug": "fishing-rod-holders"
      },
      {
        "name": "Marine Safety Equipment",
        "slug": "marine-safety-equipment"
      }
    ]
  },
  {
    "id": "store-cat-53",
    "name": "Aviation Accessories",
    "slug": "aviation-accessories",
    "subcategories": [
      {
        "name": "Pilot Headsets",
        "slug": "pilot-headsets"
      },
      {
        "name": "Aviation Bags",
        "slug": "aviation-bags"
      },
      {
        "name": "Flight Simulators",
        "slug": "flight-simulators"
      },
      {
        "name": "Aircraft Models",
        "slug": "aircraft-models"
      },
      {
        "name": "Aviation Instruments",
        "slug": "aviation-instruments"
      },
      {
        "name": "Aviation Accessories",
        "slug": "aviation-accessories"
      }
    ]
  },
  {
    "id": "store-cat-54",
    "name": "Laboratory & Scientific Equipment",
    "slug": "laboratory-scientific-equipment",
    "subcategories": [
      {
        "name": "Microscopes",
        "slug": "microscopes"
      },
      {
        "name": "Laboratory Glassware",
        "slug": "laboratory-glassware"
      },
      {
        "name": "Scientific Instruments",
        "slug": "scientific-instruments"
      },
      {
        "name": "Laboratory Furniture",
        "slug": "laboratory-furniture"
      },
      {
        "name": "Measurement Equipment",
        "slug": "measurement-equipment"
      },
      {
        "name": "Laboratory Safety Equipment",
        "slug": "laboratory-safety-equipment"
      }
    ]
  },
  {
    "id": "store-cat-55",
    "name": "Educational & Training Equipment",
    "slug": "educational-training-equipment",
    "subcategories": [
      {
        "name": "Interactive Whiteboards",
        "slug": "interactive-whiteboards"
      },
      {
        "name": "Educational Projectors",
        "slug": "educational-projectors"
      },
      {
        "name": "Science Lab Kits",
        "slug": "science-lab-kits"
      },
      {
        "name": "Teaching Models",
        "slug": "teaching-models"
      },
      {
        "name": "Learning Boards",
        "slug": "learning-boards"
      },
      {
        "name": "Classroom Furniture",
        "slug": "classroom-furniture"
      }
    ]
  },
  {
    "id": "store-cat-56",
    "name": "Event & Exhibition Equipment",
    "slug": "event-exhibition-equipment",
    "subcategories": [
      {
        "name": "Exhibition Stands",
        "slug": "exhibition-stands"
      },
      {
        "name": "Display Booths",
        "slug": "display-booths"
      },
      {
        "name": "Roll-up Banners",
        "slug": "roll-up-banners"
      },
      {
        "name": "LED Display Screens",
        "slug": "led-display-screens"
      },
      {
        "name": "Stage Lighting",
        "slug": "stage-lighting"
      },
      {
        "name": "Portable Stages",
        "slug": "portable-stages"
      },
      {
        "name": "Event Furniture",
        "slug": "event-furniture"
      }
    ]
  },
  {
    "id": "store-cat-57",
    "name": "Retail & Shop Equipment",
    "slug": "retail-shop-equipment",
    "subcategories": [
      {
        "name": "Display Shelves",
        "slug": "display-shelves"
      },
      {
        "name": "Mannequins",
        "slug": "mannequins"
      },
      {
        "name": "Shopping Baskets",
        "slug": "shopping-baskets"
      },
      {
        "name": "Cash Registers",
        "slug": "cash-registers"
      },
      {
        "name": "Barcode Printers",
        "slug": "barcode-printers"
      },
      {
        "name": "Price Tag Guns",
        "slug": "price-tag-guns"
      },
      {
        "name": "Retail Display Cases",
        "slug": "retail-display-cases"
      }
    ]
  },
  {
    "id": "store-cat-58",
    "name": "Religious & Cultural Clothing",
    "slug": "religious-cultural-clothing",
    "subcategories": [
      {
        "name": "Prayer Clothing",
        "slug": "prayer-clothing"
      },
      {
        "name": "Traditional Caps",
        "slug": "traditional-caps"
      },
      {
        "name": "Religious Robes",
        "slug": "religious-robes"
      },
      {
        "name": "Cultural Dresses",
        "slug": "cultural-dresses"
      },
      {
        "name": "Traditional Shawls",
        "slug": "traditional-shawls"
      },
      {
        "name": "Ceremonial Clothing",
        "slug": "ceremonial-clothing"
      }
    ]
  },
  {
    "id": "store-cat-59",
    "name": "Personal Protection Equipment",
    "slug": "personal-protection-equipment",
    "subcategories": [
      {
        "name": "Safety Helmets",
        "slug": "safety-helmets"
      },
      {
        "name": "Safety Gloves",
        "slug": "safety-gloves"
      },
      {
        "name": "Protective Goggles",
        "slug": "protective-goggles"
      },
      {
        "name": "Respirators",
        "slug": "respirators"
      },
      {
        "name": "Reflective Jackets",
        "slug": "reflective-jackets"
      },
      {
        "name": "Safety Boots",
        "slug": "safety-boots"
      },
      {
        "name": "Hearing Protection",
        "slug": "hearing-protection"
      }
    ]
  },
  {
    "id": "store-cat-60",
    "name": "Child Development & Learning",
    "slug": "child-development-learning",
    "subcategories": [
      {
        "name": "Montessori Materials",
        "slug": "montessori-materials"
      },
      {
        "name": "Alphabet Boards",
        "slug": "alphabet-boards"
      },
      {
        "name": "Educational Flashcards",
        "slug": "educational-flashcards"
      },
      {
        "name": "Counting Toys",
        "slug": "counting-toys"
      },
      {
        "name": "Sensory Toys",
        "slug": "sensory-toys"
      },
      {
        "name": "Learning Tablets",
        "slug": "learning-tablets"
      },
      {
        "name": "Activity Boards",
        "slug": "activity-boards"
      }
    ]
  },
  {
    "id": "store-cat-61",
    "name": "Professional Beauty Salon Equipment",
    "slug": "professional-beauty-salon-equipment",
    "subcategories": [
      {
        "name": "Salon Chairs",
        "slug": "salon-chairs"
      },
      {
        "name": "Barber Chairs",
        "slug": "barber-chairs"
      },
      {
        "name": "Hair Dryers",
        "slug": "hair-dryers"
      },
      {
        "name": "Hair Straighteners",
        "slug": "hair-straighteners"
      },
      {
        "name": "Nail Lamps",
        "slug": "nail-lamps"
      },
      {
        "name": "Manicure Tables",
        "slug": "manicure-tables"
      },
      {
        "name": "Salon Trolleys",
        "slug": "salon-trolleys"
      }
    ]
  },
  {
    "id": "store-cat-62",
    "name": "Tattoo & Body Art Supplies",
    "slug": "tattoo-body-art-supplies",
    "subcategories": [
      {
        "name": "Tattoo Machines",
        "slug": "tattoo-machines"
      },
      {
        "name": "Tattoo Needles",
        "slug": "tattoo-needles"
      },
      {
        "name": "Tattoo Ink",
        "slug": "tattoo-ink"
      },
      {
        "name": "Tattoo Accessories",
        "slug": "tattoo-accessories"
      },
      {
        "name": "Body Art Stencils",
        "slug": "body-art-stencils"
      },
      {
        "name": "Temporary Tattoo Kits",
        "slug": "temporary-tattoo-kits"
      }
    ]
  },
  {
    "id": "store-cat-63",
    "name": "Musical & Performance Clothing",
    "slug": "musical-performance-clothing",
    "subcategories": [
      {
        "name": "Dance Costumes",
        "slug": "dance-costumes"
      },
      {
        "name": "Stage Costumes",
        "slug": "stage-costumes"
      },
      {
        "name": "Performance Shoes",
        "slug": "performance-shoes"
      },
      {
        "name": "Theater Accessories",
        "slug": "theater-accessories"
      },
      {
        "name": "Dance Accessories",
        "slug": "dance-accessories"
      },
      {
        "name": "Performance Wear",
        "slug": "performance-wear"
      }
    ]
  },
  {
    "id": "store-cat-64",
    "name": "Automotive Workshop Equipment",
    "slug": "automotive-workshop-equipment",
    "subcategories": [
      {
        "name": "Car Lifts",
        "slug": "car-lifts"
      },
      {
        "name": "Hydraulic Jacks",
        "slug": "hydraulic-jacks"
      },
      {
        "name": "Diagnostic Scanners",
        "slug": "diagnostic-scanners"
      },
      {
        "name": "Tire Changers",
        "slug": "tire-changers"
      },
      {
        "name": "Air Compressors",
        "slug": "air-compressors"
      },
      {
        "name": "Workshop Tool Cabinets",
        "slug": "workshop-tool-cabinets"
      }
    ]
  },
  {
    "id": "store-cat-65",
    "name": "Laboratory & Medical Furniture",
    "slug": "laboratory-medical-furniture",
    "subcategories": [
      {
        "name": "Hospital Beds",
        "slug": "hospital-beds"
      },
      {
        "name": "Examination Tables",
        "slug": "examination-tables"
      },
      {
        "name": "Medical Cabinets",
        "slug": "medical-cabinets"
      },
      {
        "name": "Wheelchair Ramps",
        "slug": "wheelchair-ramps"
      },
      {
        "name": "Medical Trolleys",
        "slug": "medical-trolleys"
      },
      {
        "name": "Clinic Furniture",
        "slug": "clinic-furniture"
      }
    ]
  },
  {
    "id": "store-cat-66",
    "name": "Renewable Energy Equipment",
    "slug": "renewable-energy-equipment",
    "subcategories": [
      {
        "name": "Solar Charge Controllers",
        "slug": "solar-charge-controllers"
      },
      {
        "name": "Wind Turbines",
        "slug": "wind-turbines"
      },
      {
        "name": "Solar Mounting Structures",
        "slug": "solar-mounting-structures"
      },
      {
        "name": "Solar Monitoring Devices",
        "slug": "solar-monitoring-devices"
      },
      {
        "name": "Energy Storage Systems",
        "slug": "energy-storage-systems"
      },
      {
        "name": "Portable Solar Generators",
        "slug": "portable-solar-generators"
      }
    ]
  },
  {
    "id": "store-cat-67",
    "name": "Packaging & Shipping Supplies",
    "slug": "packaging-shipping-supplies",
    "subcategories": [
      {
        "name": "Shipping Boxes",
        "slug": "shipping-boxes"
      },
      {
        "name": "Bubble Wrap",
        "slug": "bubble-wrap"
      },
      {
        "name": "Packing Tape",
        "slug": "packing-tape"
      },
      {
        "name": "Stretch Film",
        "slug": "stretch-film"
      },
      {
        "name": "Shipping Labels",
        "slug": "shipping-labels"
      },
      {
        "name": "Mailing Bags",
        "slug": "mailing-bags"
      },
      {
        "name": "Packaging Machines",
        "slug": "packaging-machines"
      }
    ]
  },
  {
    "id": "store-cat-68",
    "name": "Industrial Storage & Material Handling",
    "slug": "industrial-storage-material-handling",
    "subcategories": [
      {
        "name": "Pallet Racks",
        "slug": "pallet-racks"
      },
      {
        "name": "Storage Bins",
        "slug": "storage-bins"
      },
      {
        "name": "Hand Trucks",
        "slug": "hand-trucks"
      },
      {
        "name": "Platform Trolleys",
        "slug": "platform-trolleys"
      },
      {
        "name": "Industrial Shelving",
        "slug": "industrial-shelving"
      },
      {
        "name": "Material Lifting Equipment",
        "slug": "material-lifting-equipment"
      }
    ]
  },
  {
    "id": "store-cat-69",
    "name": "Home Automation",
    "slug": "home-automation",
    "subcategories": [
      {
        "name": "Smart Switches",
        "slug": "smart-switches"
      },
      {
        "name": "Smart Plugs",
        "slug": "smart-plugs"
      },
      {
        "name": "Smart Thermostats",
        "slug": "smart-thermostats"
      },
      {
        "name": "Smart Curtains",
        "slug": "smart-curtains"
      },
      {
        "name": "Smart Sensors",
        "slug": "smart-sensors"
      },
      {
        "name": "Smart Hubs",
        "slug": "smart-hubs"
      },
      {
        "name": "Automation Controllers",
        "slug": "automation-controllers"
      }
    ]
  },
  {
    "id": "store-cat-70",
    "name": "Digital Accessories & Gadgets",
    "slug": "digital-accessories-gadgets",
    "subcategories": [
      {
        "name": "E-Readers",
        "slug": "e-readers"
      },
      {
        "name": "Digital Photo Frames",
        "slug": "digital-photo-frames"
      },
      {
        "name": "Portable Displays",
        "slug": "portable-displays"
      },
      {
        "name": "USB Hubs",
        "slug": "usb-hubs"
      },
      {
        "name": "Docking Stations",
        "slug": "docking-stations"
      },
      {
        "name": "Presentation Devices",
        "slug": "presentation-devices"
      },
      {
        "name": "Digital Notepads",
        "slug": "digital-notepads"
      }
    ]
  }
] as const;

export type StoreCategory = (typeof BASE_STORE_CATEGORIES)[number];
export type StoreSubcategory = StoreCategory['subcategories'][number];
export type StoreCategoryData = {
  id: string;
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
  isCustom?: boolean;
  customSubcategorySlugs?: string[];
};

export const STORE_CATEGORIES: StoreCategoryData[] = replaceCatalogCategories(addCatalogCategoryDefaults(
  BASE_STORE_CATEGORIES.map((category) => ({ ...category, subcategories: [...category.subcategories] })),
));
