'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export const ProductImageWithFallback: React.FC<ProductImageWithFallbackProps> = ({
  src,
  alt,
  className = 'h-full w-full object-contain mix-blend-multiply',
  containerClassName = 'relative w-full h-full flex items-center justify-center',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure relative positioning is always active so skeleton loader never escapes to cover the viewport
  const safeContainerClass = containerClassName.includes('relative')
    ? containerClassName
    : `relative ${containerClassName}`;

  return (
    <div className={safeContainerClass}>
      {/* Loading Skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200/60 to-gray-100 animate-pulse flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-300 animate-pulse" />
        </div>
      )}

      {/* Error / Fallback State */}
      {hasError ? (
        <div className="flex flex-col items-center justify-center p-4 text-center text-gray-400">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <span className="text-[11px] font-medium text-gray-500">Commercial Catalog Item</span>
          <span className="text-[9px] text-gray-400 mt-0.5">Verified Commercial Item</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`${className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};
