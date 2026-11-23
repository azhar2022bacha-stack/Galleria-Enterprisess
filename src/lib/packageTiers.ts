export type PackageTierId = 'free' | 'silver' | 'gold' | 'platinum';

export interface PackageTier {
  id: PackageTierId;
  name: string;
  rebatePercent: number;
  productLimit: number;
  price: number;
}

export const PACKAGE_TIERS: PackageTier[] = [
  { id: 'free', name: 'Free Shop', rebatePercent: 15, productLimit: 300, price: 0 },
  { id: 'silver', name: 'Silver Shop', rebatePercent: 20, productLimit: 1000, price: 10000 },
  { id: 'gold', name: 'Gold Shop', rebatePercent: 30, productLimit: 2500, price: 20000 },
  { id: 'platinum', name: 'Platinum Shop', rebatePercent: 40, productLimit: 5000, price: 30000 },
];
