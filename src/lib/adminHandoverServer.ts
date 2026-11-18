import fs from 'fs';
import path from 'path';
import { dbQuery, initDb } from '@/lib/db';

export type HandoverStatus = 'open' | 'in_progress' | 'completed';
export type HandoverPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface HandoverTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: HandoverPriority;
  status: HandoverStatus;
  dueAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'admin_handover_tasks.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readFallback(): HandoverTask[] {
  try {
    ensureDataFile();
    const value = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error('Unable to read handover tasks:', error);
    return [];
  }
}

function writeFallback(tasks: HandoverTask[]): void {
  ensureDataFile();
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(tasks, null, 2), 'utf8');
  fs.renameSync(temporaryFile, DATA_FILE);
}

function toIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function fromRow(row: Record<string, unknown>): HandoverTask {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    assignedTo: String(row.assigned_to || ''),
    priority: row.priority as HandoverPriority,
    status: row.status as HandoverStatus,
    dueAt: toIso(row.due_at),
    createdBy: String(row.created_by || ''),
    updatedBy: String(row.updated_by || ''),
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    updatedAt: toIso(row.updated_at) || new Date().toISOString(),
    completedAt: toIso(row.completed_at),
  };
}

async function moveFallbackTasksIntoDatabase(): Promise<void> {
  const fallbackTasks = readFallback();
  if (!fallbackTasks.length) return;
  for (const task of fallbackTasks) {
    const result = await dbQuery(
      `INSERT INTO admin_handover_tasks
        (id, title, description, assigned_to, priority, status, due_at, created_by, updated_by, created_at, updated_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [task.id, task.title, task.description, task.assignedTo, task.priority, task.status, task.dueAt, task.createdBy, task.updatedBy, task.createdAt, task.updatedAt, task.completedAt]
    );
    if (!result) throw new Error('Local handover tasks could not be moved into the database.');
  }
  writeFallback([]);
}

function sortTasks(tasks: HandoverTask[]): HandoverTask[] {
  return [...tasks].sort((a, b) => {
    const statusOrder: Record<HandoverStatus, number> = { open: 0, in_progress: 1, completed: 2 };
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus) return byStatus;
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt) || b.createdAt.localeCompare(a.createdAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function listHandoverTasks(): Promise<HandoverTask[]> {
  if (await initDb()) {
    await moveFallbackTasksIntoDatabase();
    const result = await dbQuery('SELECT * FROM admin_handover_tasks ORDER BY created_at DESC');
    if (!result) throw new Error('The handover task database could not be read.');
    return sortTasks(result.rows.map((row) => fromRow(row)));
  }
  return sortTasks(readFallback());
}

export async function createHandoverTask(task: HandoverTask): Promise<HandoverTask> {
  if (await initDb()) {
    const result = await dbQuery(
      `INSERT INTO admin_handover_tasks
        (id, title, description, assigned_to, priority, status, due_at, created_by, updated_by, created_at, updated_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [task.id, task.title, task.description, task.assignedTo, task.priority, task.status, task.dueAt, task.createdBy, task.updatedBy, task.createdAt, task.updatedAt, task.completedAt]
    );
    if (!result?.rows[0]) throw new Error('The handover task could not be saved to the database.');
    return fromRow(result.rows[0]);
  }
  const tasks = readFallback();
  tasks.unshift(task);
  writeFallback(tasks);
  return task;
}

export async function updateHandoverTask(
  id: string,
  patch: Partial<Pick<HandoverTask, 'title' | 'description' | 'assignedTo' | 'priority' | 'status' | 'dueAt'>>,
  updatedBy: string
): Promise<HandoverTask | null> {
  const updatedAt = new Date().toISOString();
  if (await initDb()) {
    const fields: Array<[keyof typeof patch, string]> = [
      ['title', 'title'], ['description', 'description'], ['assignedTo', 'assigned_to'],
      ['priority', 'priority'], ['status', 'status'], ['dueAt', 'due_at'],
    ];
    const values: unknown[] = [];
    const sets: string[] = [];
    for (const [key, column] of fields) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        values.push(patch[key]);
        sets.push(`${column} = $${values.length}`);
      }
    }
    values.push(updatedBy);
    sets.push(`updated_by = $${values.length}`);
    values.push(updatedAt);
    sets.push(`updated_at = $${values.length}`);
    if (patch.status !== undefined) {
      values.push(patch.status === 'completed' ? updatedAt : null);
      sets.push(`completed_at = $${values.length}`);
    }
    values.push(id);
    const result = await dbQuery(
      `UPDATE admin_handover_tasks SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result) throw new Error('The handover task could not be updated in the database.');
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  const tasks = readFallback();
  const index = tasks.findIndex((task) => task.id === id);
  if (index < 0) return null;
  const oldTask = tasks[index];
  const updated: HandoverTask = {
    ...oldTask,
    ...patch,
    updatedBy,
    updatedAt,
    completedAt: patch.status === 'completed' ? updatedAt : patch.status ? null : oldTask.completedAt,
  };
  tasks[index] = updated;
  writeFallback(tasks);
  return updated;
}

export async function deleteHandoverTasks(ids: string[]): Promise<number> {
  if (await initDb()) {
    const result = await dbQuery('DELETE FROM admin_handover_tasks WHERE id = ANY($1::varchar[])', [ids]);
    if (!result) throw new Error('The selected handover tasks could not be deleted from the database.');
    return result.rowCount || 0;
  }
  const tasks = readFallback();
  const remaining = tasks.filter((task) => !ids.includes(task.id));
  writeFallback(remaining);
  return tasks.length - remaining.length;
}

export async function clearCompletedHandoverTasks(): Promise<number> {
  if (await initDb()) {
    const result = await dbQuery("DELETE FROM admin_handover_tasks WHERE status = 'completed'");
    if (!result) throw new Error('Completed handover tasks could not be cleared from the database.');
    return result.rowCount || 0;
  }
  const tasks = readFallback();
  const remaining = tasks.filter((task) => task.status !== 'completed');
  writeFallback(remaining);
  return tasks.length - remaining.length;
}

export async function importLegacyHandoverTasks(tasksToImport: HandoverTask[]): Promise<number> {
  if (!(await listHandoverTasks()).length) {
    for (const task of tasksToImport) {
      const existing = await listHandoverTasks();
      if (existing.some((current) => current.id === task.id)) continue;
      await createHandoverTask(task);
    }
  }
  return (await listHandoverTasks()).length;
}
