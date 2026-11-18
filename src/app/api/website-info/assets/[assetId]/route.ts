import { NextResponse } from 'next/server';
import { dbQuery, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { assetId: string } }) {
  if (!/^[a-f0-9-]{36}$/i.test(params.assetId)) return NextResponse.json({ success: false }, { status: 404 });
  if (!process.env.DATABASE_URL?.trim()) return NextResponse.json({ success: false }, { status: 404 });
  if (!(await initDb())) return NextResponse.json({ success: false }, { status: 503 });
  const result = await dbQuery<{ content_type: string; file_name: string; data: Buffer }>(
    'SELECT content_type, file_name, data FROM website_info_assets WHERE asset_id = $1',
    [params.assetId],
  );
  const asset = result?.rows[0];
  if (!asset) return NextResponse.json({ success: false }, { status: result ? 404 : 503 });
  return new Response(new Uint8Array(asset.data), {
    headers: {
      'Content-Type': asset.content_type,
      'Content-Length': String(asset.data.byteLength),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(asset.file_name)}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
