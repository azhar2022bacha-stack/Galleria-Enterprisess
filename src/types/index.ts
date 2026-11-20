// Core Data Models prepared for PostgreSQL / Prisma and NestJS Backend

export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  street: string;
  apartment?: string;
  phoneNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  itemCount?: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  description: string;
  shortDescription?: string;
  features?: string[];
  category: string;
  categorySlug: string;
  /** Store taxonomy fields for parent/subcategory navigation. */
  storeCategorySlug?: string;
  subcategory?: string;
  subcategorySlug?: string;
  model?: string;
  upc?: string;
  priceSourceUrl?: string;
  priceCheckedAt?: string;
  image: string;
  additionalImages?: string[];
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  brand?: string;
  sellerStoreSlug?: string;
  tags?: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isDeal?: boolean;
  isCatalogSample?: boolean;
  specifications?: ProductSpecification[];
  colors?: string[];
  sizes?: string[];
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  promotionCode?: string;
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  cryptoPayment?: import('@/lib/storefrontCrypto').StorefrontCryptoPayment;
  orderStatus: OrderStatus;
  createdAt: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
}
