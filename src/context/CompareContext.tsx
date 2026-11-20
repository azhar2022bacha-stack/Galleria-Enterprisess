'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import { isDemoStorefrontProduct } from '@/lib/demoStorefrontProduct';

const COMPARE_LIMIT = 4;

interface CompareContextValue {
  products: Product[];
  toggleProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  hasProduct: (productId: string) => boolean;
  limit: number;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('galleria_compare');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setProducts(parsed.filter((product) => product?.id && !isDemoStorefrontProduct(product.id)).slice(0, COMPARE_LIMIT));
      }
    } catch {}
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try { localStorage.setItem('galleria_compare', JSON.stringify(products)); } catch {}
  }, [products, initialized]);

  const hasProduct = useCallback((productId: string) => products.some((product) => product.id === productId), [products]);
  const toggleProduct = useCallback((product: Product) => {
    setProducts((current) => current.some((item) => item.id === product.id)
      ? current.filter((item) => item.id !== product.id)
      : current.length >= COMPARE_LIMIT ? current : [...current, product]);
  }, []);
  const removeProduct = useCallback((productId: string) => setProducts((current) => current.filter((product) => product.id !== productId)), []);
  const clear = useCallback(() => setProducts([]), []);

  const value = useMemo(() => ({ products, toggleProduct, removeProduct, clear, hasProduct, limit: COMPARE_LIMIT }), [products, toggleProduct, removeProduct, clear, hasProduct]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within a CompareProvider');
  return context;
}
