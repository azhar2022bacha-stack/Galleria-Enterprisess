import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { pngHasTransparentPixels } from '@/lib/transparentPng';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PROCESSED_IMAGE_SIZE = 12 * 1024 * 1024;

function hasSellerSession(request: Request): boolean {
  return Boolean(getRequestSellerEmail(request));
}

function validFileSignature(bytes: Buffer, mimeType: string): boolean {
  return mimeType === 'image/png' && bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

export async function POST(request: Request) {
  if (!hasSellerSession(request)) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_PROCESSED_IMAGE_SIZE + 64 * 1024) {
    return NextResponse.json({ success: false, error: 'The processed transparent product image is too large.' }, { status: 413 });
  }

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ success: false, error: 'Choose an image file to upload.' }, { status: 400 }); }
  const file = formData.get('image');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ success: false, error: 'Choose an image file to upload.' }, { status: 400 });
  }
  if (file.size < 1 || file.size > MAX_PROCESSED_IMAGE_SIZE) {
    return NextResponse.json({ success: false, error: 'The processed transparent product image is too large.' }, { status: 400 });
  }

  if (file.type !== 'image/png') return NextResponse.json({ success: false, error: 'Upload the transparent PNG produced by the product photo uploader.' }, { status: 415 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!validFileSignature(bytes, file.type)) return NextResponse.json({ success: false, error: 'This file does not match its image format.' }, { status: 415 });
  if (!pngHasTransparentPixels(bytes)) {
    return NextResponse.json({ success: false, error: 'This image still has a background. Use the product photo uploader to remove it before uploading.' }, { status: 422 });
  }

  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'retail-listings');
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `ret-${randomUUID()}.png`;
  await fs.writeFile(path.join(outputDir, fileName), bytes, { flag: 'wx' });
  return NextResponse.json({ success: true, image: `/uploads/retail-listings/${fileName}` }, { status: 201 });
}
