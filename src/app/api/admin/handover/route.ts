import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getRequestAdmin } from '@/lib/adminSession';
import { getAdminAccounts } from '@/lib/adminAccountsServer';
import {
  clearCompletedHandoverTasks,
  createHandoverTask,
  deleteHandoverTasks,
  importLegacyHandoverTasks,
  listHandoverTasks,
  updateHandoverTask,
  type HandoverPriority,
  type HandoverStatus,
  type HandoverTask,
} from '@/lib/adminHandoverServer';

export const dynamic = 'force-dynamic';

const PRIORITIES: HandoverPriority[] = ['low', 'normal', 'high', 'urgent'];
const STATUSES: HandoverStatus[] = ['open', 'in_progress', 'completed'];

function displayNameFromEmail(email: string): string {
  return email.split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || email;
}

function validDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function stringValue(value: unknown, max: number): string {
  return String(value || '').trim().slice(0, max);
}

function normalizeLegacyTask(value: unknown, adminEmail: string): HandoverTask | null {
  if (!value || typeof value !== 'object') return null;
  const legacy = value as Record<string, unknown>;
  const title = stringValue(legacy.title || legacy.text, 200);
  if (!title) return null;
  const parsedDate = new Date(String(legacy.createdAt || ''));
  const createdAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  const completed = Boolean(legacy.completed);
  return {
    id: stringValue(legacy.id, 100) || `handover-${randomUUID()}`,
    title,
    description: stringValue(legacy.description, 4000),
    assignedTo: '',
    priority: 'normal',
    status: completed ? 'completed' : 'open',
    dueAt: null,
    createdBy: adminEmail,
    updatedBy: adminEmail,
    createdAt,
    updatedAt: createdAt,
    completedAt: completed ? createdAt : null,
  };
}

export async function GET(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ error: 'Please sign in to view handover tasks.' }, { status: 401 });
    const [tasks, accounts] = await Promise.all([listHandoverTasks(), getAdminAccounts()]);
    const admins = accounts
      .filter((account) => account.status === 'Active')
      .map((account) => ({
        id: account.id,
        email: account.email,
        name: displayNameFromEmail(account.email),
        isRoot: account.isRoot,
      }));
    return NextResponse.json({ tasks, admins });
  } catch (error) {
    console.error('Unable to load handover tasks:', error);
    return NextResponse.json({ error: 'Unable to load handover tasks.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Please sign in to add handover tasks.' }, { status: 401 });
    const parsedBody = await request.json();
    const body = parsedBody && typeof parsedBody === 'object' ? parsedBody as Record<string, unknown> : {};

    if (Array.isArray(body.legacyTasks)) {
      const imported = body.legacyTasks.slice(0, 500).map((task: unknown) => normalizeLegacyTask(task, admin.email)).filter(Boolean) as HandoverTask[];
      await importLegacyHandoverTasks(imported);
      return NextResponse.json({ success: true, tasks: await listHandoverTasks() });
    }

    const title = stringValue(body.title, 200);
    const description = stringValue(body.description, 4000);
    const assignedTo = stringValue(body.assignedTo, 255);
    const priority = body.priority as HandoverPriority;
    const dueAt = validDate('dueAt' in body ? body.dueAt : null);
    if (!title) return NextResponse.json({ error: 'Enter a task title.' }, { status: 400 });
    if (!PRIORITIES.includes(priority)) return NextResponse.json({ error: 'Choose a valid priority.' }, { status: 400 });
    if (dueAt === undefined) return NextResponse.json({ error: 'Enter a valid due date.' }, { status: 400 });

    const now = new Date().toISOString();
    const task: HandoverTask = {
      id: `handover-${randomUUID()}`,
      title,
      description,
      assignedTo,
      priority,
      status: 'open',
      dueAt,
      createdBy: admin.email,
      updatedBy: admin.email,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    return NextResponse.json({ task: await createHandoverTask(task) }, { status: 201 });
  } catch (error) {
    console.error('Unable to create handover task:', error);
    return NextResponse.json({ error: 'Unable to create handover task.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Please sign in to update handover tasks.' }, { status: 401 });
    const parsedBody = await request.json();
    const body = parsedBody && typeof parsedBody === 'object' ? parsedBody as Record<string, unknown> : {};
    const id = stringValue(body.id, 100);
    if (!id) return NextResponse.json({ error: 'A task ID is required.' }, { status: 400 });

    const patch: Partial<Pick<HandoverTask, 'title' | 'description' | 'assignedTo' | 'priority' | 'status' | 'dueAt'>> = {};
    if ('title' in body) {
      const title = stringValue(body.title, 200);
      if (!title) return NextResponse.json({ error: 'Task title cannot be empty.' }, { status: 400 });
      patch.title = title;
    }
    if ('description' in body) patch.description = stringValue(body.description, 4000);
    if ('assignedTo' in body) patch.assignedTo = stringValue(body.assignedTo, 255);
    if ('priority' in body) {
      if (!PRIORITIES.includes(body.priority as HandoverPriority)) return NextResponse.json({ error: 'Choose a valid priority.' }, { status: 400 });
      patch.priority = body.priority as HandoverPriority;
    }
    if ('status' in body) {
      if (!STATUSES.includes(body.status as HandoverStatus)) return NextResponse.json({ error: 'Choose a valid task status.' }, { status: 400 });
      patch.status = body.status as HandoverStatus;
    }
    if ('dueAt' in body) {
      const dueAt = validDate(body.dueAt);
      if (dueAt === undefined) return NextResponse.json({ error: 'Enter a valid due date.' }, { status: 400 });
      patch.dueAt = dueAt;
    }
    if (!Object.keys(patch).length) return NextResponse.json({ error: 'No task changes were provided.' }, { status: 400 });

    const task = await updateHandoverTask(id, patch, admin.email);
    if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Unable to update handover task:', error);
    return NextResponse.json({ error: 'Unable to update handover task.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ error: 'Please sign in to delete handover tasks.' }, { status: 401 });
    const parsedBody = await request.json();
    const body = parsedBody && typeof parsedBody === 'object' ? parsedBody as Record<string, unknown> : {};
    if (body.clearCompleted === true) {
      const deleted = await clearCompletedHandoverTasks();
      return NextResponse.json({ success: true, deleted, tasks: await listHandoverTasks() });
    }
    const ids = Array.isArray(body.ids) ? Array.from(new Set(body.ids.map((id: unknown) => stringValue(id, 100)).filter(Boolean))).slice(0, 500) : [];
    if (!ids.length) return NextResponse.json({ error: 'Select at least one task to delete.' }, { status: 400 });
    const deleted = await deleteHandoverTasks(ids);
    return NextResponse.json({ success: true, deleted, tasks: await listHandoverTasks() });
  } catch (error) {
    console.error('Unable to delete handover tasks:', error);
    return NextResponse.json({ error: 'Unable to delete handover tasks.' }, { status: 500 });
  }
}
