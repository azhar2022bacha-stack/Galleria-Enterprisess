import { inflateSync } from 'zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_DIMENSION = 1600;

function paeth(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

/** Confirms that a PNG is an 8-bit RGBA file with at least one genuinely transparent pixel. */
export function pngHasTransparentPixels(bytes: Buffer): boolean {
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return false;

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlaceMethod = 1;
  const imageData: Buffer[] = [];
  let offset = 8;

  try {
    while (offset + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(offset);
      const type = bytes.toString('ascii', offset + 4, offset + 8);
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (length > bytes.length || dataEnd + 4 > bytes.length) return false;

      if (type === 'IHDR' && length === 13) {
        width = bytes.readUInt32BE(dataStart);
        height = bytes.readUInt32BE(dataStart + 4);
        bitDepth = bytes[dataStart + 8];
        colorType = bytes[dataStart + 9];
        interlaceMethod = bytes[dataStart + 12];
      } else if (type === 'IDAT') {
        imageData.push(bytes.subarray(dataStart, dataEnd));
      } else if (type === 'IEND') {
        break;
      }

      offset = dataEnd + 4;
    }

    if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_DIMENSION * MAX_DIMENSION) return false;
    if (bitDepth !== 8 || colorType !== 6 || interlaceMethod !== 0 || imageData.length === 0) return false;

    const bytesPerPixel = 4;
    const rowBytes = width * bytesPerPixel;
    const rowStride = rowBytes + 1;
    const decoded = inflateSync(Buffer.concat(imageData), { maxOutputLength: rowStride * height });
    if (decoded.length !== rowStride * height) return false;

    for (let y = 0; y < height; y += 1) {
      const rowStart = y * rowStride + 1;
      const filter = decoded[y * rowStride];
      if (filter > 4) return false;

      for (let x = 0; x < rowBytes; x += 1) {
        const left = x >= bytesPerPixel ? decoded[rowStart + x - bytesPerPixel] : 0;
        const up = y > 0 ? decoded[rowStart + x - rowStride] : 0;
        const upperLeft = y > 0 && x >= bytesPerPixel ? decoded[rowStart + x - rowStride - bytesPerPixel] : 0;
        const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : 0;
        decoded[rowStart + x] = (decoded[rowStart + x] + predictor) & 0xff;
      }

      for (let x = 3; x < rowBytes; x += bytesPerPixel) {
        if (decoded[rowStart + x] < 245) return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}
