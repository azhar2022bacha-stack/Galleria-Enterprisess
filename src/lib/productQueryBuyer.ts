import type { ProductQuery } from './sellerOrders';

export function buyerAttribution(name: string) {
  return 'On behalf of: ' + name + '\n\n';
}

export function displayProductQuery(query: ProductQuery): ProductQuery {
  const match = query.source === 'admin-consign' && /^On behalf of: ([^\r\n]+)\n\n/.exec(query.question);
  return match ? { ...query, userName: match[1], question: query.question.slice(match[0].length) } : query;
}
