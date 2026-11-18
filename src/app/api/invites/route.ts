import { NextResponse } from 'next/server';
import {
  getStoredCodesServer,
  generateCodesServer,
  validateCodeServer,
  toggleCodeStatusServer,
  clearCodesServer,
} from '@/lib/inviteCodesServer';
import { getRequestAdmin } from '@/lib/adminSession';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code && !(await getRequestAdmin(request))) {
      return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
    }

    // If a specific code was requested for verification:
    if (code) {
      const validation = await validateCodeServer(code);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            valid: false,
            error: validation.error,
            remainingUses: validation.remainingUses ?? 0,
            maxUsage: validation.invite?.maxUsage,
            usage: validation.invite?.usage,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          valid: true,
          code: validation.invite?.code,
          remainingUses: validation.remainingUses,
          maxUsage: validation.invite?.maxUsage,
          usage: validation.invite?.usage,
        },
        { status: 200 }
      );
    }

    // Otherwise return all codes from persistent PostgreSQL storage
    const all = await getStoredCodesServer();
    return NextResponse.json({ codes: all }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await request.json();
    const { action, howMany, usesPerCode, note, id } = body;

    if (action === 'generate') {
      const newCodes = await generateCodesServer(
        Number(howMany) || 1,
        Number(usesPerCode) || 1,
        note || ''
      );
      const allCodes = await getStoredCodesServer();
      return NextResponse.json(
        { success: true, generated: newCodes, codes: allCodes },
        { status: 201 }
      );
    }

    if (action === 'toggle' && id) {
      const updated = await toggleCodeStatusServer(id);
      return NextResponse.json({ success: true, codes: updated }, { status: 200 });
    }

    if (action === 'clear') {
      await clearCodesServer();
      return NextResponse.json(
        { success: true, message: 'All invitation codes cleared.', codes: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
