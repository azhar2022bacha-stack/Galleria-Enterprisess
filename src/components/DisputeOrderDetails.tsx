import React from 'react';

export interface DisputeOrderProduct {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export function DisputeOrderDetails({
  sellerName,
  sellerEmail,
  products,
}: {
  sellerName?: string;
  sellerEmail?: string;
  products?: DisputeOrderProduct[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <h3 className="mb-3 text-xs font-semibold text-gray-800">Seller and order details</h3>
      <dl className="grid gap-x-5 gap-y-2 text-xs sm:grid-cols-2">
        <div><dt className="text-gray-500">Seller name</dt><dd className="mt-0.5 break-words font-medium text-gray-800">{sellerName || 'Not provided'}</dd></div>
        <div><dt className="text-gray-500">Seller email</dt><dd className="mt-0.5 break-all font-medium text-gray-800">{sellerEmail || 'Not provided'}</dd></div>
      </dl>
      <div className="mt-4 border-t border-gray-100 pt-3">
        <h4 className="mb-2 text-xs font-semibold text-gray-700">Products and prices</h4>
        {products?.length ? (
          <ul className="space-y-2">
            {products.map((product, index) => (
              <li key={product.id || `${product.name}-${index}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs">
                <span className="min-w-0 flex-1 break-words text-gray-700">{product.name} <span className="text-gray-500">· {product.quantity} × ${Number(product.price || 0).toFixed(2)}</span></span>
                <span className="font-semibold text-gray-900">${Number(product.lineTotal || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-gray-500">Product details are not available for this order.</p>}
      </div>
    </div>
  );
}
