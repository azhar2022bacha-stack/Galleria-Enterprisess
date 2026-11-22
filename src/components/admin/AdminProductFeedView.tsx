'use client';

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImagePlus,
  Link2,
  LoaderCircle,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Store,
  Tag,
  Trash2,
  Upload,
  Warehouse,
  X,
} from 'lucide-react';
import { STOREHOUSE_IMPORT_CATEGORIES } from '@/data/storehouseImportCategories';
import { addCatalogCategoryDefaults, replaceCatalogCategories } from '@/data/catalogCategoryReplacements';
import {
  isProductFeedDestination, normalizeProductFeedHeader as normalizeHeader,
  PRODUCT_FEED_DESTINATION_NAMES, REQUIRED_PRODUCT_FEED_COLUMNS,
  type ProductFeedCategory as CategoryOption, type ProductFeedDestination as Destination,
} from '@/lib/productFeed';

type FeedProductInput = {
  rowNumber?: number;
  title: string;
  description: string;
  priceUsd: number | string;
  sku: string;
  brand?: string;
  category?: string;
  categorySlug?: string;
  subcategory?: string;
  subcategorySlug?: string;
  imageUrl?: string;
  imageDataUrl?: string;
  stockQuantity?: number | string;
};
type ImportPreview = { success: boolean; totalRows: number; validRows: number; errors: { row: number; message: string }[]; destination: Destination };
const FILE_PREVIEW_PAGE_SIZE = 12;

function ProductFeedFilePreview({ products }: { products: FeedProductInput[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(({ title, sku, category, subcategory }) =>
      [title, sku, category, subcategory].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [products, search]);
  const start = page * FILE_PREVIEW_PAGE_SIZE;
  const end = Math.min(start + FILE_PREVIEW_PAGE_SIZE, matches.length);

  return (
    <section aria-label="Products in this file" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-xs font-bold text-slate-900">Products in this file</h4>
        <input
          type="search"
          aria-label="Search preview by product name, SKU, or category"
          placeholder="Search products in this file"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(0); }}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:w-64"
        />
      </div>
      {matches.length ? <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-xs">
          <thead className="bg-slate-50 text-slate-700">
            <tr>{['Row', 'Product', 'SKU', 'Category in file', 'Price (USD)', 'Image'].map((label) =>
              <th key={label} scope="col" className="px-3 py-2 font-semibold">{label}</th>,
            )}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {matches.slice(start, end).map((product) => {
              const category = [product.category, product.subcategory].filter(Boolean).join(' › ');
              const image = product.imageUrl ?? '';
              const canOpenImage = /^https:\/\/[^/\s]/i.test(image)
                || (/^\/(?:images|uploads)\//.test(image) && !image.includes('..') && !image.includes('\\'));
              return <tr key={product.rowNumber}>
                <td className="px-3 py-2">{product.rowNumber}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{product.title || '—'}</td>
                <td className="px-3 py-2">{product.sku || '—'}</td>
                <td className="px-3 py-2">{category || '—'}</td>
                <td className="px-3 py-2">{product.priceUsd === '' ? '—' : product.priceUsd}</td>
                <td className="px-3 py-2">{canOpenImage ? <a href={image} target="_blank" rel="noopener noreferrer" className="underline">View image</a> : '—'}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div> : <p className="text-xs text-slate-600">No products match your search.</p>}
      {matches.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>Showing {start + 1}–{end} of {matches.length.toLocaleString()} rows</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40" disabled={end >= matches.length} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>}
    </section>
  );
}

function csvRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const text = source.replace(/^\uFEFF/, '');
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field); field = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (quoted) throw new Error('This CSV contains an unfinished quoted field.');
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  if (rows.length < 2) throw new Error('Choose a CSV with a header and at least one product row.');
  return rows;
}

function productsFromTable(rows: string[][], format: 'CSV' | 'PDF'): FeedProductInput[] {
  const headers = rows[0].map(normalizeHeader);
  if (new Set(headers).size !== headers.length) throw new Error(`The ${format} has duplicate column names.`);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const missing = Object.entries(REQUIRED_PRODUCT_FEED_COLUMNS)
    .filter(([, aliases]) => !aliases.some((alias) => headerIndex.has(alias)))
    .map(([field]) => field);
  if (missing.length) throw new Error(`${format} is missing required columns: ${missing.join(', ')}.`);
  const read = (cells: string[], ...aliases: string[]) => {
    const index = aliases.map((alias) => headerIndex.get(normalizeHeader(alias))).find((value) => value !== undefined);
    return index === undefined ? '' : String(cells[index] ?? '').trim();
  };
  return rows.slice(1).map((cells, index) => ({
    rowNumber: index + 2,
    title: read(cells, 'title', 'product_name', 'name'),
    description: read(cells, 'description', 'product_description'),
    priceUsd: read(cells, 'price_usd', 'usd_price', 'price'),
    imageUrl: read(cells, 'image_url', 'image', 'imageurl'),
    sku: read(cells, 'sku', 'product_sku'),
    category: read(cells, 'category', 'category_name'),
    subcategory: read(cells, 'subcategory', 'sub_category'),
    brand: read(cells, 'brand', 'company'),
    stockQuantity: read(cells, 'stock_quantity', 'stock', 'inventory') || 1,
  }));
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the selected image.'));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

const CSV_TEMPLATE = 'title,description,price_usd,image_url,sku,category,subcategory,brand,stock_quantity\n';
const PRODUCT_FEED_DESTINATION_STORAGE_KEY = 'buyxoco_admin_product_feed_destination';
const DESTINATION_OPTIONS = [
  { id: 'main-store', Icon: Store, detail: 'Publish on the public storefront' },
  { id: 'seller-storehouse', Icon: Warehouse, detail: 'Add to the shared seller catalog' },
  { id: 'all-three', Icon: PackagePlus, detail: 'Main Store, Seller Storehouse, and Consign Products' },
  { id: 'consign', Icon: Package, detail: 'Admin → Consign → Merchant' },
] as const;

function customOptionsLast<T>(items: T[], isCustom: (item: T) => boolean): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => Number(isCustom(left.item)) - Number(isCustom(right.item)) || left.index - right.index)
    .map(({ item }) => item);
}

function TaxonomyPicker({
  items,
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  className = '',
}: {
  items: { name: string; slug: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('');
  const letters = useMemo(() => Array.from(new Set(
    items.map((item) => item.name.trim().charAt(0).toLocaleUpperCase()).filter((character) => /^[A-Z]$/.test(character)),
  )).sort(), [items]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items.filter((item) =>
      (!letter || item.name.trim().toLocaleUpperCase().startsWith(letter))
      && (!normalizedQuery || item.name.toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [items, letter, query]);
  const selectedItem = items.find((item) => item.slug === value);
  const selectedItemIsFilteredOut = Boolean(selectedItem && !filteredItems.some((item) => item.slug === value));

  useEffect(() => {
    if (letter && !letters.includes(letter)) setLetter('');
  }, [letter, letters]);

  return (
    <div className={`mt-1.5 space-y-2 ${className}`}>
      <div className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label={`Search ${label.toLowerCase()}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#173759] disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1" aria-label={`Filter ${label.toLowerCase()} by first letter`}>
        <button type="button" disabled={disabled} onClick={() => setLetter('')} aria-pressed={!letter} className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-semibold ${!letter ? 'border-[#173759] bg-[#173759] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'} disabled:opacity-50`}>All</button>
        {letters.map((character) => <button key={character} type="button" disabled={disabled} onClick={() => setLetter((current) => current === character ? '' : character)} aria-pressed={letter === character} className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-semibold ${letter === character ? 'border-[#173759] bg-[#173759] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'} disabled:opacity-50`}>{character}</button>)}
      </div>
      <select required disabled={disabled} aria-label={`Select ${label.toLowerCase()}`} value={value} onChange={(event) => onChange(event.target.value)} className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-normal text-slate-800 outline-none focus:border-[#173759] disabled:bg-slate-100 disabled:text-slate-400">
        <option value="">{placeholder} ({filteredItems.length} shown)</option>
        {selectedItemIsFilteredOut && selectedItem && <option value={value}>{selectedItem.name} (selected)</option>}
        {filteredItems.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        {filteredItems.length === 0 && <option disabled value="__no_match__">No matching {label.toLowerCase()}</option>}
      </select>
    </div>
  );
}

export function AdminProductFeedView({ notify }: { notify?: (message: string) => void }) {
  const [destination, setDestination] = useState<Destination>('main-store');
  const [destinationPreferenceLoaded, setDestinationPreferenceLoaded] = useState(false);
  const [mode, setMode] = useState<'single' | 'csv'>('single');
  const [storeCategories, setStoreCategories] = useState<CategoryOption[]>([]);
  const [storehouseCategories, setStorehouseCategories] = useState<CategoryOption[]>(() => replaceCatalogCategories(addCatalogCategoryDefaults(STOREHOUSE_IMPORT_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    subcategories: category.subcategories.map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })),
  })))));
  const [categoryLoadError, setCategoryLoadError] = useState('');
  const [refreshingCategories, setRefreshingCategories] = useState(false);
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});
  const [categoryProductCountsIncomplete, setCategoryProductCountsIncomplete] = useState(false);
  const categoryRequestVersion = useRef(0);
  const [categoryManagerKind, setCategoryManagerKind] = useState<'category' | 'subcategory' | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryParentSlug, setCategoryParentSlug] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryNotice, setCategoryNotice] = useState('');
  const [deletingCategoryKey, setDeletingCategoryKey] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [subcategorySlug, setSubcategorySlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [savingSingle, setSavingSingle] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProducts, setCsvProducts] = useState<FeedProductInput[]>([]);
  const [csvCategoryMode, setCsvCategoryMode] = useState<'selected' | 'columns'>('selected');
  const [csvCategorySlug, setCsvCategorySlug] = useState('');
  const [csvSubcategorySlug, setCsvSubcategorySlug] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [csvError, setCsvError] = useState('');
  const [working, setWorking] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const fileReadVersion = useRef(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const savedDestination = window.localStorage.getItem(PRODUCT_FEED_DESTINATION_STORAGE_KEY);
      if (isProductFeedDestination(savedDestination)) {
        setDestination(savedDestination);
      }
    } catch {
      // The Product Feed remains usable when browser storage is unavailable.
    } finally {
      setDestinationPreferenceLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!destinationPreferenceLoaded) return;
    try {
      window.localStorage.setItem(PRODUCT_FEED_DESTINATION_STORAGE_KEY, destination);
    } catch {
      // Destination persistence is a convenience; category data is saved by the server.
    }
  }, [destination, destinationPreferenceLoaded]);

  const refreshDestination = useCallback(async () => {
    const version = ++categoryRequestVersion.current;
    setRefreshingCategories(true);
    setCategoryLoadError('');
    try {
      const response = await fetch('/api/admin/product-feed/categories', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.mainStoreCategories) || !Array.isArray(payload.storehouseCategories)) {
        throw new Error(payload.error || 'Could not load catalog categories.');
      }
      if (categoryRequestVersion.current === version) {
        setStoreCategories(payload.mainStoreCategories);
        setStorehouseCategories(payload.storehouseCategories);
        setCategoryProductCounts(payload.categoryProductCounts && typeof payload.categoryProductCounts === 'object' ? payload.categoryProductCounts : {});
        setCategoryProductCountsIncomplete(payload.categoryProductCountsIncomplete === true);
      }
    } catch (error) {
      if (categoryRequestVersion.current === version) {
        setCategoryLoadError(error instanceof Error ? error.message : 'Could not refresh categories.');
      }
    } finally {
      if (categoryRequestVersion.current === version) setRefreshingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!destinationPreferenceLoaded) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshDestination();
    };
    refreshDestination();
    window.addEventListener('focus', refreshDestination);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', refreshDestination);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [destinationPreferenceLoaded, refreshDestination]);

  const categories = customOptionsLast(
    destination === 'seller-storehouse' ? storehouseCategories : storeCategories,
    (category) => Boolean(category.isCustom),
  );
  const managedCategories = useMemo(() => {
    const managed = new Map<string, CategoryOption>();
    for (const category of [...storeCategories, ...storehouseCategories]) {
      const key = category.name.toLowerCase();
      const existing = managed.get(key);
      if (!existing) managed.set(key, category);
      else managed.set(key, {
        ...existing,
        subcategories: [...new Map([...existing.subcategories, ...category.subcategories].map((item) => [item.slug, item])).values()],
      });
    }
    return [...managed.values()];
  }, [storeCategories, storehouseCategories]);

  const parsedSubcategoryNames = useMemo(() => categoryName.split(',').map((name) => name.trim()).filter(Boolean), [categoryName]);
  const duplicateSubcategoryNames = useMemo(() => {
    const normalized = parsedSubcategoryNames.map((name) => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
    return new Set(normalized).size !== normalized.length;
  }, [parsedSubcategoryNames]);
  const selectedCategory = categories.find((category) => category.slug === categorySlug);
  const subcategories = customOptionsLast(
    selectedCategory?.subcategories || [],
    (subcategory) => Boolean(selectedCategory?.customSubcategorySlugs?.includes(subcategory.slug)),
  );
  const selectedCsvCategory = categories.find((category) => category.slug === csvCategorySlug);
  const csvSubcategories = customOptionsLast(
    selectedCsvCategory?.subcategories || [],
    (subcategory) => Boolean(selectedCsvCategory?.customSubcategorySlugs?.includes(subcategory.slug)),
  );
  const destinationLabel = PRODUCT_FEED_DESTINATION_NAMES[destination];

  const changeDestination = (nextDestination: Destination) => {
    setDestination(nextDestination);
    setCategorySlug('');
    setSubcategorySlug('');
    setCsvCategorySlug('');
    setCsvSubcategorySlug('');
    setPreview(null);
    setCsvError('');
    setNotice('');
    setCategoryError('');
    setCategoryManagerKind(null);
  };

  const openCategoryManager = (kind: 'category' | 'subcategory') => {
    setCategoryManagerKind(kind);
    setCategoryName('');
    setCategoryError('');
    setCategoryNotice('');
    setCategoryParentSlug(categorySlug || managedCategories[0]?.slug || '');
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryManagerKind) return;
    setSavingCategory(true);
    setCategoryError('');
    setCategoryNotice('');
    try {
      const response = await fetch('/api/admin/product-feed/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'all-catalogs',
          kind: categoryManagerKind,
          name: categoryName,
          ...(categoryManagerKind === 'subcategory' ? { categorySlug: categoryParentSlug, categoryName: managedCategories.find((item) => item.slug === categoryParentSlug)?.name, names: parsedSubcategoryNames } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.mainStoreCategories) || !Array.isArray(payload.storehouseCategories)) {
        throw new Error(payload.error || 'Could not save this category.');
      }
      categoryRequestVersion.current += 1;
      setRefreshingCategories(false);
      setStoreCategories(payload.mainStoreCategories);
      setStorehouseCategories(payload.storehouseCategories);
      const updatedCategories: CategoryOption[] = destination === 'seller-storehouse' ? payload.storehouseCategories : payload.mainStoreCategories;

      const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (categoryManagerKind === 'category') {
        const added = updatedCategories.find((item) => normalize(item.name) === normalize(categoryName));
        if (added) {
          setCategorySlug(added.slug);
          setSubcategorySlug('');
          setCsvCategorySlug(added.slug);
          setCsvSubcategorySlug('');
        }
      } else {
        const parentName = managedCategories.find((item) => item.slug === categoryParentSlug)?.name;
        const parent = updatedCategories.find((item) => item.slug === categoryParentSlug || item.name === parentName);
        const added = parent?.subcategories.find((item) => normalize(item.name) === normalize(parsedSubcategoryNames[0] || ''));
        setCategorySlug(parent?.slug || '');
        setCsvCategorySlug(parent?.slug || '');
        if (added) {
          setSubcategorySlug(added.slug);
          setCsvSubcategorySlug(added.slug);
        }
      }
      const savedCount = categoryManagerKind === 'subcategory' ? parsedSubcategoryNames.length : 1;
      const savedLabel = categoryManagerKind === 'category' ? 'category' : savedCount === 1 ? 'subcategory' : 'subcategories';
      const parentName = updatedCategories.find((item) => item.slug === categoryParentSlug)?.name;
      const successMessage = categoryManagerKind === 'category'
        ? `Category “${categoryName.trim()}” is available in all catalogs.`
        : `${savedCount} ${savedLabel} available under “${parentName || categoryParentSlug}” in all catalogs.`;
      notify?.(successMessage);
      setCategoryNotice(successMessage);
      setCategoryManagerKind(null);
      setPreview(null);
      setCategoryName('');
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : 'Could not save this category.');
    } finally { setSavingCategory(false); }
  };

  const deleteManagedCategory = async (kind: 'category' | 'subcategory', category: CategoryOption, subcategory?: CategoryOption['subcategories'][number]) => {
    const label = kind === 'category' ? category.name : `${category.name} › ${subcategory?.name || ''}`;
    const key = `${kind}:${category.slug}:${subcategory?.slug || ''}`;
    if (!window.confirm(`Permanently delete “${label}” and its products from all catalogs and seller accounts? This cannot be undone.`)) return;
    setDeletingCategoryKey(key);
    setCategoryError('');
    setCategoryNotice('');
    try {
      const response = await fetch('/api/admin/product-feed/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'all-catalogs',
          kind,
          categorySlug: category.slug,
          categoryName: category.name,
          ...(subcategory ? { subcategorySlug: subcategory.slug, subcategoryName: subcategory.name } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not delete this category.');
      // Invalidate earlier GETs for both destinations so a stale response cannot restore a deleted item.
      categoryRequestVersion.current += 1;
      setRefreshingCategories(false);
      if (Array.isArray(payload.mainStoreCategories)) setStoreCategories(payload.mainStoreCategories);
      if (Array.isArray(payload.storehouseCategories)) setStorehouseCategories(payload.storehouseCategories);
      if (kind === 'category' && categorySlug === category.slug) {
        setCategorySlug('');
        setSubcategorySlug('');
      }
      if (kind === 'category' && csvCategorySlug === category.slug) {
        setCsvCategorySlug('');
        setCsvSubcategorySlug('');
      }
      if (kind === 'subcategory' && categorySlug === category.slug && subcategorySlug === subcategory?.slug) setSubcategorySlug('');
      if (kind === 'subcategory' && csvCategorySlug === category.slug && csvSubcategorySlug === subcategory?.slug) setCsvSubcategorySlug('');
      setPreview(null);
      const deletedCount = Number(payload.deletedProducts) || 0;
      const successMessage = `${label} deleted from all catalogs. ${deletedCount.toLocaleString()} product records removed.`;
      setCategoryNotice(successMessage);
      notify?.(successMessage);
      void refreshDestination();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : 'Could not delete this category.');
    } finally {
      setDeletingCategoryKey('');
    }
  };

  const deleteAllCategories = async () => {
    const totalProducts = Object.values(categoryProductCounts).reduce((sum, count) => sum + count, 0);
    const productCountLabel = categoryProductCountsIncomplete
      ? 'all categorized products'
      : `${totalProducts.toLocaleString()} categorized products`;
    const confirmed = window.confirm(
      `Permanently delete all ${managedCategories.length} categories and ${productCountLabel} from Main Store, Seller Storehouse, seller accounts, and Consign? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingCategoryKey('all-categories');
    setCategoryError('');
    setCategoryNotice('');
    try {
      const response = await fetch('/api/admin/product-feed/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'all-catalogs', kind: 'all-categories' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not delete all categories.');

      categoryRequestVersion.current += 1;
      setRefreshingCategories(false);
      setStoreCategories(Array.isArray(payload.categories) ? payload.categories : []);
      setStorehouseCategories(Array.isArray(payload.storehouseCategories) ? payload.storehouseCategories : []);
      setCategoryProductCounts({});
      setCategoryProductCountsIncomplete(false);
      setCategorySlug('');
      setSubcategorySlug('');
      setCsvCategorySlug('');
      setCsvSubcategorySlug('');
      setCategoryManagerKind(null);
      setCategoryName('');
      setPreview(null);
      const deletedCount = Number(payload.deletedProducts) || 0;
      const successMessage = `All categories deleted. ${deletedCount.toLocaleString()} categorized products were permanently removed from all catalogs.`;
      setCategoryNotice(successMessage);
      notify?.(successMessage);
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : 'Could not delete all categories.');
    } finally {
      setDeletingCategoryKey('');
    }
  };

  const sendProducts = async (action: 'preview' | 'commit', items: FeedProductInput[], fileName = '') => {
    const response = await fetch('/api/admin/product-feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, destination, fileName, items }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && !(action === 'preview' && Array.isArray(payload.errors))) {
      throw new Error(payload.error || 'The product feed request failed.');
    }
    return payload;
  };

  const saveSingleProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSingle(true);
    setNotice('');
    try {
      const data = {
        title,
        description,
        priceUsd,
        sku,
        brand,
        stockQuantity,
        categorySlug,
        subcategorySlug,
        imageUrl: imageFile ? '' : imageUrl,
        ...(imageFile ? { imageDataUrl: await toDataUrl(imageFile) } : {}),
      };
      const payload = await sendProducts('commit', [data]);
      const localStorageNote = payload.storageMode === 'local-file' ? ' Saved in the local Storehouse catalog while PostgreSQL is offline.' : '';
      setNotice(`Added ${payload.importedCount} product${payload.importedCount === 1 ? '' : 's'} to ${destinationLabel}.${localStorageNote}`);
      notify?.(`Product feed saved to ${destinationLabel}${payload.storageMode === 'local-file' ? ' local catalog' : ''}.`);
      setTitle(''); setDescription(''); setPriceUsd(''); setSku(''); setBrand(''); setStockQuantity('1'); setImageUrl(''); setImageFile(null); setImagePreview('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Product could not be saved.');
    } finally { setSavingSingle(false); }
  };

  const prepareCsvProducts = (): FeedProductInput[] | null => {
    if (csvCategoryMode === 'columns') return csvProducts;
    const category = categories.find((item) => item.slug === csvCategorySlug);
    const subcategory = category?.subcategories.find((item) => item.slug === csvSubcategorySlug);
    if (!category) {
      setCsvError('Choose the main category for this upload.');
      return null;
    }
    if (!subcategory) {
      setCsvError('Choose the subcategory for this upload.');
      return null;
    }
    return csvProducts.map((product) => ({
      ...product,
      category: category.name,
      categorySlug: category.slug,
      subcategory: subcategory.name,
      subcategorySlug: subcategory.slug,
    }));
  };

  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (!file) { setImagePreview(imageUrl); return; }
    if (file.size > 12 * 1024 * 1024) {
      setImageFile(null); setImagePreview(''); setNotice('Choose an image under 12 MB.'); return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImageFile(null); setImagePreview(''); setNotice('Choose a PNG, JPG, or WebP image.'); return;
    }
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
    setNotice('');
  };

  const selectCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const requestVersion = ++fileReadVersion.current;
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    setCsvFile(file); setPreview(null); setCsvError(''); setNotice(''); setCsvProducts([]);
    setReadingFile(false);
    if (!file) return;
    const isPdf = /\.pdf$/i.test(file.name);
    if (!isPdf && !/\.csv$/i.test(file.name)) { setCsvError('Choose a CSV or PDF file.'); return; }
    if (file.size > 30 * 1024 * 1024) { setCsvError('Keep the file under 30 MB.'); return; }
    setReadingFile(true);
    try {
      const rows = isPdf
        ? await (await import('@/lib/productFeedPdf')).readProductPdf(file)
        : csvRows(await file.text());
      const parsed = productsFromTable(rows, isPdf ? 'PDF' : 'CSV');
      if (parsed.length > 5000) throw new Error('Upload no more than 5,000 products at a time.');
      if (requestVersion === fileReadVersion.current) setCsvProducts(parsed);
    } catch (error) {
      if (requestVersion === fileReadVersion.current) setCsvError(error instanceof Error ? error.message : 'Could not read this file.');
    } finally {
      if (requestVersion === fileReadVersion.current) setReadingFile(false);
    }
  };

  const validateCsv = async () => {
    const items = prepareCsvProducts();
    if (!items) return;
    setWorking(true); setCsvError(''); setNotice('');
    try {
      const payload = await sendProducts('preview', items, csvFile?.name || 'product-feed.csv');
      setPreview(payload as ImportPreview);
      if (payload.success) {
        const localStorageNote = payload.storageMode === 'local-file' ? ' They will be saved in the local Storehouse catalog while PostgreSQL is offline.' : '';
        setNotice(`${payload.validRows} product${payload.validRows === 1 ? '' : 's'} passed validation.${localStorageNote}`);
      }
    } catch (error) { setCsvError(error instanceof Error ? error.message : 'Could not validate this file.'); }
    finally { setWorking(false); }
  };

  const importCsv = async () => {
    const items = prepareCsvProducts();
    if (!items) return;
    setWorking(true); setCsvError(''); setNotice('');
    try {
      const payload = await sendProducts('commit', items, csvFile?.name || 'product-feed.csv');
      const localStorageNote = payload.storageMode === 'local-file' ? ' Saved in the local Storehouse catalog while PostgreSQL is offline.' : '';
      setNotice(`Successfully added ${payload.importedCount} products to ${destinationLabel}.${localStorageNote}`);
      notify?.(`Imported ${payload.importedCount} products to ${destinationLabel}${payload.storageMode === 'local-file' ? ' local catalog' : ''}.`);
      setCsvFile(null); setCsvProducts([]); setPreview(null);
    } catch (error) { setCsvError(error instanceof Error ? error.message : 'The product import failed.'); }
    finally { setWorking(false); }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'product-feed-template.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10233d] via-[#173759] to-[#1d4963] px-6 py-7 text-white shadow-lg sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-14 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-100"><PackagePlus className="h-3.5 w-3.5" /> Product operations</span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Product Feed</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Add a product by hand or import a complete catalog. Choose exactly where each feed should be published.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-xs text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> SKU and title checks included</div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Choose a destination</h2>
          <p className="mt-1 text-xs text-slate-500">Products are saved to the catalog you select below.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DESTINATION_OPTIONS.map(({ id, Icon, detail }) => {
            const active = destination === id;
            return <button key={id} type="button" disabled={working || savingSingle} aria-pressed={active} onClick={() => changeDestination(id)} className={`group flex items-start gap-3.5 rounded-2xl border p-4 text-left transition ${active ? 'border-[#173759] bg-[#f5f8fb] ring-2 ring-[#173759]/10' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#173759] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">{PRODUCT_FEED_DESTINATION_NAMES[id]}{active && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span>
            </button>;
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Tag className="h-5 w-5" /></span>
            <div><h2 className="text-sm font-bold text-slate-900">Manage categories</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Changes apply to Main Store, Seller Storehouse, and Consigned Products.</p></div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button type="button" onClick={() => void deleteAllCategories()} disabled={!managedCategories.length || Boolean(deletingCategoryKey)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-[11px] font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">{deletingCategoryKey === 'all-categories' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete All Categories</button>
            <button type="button" onClick={refreshDestination} disabled={refreshingCategories} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshingCategories ? 'animate-spin' : ''}`} />Refresh categories</button>
            <button type="button" onClick={() => openCategoryManager('category')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add category</button>
            <button type="button" disabled={!managedCategories.length} onClick={() => openCategoryManager('subcategory')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"><Plus className="h-3.5 w-3.5" />Add subcategory</button>
          </div>
        </div>

        {categoryManagerKind && <form onSubmit={saveCategory} className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:items-end">
          {categoryManagerKind === 'subcategory' && <label className="text-[11px] font-semibold text-slate-700">Parent category
            <TaxonomyPicker key={destination} items={managedCategories} value={categoryParentSlug} onChange={setCategoryParentSlug} label="parent categories" placeholder="Select parent category" />
          </label>}
          <label className={`text-[11px] font-semibold text-slate-700 ${categoryManagerKind === 'subcategory' ? 'sm:col-span-1' : 'sm:col-span-2'}`}>{categoryManagerKind === 'category' ? 'Category name' : 'Subcategories (separate each name with a comma)'}
            {categoryManagerKind === 'category' ? (
              <input autoFocus required minLength={2} maxLength={60} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Travel Accessories" className="mt-1.5 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-normal text-slate-800 outline-none focus:border-[#173759]" />
            ) : (
              <textarea autoFocus required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Cabin Suitcases, Travel Backpacks, Packing Cubes" rows={3} className="mt-1.5 block w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal text-slate-800 outline-none focus:border-[#173759]" />
            )}
          </label>
          {categoryManagerKind === 'subcategory' && <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-slate-500"><span>{parsedSubcategoryNames.length} subcategor{parsedSubcategoryNames.length === 1 ? 'y' : 'ies'} detected</span>{parsedSubcategoryNames.length > 50 && <span className="text-rose-600">Maximum 50 at a time</span>}</div>
            {parsedSubcategoryNames.length > 0 && <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-auto rounded-lg border border-slate-200 bg-white p-2">
              {parsedSubcategoryNames.map((name, index) => <span key={`${name}-${index}`} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">{index + 1}. {name}</span>)}
            </div>}
            {duplicateSubcategoryNames && <p className="mt-1.5 text-[10px] font-semibold text-rose-600">This list repeats a subcategory name. Remove duplicates before saving.</p>}
          </div>}
          <div className="flex items-center gap-2 sm:col-span-2">
            <button type="submit" disabled={savingCategory || (categoryManagerKind === 'subcategory' && (!categoryParentSlug || parsedSubcategoryNames.length === 0 || parsedSubcategoryNames.length > 50 || duplicateSubcategoryNames))} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#173759] px-3.5 text-[11px] font-bold text-white hover:bg-[#102943] disabled:opacity-50">{savingCategory ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Save</button>
            <button type="button" onClick={() => { setCategoryManagerKind(null); setCategoryError(''); }} aria-label="Cancel category creation" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          {categoryError && <div role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] leading-5 text-rose-800 sm:col-span-full"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><div className="min-w-0 flex-1"><p className="font-semibold">{categoryError}</p></div></div>}
        </form>}
        {categoryNotice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">{categoryNotice}</p>}
        {categoryLoadError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800">{categoryLoadError} Use “Refresh categories” to try again.</p>}
        {!categoryManagerKind && categoryError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800">{categoryError}</p>}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2.5"><p className="text-[11px] font-bold text-slate-700">Catalog categories</p><span className="text-[10px] font-medium text-slate-500">{managedCategories.length} categories</span></div>
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {managedCategories.map((category) => <details key={category.slug} className="group px-3 py-2.5">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1 truncate">{category.name}<span className="ml-2 text-[10px] font-semibold text-[#173759]">{(categoryProductCounts[category.slug] || 0).toLocaleString()} products</span><span className="ml-2 text-[10px] font-normal text-slate-500">{category.subcategories.length} subcategories</span></span>
                <button type="button" disabled={Boolean(deletingCategoryKey)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void deleteManagedCategory('category', category); }} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-rose-200 px-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-3 w-3" />{deletingCategoryKey === `category:${category.slug}:` ? <LoaderCircle className="h-3 w-3 animate-spin" /> : 'Delete category'}</button>
              </summary>
              {category.subcategories.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
              {customOptionsLast(category.subcategories, (subcategory) => Boolean(category.customSubcategorySlugs?.includes(subcategory.slug))).map((subcategory) => <span key={subcategory.slug} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white pl-2.5 pr-1 py-1 text-[10px] text-slate-600">
                  <span className="truncate">{subcategory.name}</span>
                  <button type="button" aria-label={`Delete subcategory ${subcategory.name}`} title={`Delete subcategory ${subcategory.name}`} disabled={Boolean(deletingCategoryKey)} onClick={() => void deleteManagedCategory('subcategory', category, subcategory)} className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50 disabled:opacity-50">{deletingCategoryKey === `subcategory:${category.slug}:${subcategory.slug}` ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}</button>
                </span>)}
              </div>}
            </details>)}
            {!managedCategories.length && <p className="px-3 py-5 text-center text-[11px] text-slate-500">No categories are available.</p>}
          </div>
        </div>
        <section aria-label="Product counts by category" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="text-[11px] font-bold text-slate-800">Products by category</h3><p className="mt-0.5 text-[10px] text-slate-500">Counts include categorized products across Main Store, seller accounts, Storehouse, and Consign.</p></div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">{Object.values(categoryProductCounts).reduce((sum, count) => sum + count, 0).toLocaleString()} products total</span>
          </div>
          <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {managedCategories.map((category) => <div key={category.slug} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px]">
              <span className="truncate font-medium text-slate-700">{category.name}</span>
              <span className="shrink-0 font-bold text-[#173759]">{(categoryProductCounts[category.slug] || 0).toLocaleString()}</span>
            </div>)}
            {!managedCategories.length && <p className="col-span-full px-2 py-4 text-center text-[10px] text-slate-500">No category totals to show.</p>}
          </div>
          {categoryProductCountsIncomplete && <p role="status" className="mt-2 text-[10px] font-medium text-amber-700">Some catalog data could not be reached, so these totals may be incomplete.</p>}
        </section>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="text-sm font-bold text-slate-900">Add products</h2><p className="mt-1 text-xs text-slate-500">Enter one product or upload a CSV or PDF product table.</p></div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button type="button" disabled={working || savingSingle} onClick={() => { setMode('single'); setNotice(''); setPreview(null); }} className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${mode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Single product</button>
            <button type="button" disabled={working || savingSingle} onClick={() => { setMode('csv'); setNotice(''); setPreview(null); }} className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${mode === 'csv' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>CSV / PDF upload</button>
          </div>
        </div>

        {mode === 'single' ? (
          <form onSubmit={saveSingleProduct} className="space-y-5 p-5 sm:p-6">
            {destination === 'all-three' && <p className="text-xs text-slate-600">The selected category and subcategory apply to all three destinations.</p>}
            {destination === 'consign' && <p className="text-xs text-slate-600">Choose a category from the Main Store category list for this Consign product.</p>}
            {destination === 'consign' && categoryLoadError && <p role="alert" className="text-xs text-rose-700">{categoryLoadError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Category <span className="text-rose-500">*</span>
                <TaxonomyPicker key={destination} items={categories} value={categorySlug} onChange={(value) => { setCategorySlug(value); setSubcategorySlug(''); }} label="categories" placeholder="Select category" />
              </label>
              <label className="text-xs font-semibold text-slate-700">Subcategory <span className="text-rose-500">*</span>
                <TaxonomyPicker key={`${destination}-${categorySlug}`} items={subcategories} value={subcategorySlug} onChange={setSubcategorySlug} label="subcategories" placeholder="Select subcategory" disabled={!selectedCategory} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Product title <span className="text-rose-500">*</span>
                <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Lightweight Cabin Trolley Bag" className="mt-1.5 block h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-800 outline-none focus:border-[#173759] focus:ring-2 focus:ring-[#173759]/10" />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Description <span className="text-rose-500">*</span>
                <textarea required minLength={15} maxLength={3000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the product clearly for your catalog." className="mt-1.5 block w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal leading-6 text-slate-800 outline-none focus:border-[#173759] focus:ring-2 focus:ring-[#173759]/10" />
              </label>
              <label className="text-xs font-semibold text-slate-700">Price (USD) <span className="text-rose-500">*</span>
                <div className="mt-1.5 flex h-11 items-center rounded-xl border border-slate-200 focus-within:border-[#173759] focus-within:ring-2 focus-within:ring-[#173759]/10"><span className="border-r border-slate-200 px-3 text-xs text-slate-400">USD</span><input required type="number" min="0.01" step="0.01" value={priceUsd} onChange={(event) => setPriceUsd(event.target.value)} placeholder="0.00" className="h-full min-w-0 flex-1 rounded-r-xl px-3 text-sm font-normal text-slate-800 outline-none" /></div>
              </label>
              <label className="text-xs font-semibold text-slate-700">SKU <span className="text-rose-500">*</span>
                <input required maxLength={64} value={sku} onChange={(event) => setSku(event.target.value)} placeholder="e.g. TRV-CABIN-001" className="mt-1.5 block h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-800 outline-none focus:border-[#173759] focus:ring-2 focus:ring-[#173759]/10" />
              </label>
              <label className="text-xs font-semibold text-slate-700">Brand <span className="font-normal text-slate-400">(optional)</span>
                <input maxLength={120} value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand name" className="mt-1.5 block h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-800 outline-none focus:border-[#173759] focus:ring-2 focus:ring-[#173759]/10" />
              </label>
              <label className="text-xs font-semibold text-slate-700">Stock quantity
                <input required type="number" min="0" step="1" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} className="mt-1.5 block h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-800 outline-none focus:border-[#173759] focus:ring-2 focus:ring-[#173759]/10" />
              </label>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:p-5">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Product image <span className="text-rose-500">*</span></h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Upload PNG, JPG or WebP up to 12 MB, or use a secure HTTPS image URL.</p>
                <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 sm:w-fit sm:min-w-52"><ImagePlus className="h-4 w-4" />{imageFile ? imageFile.name : 'Choose image file'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectImage(event)} className="sr-only" /></label>
                <div className="my-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />or use an image URL<span className="h-px flex-1 bg-slate-200" /></div>
                <label className="relative block"><Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="url" value={imageUrl} disabled={Boolean(imageFile)} onChange={(event) => { setImageUrl(event.target.value); setImagePreview(event.target.value); }} placeholder="https://example.com/product-image.jpg" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-normal text-slate-800 outline-none focus:border-[#173759] disabled:bg-slate-100" /></label>
                {imageFile && <button type="button" onClick={() => { setImageFile(null); setImagePreview(imageUrl); }} className="mt-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700">Remove selected image</button>}
              </div>
              <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                {imagePreview ? <img src={imagePreview} alt="Product preview" className="max-h-40 w-full object-contain" onError={() => setImagePreview('')} /> : <div className="text-center text-slate-300"><ImagePlus className="mx-auto h-7 w-7" /><span className="mt-2 block text-[10px] font-medium">Image preview</span></div>}
              </div>
            </div>

            {notice && <div className={`flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs ${notice.startsWith('Added') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-400">All prices are in USD. Products with duplicate titles or SKUs are blocked.</p>
              <button disabled={savingSingle || !selectedCategory || !subcategories.some((item) => item.slug === subcategorySlug)} type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#173759] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#102943] disabled:cursor-not-allowed disabled:opacity-50">{savingSingle ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}Add product <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </form>
        ) : (
          <fieldset disabled={working} className="min-w-0 space-y-5 p-5 sm:p-6">
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div>
                <h3 className="text-xs font-bold text-slate-800">File upload destination</h3>
                <p className="mt-1 text-[11px] text-slate-500">Choose where this file should be saved. This matches the destination selector above.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {DESTINATION_OPTIONS.map(({ id, Icon, detail }) => (
                  <button key={id} type="button" onClick={() => changeDestination(id)} aria-pressed={destination === id} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${destination === id ? 'border-[#173759] bg-white ring-2 ring-[#173759]/10' : 'border-slate-200 bg-white/70 hover:border-slate-300'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${destination === id ? 'bg-[#173759] text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-800">{PRODUCT_FEED_DESTINATION_NAMES[id]}</span><span className="mt-0.5 block text-[10px] text-slate-500">{detail}</span></span>
                    {destination === id && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs font-bold text-slate-800">Categories for this upload</h3>
                <p className="mt-1 text-[11px] text-slate-500">Assign all rows to one category or use the category columns in the file.</p>
                {destination === 'consign' && <p className="mt-1 text-[11px] text-slate-500">Consigned Products uses the Main Store category list.</p>}
                {destination === 'consign' && categoryLoadError && <p role="alert" className="mt-2 text-xs text-rose-700">{categoryLoadError}</p>}
                <div className="mt-3 inline-flex flex-wrap rounded-lg bg-slate-200/70 p-1">
                  <button type="button" onClick={() => { setCsvCategoryMode('selected'); setPreview(null); setCsvError(''); }} aria-pressed={csvCategoryMode === 'selected'} className={`rounded-md px-3 py-2 text-[10px] font-bold transition ${csvCategoryMode === 'selected' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Choose one category</button>
                  <button type="button" onClick={() => { setCsvCategoryMode('columns'); setPreview(null); setCsvError(''); }} aria-pressed={csvCategoryMode === 'columns'} className={`rounded-md px-3 py-2 text-[10px] font-bold transition ${csvCategoryMode === 'columns' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Use file category columns</button>
                </div>
                {csvCategoryMode === 'selected' ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-[11px] font-semibold text-slate-700">Main category <span className="text-rose-500">*</span>
                      <TaxonomyPicker key={destination} items={categories} value={csvCategorySlug} onChange={(value) => { setCsvCategorySlug(value); setCsvSubcategorySlug(''); setPreview(null); setCsvError(''); }} label="main categories" placeholder="Select main category" />
                    </label>
                    <label className="text-[11px] font-semibold text-slate-700">Subcategory <span className="text-rose-500">*</span>
                      <TaxonomyPicker key={`${destination}-${csvCategorySlug}`} items={csvSubcategories} value={csvSubcategorySlug} onChange={(value) => { setCsvSubcategorySlug(value); setPreview(null); setCsvError(''); }} label="subcategories" placeholder="Select subcategory" disabled={!selectedCsvCategory} />
                    </label>
                    {selectedCsvCategory && csvSubcategorySlug && <p className="text-[10px] text-slate-500 sm:col-span-2">All rows will use <strong>{selectedCsvCategory.name}</strong> › <strong>{csvSubcategories.find((item) => item.slug === csvSubcategorySlug)?.name}</strong> in {destination === 'all-three' ? 'all three destinations' : destinationLabel}.</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-[10px] leading-5 text-slate-500">{destination === 'all-three' ? 'Each row needs a Main Store category and subcategory. The same pair will be used in all three destinations.' : 'Each row needs a category and subcategory from the selected catalog.'}</p>
                )}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-7 text-center transition hover:border-slate-300 hover:bg-slate-50">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#173759] shadow-sm"><FileSpreadsheet className="h-5 w-5" /></span>
                <span className="mt-3 text-sm font-bold text-slate-800">{csvFile ? csvFile.name : 'Choose your product CSV or PDF'}</span>
                <span className="mt-1 text-xs text-slate-500" aria-live="polite">{readingFile ? 'Reading the product file…' : 'Up to 30 MB and 5,000 products per upload'}</span>
                <input type="file" accept=".csv,.pdf,text/csv,application/pdf" onChange={(event) => void selectCsv(event)} className="sr-only" />
              </label>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-800">Product file format</p>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Required columns are title, description, price_usd, image_url, and SKU. For PDF, use a selectable table with one product per line and the same headers on each page.</p>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">Optional: brand and stock_quantity. Images use HTTPS URLs or local /images and /uploads paths.</p>
                <button type="button" onClick={downloadTemplate} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><Download className="h-3.5 w-3.5" />Download CSV template</button>
              </div>
            </div>

            {csvProducts.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><FileSpreadsheet className="h-4 w-4" /></span><div><p className="text-xs font-bold text-slate-800">{csvProducts.length.toLocaleString()} products found</p><p className="text-[10px] text-slate-500">Ready to check required fields and duplicates</p></div></div><button type="button" disabled={working || (csvCategoryMode === 'selected' && (!selectedCsvCategory || !csvSubcategories.some((item) => item.slug === csvSubcategorySlug)))} onClick={() => void validateCsv()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-[11px] font-bold text-white hover:bg-slate-700 disabled:opacity-50">{working ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Validate file</button></div>}

            {csvProducts.length > 0 && <ProductFeedFilePreview products={csvProducts} />}

            {preview && <div className={`rounded-xl border p-4 ${preview.success ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${preview.success ? 'text-emerald-700' : 'text-amber-700'}`} /><p className="text-xs font-bold text-slate-800">{preview.validRows} of {preview.totalRows} rows passed validation</p></div>{preview.success && <button type="button" disabled={working} onClick={() => void importCsv()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{working ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}Import {preview.validRows} products</button>}</div>
              {preview.errors.length > 0 && <div className="mt-3 max-h-44 space-y-1 overflow-auto border-t border-amber-200/80 pt-3">{preview.errors.map((error, index) => <p key={`${error.row}-${index}`} className="text-[11px] leading-5 text-rose-700">Row {error.row}: {error.message}</p>)}</div>}
            </div>}

            {(csvError || notice) && <div className={`flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs ${notice.startsWith('Successfully') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{csvError || notice}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-400"><span>Uploads are checked for valid categories, required fields, and duplicate SKUs/titles.</span><span className="font-semibold text-slate-500">Destination: {destinationLabel}</span></div>
          </fieldset>
        )}
      </section>
    </div>
  );
}
