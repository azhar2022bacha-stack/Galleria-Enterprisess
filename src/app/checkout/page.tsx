'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Info,
  ArrowRight,
  TicketPercent,
  Banknote,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Order } from '@/types';

export default function CheckoutPage() {
  const { items, totalItems, subtotal, clearCart, updateCartProductData } = useCart();
  const hasStockIssue = items.some((item) => !item.product.inStock || item.product.stockQuantity < 1 || item.quantity > item.product.stockQuantity);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<{ code: string; value: string; discountPercent: number; discountAmount: number } | null>(null);
  const [promotionError, setPromotionError] = useState('');
  const [promotionMessage, setPromotionMessage] = useState('');
  const [checkingPromotion, setCheckingPromotion] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card'>('cash_on_delivery');
  const [cardPaymentsEnabled, setCardPaymentsEnabled] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    apartment: '',
    phone: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
    if (e.target.name === 'email') {
      setAppliedPromotion(null);
      setPromotionMessage('');
    }
  };

  const applyPromotion = async () => {
    setCheckingPromotion(true);
    setPromotionError('');
    setPromotionMessage('');
    setAppliedPromotion(null);
    try {
      const response = await fetch('/api/storefront-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', code: promotionCode, email: formData.email, subtotal }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'This code could not be applied.');
      setAppliedPromotion(result.promotion);
      setPromotionMessage(`${result.promotion.value} applied. The server will confirm the discount when you create the order.`);
    } catch (promotionIssue) {
      setPromotionError(promotionIssue instanceof Error ? promotionIssue.message : 'This code could not be applied.');
    } finally {
      setCheckingPromotion(false);
    }
  };

  React.useEffect(() => {
    setAppliedPromotion(null);
    setPromotionMessage('');
  }, [subtotal]);

  React.useEffect(() => {
    let active = true;
    fetch('/api/storefront-payments/config', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load payment methods.')))
      .then((result) => { if (active && result.success) setCardPaymentsEnabled(Boolean(result.methods?.card)); })
      .catch(() => { if (active) setCardPaymentsEnabled(false); });
    return () => { active = false; };
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');
    if (hasStockIssue) {
      setCheckoutError('One or more cart quantities exceed the available stock. Return to your cart and adjust them before continuing.');
      return;
    }
    setIsSubmitting(true);

    try {
      const orderResponse = await fetch('/api/storefront-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerEmail: formData.email,
          promotionCode: appliedPromotion?.code,
          paymentMethod,
          items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity, displayedPrice: item.product.price, selectedColor: item.selectedColor, selectedSize: item.selectedSize })),
          shippingAddress: {
            fullName: `${formData.firstName} ${formData.lastName}`,
            street: formData.street,
            apartment: formData.apartment,
            phoneNumber: formData.phone,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
        }),
      });
      const orderResult = await orderResponse.json();
      if (orderResponse.status === 409 && orderResult.code === 'PRICE_CHANGED' && Array.isArray(orderResult.priceChanges)) {
        updateCartProductData(orderResult.priceChanges.map((change: { productId: string; price: number }) => ({
          productId: change.productId,
          price: change.price,
        })));
        setAppliedPromotion(null);
        setPromotionMessage('');
        setCheckoutError(orderResult.error || 'Prices changed. Review the updated total and place your order again.');
        return;
      }
      if (orderResponse.status === 409 && orderResult.code === 'STOCK_CHANGED' && Array.isArray(orderResult.stockChanges)) {
        updateCartProductData(orderResult.stockChanges.map((change: { productId: string; stockQuantity: number }) => ({
          productId: change.productId,
          stockQuantity: change.stockQuantity,
        })));
        setCheckoutError(orderResult.error || 'Stock changed. Adjust the quantities before placing your order again.');
        return;
      }
      if (!orderResponse.ok || !orderResult.success || !orderResult.order) {
        throw new Error(orderResult.error || 'We could not create your order. Please review your details and try again.');
      }
      if (paymentMethod === 'card') {
        if (typeof orderResult.checkoutUrl !== 'string' || !orderResult.checkoutUrl.startsWith('https://')) {
          throw new Error('Secure card checkout did not return a valid payment page. Your cart has not been cleared.');
        }
        window.location.assign(orderResult.checkoutUrl);
        return;
      }
      const order = orderResult.order as Order;

      setCompletedOrder(order);
      clearCart();
    } catch (err) {
      console.error('Failed to create order', err);
      setCheckoutError(err instanceof Error ? err.message : 'We could not create your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="bg-[#fcfbf9] min-h-[75vh] flex items-center justify-center py-16">
        <div className="max-w-lg w-full mx-auto px-4 text-center">
          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 ${completedOrder.paymentStatus === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {completedOrder.paymentStatus === 'PAID' ? <CheckCircle2 className="h-10 w-10" /> : <Info className="h-10 w-10" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c5a059]">
            {completedOrder.paymentStatus === 'PAID' ? 'PAYMENT CONFIRMED' : 'ORDER RECEIVED'}
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#0c1b33] mt-1 mb-2">
            {completedOrder.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery order placed' : 'Thank You for Your Order!'}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your order <span className="font-mono font-bold text-[#0c1b33]">{completedOrder.orderNumber}</span> has been created. {completedOrder.paymentStatus === 'PAID' ? 'Payment is confirmed.' : completedOrder.paymentMethod === 'Cash on Delivery' ? 'Please pay the delivery agent when your order arrives.' : 'Payment is still pending; this store has not confirmed a payment.'}
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-500">Keep this order number. You can look it up later with the email address used at checkout.</p>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-left my-6 space-y-3 text-xs">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Tracking:</span>
              <span className="font-mono font-bold text-[#0c1b33]">{completedOrder.trackingNumber || 'Not connected yet'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Merchandise subtotal:</span>
              <span className="font-bold text-[#0c1b33]">${(completedOrder.subtotalAmount ?? completedOrder.totalAmount).toFixed(2)}</span>
            </div>
            {Boolean(completedOrder.discountAmount) && <div className="flex justify-between border-b border-gray-100 pb-2 text-emerald-700"><span>Promotion {completedOrder.promotionCode ? `(${completedOrder.promotionCode})` : ''}:</span><span className="font-bold">−${completedOrder.discountAmount!.toFixed(2)}</span></div>}
            {Boolean(completedOrder.subtotalAmount) && <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Order total after discount:</span><span className="font-bold text-[#0c1b33]">${completedOrder.totalAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between">
              <span className="text-gray-500">Payment method:</span>
              <span className="font-semibold text-[#0c1b33]">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status:</span>
              <span className={`font-semibold ${completedOrder.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {completedOrder.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <p className="border-t border-gray-100 pt-3 text-[10px] leading-4 text-gray-500">Shipping and tax have not been added to this amount.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="px-6 py-3 bg-[#0c1b33] text-white text-xs font-semibold rounded uppercase tracking-wider hover:bg-[#162b4e] transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="px-6 py-3 bg-white border border-[#c5a059] text-[#0c1b33] text-xs font-semibold rounded uppercase tracking-wider hover:bg-amber-50 transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#0c1b33]">No Items in Cart</h2>
        <p className="text-sm text-gray-500 mt-2 mb-6">Please add items to your shopping cart to proceed to checkout.</p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-[#0c1b33] text-white text-xs font-semibold rounded uppercase"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-[#c5a059] transition-colors">Cart</Link>
          <span>/</span>
          <span className="text-[#0c1b33] font-medium">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Checkout Form (7 cols) */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Shipping Address */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
                <div className="w-7 h-7 rounded-full bg-[#0c1b33] text-white text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h2 className="font-serif text-lg font-bold text-[#0c1b33]">
                  Shipping Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-first-name" className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    id="checkout-first-name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    autoComplete="given-name"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkout-last-name" className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    id="checkout-last-name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    autoComplete="family-name"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-email" className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="checkout-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-phone" className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="checkout-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    autoComplete="tel"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-street" className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    id="checkout-street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    autoComplete="address-line1"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-apartment" className="block text-xs font-medium text-gray-700 mb-1">Apartment, suite, or unit <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    id="checkout-apartment"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    autoComplete="address-line2"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-city" className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    id="checkout-city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    autoComplete="address-level2"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkout-state" className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    id="checkout-state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    autoComplete="address-level1"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkout-postal-code" className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    id="checkout-postal-code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    autoComplete="postal-code"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkout-country" className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <select
                    id="checkout-country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    autoComplete="country-name"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#0c1b33] focus:outline-none bg-white"
                    required
                  >
                    <option value="">Select country</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Details */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
                <div className="w-7 h-7 rounded-full bg-[#0c1b33] text-white text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <h2 className="font-serif text-lg font-bold text-[#0c1b33]">Choose a payment method</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setPaymentMethod('cash_on_delivery')} aria-pressed={paymentMethod === 'cash_on_delivery'} className={`rounded-xl border p-4 text-left transition ${paymentMethod === 'cash_on_delivery' ? 'border-[#bd9957] bg-[#fbfaf7] ring-2 ring-[#bd9957]/15' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#14263d]"><Banknote className="h-4 w-4 text-[#a77e43]" />Cash on Delivery</span>
                  <span className="mt-1 block text-[11px] leading-5 text-slate-500">Pay the delivery agent when your order arrives. No online charge is taken now.</span>
                </button>
                <button type="button" disabled={!cardPaymentsEnabled} onClick={() => setPaymentMethod('card')} aria-pressed={paymentMethod === 'card'} className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-65 ${paymentMethod === 'card' ? 'border-[#bd9957] bg-[#fbfaf7] ring-2 ring-[#bd9957]/15' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#14263d]"><CreditCard className="h-4 w-4 text-[#a77e43]" />Credit or debit card</span>
                  <span className="mt-1 block text-[11px] leading-5 text-slate-500">Visa and Mastercard through secure hosted checkout.</span>
                  {!cardPaymentsEnabled && <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-800">Gateway setup required</span>}
                </button>
              </div>

              {paymentMethod === 'card' && <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>Card details are entered on the payment provider’s secure page; they are not stored by this store.</p></div>}

              {checkoutError && (
                <div role="alert" className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800">
                  {checkoutError}
                </div>
              )}

              {hasStockIssue && !checkoutError && (
                <div role="alert" className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  A cart item is out of stock or exceeds its listed stock. Adjust your cart before creating an order.
                </div>
              )}

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting || hasStockIssue}
                  className="w-full py-4 bg-[#0c1b33] hover:bg-[#162b4e] disabled:opacity-75 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{isSubmitting ? 'Processing...' : `${paymentMethod === 'card' ? 'Continue to secure card payment' : 'Place Cash on Delivery order'} • $${Math.max(0, subtotal - (appliedPromotion?.discountAmount || 0)).toFixed(2)}`}</span>
                </button>
              </div>

            </div>

          </form>

          {/* Sidebar Order Review (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 sticky top-28">
              <h3 className="font-serif text-lg font-bold text-[#0c1b33] pb-3 border-b border-gray-100">
                Order Review ({totalItems} items)
              </h3>

              {/* Items preview list */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-[#f4f5f7] rounded p-1 shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.title}
                        fill
                        className="object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.product.title}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#0c1b33]">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#e6e0d4] bg-[#fbfaf7] p-3.5">
                <label htmlFor="checkout-promotion" className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#33445b]"><TicketPercent className="h-3.5 w-3.5 text-[#a77e43]" />Promotion code</label>
                <div className="flex gap-2"><input id="checkout-promotion" value={promotionCode} onChange={(event) => { setPromotionCode(event.target.value.toUpperCase()); setAppliedPromotion(null); setPromotionMessage(''); setPromotionError(''); }} placeholder="Enter code" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-[#dfe3e8] bg-white px-3 py-2 text-xs font-mono uppercase text-[#14263d] outline-none focus:border-[#bd9957]" /><button type="button" disabled={checkingPromotion || !promotionCode.trim()} onClick={() => void applyPromotion()} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#14263d] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50">{checkingPromotion ? 'Checking…' : 'Apply'}</button></div>
                {promotionError && <p role="alert" className="mt-2 text-[10px] leading-4 text-rose-700">{promotionError}</p>}
                {promotionMessage && <p role="status" className="mt-2 text-[10px] leading-4 text-emerald-700">{promotionMessage}</p>}
              </div>

              {/* Cost summary */}
              <div className="space-y-2.5 text-xs text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                {appliedPromotion && <div className="flex justify-between text-emerald-700"><span>{appliedPromotion.code} discount</span><span className="font-semibold">−${appliedPromotion.discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between">
                  <span>Shipping & tax</span>
                  <span className="font-semibold text-[#8b6a2f]">To be confirmed</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0c1b33] pt-2 border-t border-gray-100">
                  <span>Merchandise total</span>
                  <span>${Math.max(0, subtotal - (appliedPromotion?.discountAmount || 0)).toFixed(2)}</span>
                </div>
                <p className="text-[10px] leading-4 text-gray-500">This is not a final total or a payment. Shipping and tax are not configured yet.</p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                <span className="text-[11px] text-[#0c1b33] font-medium block">
                  Delivery and return terms are not configured yet.
                </span>
                <Link href="/about#shipping" className="text-[10px] text-[#8b6a2f] hover:underline">
                  Read order information
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
