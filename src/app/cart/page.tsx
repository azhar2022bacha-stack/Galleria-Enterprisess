'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-[#fcfbf9] min-h-[70vh] flex items-center justify-center py-16">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center mx-auto mb-5 text-[#0c1b33]">
            <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0c1b33]">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-sm text-gray-500 mt-2 mb-8 leading-relaxed">
            Looks like you haven&apos;t added any items yet. Explore our curated collections to find signature pieces.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#0c1b33] hover:bg-[#162b4e] text-white text-xs sm:text-sm font-semibold tracking-wider rounded uppercase transition-colors shadow-md"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#0c1b33] font-medium">Shopping Bag</span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-[#0c1b33] mb-8">
          Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)} items)
        </h1>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#e9e2d5] bg-white p-4 text-xs leading-5 text-[#687586] shadow-sm sm:p-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#a77e43]" />
          <p>Shipping and tax are not configured yet. The amount below is the merchandise subtotal; the seller must confirm final charges before an order is fulfilled.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cart Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-[#f4f5f7] rounded p-2 shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.title}
                        fill
                        className="object-contain mix-blend-multiply"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/product/${item.product.id}`}
                        className="text-sm font-semibold text-[#0c1b33] hover:text-[#c5a059] transition-colors"
                      >
                        {item.product.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      </div>
                      <div className={`mt-1 text-[10px] font-medium ${item.product.stockQuantity > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {item.product.stockQuantity > 0 ? `${item.product.stockQuantity} available` : 'Currently out of stock'}
                      </div>
                      <span className="text-xs font-bold text-[#0c1b33] sm:hidden block mt-1">
                        ${item.product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Unit Price */}
                    <span className="text-sm font-semibold text-gray-900 hidden sm:block">
                      ${item.product.price.toFixed(2)}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#0c1b33]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity || item.product.stockQuantity < 1}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total for item */}
                    <span className="text-sm font-bold text-[#0c1b33] w-16 text-right">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href="/shop"
                className="text-xs font-semibold text-[#0c1b33] hover:text-[#c5a059] flex items-center gap-1"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#0c1b33] pb-3 border-b border-gray-100">
                Order Summary
              </h2>

              {/* Cost Calculations */}
              <div className="space-y-3 text-xs text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span>Merchandise subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & tax</span>
                  <span className="font-semibold text-[#8b6a2f]">To be confirmed</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0c1b33] pt-3 border-t border-gray-100">
                  <span>Current subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] leading-4 text-gray-500">Discount codes are not active in this storefront preview.</p>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                className="w-full py-3.5 bg-[#0c1b33] hover:bg-[#162b4e] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-4 text-[10px] text-gray-500">
                <Info className="h-3.5 w-3.5 text-[#c5a059]" />
                <span>Payment processing is not connected. Orders remain pending.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
