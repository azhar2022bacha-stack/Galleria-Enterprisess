import { NextResponse } from 'next/server';
import { getAdminAuditEntries, recordAdminAuditEvent, type AdminAuditCategory } from '@/lib/adminAuditServer';
import { getRequestAdmin } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

const CATEGORIES: AdminAuditCategory[] = ['Money', 'Logins', 'Sensitive', 'Other'];

export async function GET(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Please sign in to view the audit log.' }, { status: 401 });
    const limit = Number(new URL(request.url).searchParams.get('limit') || 500);
    const entries = await getAdminAuditEntries(limit);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Unable to load admin audit log:', error);
    return NextResponse.json({ error: 'Unable to load the audit log.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Please sign in to record admin activity.' }, { status: 401 });
    const body = await request.json();
    const actionText = String(body.actionText || '').trim().slice(0, 300);
    const details = String(body.details || '').trim().slice(0, 2000);
    const category = body.category as AdminAuditCategory;
    const endpoint = String(body.endpoint || '').trim().slice(0, 200);
    const workflowId = String(body.workflowId || '').trim().slice(0, 120);
    const targetId = String(body.targetId || '').trim().slice(0, 160);
    const method = String(body.method || '').trim().toUpperCase().slice(0, 12);
    const status = Math.max(0, Math.min(599, Number(body.status) || 0));

    if (!actionText || !CATEGORIES.includes(category) || !endpoint || !method) {
      return NextResponse.json({ error: 'A valid audit action is required.' }, { status: 400 });
    }

    const entry = await recordAdminAuditEvent(request, {
      actionText,
      details,
      category,
      endpoint,
      workflowId,
      targetId,
      method,
      status,
      success: Boolean(body.success),
      actor: admin.email,
    });
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('Unable to record admin audit event:', error);
    return NextResponse.json({ error: 'Unable to record the audit event.' }, { status: 500 });
  }
}
