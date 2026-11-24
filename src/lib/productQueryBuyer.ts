import type { ProductQuery } from './sellerOrders';

export function buyerAttribution(name: string) {
  return 'On behalf of: ' + name + '\n\n';
}

export function displayProductQuery(query: ProductQuery): ProductQuery {
  if (query.source !== 'admin-consign' && query.userName !== 'Admin') return query;
  const match = /^On behalf of:[ \t]*([^\r\n]+)\r?\n(?:[ \t]*\r?\n)*/.exec(query.question);
  const buyer = match?.[1].trim();
  return match && buyer ? { ...query, userName: buyer, question: query.question.slice(match[0].length) } : query;
}
