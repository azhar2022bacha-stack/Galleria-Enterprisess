import { NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'crypto';
import { getRequestAdmin } from '@/lib/adminSession';
import { filterPublishedRetailListings, readRetailListings } from '@/lib/retailListingsServer';
import { readStorefrontOrders, writeStorefrontOrders } from '@/lib/storefrontOrdersServer';
import { calculatePromotion } from '@/lib/storefrontPromotionsServer';
import { createStripeCheckoutSession, expireStripeCheckoutSession, isStripeCheckoutConfigured, storefrontCurrency } from '@/lib/stripeCheckout';
import { normalizeCryptoTransactionId, storefrontCryptoNetwork } from '@/lib/storefrontCrypto';
import { getSellerPublicStoreBySlug } from '@/lib/sellerPublicStoreServer';
import type { Address, Product } from '@/types';
import type { StorefrontOrderItem, StorefrontOrderRecord } from '@/lib/storefrontOrders';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

function validText(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isOrderHoldingStock(order: StorefrontOrderRecord): boolean {
  if (order.paymentStatus === 'FAILED' || order.orderStatus === 'CANCELLED' ||
    order.status === 'cancelled' || order.status === 'payment_failed') return false;
  return true;
}

function getReservedQuantities(orders: StorefrontOrderRecord[]): Map<string, number> {
  const reserved = new Map<string, number>();
  for (const order of orders) {
    if (!isOrderHoldingStock(order)) continue;
    for (const item of order.items) {
      const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
      reserved.set(item.productId, (reserved.get(item.productId) || 0) + quantity);
    }
  }
  return reserved;
}

function addressFrom(body: any): Address | null {
  const address = body?.shippingAddress;
  if (!validText(address?.fullName, 2, 120) || !validText(address?.street, 3, 220) ||
    !validText(address?.city, 2, 100) || !validText(address?.country, 2, 100) ||
    !validText(address?.zipCode, 2, 24) || !validText(address?.phoneNumber, 5, 40)) return null;
  return {
    id: `addr-${randomUUID()}`,
    userId: 'usr-guest',
    fullName: address.fullName.trim(),
    street: address.street.trim(),
    apartment: typeof address.apartment === 'string' ? address.apartment.trim().slice(0, 100) : undefined,
    phoneNumber: address.phoneNumber.trim(),
    city: address.city.trim(),
    state: typeof address.state === 'string' ? address.state.trim().slice(0, 100) : '',
    zipCode: address.zipCode.trim(),
    country: address.country.trim(),
    isDefault: true,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const allOrders = readStorefrontOrders();
  if (scope === 'buyer') {
    const orderNumber = (searchParams.get('orderNumber') || '').trim().toUpperCase();
    const buyerEmail = (searchParams.get('email') || '').trim().toLowerCase();
    if (!/^GAL-(?:[A-F0-9]{16}|\d{9})$/.test(orderNumber) || !isValidEmail(buyerEmail)) {
      return NextResponse.json({ success: false, error: 'Enter the order number and email used at checkout.' }, { status: 400 });
    }
    const order = allOrders.find((item) => item.orderNumber === orderNumber && item.buyerEmail === buyerEmail);
    if (!order) return NextResponse.json({ success: false, error: 'We could not find an order matching those details.' }, { status: 404 });
    const { buyerEmail: _buyerEmail, buyerName: _buyerName, shippingAddress: _shippingAddress, stripeSessionId: _stripeSessionId, ...orderDetails } = order;
    return NextResponse.json({
      success: true,
      order: {
        ...orderDetails,
        items: order.items.map(({ sellerEmail: _sellerEmail, sellerName: _sellerName, sellerStoreSlug: _sellerStoreSlug, ...item }) => item),
      },
    });
  }
  const admin = await getRequestAdmin(request);
  if (scope === 'admin' && admin) return NextResponse.json({ success: true, orders: allOrders.map(({ stripeSessionId: _stripeSessionId, ...order }) => order) });
  if (scope === 'admin') return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });

  const sellerEmail = getRequestSellerEmail(request);
  if (scope === 'seller' && sellerEmail) {
    const orders = allOrders.flatMap((order) => {
      const sellerItems = order.items.filter((item) => item.sellerEmail === sellerEmail);
      if (sellerItems.length === 0) return [];
      const { stripeSessionId: _stripeSessionId, ...safeOrder } = order;
      return [{
        ...safeOrder,
        buyer: { name: order.buyerName, email: order.buyerEmail },
        items: sellerItems,
        sellerSubtotal: sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      }];
    });
    return NextResponse.json({ success: true, orders });
  }
  if (scope === 'seller') return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  return NextResponse.json({ success: false, error: 'Choose an authenticated order scope.' }, { status: 400 });
}

export async function PATCH(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid order update.' }, { status: 400 }); }
  const orders = readStorefrontOrders();
  const index = orders.findIndex((order) => order.id === String(body?.id || ''));
  if (index < 0) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
  const current = orders[index];
  const now = new Date().toISOString();

  if (body?.action === 'mark-crypto-received') {
    const payment = current.cryptoPayment;
    if (current.paymentMethod !== 'Crypto' || !payment) return NextResponse.json({ success: false, error: 'Choose an order with a crypto payment.' }, { status: 400 });
    const transactionId = normalizeCryptoTransactionId(body.transactionId);
    if (!transactionId) return NextResponse.json({ success: false, error: 'Enter a valid blockchain transaction ID.' }, { status: 400 });
    if (current.paymentStatus === 'PAID' && payment.transactionId === transactionId) {
      return NextResponse.json({ success: true, order: current });
    }
    if (current.paymentStatus !== 'PENDING' || current.orderStatus !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Only pending crypto orders can be marked as received.' }, { status: 409 });
    }
    if (orders.some((order) => order.id !== current.id && order.cryptoPayment?.chain === payment.chain
      && order.cryptoPayment?.transactionId === transactionId)) {
      return NextResponse.json({ success: false, error: 'This blockchain transaction was already recorded on another order.' }, { status: 409 });
    }
    orders[index] = {
      ...current, paymentStatus: 'PAID', orderStatus: 'PROCESSING', status: 'processing', updatedAt: now,
      cryptoPayment: { ...payment, transactionId, verifiedAt: now },
    };
    writeStorefrontOrders(orders);
    return NextResponse.json({ success: true, order: orders[index] });
  }

  if (body?.action === 'mark-cod-collected') {
    if (current.paymentMethod !== 'Cash on Delivery') return NextResponse.json({ success: false, error: 'Cash collection can only be recorded for Cash on Delivery orders.' }, { status: 400 });
    if (current.status === 'cancelled') return NextResponse.json({ success: false, error: 'Cancelled orders cannot be marked as collected.' }, { status: 409 });
    orders[index] = {
      ...current,
      paymentStatus: 'PAID',
      cashCollectedAt: now,
      status: current.orderStatus === 'PENDING' ? 'processing' : current.status,
      orderStatus: current.orderStatus === 'PENDING' ? 'PROCESSING' : current.orderStatus,
      updatedAt: now,
    };
    writeStorefrontOrders(orders);
    return NextResponse.json({ success: true, order: orders[index] });
  }

  if (body?.action !== 'update-fulfillment') return NextResponse.json({ success: false, error: 'Choose a supported order update.' }, { status: 400 });
  const orderStatus = body?.orderStatus;
  if (!['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(orderStatus)) {
    return NextResponse.json({ success: false, error: 'Choose a valid fulfillment status.' }, { status: 400 });
  }
  if (orderStatus === 'CANCELLED' && current.paymentStatus === 'PAID') {
    return NextResponse.json({ success: false, error: 'This order is paid. Process a refund before cancelling it.' }, { status: 409 });
  }
  if (current.orderStatus === 'CANCELLED' && orderStatus !== 'CANCELLED') {
    return NextResponse.json({ success: false, error: 'Cancelled orders cannot be reopened.' }, { status: 409 });
  }
  if (orderStatus === 'CANCELLED' && current.paymentMethod === 'Card (Visa/Mastercard)' && current.status === 'payment_pending' && current.stripeSessionId) {
    try { await expireStripeCheckoutSession(current.stripeSessionId); }
    catch (expireError) { return NextResponse.json({ success: false, error: expireError instanceof Error ? expireError.message : 'Unable to expire the card checkout session.' }, { status: 409 }); }
  }
  if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(orderStatus) && current.paymentStatus !== 'PAID' && current.paymentMethod !== 'Cash on Delivery') {
    return NextResponse.json({ success: false, error: 'Payment must be confirmed before fulfillment.' }, { status: 409 });
  }
  const trackingCarrier = body?.trackingCarrier === undefined ? current.trackingCarrier : String(body.trackingCarrier || '').trim().slice(0, 80) || undefined;
  const trackingNumber = body?.trackingNumber === undefined ? current.trackingNumber : String(body.trackingNumber || '').trim().slice(0, 120) || undefined;
  const trackingUrl = body?.trackingUrl === undefined ? current.trackingUrl : String(body.trackingUrl || '').trim().slice(0, 1000) || undefined;
  if (trackingUrl && !/^https:\/\//i.test(trackingUrl)) return NextResponse.json({ success: false, error: 'Tracking links must use HTTPS.' }, { status: 400 });
  if (orderStatus === 'SHIPPED' && !trackingNumber) return NextResponse.json({ success: false, error: 'Add the carrier tracking number before marking the order shipped.' }, { status: 400 });
  const orderStatusValue = orderStatus as StorefrontOrderRecord['orderStatus'];
  const nextStatus: StorefrontOrderRecord['status'] = orderStatus === 'PENDING'
    ? current.paymentStatus === 'PAID' ? 'paid' : current.paymentMethod === 'Cash on Delivery' ? 'cod_pending' : 'payment_pending'
    : orderStatus.toLowerCase() as StorefrontOrderRecord['status'];
  orders[index] = { ...current, orderStatus: orderStatusValue, status: nextStatus, trackingCarrier, trackingNumber, trackingUrl, updatedAt: now };
  writeStorefrontOrders(orders);
  return NextResponse.json({ success: true, order: orders[index] });
}

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid order request.' }, { status: 400 }); }
  const requestedPaymentMethod = body?.paymentMethod || 'cash_on_delivery';
  if (!['cash_on_delivery', 'card', 'crypto'].includes(requestedPaymentMethod)) {
    return NextResponse.json({ success: false, error: 'Choose Cash on Delivery, card, or crypto payment.' }, { status: 400 });
  }
  if (requestedPaymentMethod === 'card' && !isStripeCheckoutConfigured()) {
    return NextResponse.json({ success: false, error: 'Card payments require gateway setup. Choose another payment method to continue.' }, { status: 503 });
  }
  const cryptoNetwork = requestedPaymentMethod === 'crypto' ? storefrontCryptoNetwork(body.cryptoNetworkId) : undefined;
  if (requestedPaymentMethod === 'crypto' && (!cryptoNetwork || storefrontCurrency() !== 'usd')) {
    return NextResponse.json({ success: false, error: 'Choose an available crypto network for your USD order.' }, { status: 400 });
  }
  if (!isValidEmail(body?.buyerEmail) || !Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 100) {
    return NextResponse.json({ success: false, error: 'Enter a valid email and include between 1 and 100 products.' }, { status: 400 });
  }
  const shippingAddress = addressFrom(body);
  if (!shippingAddress) return NextResponse.json({ success: false, error: 'Complete the required shipping address and phone fields.' }, { status: 400 });

  const listings = await readRetailListings();
  const listingById = new Map(filterPublishedRetailListings(listings).map((listing) => [listing.id, listing]));
  const aggregated = new Map<string, number>();
  const normalizedItems: { id: string; quantity: number; displayedPrice?: number; selectedColor?: string; selectedSize?: string }[] = [];
  for (const item of body.items) {
    const id = String(item?.productId || '');
    const quantity = Number(item?.quantity);
    const displayedPrice = item?.displayedPrice === undefined ? undefined : Number(item.displayedPrice);
    if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000 ||
      (displayedPrice !== undefined && (!Number.isFinite(displayedPrice) || displayedPrice < 0))) {
      return NextResponse.json({ success: false, error: 'Product quantities must be whole numbers between 1 and 1,000.' }, { status: 400 });
    }
    aggregated.set(id, (aggregated.get(id) || 0) + quantity);
    normalizedItems.push({
      id,
      quantity,
      displayedPrice,
      selectedColor: typeof item?.selectedColor === 'string' ? item.selectedColor.trim() : undefined,
      selectedSize: typeof item?.selectedSize === 'string' ? item.selectedSize.trim() : undefined,
    });
  }

  const sellerProductsById = new Map<string, {
    product: Product;
    sellerEmail: string;
    sellerName: string;
    sellerStoreSlug: string;
  }>();
  const sellerStorePromises = new Map<string, ReturnType<typeof getSellerPublicStoreBySlug>>();
  for (const id of aggregated.keys()) {
    const match = id.match(/^seller-([a-f0-9]{8})-(.+)$/i);
    if (!match) continue;
    const [, hash, encodedProductId] = match;
    const normalizedHash = hash.toLowerCase();
    let storePromise = sellerStorePromises.get(normalizedHash);
    if (!storePromise) {
      storePromise = getSellerPublicStoreBySlug(`store-${normalizedHash}`);
      sellerStorePromises.set(normalizedHash, storePromise);
    }
    const store = await storePromise;
    if (!store) continue;
    let originalProductId = encodedProductId;
    try { originalProductId = decodeURIComponent(encodedProductId); } catch { continue; }
    const sellerProduct = store.products.find((product) => product.originalSellerProductId === originalProductId);
    if (!sellerProduct) continue;
    sellerProductsById.set(id, {
      product: sellerProduct,
      sellerEmail: store.sellerEmail,
      sellerName: store.store.name,
      sellerStoreSlug: store.store.slug,
    });
  }

  const existingOrders = readStorefrontOrders();
  const reservedQuantities = getReservedQuantities(existingOrders);
  const reservedFor = (productId: string) => reservedQuantities.get(productId) || 0;
  const stockIssues: { productId: string; title: string; requested: number; available: number }[] = [];
  for (const [id, requested] of aggregated) {
    if (id.startsWith('seller-')) {
      const sellerProduct = sellerProductsById.get(id);
      const available = Math.max(0, (sellerProduct?.product.stockQuantity || 0) - reservedFor(id));
      if (!sellerProduct || !sellerProduct.product.inStock || requested > available) {
        stockIssues.push({ productId: id, title: sellerProduct?.product.title || 'A product in your cart', requested, available });
      }
    } else {
      const listing = listingById.get(id);
      const available = Math.max(0, (listing?.stockQuantity || 0) - reservedFor(id));
      if (!listing || requested > available) stockIssues.push({ productId: id, title: listing?.title || 'A product in your cart', requested, available });
    }
  }
  if (stockIssues.length > 0) return NextResponse.json({
    success: false,
    code: 'STOCK_CHANGED',
    stockChanges: stockIssues.map(({ productId, available }) => ({ productId, stockQuantity: available })),
    error: `${stockIssues[0].title} has ${stockIssues[0].available} available, but your cart has ${stockIssues[0].requested}. Please adjust your cart.`,
  }, { status: 409 });

  for (const item of normalizedItems) {
    const listing = listingById.get(item.id);
    const sellerProduct = sellerProductsById.get(item.id);
    const product = listing || sellerProduct?.product;
    if (!product) continue;
    if (product.colors?.length && (!item.selectedColor || !product.colors.includes(item.selectedColor))) {
      return NextResponse.json({ success: false, error: `Choose an available color for ${product.title}.` }, { status: 400 });
    }
    if (product.sizes?.length && (!item.selectedSize || !product.sizes.includes(item.selectedSize))) {
      return NextResponse.json({ success: false, error: `Choose an available size for ${product.title}.` }, { status: 400 });
    }
  }

  const priceChangesById = new Map<string, { productId: string; title: string; price: number }>();
  for (const item of normalizedItems) {
    if (item.displayedPrice === undefined) continue;
    const listing = listingById.get(item.id);
    const sellerProduct = sellerProductsById.get(item.id);
    const product = listing || sellerProduct?.product;
    if (!product || Math.round(item.displayedPrice * 100) === Math.round(product.price * 100)) continue;
    priceChangesById.set(item.id, { productId: item.id, title: product.title, price: product.price });
  }
  if (priceChangesById.size > 0) {
    return NextResponse.json({
      success: false,
      code: 'PRICE_CHANGED',
      priceChanges: Array.from(priceChangesById.values()),
      error: 'Some prices changed since these products were added to your cart. Review the updated total and place your order again.',
    }, { status: 409 });
  }

  const orderItems: StorefrontOrderItem[] = normalizedItems.map((item) => {
    const listing = listingById.get(item.id);
    const sellerProduct = sellerProductsById.get(item.id);
    const product = listing || sellerProduct!.product;
    return {
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.image,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      ...(listing ? { sellerEmail: listing.sellerEmail, sellerName: listing.sellerName, sellerStoreSlug: listing.sellerSlug } : sellerProduct ? {
        sellerEmail: sellerProduct.sellerEmail,
        sellerName: sellerProduct.sellerName,
        sellerStoreSlug: sellerProduct.sellerStoreSlug,
      } : {}),
    };
  });
  const subtotal = Math.round(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  let promotionCode: string | undefined;
  let discountAmount = 0;
  if (typeof body.promotionCode === 'string' && body.promotionCode.trim()) {
    const promotion = calculatePromotion(body.promotionCode, body.buyerEmail, subtotal);
    if ('error' in promotion) return NextResponse.json({ success: false, error: promotion.error }, { status: 400 });
    promotionCode = promotion.code;
    discountAmount = promotion.discountAmount;
  }
  const createdAt = new Date().toISOString();
  const orderNumber = `GAL-${randomBytes(8).toString('hex').toUpperCase()}`;
  const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
  if (cryptoNetwork && totalAmount <= 0) {
    return NextResponse.json({ success: false, error: 'Choose Cash on Delivery for a zero-total order.' }, { status: 400 });
  }
  const order: StorefrontOrderRecord = {
    id: randomUUID(),
    orderNumber,
    buyerName: shippingAddress.fullName,
    buyerEmail: body.buyerEmail.trim().toLowerCase(),
    items: orderItems,
    subtotalAmount: subtotal,
    discountAmount,
    promotionCode,
    totalAmount,
    shippingAddress,
    paymentMethod: cryptoNetwork ? 'Crypto' : requestedPaymentMethod === 'card' ? 'Card (Visa/Mastercard)' : 'Cash on Delivery',
    ...(cryptoNetwork ? { cryptoPayment: {
      networkId: cryptoNetwork.id, networkName: cryptoNetwork.name, chain: cryptoNetwork.chain,
      token: cryptoNetwork.token, address: cryptoNetwork.address, amount: totalAmount.toFixed(2),
    } } : {}),
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
    status: requestedPaymentMethod === 'cash_on_delivery' ? 'cod_pending' : 'payment_pending',
    createdAt,
  };
  let checkoutUrl: string | undefined;
  if (requestedPaymentMethod === 'card') {
    const reservations = readStorefrontOrders();
    reservations.unshift(order);
    writeStorefrontOrders(reservations);
    try {
      const session = await createStripeCheckoutSession(order, request.url);
      order.stripeSessionId = session.id;
      checkoutUrl = session.url;
    } catch (paymentError) {
      const latestOrders = readStorefrontOrders().filter((existingOrder) => existingOrder.id !== order.id);
      writeStorefrontOrders(latestOrders);
      const message = paymentError instanceof Error ? paymentError.message : 'Secure card checkout is unavailable.';
      return NextResponse.json({ success: false, error: message }, { status: 502 });
    }
    const latestOrders = readStorefrontOrders();
    const reservationIndex = latestOrders.findIndex((existingOrder) => existingOrder.id === order.id);
    if (reservationIndex >= 0) {
      latestOrders[reservationIndex] = { ...latestOrders[reservationIndex], stripeSessionId: order.stripeSessionId };
      writeStorefrontOrders(latestOrders);
    }
  } else {
    const orders = readStorefrontOrders();
    orders.unshift(order);
    writeStorefrontOrders(orders);
  }

  const buyerOrder = {
    id: order.id,
    orderNumber,
    userId: 'usr-guest',
    items: orderItems.map(({ sellerEmail: _sellerEmail, sellerName: _sellerName, sellerStoreSlug: _sellerStoreSlug, ...item }) => item),
    subtotalAmount: subtotal,
    discountAmount,
    promotionCode,
    totalAmount,
    shippingAddress,
    paymentMethod: order.paymentMethod,
    cryptoPayment: order.cryptoPayment,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingCarrier: order.trackingCarrier,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    createdAt,
  };
  return NextResponse.json({ success: true, order: buyerOrder, checkoutUrl }, { status: 201 });
}
