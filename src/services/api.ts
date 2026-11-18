import { Product, ProductCategory, FilterOptions, Order, Address } from '@/types';
import { ALL_PRODUCTS, FEATURED_PRODUCTS, CATEGORIES } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
}

export const apiService = {
  // Products
  async getProducts(filters?: FilterOptions): Promise<Product[]> {
    if (USE_REAL_API) {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.searchQuery) queryParams.set('search', filters.searchQuery);
      if (filters?.minPrice) queryParams.set('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) queryParams.set('maxPrice', filters.maxPrice.toString());
      if (filters?.sortBy) queryParams.set('sortBy', filters.sortBy);

      const res = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products from backend');
      return res.json();
    }

    // Mock data with realistic filtering
    let result = [...ALL_PRODUCTS];

    if (filters?.category) {
      result = result.filter(
        (p) => p.categorySlug.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filters?.minPrice !== undefined) {
      result = result.filter((p) => p.price >= (filters.minPrice ?? 0));
    }

    if (filters?.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= (filters.maxPrice ?? Infinity));
    }

    if (filters?.inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
          break;
        case 'featured':
        default:
          result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }

    return result;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/products/featured`);
      if (!res.ok) throw new Error('Failed to fetch featured products');
      return res.json();
    }
    return FEATURED_PRODUCTS;
  },

  async getProductById(id: string): Promise<Product | null> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!res.ok) return null;
      return res.json();
    }
    return ALL_PRODUCTS.find((p) => p.id === id) || null;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
      if (!res.ok) return null;
      return res.json();
    }
    return ALL_PRODUCTS.find((p) => p.slug === slug) || null;
  },

  // Categories
  async getCategories(): Promise<ProductCategory[]> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
    return CATEGORIES;
  },

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/categories/${slug}`);
      if (!res.ok) return null;
      return res.json();
    }
    return CATEGORIES.find((c) => c.slug === slug) || null;
  },

  // Deals
  async getDeals(): Promise<Product[]> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/products/deals`);
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    }
    return ALL_PRODUCTS.filter((p) => p.isDeal || (p.originalPrice && p.originalPrice > p.price));
  },

  // Newsletter
  async subscribeNewsletter(email: string): Promise<NewsletterResponse> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.json();
    }
    throw new Error('Newsletter signup is not connected in this storefront preview.');
  },

  // Contact
  async submitContact(data: ContactFormData): Promise<{ success: boolean; message: string }> {
    if (USE_REAL_API) {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    throw new Error('The customer support inbox is not connected in this storefront preview.');
  },

  // Order
  async createOrder(payload: { items: any[]; shippingAddress: Address; paymentMethod: string; totalAmount: number }): Promise<Order> {
    if (USE_REAL_API) {
      const orderRequest = {
        items: payload.items,
        shippingAddress: payload.shippingAddress,
        paymentMethod: payload.paymentMethod,
      };
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The backend must calculate the authoritative order total from its own prices and fees.
        body: JSON.stringify(orderRequest),
      });
      if (!res.ok) throw new Error('The order could not be created. Please review your details and try again.');
      return res.json();
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `GAL-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: 'usr-guest',
      items: payload.items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image,
        selectedColor: i.selectedColor,
        selectedSize: i.selectedSize,
      })),
      totalAmount: payload.totalAmount,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    return newOrder;
  },
};
