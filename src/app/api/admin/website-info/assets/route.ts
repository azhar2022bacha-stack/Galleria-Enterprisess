import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getRequestAdmin } from '@/lib/adminSession';
import { dbQuery, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ASSET_TYPES: Record<string, { extension: string; label: string }> = {
  'image/jpeg': { extension: 'jpg', label: 'JPEG image' },
  'image/png': { extension: 'png', label: 'PNG image' },
  'image/webp': { extension: 'webp', label: 'WebP image' },
  'image/gif': { extension: 'gif', label: 'GIF image' },
  'image/x-icon': { extension: 'ico', label: 'icon' },
  'image/vnd.microsoft.icon': { extension: 'ico', label: 'icon' },
  'application/pdf': { extension: 'pdf', label: 'PDF document' },
};

function safeFileName(value: string): string {
  return value.replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 255) || 'website-file';
}

export async function POST(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required to upload website files.' }, { status: 401 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 9 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Choose a file smaller than 8 MB.' }, { status: 413 });

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ success: false, error: 'Choose an image or PDF file to upload.' }, { status: 400 }); }
  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') return NextResponse.json({ success: false, error: 'Choose an image or PDF file to upload.' }, { status: 400 });
  if (!file.size || file.size > 8 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Choose a file between 1 byte and 8 MB.' }, { status: 413 });
  const assetType = ASSET_TYPES[file.type];
  if (!assetType) return NextResponse.json({ success: false, error: 'Use JPG, PNG, WebP, GIF, ICO, or PDF files.' }, { status: 415 });

  const assetId = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = safeFileName(file.name);
  if (process.env.DATABASE_URL?.trim()) {
    if (!(await initDb())) return NextResponse.json({ success: false, error: 'Shared website file storage is unavailable.' }, { status: 503 });
    const saved = await dbQuery(
      'INSERT INTO website_info_assets (asset_id, file_name, content_type, data) VALUES ($1, $2, $3, $4) RETURNING asset_id',
      [assetId, originalName, file.type, buffer],
    );
    if (!saved) return NextResponse.json({ success: false, error: 'Unable to save this website file.' }, { status: 503 });
    return NextResponse.json({ success: true, url: `/api/website-info/assets/${assetId}`, fileName: originalName, contentType: file.type }, { status: 201 });
  }

  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'website-info');
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${assetId}.${assetType.extension}`);
  await fs.writeFile(filePath, buffer, { flag: 'wx' });
  return NextResponse.json({ success: true, url: `/uploads/website-info/${assetId}.${assetType.extension}`, fileName: originalName, contentType: file.type }, { status: 201 });
}
