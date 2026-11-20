export function isDemoStorefrontProduct(id: string): boolean {
  return /^prod-\d+$/.test(id);
}
