'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '@/types';
import { isDemoStorefrontProduct } from '@/lib/demoStorefrontProduct';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  updateCartProductData: (changes: { productId: string; price?: number; stockQuantity?: number }[]) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  toastMessage: string | null;
  clearToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('galleria_cart');
      if (stored) {
        const savedItems = JSON.parse(stored) as CartItem[];
        if (Array.isArray(savedItems)) setItems(savedItems.filter((item) => item?.product?.id && !isDemoStorefrontProduct(item.product.id)));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('galleria_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to storage', e);
      }
    }
  }, [items, isInitialized]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const clearToast = () => setToastMessage(null);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    const availableStock = Math.max(0, Number(product.stockQuantity) || 0);
    if (!product.inStock || availableStock < 1) {
      showToast(`"${product.title}" is currently out of stock.`);
      return;
    }
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const requestedQuantity = updated[existingIndex].quantity + Math.max(1, quantity);
        updated[existingIndex] = { ...updated[existingIndex], product, quantity: Math.min(availableStock, requestedQuantity) };
        showToast(requestedQuantity > availableStock
          ? `Only ${availableStock} of "${product.title}" are available.`
          : `Updated "${product.title}" quantity in your cart.`);
        return updated;
      } else {
        const cappedQuantity = Math.min(availableStock, Math.max(1, quantity));
        showToast(cappedQuantity < quantity
          ? `Only ${availableStock} of "${product.title}" are available.`
          : `Added "${product.title}" to your shopping cart.`);
        return [
          ...prev,
          {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity: cappedQuantity,
            selectedColor: selectedColor || product.colors?.[0],
            selectedSize: selectedSize || product.sizes?.[0],
          },
        ];
      }
    });
  };

  const updateCartProductData = (changes: { productId: string; price?: number; stockQuantity?: number }[]) => {
    const changesByProductId = new Map(changes.map((change) => [change.productId, change]));
    setItems((previous) => previous.map((item) => {
      const change = changesByProductId.get(item.product.id);
      if (!change) return item;
      const product = { ...item.product };
      if (Number.isFinite(change.price) && (change.price as number) >= 0) product.price = change.price as number;
      if (Number.isInteger(change.stockQuantity) && (change.stockQuantity as number) >= 0) {
        product.stockQuantity = change.stockQuantity as number;
        product.inStock = (change.stockQuantity as number) > 0;
      }
      return { ...item, product };
    }));
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item) {
        showToast(`Removed "${item.product.title}" from your cart.`);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const availableStock = Math.max(0, Number(item.product.stockQuantity) || 0);
      if (availableStock < 1) {
        if (quantity < item.quantity) return { ...item, quantity };
        showToast(`"${item.product.title}" is currently out of stock.`);
        return item;
      }
      const cappedQuantity = Math.min(quantity, availableStock);
      if (quantity > availableStock) showToast(`Only ${availableStock} of "${item.product.title}" are available.`);
      return { ...item, quantity: cappedQuantity };
    }));
  };

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  // Shipping and tax are left unquoted until the seller's destination rules are configured.
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateCartProductData,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        tax,
        total,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
