import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { dbQuery } from '@/lib/db';

export type AdminAuditCategory = 'Money' | 'Logins' | 'Sensitive' | 'Other';

export interface AdminAuditEntry {
  id: string;
  actionText: string;
  details?: string;
  category: AdminAuditCategory;
  actor: string;
  ip: string;
  endpoint: string;
  workflowId?: string;
  targetId?: string;
  method: string;
  status: number;
  success: boolean;
  userAgent: string;
  createdAt: string;
}

const AUDIT_FILE = path.join(process.cwd(), 'src', 'data', 'admin_audit_log.json');

function readFileEntries(): AdminAuditEntry[] {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFileEntry(entry: AdminAuditEntry): void {
  fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  const entries = readFileEntries();
  entries.unshift(entry);
  const tempFile = `${AUDIT_FILE}.${entry.id}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(entries, null, 2), 'utf8');
  fs.renameSync(tempFile, AUDIT_FILE);
}

function clientIp(request: Request): string {
  const headers = request.headers;
  const value =
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0] ||
    '';
  const ip = value.trim().slice(0, 64);
  if (ip) return ip;
  return process.env.NODE_ENV === 'development' ? '127.0.0.1 (local)' : 'Unavailable';
}

export async function recordAdminAuditEvent(
  request: Request,
  input: Omit<AdminAuditEntry, 'id' | 'ip' | 'userAgent' | 'createdAt'>
): Promise<AdminAuditEntry> {
  const entry: AdminAuditEntry = {
    ...input,
    id: randomUUID(),
    actor: input.actor,
    ip: clientIp(request),
    userAgent: (request.headers.get('user-agent') || '').slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  const inserted = await dbQuery(
    `INSERT INTO admin_audit_log (id, action_text, details, category, actor, ip, endpoint, workflow_id, target_id, method, status, success, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [entry.id, entry.actionText, entry.details || '', entry.category, entry.actor, entry.ip, entry.endpoint, entry.workflowId || '', entry.targetId || '', entry.method, entry.status, entry.success, entry.userAgent, entry.createdAt]
  );

  if (!inserted) writeFileEntry(entry);
  return entry;
}

export async function getAdminAuditEntries(limit = 500): Promise<AdminAuditEntry[]> {
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit) || 500));
  const result = await dbQuery<{
    id: string;
    action_text: string;
    details: string;
    category: AdminAuditCategory;
    actor: string;
    ip: string;
    endpoint: string;
    workflow_id: string;
    target_id: string;
    method: string;
    status: number;
    success: boolean;
    user_agent: string;
    created_at: string | Date;
  }>(
    `SELECT id, action_text, details, category, actor, ip, endpoint, workflow_id, target_id, method, status, success, user_agent, created_at
     FROM admin_audit_log ORDER BY created_at DESC LIMIT $1`,
    [safeLimit]
  );

  const databaseEntries: AdminAuditEntry[] = result?.rows.map((row) => ({
    id: row.id,
    actionText: row.action_text,
    details: row.details || '',
    category: row.category,
    actor: row.actor,
    ip: row.ip,
    endpoint: row.endpoint,
    workflowId: row.workflow_id || '',
    targetId: row.target_id || '',
    method: row.method,
    status: Number(row.status),
    success: Boolean(row.success),
    userAgent: row.user_agent || '',
    createdAt: new Date(row.created_at).toISOString(),
  })) || [];

  const merged = new Map<string, AdminAuditEntry>();
  for (const entry of [...databaseEntries, ...readFileEntries()]) merged.set(entry.id, entry);
  return [...merged.values()]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, safeLimit);
}
