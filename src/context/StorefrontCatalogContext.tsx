'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { CatalogCategory, CatalogProduct } from '@/lib/storefrontCatalogServer';

type Catalog = { categories: CatalogCategory[]; products: CatalogProduct[]; total: number };
const emptyCatalog: Catalog = { categories: [], products: [], total: 0 };
const StorefrontCatalogContext = createContext({ ...emptyCatalog, isLoading: true, error: '' });

export function StorefrontCatalogProvider({ children, forceFull = false }: { children: ReactNode; forceFull?: boolean }) {
  const pathname = usePathname();
  const scope = !forceFull && (pathname === '/shop' || pathname?.startsWith('/product/')) ? 'index' : 'full';
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let request: AbortController | undefined;
    async function refresh() {
      if (request) return;
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch('/api/storefront-catalog?scope=' + scope, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Catalog request failed.');
        const data = await response.json();
        if (!active) return;
        setCatalog({ categories: data.categories, products: data.products ?? [], total: data.total });
        setError('');
      } catch {
        if (active) setError('The catalog is temporarily unavailable. Please try again.');
      } finally {
        clearTimeout(timeout);
        request = undefined;
        if (active) setIsLoading(false);
      }
    }

    void refresh();
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      request?.abort();
      window.removeEventListener('focus', refresh);
    };
  }, [scope]);

  return <StorefrontCatalogContext.Provider value={{ ...catalog, isLoading, error }}>{children}</StorefrontCatalogContext.Provider>;
}

export function useStorefrontCatalog() {
  return useContext(StorefrontCatalogContext);
}
