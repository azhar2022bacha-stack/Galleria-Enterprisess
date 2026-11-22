export const MAX_SHOP_DESCRIPTION_WORDS = 150;

export function countShopDescriptionWords(description: string): number {
  return description.match(/\S+/g)?.length ?? 0;
}
