export const MAX_SHOP_DESCRIPTION_CHARACTERS = 150;

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

export function countShopDescriptionCharacters(description: string): number {
  return segmenter ? Array.from(segmenter.segment(description)).length : Array.from(description).length;
}
