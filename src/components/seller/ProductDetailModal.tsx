'use client';

import React, { useState, useEffect } from 'react';
import { DemoProduct } from '@/types/product';
import {
  X,
  Plus,
  Check,
  Package,
  Layers,
  ShieldCheck,
  Building,
  Sparkles,
  Info,
  DollarSign,
  Boxes,
  Eye,
} from 'lucide-react';
import { ProductImageWithFallback } from './ProductImageWithFallback';
import { TOTAL_DEMO_PRODUCTS } from '@/lib/mock-products';

interface ProductDetailModalProps {
  product: DemoProduct | null;
  isOpen: boolean;
  onClose: () => void;
  isAdded: boolean;
  onAddToShop: (product: DemoProduct) => void;
  onRemoveFromShop?: (id: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  isAdded,
  onAddToShop,
  onRemoveFromShop,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    if (product) {
      setSelectedImage(product.mainImage);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const discountPercent =
    product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 z-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#071324] text-white">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#cca23b] text-[#071324] font-bold text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-sm">
              <Eye className="w-3 h-3" />
              <span>Quick View</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Gallery & Main Image */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 flex items-center justify-center min-h-[320px] sm:min-h-[380px]">
                <ProductImageWithFallback
                  src={selectedImage || product.mainImage}
                  alt={product.title}
                  className="max-h-80 sm:max-h-96 w-full h-full object-contain mix-blend-multiply transition-all drop-shadow-md"
                  containerClassName="relative w-full h-full flex items-center justify-center"
                />
              </div>

              {/* Thumbnail Selector */}
              {product.galleryImages && product.galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                        selectedImage === imgUrl
                          ? 'border-[#071324] ring-2 ring-[#071324]/20 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Demo Notice Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-blue-950">
                    Frontend Demo Product Record
                  </strong>
                  <p className="text-[11px] text-blue-800/80 mt-0.5 leading-relaxed">
                    This item is part of the {TOTAL_DEMO_PRODUCTS.toLocaleString()}-product frontend demonstration catalog. Adding to your shop updates local session state for UI testing.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Product Details, Pricing, & Attributes */}
            <div className="space-y-5 flex flex-col justify-between">
              <div>
                {/* Category & Brand Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                  <span>{product.category}</span>
                  <span>•</span>
                  <span className="text-[#cca23b] font-semibold">{product.subcategory}</span>
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                  {product.title}
                </h2>

                {/* Brand & Condition Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                    Brand: <strong className="text-gray-900">{product.brand}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    {product.condition}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                      product.status === 'In Stock'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {product.status} ({product.stockQuantity} units)
                  </span>
                </div>

                {/* Pricing Block */}
                <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">
                      Wholesale Unit Price
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-2xl font-bold text-gray-900 font-mono">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                {/* Short Description */}
                <p className="text-xs sm:text-sm text-gray-600 mt-4 leading-relaxed">
                  {product.shortDescription}
                </p>

                {/* Technical Specifications Table */}
                <div className="mt-5 space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#cca23b]" />
                    <span>Commercial Specifications</span>
                  </h4>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 text-xs">
                    {Object.entries(product.attributes)
                      .filter(([key]) => !key.toLowerCase().includes('sku'))
                      .map(([key, val]) => (
                      <div
                        key={key}
                        className="grid grid-cols-2 px-3.5 py-2 hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="font-semibold text-gray-600">{key}</span>
                        <span className="text-gray-900 font-medium text-right sm:text-left">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons at bottom of info */}
              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                {isAdded ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onRemoveFromShop && product) {
                        onRemoveFromShop(product.id);
                      }
                    }}
                    className="flex-1 py-3 bg-emerald-50 hover:bg-red-50 border border-emerald-300 hover:border-red-300 text-emerald-700 hover:text-red-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors group/modalBtn"
                    title="Click to remove from My Products"
                  >
                    <Check className="w-4 h-4 text-emerald-600 group-hover/modalBtn:hidden" />
                    <X className="w-4 h-4 hidden group-hover/modalBtn:inline text-red-600" />
                    <span className="group-hover/modalBtn:hidden">Added to My Products Catalog</span>
                    <span className="hidden group-hover/modalBtn:inline">Remove from My Products</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onAddToShop(product);
                    }}
                    className="flex-1 py-3 bg-[#071324] hover:bg-[#11233b] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg border border-[#162740]"
                  >
                    <Plus className="w-4 h-4 text-[#cca23b]" />
                    <span>Add to My Products</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Full Description & Commercial Logistics */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#cca23b]" />
              <span>Full Product & Export Description</span>
            </h4>
            <div className="text-xs sm:text-sm text-gray-600 whitespace-pre-line leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-200/60 font-sans">
              {product.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
