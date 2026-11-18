import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getStoreSettings, saveStoreSettings } from '@/lib/storeSettingsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Please sign in to view store settings.' }, { status: 401 });
    }
    return NextResponse.json({ success: true, settings: await getStoreSettings() });
  } catch (error) {
    console.error('Unable to load store settings:', error);
    return NextResponse.json({ success: false, error: 'Unable to load store settings.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Please sign in to update store settings.' }, { status: 401 });
    }
    const settings = await saveStoreSettings(await request.json());
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save store settings.';
    const isValidationError = /must|enter|listed|currency|metadata|name is required/i.test(message);
    console.error('Unable to save store settings:', error);
    return NextResponse.json({ success: false, error: message }, { status: isValidationError ? 400 : 500 });
  }
}
