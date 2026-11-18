'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CATEGORIES } from '@/data/categories';
import { STOREHOUSE_CATEGORY_COUNTS } from '@/data/storehouseCatalogRules';
import { STOREHOUSE_IMPORT_CATEGORIES } from '@/data/storehouseImportCategories';
import {
  DemoProduct,
  PriceRangeFilter,
  SortOption,
  ProductFilterState,
} from '@/types/product';
import { queryDemoProducts, getProductById } from '@/lib/mock-products';
import { ProductImageWithFallback } from './ProductImageWithFallback';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  Plus,
  Check,
  Eye,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PackageOpen,
  Info,
  RotateCcw,
  Tag,
  ArrowUpDown,
} from 'lucide-react';

const HIDDEN_SELLER_STOREHOUSE_CATEGORY_SLUGS = new Set(['arts-craft-materials']);
const CLEARED_SELLER_STOREHOUSE_DEMO_CATEGORY_SLUGS = new Set([
  'furniture-decor',
  'home-kitchen',
  'computers-technology',
  'clothing-apparel',
  'shoes-footwear',
  'watches-jewelry',
  'smartphones-mobile',
  'automotive-tools',
  'sports-outdoors',
  'bags-accessories',
  'books-stationery',
  'pet-supplies',
  'garden-tools',
  'baby-products',
  'toys-games',
  'mens-clothing',
  'womens-clothing',
  'baby-clothing',
  'mens-kurtas-shalwar-kameez',
  'womans-nightwear',
  'sunglasses-eyewear',
  'accessories',
  'unstitched-fabric',
  'muslim-wear',
  'gift-customize-products',
  'party-supplies',
  'women-bags',
  'dupattas-stoles-shawls',
  'mens-accessories-other',
  'foundation-face-makeup',
  'moisturizers',
  'hair-styling-products',
  'bath-body',
  'personal-care-hygiene',
  'mens-perfumes',
  'lipsticks',
  'eye-makeup',
  'makeup-tools',
  'face-wash',
  'serums',
  'sunscreens',
  'shampoos',
  'hair-oils',
  'hair-tools',
]);

interface StorehouseCatalogProps {
  remainingSlots: number;
  planLimit?: number;
  packageName?: string;
  addedStorehouseIds: string[];
  onAddToShop: (product: DemoProduct) => void;
  onRemoveFromShop?: (productId: string) => void;
  onAddMultipleToShop?: (products: DemoProduct[]) => void;
  onAddAllToShop: (excludedCategorySlugs?: string[]) => void;
  notify: (msg: string) => void;
}

type BrowseCategory = {
  id: string;
  name: string;
  slug: string;
  subcategories: string[];
  code?: string;
  catalogProductCount?: number;
};

export const StorehouseCatalog: React.FC<StorehouseCatalogProps> = ({
  remainingSlots,
  planLimit = 300,
  packageName = 'Free Shop',
  addedStorehouseIds,
  onAddToShop,
  onRemoveFromShop,
  onAddMultipleToShop,
  onAddAllToShop,
  notify,
}) => {
  // ---------------------------------------------------------------------------
  // FILTER & SEARCH STATE
  // ---------------------------------------------------------------------------
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-stock' | 'low-stock'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [hideAdded, setHideAdded] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Modal detail preview state
  const [modalProduct, setModalProduct] = useState<DemoProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Direct Product Selection state (PRD Option 2)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [feedCategories, setFeedCategories] = useState<BrowseCategory[]>(() => STOREHOUSE_IMPORT_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    subcategories: category.subcategories,
    code: category.code,
    catalogProductCount: category.catalogProductCount ?? 0,
  })));
  const [hiddenCategorySlugs, setHiddenCategorySlugs] = useState<string[]>([]);
  const [hiddenSubcategories, setHiddenSubcategories] = useState<Record<string, string[]>>({});
  const catalogCategories = useMemo(() => {
    const hiddenCategories = new Set(hiddenCategorySlugs);
    const hiddenSubs = (categorySlug: string) => new Set(hiddenSubcategories[categorySlug] || []);
    const categoriesBySlug = new Map<string, BrowseCategory>(CATEGORIES
      .filter((category) => !hiddenCategories.has(category.slug))
      .map((category) => [category.slug, {
        ...category,
        subcategories: category.subcategories.filter((name) => !hiddenSubs(category.slug).has(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))),
      }]));
    for (const category of feedCategories) {
      if (hiddenCategories.has(category.slug)) continue;
      const current = categoriesBySlug.get(category.slug);
      const removedSubcategories = hiddenSubs(category.slug);
      categoriesBySlug.set(category.slug, {
        ...current,
        ...category,
        subcategories: category.subcategories.filter((name) => !removedSubcategories.has(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))),
        code: category.code || current?.code || 'FEED',
        catalogProductCount: current?.catalogProductCount ?? category.catalogProductCount ?? 0,
      });
    }
    return [...categoriesBySlug.values()].sort((left, right) => (
      Number(right.id.startsWith('feed-')) - Number(left.id.startsWith('feed-'))
    ));
  }, [feedCategories, hiddenCategorySlugs, hiddenSubcategories]);

  // ---------------------------------------------------------------------------
  // SEARCH DEBOUNCING (300ms)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Subcategories list for the current selected category
  const activeCategoryDefinition = useMemo(() => {
    return catalogCategories.find(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [catalogCategories, selectedCategory]);

  const availableSubcategories = activeCategoryDefinition?.subcategories || [];

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory('All');
    setPage(1);
  };

  useEffect(() => {
    if (selectedCategory !== 'All categories' && !catalogCategories.some((category) => category.name === selectedCategory)) {
      setSelectedCategory('All categories');
      setSelectedSubcategory('All');
    } else if (activeCategoryDefinition && selectedSubcategory !== 'All' && !activeCategoryDefinition.subcategories.includes(selectedSubcategory)) {
      setSelectedSubcategory('All');
    }
  }, [activeCategoryDefinition, catalogCategories, selectedCategory, selectedSubcategory]);

  // ---------------------------------------------------------------------------
  // QUERY THE DEMO CATALOG (Deterministic, Fast Memory Slice)
  // ---------------------------------------------------------------------------
  const filterState: ProductFilterState = useMemo(() => {
    return {
      searchQuery: debouncedSearch,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      priceRange,
      status: statusFilter,
      sortBy,
      hideAdded,
      page,
      pageSize,
    };
  }, [
    debouncedSearch,
    selectedCategory,
    selectedSubcategory,
    priceRange,
    statusFilter,
    sortBy,
    hideAdded,
    page,
    pageSize,
  ]);

  const queryResult = useMemo(() => {
    return queryDemoProducts(filterState, addedStorehouseIds);
  }, [filterState, addedStorehouseIds]);

  const mixedCatalogCategories = useMemo(
    () => catalogCategories.filter((category) => (STOREHOUSE_CATEGORY_COUNTS[category.name] || 0) > 0),
    [catalogCategories]
  );
  const mixedCategoryProducts = useMemo(() => {
    if (selectedCategory !== 'All categories' || sortBy !== 'default' || mixedCatalogCategories.length === 0) {
      return queryResult.products;
    }

    const requestedThroughPage = page * pageSize;
    const productsPerCategory = Math.max(1, Math.ceil(requestedThroughPage / mixedCatalogCategories.length));
    const categoryProductGroups = mixedCatalogCategories.map((category) => queryDemoProducts({
      ...filterState,
      category: category.name,
      subcategory: 'All',
      page: 1,
      pageSize: productsPerCategory,
    }, addedStorehouseIds).products);

    const interleavedProducts: DemoProduct[] = [];
    for (let index = 0; index < productsPerCategory; index += 1) {
      for (const categoryProducts of categoryProductGroups) {
        const product = categoryProducts[index];
        if (product) interleavedProducts.push(product);
      }
    }

    return interleavedProducts.slice((page - 1) * pageSize, page * pageSize);
  }, [
    addedStorehouseIds,
    filterState,
    mixedCatalogCategories,
    page,
    pageSize,
    queryResult.products,
    selectedCategory,
    sortBy,
  ]);

  const [persistedCategoryData, setPersistedCategoryData] = useState<{
    category: string;
    products: DemoProduct[];
  } | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(catalogCategories.map((category) => [category.slug, 0]))
  );
  const [hasLoadedCategoryCounts, setHasLoadedCategoryCounts] = useState(false);
  const categoryCatalogTotal = useMemo(
    () => catalogCategories.reduce(
      (total, category) => total + (categoryCounts[category.slug] ?? 0),
      0
    ),
    [categoryCounts, catalogCategories]
  );
  const [isVerifiedProductsLoading, setIsVerifiedProductsLoading] = useState(false);
  const [catalogLoadError, setCatalogLoadError] = useState('');

  const selectedFeedCategory = activeCategoryDefinition;
  const selectedFeedCategorySlug = selectedFeedCategory?.slug || '';
  const selectedFeedCategoryName = selectedFeedCategory?.name || '';
  const isSelectedFeedCategory = Boolean(
    selectedFeedCategorySlug && feedCategories.some((item) => item.slug === selectedFeedCategorySlug)
  );

  useEffect(() => {
    const refreshCategories = () => fetch('/api/storehouse/categories', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Storehouse categories are unavailable.');
        return response.json();
      })
      .then((payload) => {
        if (Array.isArray(payload.categories)) {
          const nextCategories = payload.categories
            .filter((category: { slug: string }) => !HIDDEN_SELLER_STOREHOUSE_CATEGORY_SLUGS.has(category.slug))
            .map((category: { id: string; name: string; slug: string; subcategories?: { name: string }[] }) => ({
              id: category.id,
              name: category.name,
              slug: category.slug,
              subcategories: (category.subcategories || []).map((subcategory) => subcategory.name),
            }));
          setFeedCategories((current) => JSON.stringify(current) === JSON.stringify(nextCategories) ? current : nextCategories);
        }
        if (Array.isArray(payload.deletedCategorySlugs)) {
          setHiddenCategorySlugs((current) => JSON.stringify(current) === JSON.stringify(payload.deletedCategorySlugs) ? current : payload.deletedCategorySlugs);
        }
        if (payload.deletedSubcategories && typeof payload.deletedSubcategories === 'object') {
          setHiddenSubcategories((current) => JSON.stringify(current) === JSON.stringify(payload.deletedSubcategories) ? current : payload.deletedSubcategories);
        }
      })
      .catch(() => undefined);
    const refreshCounts = () => fetch('/api/storehouse/catalog', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Storehouse catalog counts are unavailable.');
        return response.json();
      })
      .then((payload) => {
        if (payload.categoryCounts && typeof payload.categoryCounts === 'object') {
          setCategoryCounts((previous) => ({ ...previous, ...payload.categoryCounts }));
          setHasLoadedCategoryCounts(payload.catalogAvailable !== false);
        }
      })
      .catch(() => {
        setHasLoadedCategoryCounts(false);
      });
    const refreshCatalog = () => { void refreshCategories(); void refreshCounts(); };
    refreshCatalog();
    const timer = setInterval(refreshCatalog, 15000);
    window.addEventListener('focus', refreshCatalog);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshCatalog);
    };
  }, []);

  useEffect(() => {
    if (!selectedFeedCategorySlug || !isSelectedFeedCategory) {
      setPersistedCategoryData(null);
      setIsVerifiedProductsLoading(false);
      setCatalogLoadError('');
      return;
    }

    const controller = new AbortController();
    setIsVerifiedProductsLoading(true);
    setCatalogLoadError('');
    fetch(`/api/storehouse/catalog?category=${encodeURIComponent(selectedFeedCategorySlug)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your seller sign-in has expired. Sign in again to load Storehouse products.');
          }
          throw new Error(payload?.error || 'Storehouse product listings could not be loaded.');
        }
        return payload;
      })
      .then((payload) => {
        if (Array.isArray(payload.products)) {
          setPersistedCategoryData({ category: selectedFeedCategoryName, products: payload.products as DemoProduct[] });
          setCategoryCounts((previous) => ({ ...previous, [selectedFeedCategorySlug]: payload.products.length }));
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setPersistedCategoryData((current) => current?.category === selectedFeedCategoryName
            ? current
            : { category: selectedFeedCategoryName, products: [] });
          setCatalogLoadError(error?.message || 'Storehouse product listings could not be loaded.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsVerifiedProductsLoading(false);
      });

    return () => controller.abort();
  }, [isSelectedFeedCategory, selectedFeedCategoryName, selectedFeedCategorySlug]);

  const isManagedImportCategory = feedCategories.some((category) =>
    catalogCategories.some((definition) => definition.name === selectedCategory && definition.slug === category.slug)
  );

  const filteredVerifiedProducts = useMemo(() => {
    if (!isManagedImportCategory || persistedCategoryData?.category !== selectedCategory) return [];
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    const matchesPrice = (price: number) => {
      switch (priceRange) {
        case 'under-25': return price < 25;
        case '25-50': return price >= 25 && price <= 50;
        case '50-100': return price >= 50 && price <= 100;
        case '100-250': return price >= 100 && price <= 250;
        case '250-plus': return price > 250;
        default: return true;
      }
    };
    const matches = persistedCategoryData.products.filter((product) => {
      if (selectedSubcategory !== 'All' && product.subcategory !== selectedSubcategory) return false;
      if (!matchesPrice(product.price)) return false;
      if (statusFilter === 'in-stock' && product.status !== 'In Stock') return false;
      if (statusFilter === 'low-stock' && product.status !== 'Low Stock') return false;
      if (hideAdded && addedStorehouseIds.includes(product.id)) return false;
      if (normalizedSearch) {
        const searchable = `${product.title} ${product.sku} ${product.brand} ${product.subcategory}`.toLowerCase();
        if (!searchable.includes(normalizedSearch)) return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'price-asc': matches.sort((a, b) => a.price - b.price); break;
      case 'price-desc': matches.sort((a, b) => b.price - a.price); break;
      case 'name-asc': matches.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'name-desc': matches.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'discount': matches.sort((a, b) => (b.compareAtPrice - b.price) - (a.compareAtPrice - a.price)); break;
      case 'stock-desc': matches.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
      default: break;
    }
    return matches;
  }, [
    addedStorehouseIds,
    debouncedSearch,
    hideAdded,
    isManagedImportCategory,
    persistedCategoryData,
    priceRange,
    selectedCategory,
    selectedSubcategory,
    sortBy,
    statusFilter,
  ]);

  const isClearedDemoCategory = CLEARED_SELLER_STOREHOUSE_DEMO_CATEGORY_SLUGS.has(activeCategoryDefinition?.slug || '');
  const totalCount = isManagedImportCategory
    ? filteredVerifiedProducts.length
    : selectedCategory === 'All categories'
      ? categoryCatalogTotal
      : isClearedDemoCategory ? 0 : queryResult.totalCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const products = isManagedImportCategory
    ? filteredVerifiedProducts.slice((page - 1) * pageSize, page * pageSize)
    : (selectedCategory === 'All categories' ? mixedCategoryProducts : queryResult.products).filter((product) => (
      catalogCategories.some((category) => category.slug === product.categorySlug)
      && (selectedCategory === 'All categories' || !CLEARED_SELLER_STOREHOUSE_DEMO_CATEGORY_SLUGS.has(product.categorySlug))
    ));
  const pageProducts = products;
  const loadedCategoryProducts = persistedCategoryData?.category === selectedCategory
    ? persistedCategoryData.products
    : null;
  const subcategoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of loadedCategoryProducts || []) {
      if (product.subcategory) counts.set(product.subcategory, (counts.get(product.subcategory) || 0) + 1);
    }
    return counts;
  }, [loadedCategoryProducts]);
  // ---------------------------------------------------------------------------
  // PRODUCT SELECTION & QUICK VIEW HANDLERS (PRD: Direct Selection & Quick View)
  // ---------------------------------------------------------------------------
  const handleToggleProductSelect = (productId: string) => {
    const isCurrentlySelected = selectedProductIds.includes(productId) || addedStorehouseIds.includes(productId);

    if (isCurrentlySelected) {
      // DESELECT: Remove from selection and remove from My Products!
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
      if (onRemoveFromShop) {
        onRemoveFromShop(productId);
      }
    } else {
      // SELECT: Add to selection and add to My Products!
      setSelectedProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      if (!addedStorehouseIds.includes(productId)) {
        const prod = products.find((p) => p.id === productId) || getProductById(productId);
        if (prod) {
          onAddToShop(prod);
        }
      }
    }
  };

  const handleSelectAllCurrentPage = () => {
    const currentPageIds = products.map((p) => p.id);
    const allSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedProductIds.includes(id) || addedStorehouseIds.includes(id));

    if (allSelected) {
      // DESELECT ALL ON CURRENT PAGE: Remove from selection and remove from My Products!
      setSelectedProductIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
      if (onRemoveFromShop) {
        currentPageIds.forEach((id) => {
          if (addedStorehouseIds.includes(id)) {
            onRemoveFromShop(id);
          }
        });
      }
    } else {
      setSelectedProductIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds]))
      );
      // Automatically add unadded products from current page to shop
      const unaddedOnPage = products.filter((p) => !addedStorehouseIds.includes(p.id));
      if (unaddedOnPage.length > 0) {
        if (onAddMultipleToShop) {
          onAddMultipleToShop(unaddedOnPage);
        } else {
          unaddedOnPage.forEach((p) => onAddToShop(p));
        }
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  const handleQuickView = (e: React.MouseEvent, item: DemoProduct) => {
    e.stopPropagation(); // MUST NOT trigger card click or product selection
    setModalProduct(item);
    setIsModalOpen(true);
  };

  const handleAddSelectedToShop = () => {
    const unaddedSelected = products.filter(
      (p) => selectedProductIds.includes(p.id) && !addedStorehouseIds.includes(p.id)
    );

    if (unaddedSelected.length === 0) {
      notify('All selected products on this page are already in your shop.');
      return;
    }

    const toAdd = unaddedSelected.slice(0, remainingSlots);
    if (toAdd.length === 0) {
      notify(`Limit reached: ${packageName} allows up to ${planLimit} products.`);
      return;
    }

    if (onAddMultipleToShop) {
      onAddMultipleToShop(toAdd);
    } else {
      toAdd.forEach((item) => {
        onAddToShop(item);
      });
      notify(`Added ${toAdd.length} selected products to your shop!`);
    }
    setSelectedProductIds((prev) =>
      prev.filter((id) => !toAdd.some((item) => item.id === id))
    );
  };

  const handleAddAllCurrentCatalog = () => {
    if (isClearedDemoCategory) {
      notify('There are no products in this category to add.');
      return;
    }
    if (!isManagedImportCategory) {
      onAddAllToShop(Array.from(CLEARED_SELLER_STOREHOUSE_DEMO_CATEGORY_SLUGS));
      return;
    }
    const eligible = filteredVerifiedProducts
      .filter((product) => !addedStorehouseIds.includes(product.id))
      .slice(0, remainingSlots);
    if (!eligible.length) {
      notify(remainingSlots <= 0
        ? `Limit reached: ${packageName} allows up to ${planLimit} products.`
        : 'There are no new products in this category to add.');
      return;
    }
    if (onAddMultipleToShop) onAddMultipleToShop(eligible);
    else eligible.forEach(onAddToShop);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategory('All categories');
    setSelectedSubcategory('All');
    setPriceRange('all');
    setStatusFilter('all');
    setSortBy('default');
    setHideAdded(false);
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    selectedCategory !== 'All categories' ||
    selectedSubcategory !== 'All' ||
    priceRange !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'default' ||
    hideAdded;

  // Jump to specific page
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpPageInput, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      setPage(targetPage);
      setJumpPageInput('');
    } else {
      notify(`Please enter a valid page between 1 and ${totalPages.toLocaleString()}.`);
    }
  };

  // Calculate visible range numbers
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(totalCount, page * pageSize);

  // Generate pagination numbers sliding window
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | string)[] = [];
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) {
      if (i !== 1 && i !== totalPages) range.push(i);
    }
    if (right < totalPages - 1) range.push('...');
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [page, totalPages]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ===================================================================== */}
      {/* PRIMARY CONTROL TOOLBAR                                               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar with Debouncing */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={hasLoadedCategoryCounts ? `Search ${categoryCatalogTotal.toLocaleString()} products by title or brand...` : 'Search products by title or brand...'}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cca23b] focus:bg-white transition-all shadow-inner"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Toolbar Right: View Toggle, Hide Added, & Add All Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#071324] shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#071324] shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table Manifest View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Hide Added Checkbox */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer shadow-sm hover:bg-gray-50 select-none">
              <input
                type="checkbox"
                checked={hideAdded}
                onChange={(e) => {
                  setHideAdded(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-gray-300 text-[#071324] focus:ring-[#cca23b] w-4 h-4 accent-[#071324]"
              />
              <span>Hide added</span>
            </label>

            {/* "Add all to My Products" Button */}
            <button
              onClick={handleAddAllCurrentCatalog}
              disabled={remainingSlots <= 0}
              className={`px-4 py-2 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 border ${
                remainingSlots <= 0
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-[#071324] hover:bg-[#11233b] text-white border-[#162740]'
              }`}
              title={
                remainingSlots <= 0
                  ? `Product limit reached (${planLimit}/${planLimit})`
                  : `Add all eligible products to My Products up to ${planLimit}`
              }
            >
              <Plus className={`w-3.5 h-3.5 ${remainingSlots <= 0 ? 'text-gray-400' : 'text-[#cca23b]'}`} />
              <span>Add all to My Products</span>
            </button>

            {/* "Add Selected" Button (when products are selected) */}
            {selectedProductIds.length > 0 && (
              <button
                type="button"
                onClick={handleAddSelectedToShop}
                className="px-3.5 py-2 bg-[#cca23b] hover:bg-[#b89132] text-[#071324] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 animate-fadeIn"
                title="Add selected products to My Products"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Selected ({selectedProductIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row: Subcategory, Price, Status, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-gray-100 text-xs">

          {/* Subcategory Dropdown (Populates when Category selected) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Subcategory
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                setPage(1);
              }}
              disabled={selectedCategory === 'All categories'}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#cca23b] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="All">All Subcategories</option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Wholesale Price
            </label>
            <select
              value={priceRange}
              onChange={(e) => {
                setPriceRange(e.target.value as PriceRangeFilter);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#cca23b]"
            >
              <option value="all">All Prices</option>
              <option value="under-25">Under $25</option>
              <option value="25-50">$25 to $50</option>
              <option value="50-100">$50 to $100</option>
              <option value="100-250">$100 to $250</option>
              <option value="250-plus">$250 and above</option>
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Inventory Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'in-stock' | 'low-stock');
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#cca23b]"
            >
              <option value="all">All Statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock (&lt; 25)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#cca23b]"
            >
              <option value="default">Default Catalog Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Product Name: A to Z</option>
              <option value="name-desc">Product Name: Z to A</option>
              <option value="discount">Highest Savings %</option>
              <option value="stock-desc">Stock: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. CATEGORY FILTER PILLS (Matching User's Original Reference Design)   */}
      {/* ===================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span className="font-semibold text-gray-700">Browse by Category:</span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCategorySelect('All categories')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 ${
              selectedCategory === 'All categories'
                ? 'border border-[#10b981] bg-[#ecfdf5] text-[#059669] font-bold shadow-sm'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 font-medium'
            }`}
          >
            <span>All categories</span>
            <span className="text-[10px] opacity-75">({hasLoadedCategoryCounts ? `${(categoryCatalogTotal / 1000).toFixed(1)}K` : '—'})</span>
          </button>

          {catalogCategories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'border border-[#10b981] bg-[#ecfdf5] text-[#059669] font-bold shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 font-medium'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({hasLoadedCategoryCounts ? (categoryCounts[cat.slug] ?? 0).toLocaleString() : '—'})</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedCategory !== 'All categories' && availableSubcategories.length > 0 && (
        <section aria-label={`Subcategories in ${selectedCategory}`} className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-800">Subcategories in {selectedCategory}</h3>
            <span className="text-[10px] text-slate-500">{availableSubcategories.length} subcategories · choose one to filter, or view all below</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={selectedSubcategory === 'All'}
              onClick={() => { setSelectedSubcategory('All'); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${selectedSubcategory === 'All' ? 'border-[#173759] bg-[#173759] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
            >
              All subcategories <span className="ml-1 opacity-75">({catalogLoadError ? '—' : loadedCategoryProducts?.length ?? (isVerifiedProductsLoading ? '…' : '—')})</span>
            </button>
            {availableSubcategories.map((subcategory) => {
              const isActive = selectedSubcategory === subcategory;
              const count = catalogLoadError ? '—' : loadedCategoryProducts ? subcategoryProductCounts.get(subcategory) || 0 : isVerifiedProductsLoading ? '…' : '—';
              return (
                <button
                  key={subcategory}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => { setSelectedSubcategory(subcategory); setPage(1); }}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${isActive ? 'border-[#cca23b] bg-amber-50 text-[#071324]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
                >
                  {subcategory} <span className="ml-1 text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 4. ACTIVE FILTER TAGS & RESULT SUMMARY BAR                             */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 bg-gray-50/80 px-4 py-2.5 rounded-xl border border-gray-200/70">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">
            Showing {startItem.toLocaleString()}–{endItem.toLocaleString()} of {totalCount.toLocaleString()} products
          </span>
          {hasActiveFilters && (
            <span className="text-gray-400 font-mono">
              (Filtered from {categoryCatalogTotal.toLocaleString()} total)
            </span>
          )}
        </div>

        {/* Per-Page Selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">Per page:</span>
          {[24, 48, 72].map((size) => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                setPage(1);
              }}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                pageSize === size
                  ? 'bg-[#071324] text-white font-bold'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. PRODUCT DISPLAY: GRID OR TABLE MANIFEST                             */}
      {/* ===================================================================== */}
      {pageProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 space-y-3">
          <PackageOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-base">
            {isManagedImportCategory
              ? isVerifiedProductsLoading
                ? 'Loading verified product listings…'
                : catalogLoadError || 'No verified products have been imported for this category yet'
              : 'No products match your filter criteria'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {isManagedImportCategory
              ? !isVerifiedProductsLoading && !catalogLoadError && loadedCategoryProducts?.length === 0
                ? 'There are no imported products in this category yet.'
                : 'Only imported product records with their matching product photos are shown in this category.'
              : 'Try clearing your search keyword or adjusting the price range.'}
          </p>
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#071324] text-white text-xs font-bold rounded-lg hover:bg-[#11233b] transition-colors shadow-sm"
            >
              Reset all filters
            </button>
            {catalogLoadError.includes('seller sign-in has expired') && (
              <a
                href="/seller"
                className="ml-2 inline-flex px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign in again
              </a>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Direct Selection & Quick View (PRD) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {pageProducts.map((item) => {
            const isAdded = addedStorehouseIds.includes(item.id);
            const isSelected = isAdded || selectedProductIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleToggleProductSelect(item.id)}
                className={`rounded-2xl p-4 transition-all flex flex-col justify-between group cursor-pointer relative select-none ${
                  isSelected
                    ? 'bg-amber-50/40 border-2 border-[#cca23b] shadow-md ring-2 ring-[#cca23b]/30'
                    : 'bg-white border border-gray-200/90 shadow-sm hover:shadow-md hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Clean White Product Image Area */}
                  <div className="relative h-60 sm:h-64 w-full bg-white mb-3 flex items-center justify-center overflow-hidden p-2 rounded-xl group/img">
                    <ProductImageWithFallback
                      src={item.mainImage}
                      alt={item.title}
                      className="h-full w-full max-h-full max-w-full object-contain mix-blend-multiply group-hover/img:scale-105 transition-transform duration-300 drop-shadow-sm pointer-events-none"
                      containerClassName="relative h-full w-full flex items-center justify-center"
                    />

                    {/* Direct Product Selection Checkmark Indicator (PRD Option 2) */}
                    <div
                      className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        isSelected
                          ? 'bg-[#071324] text-white border border-[#cca23b]'
                          : 'bg-white/95 text-gray-500 border border-gray-200 opacity-0 group-hover:opacity-100 hover:text-gray-900'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleProductSelect(item.id);
                      }}
                      title={isSelected ? 'Click to deselect' : 'Click to select product'}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#cca23b] text-[#071324]' : 'border border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                    </div>

                    {/* In-Shop Badge */}
                    {isAdded && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[9.5px] shadow-sm flex items-center gap-1 z-10">
                        <Check className="w-3 h-3" />
                        <span>In Shop</span>
                      </span>
                    )}

                    {/* Quick View Button: Clearly Defined Clickable Area (PRD Option 1 - does NOT select product) */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickView(e, item)}
                      className="absolute bottom-2 right-2 z-20 px-3 py-1.5 rounded-lg bg-[#071324] hover:bg-[#11233b] text-white text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 border border-[#162740] opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95"
                      title="Quick View: Preview complete product information"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#cca23b]" />
                      <span>Quick View</span>
                    </button>
                  </div>

                  {/* Brand & Category Breadcrumb */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1">
                    <span className="text-gray-500 font-semibold truncate max-w-[130px]">
                      {item.brand}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                      {item.subcategory}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <h3
                    title={item.title}
                    className="text-sm font-semibold text-gray-900 group-hover:text-[#cca23b] transition-colors line-clamp-2 min-h-[2.5rem] leading-snug"
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-baseline justify-between mt-2">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm font-bold text-gray-900 font-mono">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.compareAtPrice > item.price && (
                        <p className="text-[11px] text-gray-400 line-through">
                          ${item.compareAtPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        item.status === 'In Stock'
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {item.status} ({item.stockQuantity})
                    </span>
                  </div>
                </div>

                {/* Add to Shop Action Button */}
                <div className="mt-4 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  {isAdded ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleProductSelect(item.id);
                      }}
                      className="w-full py-2 bg-emerald-50 hover:bg-red-50 border border-emerald-200 hover:border-red-200 text-emerald-700 hover:text-red-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer group/cardBtn"
                      title="Click to remove from My Products"
                    >
                      <Check className="w-3.5 h-3.5 group-hover/cardBtn:hidden" />
                      <X className="w-3.5 h-3.5 hidden group-hover/cardBtn:inline text-red-600" />
                      <span className="group-hover/cardBtn:hidden">Added to My Products</span>
                      <span className="hidden group-hover/cardBtn:inline">Remove from My Products</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleProductSelect(item.id);
                      }}
                      className="w-full py-2 bg-[#071324] hover:bg-[#11233b] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm border border-[#162740] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#cca23b]" />
                      <span>Add to My Products</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: Direct Selection & Quick View (PRD) */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#071324] text-white border-b border-[#162740]">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={pageProducts.length > 0 && pageProducts.every((p) => selectedProductIds.includes(p.id) || addedStorehouseIds.includes(p.id))}
                      onChange={handleSelectAllCurrentPage}
                      title="Select / Deselect all on this page"
                      className="w-4 h-4 rounded border-gray-300 text-[#071324] focus:ring-[#cca23b] accent-[#071324] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 font-bold">Product</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Brand</th>
                  <th className="py-3 px-4 font-bold">Price</th>
                  <th className="py-3 px-4 font-bold">Stock</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageProducts.map((item) => {
                  const isAdded = addedStorehouseIds.includes(item.id);
                  const isSelected = isAdded || selectedProductIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleProductSelect(item.id)}
                      className={`cursor-pointer transition-colors select-none ${
                        isSelected
                          ? 'bg-amber-50/70 border-l-4 border-l-[#cca23b]'
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <td className="py-3 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProductSelect(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#071324] focus:ring-[#cca23b] accent-[#071324] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.mainImage}
                              alt={item.title}
                              className="w-full h-full object-contain mix-blend-multiply"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <span
                              className="font-semibold text-gray-900 line-clamp-1"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              MOQ: {item.minOrderQuantity} units • {item.condition}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {item.brand}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {item.stockQuantity}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'In Stock'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleQuickView(e, item)}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-[#071324] hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                            title="Quick View: Preview complete product information"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#cca23b]" />
                            <span>Quick View</span>
                          </button>
                          {isAdded ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProductSelect(item.id);
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-red-50 text-emerald-700 hover:text-red-600 font-bold text-[10px] border border-emerald-200 hover:border-red-200 transition-colors cursor-pointer group/tblBtn"
                              title="Click to remove from My Products"
                            >
                              <span className="group-hover/tblBtn:hidden">In Shop</span>
                              <span className="hidden group-hover/tblBtn:inline">Remove</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProductSelect(item.id);
                              }}
                              className="px-2.5 py-1 bg-[#071324] hover:bg-[#11233b] text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Selection Bar (PRD Option 2) */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#071324] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#cca23b]/50 flex items-center gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#cca23b] text-[#071324] font-extrabold text-xs flex items-center justify-center">
              {selectedProductIds.length}
            </div>
            <span className="text-xs font-bold text-white whitespace-nowrap">
              {selectedProductIds.length} {selectedProductIds.length === 1 ? 'product' : 'products'} selected
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSelectedToShop}
              className="px-3.5 py-1.5 bg-[#cca23b] hover:bg-[#b89132] text-[#071324] font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Selected to My Products</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-medium text-xs rounded-lg transition-colors whitespace-nowrap"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. ADVANCED PAGINATION CONTROLS (Smart Window & Jump Input)            */}
      {/* ===================================================================== */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Status info */}
          <div className="text-gray-500 font-medium">
            Page <strong className="text-gray-900">{page}</strong> of{' '}
            <strong className="text-gray-900">{totalPages.toLocaleString()}</strong> ({totalCount.toLocaleString()} products)
          </div>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1.5">
            {/* First Page Button */}
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page Button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Numbered Buttons Window */}
            {paginationRange.map((pNum, index) => {
              if (pNum === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-400 select-none"
                  >
                    ...
                  </span>
                );
              }
              const isCurrent = pNum === page;
              return (
                <button
                  key={`page-${pNum}`}
                  onClick={() => setPage(pNum as number)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#071324] text-white shadow-sm'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            {/* Next Page Button */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page Button */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Page Jump Form */}
          <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Jump to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={page.toString()}
              className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#cca23b]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. PRODUCT DETAIL MODAL DIALOG                                         */}
      {/* ===================================================================== */}
      <ProductDetailModal
        product={modalProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalProduct(null);
        }}
        isAdded={modalProduct ? addedStorehouseIds.includes(modalProduct.id) : false}
        onAddToShop={(prod) => {
          handleToggleProductSelect(prod.id);
          setIsModalOpen(false);
        }}
        onRemoveFromShop={(id) => {
          handleToggleProductSelect(id);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
