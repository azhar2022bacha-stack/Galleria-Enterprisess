const MAX_INPUT_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;

export class ProductImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductImageProcessingError';
  }
}

function median(values: number[]): number {
  values.sort((left, right) => left - right);
  return values[Math.floor(values.length / 2)] || 0;
}

function colorDistanceSquared(pixels: Uint8ClampedArray, offset: number, background: [number, number, number]): number {
  const red = pixels[offset] - background[0];
  const green = pixels[offset + 1] - background[1];
  const blue = pixels[offset + 2] - background[2];
  return red * red + green * green + blue * blue;
}

function getOpaqueContentBounds(pixels: Uint8ClampedArray, width: number, height: number) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 12) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return right < left || bottom < top ? null : { left, top, right, bottom };
}

function getBackgroundColor(pixels: Uint8ClampedArray, width: number, bounds: { left: number; top: number; right: number; bottom: number }): { color: [number, number, number]; offsets: number[] } | null {
  const { left, top, right, bottom } = bounds;
  const stride = Math.max(1, Math.floor(Math.max(right - left + 1, bottom - top + 1) / 500));
  const offsets: number[] = [];
  const red: number[] = [];
  const green: number[] = [];
  const blue: number[] = [];

  for (let x = left; x <= right; x += stride) {
    offsets.push((top * width + x) * 4, (bottom * width + x) * 4);
  }
  for (let y = top + stride; y < bottom; y += stride) {
    offsets.push((y * width + left) * 4, (y * width + right) * 4);
  }

  for (const offset of offsets) {
    if (pixels[offset + 3] < 245) continue;
    red.push(pixels[offset]);
    green.push(pixels[offset + 1]);
    blue.push(pixels[offset + 2]);
  }

  if (red.length < 16) return null;

  return { color: [median(red), median(green), median(blue)], offsets };
}

function removePlainLightBackground(pixels: Uint8ClampedArray, width: number, height: number, allowAlreadyTransparent: boolean): boolean {
  const contentBounds = getOpaqueContentBounds(pixels, width, height);
  if (!contentBounds) throw new ProductImageProcessingError('No visible product was found in this image. Choose another product photo.');
  const border = getBackgroundColor(pixels, width, contentBounds);
  if (!border) {
    if (allowAlreadyTransparent) return false;
    throw new ProductImageProcessingError('Use a transparent PNG or a clear product photo on a plain white/light background.');
  }
  const { color: background, offsets } = border;
  const [red, green, blue] = background;
  if (Math.min(red, green, blue) < 185 || Math.max(red, green, blue) - Math.min(red, green, blue) > 48) {
    if (allowAlreadyTransparent) return false;
    throw new ProductImageProcessingError('This photo has a colored or dark background. Upload a transparent PNG or retake it against a plain white/light background.');
  }

  let matching = 0;
  let opaque = 0;
  for (const offset of offsets) {
    if (pixels[offset + 3] < 245) continue;
    opaque += 1;
    if (colorDistanceSquared(pixels, offset, background) <= 48 * 48) matching += 1;
  }
  if (!opaque || matching / opaque < 0.88) {
    if (allowAlreadyTransparent) return false;
    throw new ProductImageProcessingError('This background is too uneven to remove cleanly. Upload a transparent PNG or use a plain white/light studio background.');
  }

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let tail = 0;
  const addBackgroundPixel = (pixelIndex: number) => {
    if (visited[pixelIndex]) return;
    const offset = pixelIndex * 4;
    if (pixels[offset + 3] === 0 || colorDistanceSquared(pixels, offset, background) > 88 * 88) return;
    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = contentBounds.left; x <= contentBounds.right; x += 1) {
    addBackgroundPixel(contentBounds.top * width + x);
    addBackgroundPixel(contentBounds.bottom * width + x);
  }
  for (let y = contentBounds.top + 1; y < contentBounds.bottom; y += 1) {
    addBackgroundPixel(y * width + contentBounds.left);
    addBackgroundPixel(y * width + contentBounds.right);
  }

  for (let head = 0; head < tail; head += 1) {
    const pixelIndex = queue[head];
    const x = pixelIndex % width;
    if (x > 0) addBackgroundPixel(pixelIndex - 1);
    if (x + 1 < width) addBackgroundPixel(pixelIndex + 1);
    if (pixelIndex >= width) addBackgroundPixel(pixelIndex - width);
    if (pixelIndex + width < pixelCount) addBackgroundPixel(pixelIndex + width);
  }

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (!visited[pixelIndex]) continue;
    const offset = pixelIndex * 4;
    const distance = Math.sqrt(colorDistanceSquared(pixels, offset, background));
    const opacity = Math.max(0, Math.min(1, (distance - 20) / 58));
    pixels[offset + 3] = Math.round(pixels[offset + 3] * opacity);
  }
  return true;
}

function findProductBounds(pixels: Uint8ClampedArray, width: number, height: number): { left: number; top: number; right: number; bottom: number } {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 12) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) {
    throw new ProductImageProcessingError('No visible product was found in this image. Choose another product photo.');
  }

  const margin = Math.max(4, Math.round(Math.max(right - left + 1, bottom - top + 1) * 0.025));
  return {
    left: Math.max(0, left - margin),
    top: Math.max(0, top - margin),
    right: Math.min(width - 1, right + margin),
    bottom: Math.min(height - 1, bottom + margin),
  };
}

/** Reconstructs a tightly cropped transparent cutout from decoded browser image pixels. */
export function processProductImageData(image: ImageData): ImageData {
  const { width, height, data: pixels } = image;
  let transparentPixelCount = 0;
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset] < 245) transparentPixelCount += 1;
  }
  const hasTransparentBackground = transparentPixelCount > width * height * 0.01;
  removePlainLightBackground(pixels, width, height, hasTransparentBackground);

  const bounds = findProductBounds(pixels, width, height);
  const cropWidth = bounds.right - bounds.left + 1;
  const cropHeight = bounds.bottom - bounds.top + 1;
  const croppedPixels = new Uint8ClampedArray(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    const sourceStart = ((bounds.top + y) * width + bounds.left) * 4;
    const targetStart = y * cropWidth * 4;
    croppedPixels.set(pixels.subarray(sourceStart, sourceStart + cropWidth * 4), targetStart);
  }
  return new ImageData(croppedPixels, cropWidth, cropHeight);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new ProductImageProcessingError('The transparent product image could not be created. Please try another image.')), 'image/png');
  });
}

/** Removes a plain light studio background or preserves existing transparency, then trims empty canvas. */
export async function processProductImageFile(file: File): Promise<File> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new ProductImageProcessingError('Choose a JPG, PNG, or WebP product photo.');
  }
  if (file.size < 1 || file.size > MAX_INPUT_SIZE) {
    throw new ProductImageProcessingError('Product photos must be smaller than 5 MB.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ProductImageProcessingError('This image could not be opened. Choose a valid JPG, PNG, or WebP photo.');
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new ProductImageProcessingError('Your browser could not prepare this product image.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);
    const image = processProductImageData(context.getImageData(0, 0, width, height));
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = image.width;
    outputCanvas.height = image.height;
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) throw new ProductImageProcessingError('Your browser could not prepare this product image.');
    outputContext.putImageData(image, 0, 0);

    const blob = await canvasToPng(outputCanvas);
    const name = file.name.replace(/\.[^.]+$/, '') || 'product-image';
    return new File([blob], `${name}.png`, { type: 'image/png', lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
