'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpDown, CheckCircle2, Clock3, MessageSquare, Search, Send, Sparkles, X } from 'lucide-react';
import type { ProductQuery } from '@/lib/sellerOrders';

interface QuerySeller {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  products?: any[];
}

interface QueryOrder {
  id: string;
  orderNumber: string;
  shopName: string;
  merchantEmail?: string;
  itemTitle: string;
  products?: { id?: string; title?: string; name?: string; image?: string; imageUrl?: string }[];
}

interface ProductChoice {
  id: string;
  name: string;
  image?: string;
}

interface AdminConsignProductQueriesPanelProps {
  merchants: QuerySeller[];
  orders: QueryOrder[];
  notify?: (message: string) => void;
}

const QUERY_TOPICS = [
  'Product quality',
  'Materials or ingredients',
  'Product specifications',
  'Stock or availability',
  'Packaging',
  'Order or dispatch',
  'Other product question',
];

const QUERY_PROMPTS = [
  {
    label: 'Quality check',
    topic: 'Product quality',
    subject: 'Please confirm the product quality',
    question: 'Could you share the current condition and quality of this product, including any known issues the buyer should know about?',
  },
  {
    label: 'Materials or ingredients',
    topic: 'Materials or ingredients',
    subject: 'Please confirm the product materials or ingredients',
    question: 'Please confirm the materials or ingredients used in this product and share any relevant details or certifications.',
  },
  {
    label: 'Specifications',
    topic: 'Product specifications',
    subject: 'Please confirm the product specifications',
    question: 'Please confirm the product dimensions, key specifications, and which accessories or items are included.',
  },
  {
    label: 'Stock check',
    topic: 'Stock or availability',
    subject: 'Please confirm current stock availability',
    question: 'Please confirm how many units are currently available and provide an estimated restock date if stock is limited.',
  },
  {
    label: 'Packaging',
    topic: 'Packaging',
    subject: 'Please confirm the product packaging',
    question: 'Please describe the packaging and confirm whether the product includes its original retail packaging.',
  },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
};

function normalizeProduct(product: any, fallbackId: string): ProductChoice | null {
  const name = String(product?.name || product?.title || product?.productName || '').trim();
  if (!name) return null;
  return {
    id: String(product?.id || product?._id || product?.sku || fallbackId || name).trim(),
    name,
    image: String(product?.imageUrl || product?.image || '').trim() || undefined,
  };
}

export function AdminConsignProductQueriesPanel({ merchants, orders, notify }: AdminConsignProductQueriesPanelProps) {
  const [selectedSellerEmail, setSelectedSellerEmail] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [topic, setTopic] = useState(QUERY_TOPICS[0]);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [queries, setQueries] = useState<ProductQuery[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Open' | 'Replied'>('All');
  const [search, setSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'needs_reply'>('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');

  const sellersWithEmail = useMemo(
    () => merchants.filter((merchant) => Boolean(merchant.email?.trim())),
    [merchants]
  );
  const selectedSeller =
    sellersWithEmail.find((merchant) => merchant.email?.trim().toLowerCase() === selectedSellerEmail.toLowerCase()) ||
    sellersWithEmail[0];

  useEffect(() => {
    if (!selectedSellerEmail && sellersWithEmail[0]?.email) {
      setSelectedSellerEmail(sellersWithEmail[0].email.trim());
    }
  }, [selectedSellerEmail, sellersWithEmail]);

  const sellerOrders = useMemo(() => {
    if (!selectedSeller) return [];
    const sellerEmail = String(selectedSeller.email || '').trim().toLowerCase();
    const sellerName = selectedSeller.name.trim().toLowerCase();
    return orders.filter((order) =>
      (order.merchantEmail && order.merchantEmail.trim().toLowerCase() === sellerEmail) ||
      (!order.merchantEmail && order.shopName.trim().toLowerCase() === sellerName)
    );
  }, [orders, selectedSeller]);

  const productChoices = useMemo(() => {
    if (!selectedSeller) return [];
    const choices: ProductChoice[] = [];
    (Array.isArray(selectedSeller.products) ? selectedSeller.products : []).forEach((product, index) => {
      const normalized = normalizeProduct(product, `seller-product-${index}`);
      if (normalized) choices.push(normalized);
    });
    sellerOrders.forEach((order) => {
      const products = Array.isArray(order.products) && order.products.length > 0
        ? order.products
        : [{ id: order.id, title: order.itemTitle }];
      products.forEach((product, index) => {
        const normalized = normalizeProduct(product, `${order.id}-product-${index}`);
        if (normalized) choices.push(normalized);
      });
    });
    const unique = new Map<string, ProductChoice>();
    choices.forEach((product) => {
      const key = product.id.toLowerCase() || product.name.toLowerCase();
      if (!unique.has(key)) unique.set(key, product);
    });
    return Array.from(unique.values());
  }, [selectedSeller, sellerOrders]);

  const selectedProduct = productChoices.find((product) => product.id === selectedProductId);
  const selectedOrder = sellerOrders.find((order) => order.id === selectedOrderId);

  useEffect(() => {
    if (!productChoices.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(productChoices[0]?.id || '__custom');
    }
  }, [productChoices, selectedProductId]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/consign/product-queries?all=true', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data.queries)) {
          throw new Error(data?.error || 'Unable to load product queries.');
        }
        if (active) {
          setQueries(data.queries);
          setLoadError('');
          setIsLoading(false);
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load product queries.');
          setIsLoading(false);
        }
      }
    };
    void refresh();
    const intervalId = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const counts = useMemo(() => ({
    all: queries.length,
    open: queries.filter((query) => query.status === 'Open').length,
    replied: queries.filter((query) => query.status === 'Replied').length,
  }), [queries]);

  const sellerOptions = useMemo(() => {
    const sellers = new Map<string, { email: string; name: string }>();
    queries.forEach((query) => {
      const email = String(query.sellerEmail || '').trim();
      if (!email) return;
      const key = email.toLowerCase();
      if (!sellers.has(key)) sellers.set(key, { email, name: query.sellerName || email });
    });
    return Array.from(sellers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [queries]);

  const topicOptions = useMemo(
    () => Array.from(new Set(queries.map((query) => query.topic).filter((value): value is string => Boolean(value)))).sort(),
    [queries]
  );

  const filteredQueries = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const matches = queries.filter((query) => {
      if (activeFilter !== 'All' && query.status !== activeFilter) return false;
      if (sellerFilter !== 'all' && query.sellerEmail?.toLowerCase() !== sellerFilter) return false;
      if (topicFilter !== 'all' && query.topic !== topicFilter) return false;
      if (!searchTerm) return true;
      return [query.sellerName, query.sellerEmail, query.productName, query.orderCode, query.topic, query.subject, query.question, query.reply]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);
    });
    return matches.sort((left, right) => {
      const leftDate = Date.parse(left.createdAt) || 0;
      const rightDate = Date.parse(right.createdAt) || 0;
      if (sortMode === 'needs_reply' && left.status !== right.status) return left.status === 'Open' ? -1 : 1;
      return sortMode === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [activeFilter, queries, search, sellerFilter, sortMode, topicFilter]);

  const clearFilters = () => {
    setActiveFilter('All');
    setSearch('');
    setSellerFilter('all');
    setTopicFilter('all');
    setSortMode('newest');
  };

  const applyPrompt = (prompt: (typeof QUERY_PROMPTS)[number]) => {
    setTopic(prompt.topic);
    setSubject(prompt.subject);
    setQuestion(prompt.question);
    setFormError('');
  };

  const handleSellerChange = (email: string) => {
    setSelectedSellerEmail(email);
    setSelectedProductId('');
    setCustomProductName('');
    setSelectedOrderId('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSeller?.email) {
      setFormError('Choose a seller account before sending a query.');
      return;
    }
    const productName = selectedProductId === '__custom' ? customProductName.trim() : selectedProduct?.name || '';
    if (!productName || !subject.trim() || !question.trim()) {
      setFormError('Choose or enter a product, add a subject, and write your question.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const response = await fetch('/api/consign/product-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerEmail: selectedSeller.email,
          sellerName: selectedSeller.name,
          productId: selectedProduct?.id || '',
          productName,
          productImage: selectedProduct?.image,
          ...(selectedOrder ? { orderId: selectedOrder.id, orderCode: selectedOrder.orderNumber } : {}),
          topic,
          subject: subject.trim(),
          question: question.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data.query) {
        throw new Error(data?.error || 'Unable to send the product query.');
      }
      setQueries((current) => [data.query, ...current.filter((query) => query.id !== data.query.id)]);
      setSubject('');
      setQuestion('');
      notify?.(`Product query sent to ${selectedSeller.name}.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to send the product query.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Product Queries</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">Ask a seller about product quality, specifications, stock, packaging, or a Consign order.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:min-w-[390px]">
            <button type="button" aria-pressed={activeFilter === 'All'} onClick={() => setActiveFilter('All')} className={'rounded-xl border px-3 py-2 text-left transition-colors ' + (activeFilter === 'All' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
              <span className="block text-[10px] font-medium text-gray-500">Total queries</span>
              <span className="mt-0.5 block text-lg font-bold leading-5 text-gray-900">{counts.all}</span>
            </button>
            <button type="button" aria-pressed={activeFilter === 'Open'} onClick={() => setActiveFilter('Open')} className={'rounded-xl border px-3 py-2 text-left transition-colors ' + (activeFilter === 'Open' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
              <span className="block text-[10px] font-medium text-gray-500">Awaiting seller</span>
              <span className="mt-0.5 block text-lg font-bold leading-5 text-amber-700">{counts.open}</span>
            </button>
            <button type="button" aria-pressed={activeFilter === 'Replied'} onClick={() => setActiveFilter('Replied')} className={'rounded-xl border px-3 py-2 text-left transition-colors ' + (activeFilter === 'Replied' ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
              <span className="block text-[10px] font-medium text-gray-500">Seller replied</span>
              <span className="mt-0.5 block text-lg font-bold leading-5 text-emerald-700">{counts.replied}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Ask a seller</h2>
            <span className="text-[11px] text-gray-500">{counts.all} total queries</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-medium text-gray-700">
              Seller account <span className="text-red-500">*</span>
              <select
                value={selectedSeller?.email || ''}
                onChange={(event) => handleSellerChange(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="" disabled>Select a seller</option>
                {sellersWithEmail.map((seller) => (
                  <option key={seller.id} value={seller.email}>{seller.name}{seller.email ? ` · ${seller.email}` : ''}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-gray-700">
              Product <span className="text-red-500">*</span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              >
                {productChoices.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                <option value="__custom">Other / enter product name</option>
              </select>
            </label>

            <label className="text-xs font-medium text-gray-700">
              Topic
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {QUERY_TOPICS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>

            <label className="text-xs font-medium text-gray-700">
              Related Consign order <span className="font-normal text-gray-400">(optional)</span>
              <select
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">No order linked</option>
                {sellerOrders.map((order) => <option key={order.id} value={order.id}>#{order.orderNumber} · {order.itemTitle}</option>)}
              </select>
            </label>
          </div>

          {selectedProductId === '__custom' && (
            <label className="mt-3 block text-xs font-medium text-gray-700">
              Product name <span className="text-red-500">*</span>
              <input
                value={customProductName}
                onChange={(event) => setCustomProductName(event.target.value)}
                maxLength={180}
                placeholder="Enter the product you want to ask about"
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>
          )}

          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.7fr)]">
            <label className="text-xs font-medium text-gray-700">
              Subject <span className="text-red-500">*</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={140}
                placeholder="e.g. Confirm product material and quality"
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>
            <label className="text-xs font-medium text-gray-700">
              Your question <span className="text-red-500">*</span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={3000}
                rows={3}
                placeholder="Write the product question or details you need the seller to confirm..."
                className="mt-1 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
              <span className="mt-1 block text-right text-[10px] font-normal text-gray-400">{question.length}/3000</span>
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-blue-100 bg-white/80 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Start with a quick question
              <span className="font-normal text-gray-400">(click to fill the subject and message)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUERY_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => applyPrompt(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {formError && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-gray-500">The seller will see this in Seller Account → Product Queries and can reply there.</p>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSeller?.email}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Sending…' : 'Send query to seller'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-3 border-b border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Query history</h2>
              <p className="mt-0.5 text-xs text-gray-500">Search and filter seller questions. Replies refresh automatically.</p>
            </div>
            <p className="text-xs font-medium text-gray-500">Showing <span className="text-gray-900">{filteredQueries.length}</span> of <span className="text-gray-900">{counts.all}</span> queries</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(165px,1fr)_auto]">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-400 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50">
              <Search className="h-4 w-4 shrink-0" />
              <input aria-label="Search product queries" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search seller, product, order, message…" className="min-w-0 flex-1 text-xs text-gray-800 outline-none placeholder:text-gray-400" />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-700"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <label className="relative flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-blue-300">
              <span className="sr-only">Filter by seller</span>
              <select value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)} className="w-full bg-transparent pr-4 text-xs text-gray-700 outline-none">
                <option value="all">All sellers</option>
                {sellerOptions.map((seller) => <option key={seller.email} value={seller.email.toLowerCase()}>{seller.name}</option>)}
              </select>
            </label>
            <label className="relative flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-blue-300">
              <span className="sr-only">Filter by topic</span>
              <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="w-full bg-transparent pr-4 text-xs text-gray-700 outline-none">
                <option value="all">All topics</option>
                {topicOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-blue-300">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
              <span className="sr-only">Sort product queries</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)} className="w-full bg-transparent text-xs text-gray-700 outline-none">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="needs_reply">Needs reply first</option>
              </select>
            </label>
            <button type="button" onClick={clearFilters} className="h-10 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
              Clear filters
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Open', 'Replied'] as const).map((filter) => {
              const count = filter === 'All' ? counts.all : filter === 'Open' ? counts.open : counts.replied;
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                  className={'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ' + (activeFilter === filter ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50')}
                >
                  {filter === 'Open' ? 'Awaiting seller' : filter === 'Replied' ? 'Seller replied' : 'All'} <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loadError && <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{loadError}</p>}
        {isLoading ? (
          <div className="py-14 text-center text-sm text-gray-400">Loading product queries…</div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-14 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-600">{counts.all === 0 ? 'No product queries yet.' : 'No queries match these filters.'}</p>
            <p className="mt-1 text-xs text-gray-400">{counts.all === 0 ? 'Questions you send and seller replies will appear here.' : 'Try a different search or clear your filters.'}</p>
            {counts.all > 0 && (
              <button type="button" onClick={clearFilters} className="mt-3 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQueries.map((query) => (
              <article key={query.id} className="p-4 transition-colors hover:bg-gray-50/50 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold uppercase text-blue-700">
                      {(query.sellerName || 'S').trim().charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{query.sellerName || 'Seller'}</p>
                      <p className="truncate text-[11px] text-gray-500">{query.sellerEmail || 'Seller account'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-800">{query.productName}</span>
                        {query.orderCode && <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 font-mono text-[10px] text-gray-600">Order #{query.orderCode}</span>}
                        {query.topic && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">{query.topic}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-[52px] sm:pl-0">
                    <span className={'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ' + (query.status === 'Replied' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                      {query.status === 'Replied' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {query.status === 'Replied' ? 'Seller replied' : 'Awaiting seller'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 ml-1 space-y-3 border-l-2 border-blue-100 pl-4 sm:ml-[19px]">
                  <div className="relative rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
                    <span className="absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 ring-1 ring-blue-200" />
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Admin question · {query.subject || 'Product question'}</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500"><Clock3 className="h-3 w-3" />{formatDate(query.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">{query.question}</p>
                  </div>
                  {query.reply ? (
                    <div className="relative rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                      <span className="absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-200" />
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Seller reply</span>
                        {query.repliedAt && <span className="flex items-center gap-1 text-[10px] text-gray-500"><Clock3 className="h-3 w-3" />{formatDate(query.repliedAt)}</span>}
                      </div>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">{query.reply}</p>
                    </div>
                  ) : (
                    <p className="relative flex items-center gap-1.5 py-1 text-[11px] font-medium text-amber-700">
                      <span className="absolute -left-[22px] h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400 ring-1 ring-amber-200" />
                      <Clock3 className="h-3.5 w-3.5" />Waiting for the seller’s reply
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
