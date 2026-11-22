import {
  amountToCents,
  CONSIGN_SELLER_COMMISSION_RATE,
  orderPaymentBreakdownAtRate,
  type SellerOrder,
} from '@/lib/sellerOrders';

export function summarizeSellerDashboardOrders(orders: SellerOrder[]) {
  const flow = { new: 0, confirmed: 0, pickedUp: 0, onTheWay: 0, delivered: 0, cancelled: 0 };
  let grossCents = 0;
  let profitCents = 0;
  for (const order of orders) {
    if (order.outcome) {
      if (order.outcome === 'Cancelled') flow.cancelled += 1;
      continue;
    }
    switch (order.status) {
      case 'awaiting_payment': flow.new += 1; continue;
      case 'confirmed': flow.confirmed += 1; break;
      case 'picked_up': flow.pickedUp += 1; break;
      case 'on_the_way': flow.onTheWay += 1; break;
      case 'delivered': flow.delivered += 1; break;
      default: continue;
    }

    const amount = amountToCents(order.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) continue;
    grossCents += amount;

    const paid = amountToCents(order.sellerPaidAmount ?? NaN);
    const recordedProfit = amountToCents(order.sellerCommission ?? order.commission ?? NaN);
    const recordedRate = Number(order.commissionRate?.replace(/%$/, '').trim());
    if (paid >= 0 && paid <= amount) {
      profitCents += amount - paid;
    } else if (recordedProfit >= 0 && recordedProfit <= amount) {
      profitCents += recordedProfit;
    } else {
      // Older orders without a saved rate keep the original Free Shop rate.
      const rate = recordedRate > 0 && recordedRate < 100 ? recordedRate : CONSIGN_SELLER_COMMISSION_RATE;
      profitCents += amountToCents(orderPaymentBreakdownAtRate(order.amount, rate).commission);
    }
  }

  return { flow, grossSales: grossCents / 100, estimatedProfit: profitCents / 100 };
}
