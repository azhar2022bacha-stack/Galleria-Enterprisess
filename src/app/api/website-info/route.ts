import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getWebsiteInfo, saveWebsiteInfo } from '@/lib/websiteInfoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ success: true, settings: await getWebsiteInfo() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Unable to load website information:', error);
    return NextResponse.json({ success: false, error: 'Website information is temporarily unavailable.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Admin sign-in is required to update website information.' }, { status: 401 });
    }
    const settings = await saveWebsiteInfo(await request.json());
    return NextResponse.json({ success: true, settings }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save website information.';
    const validationError = /must|enter|add no more|each certificate|upload a file|FAQ/i.test(message);
    console.error('Unable to save website information:', error);
    return NextResponse.json({ success: false, error: message }, { status: validationError ? 400 : 503 });
  }
}
