export type PromotionMethod = 'Promotion code';
export type PromotionStatus = 'Active' | 'Draft' | 'Disabled';

export interface StorefrontPromotion {
  id: string;
  code: string;
  method: PromotionMethod;
  status: PromotionStatus;
  value: string;
  createdAt: string;
  updatedAt: string;
}
