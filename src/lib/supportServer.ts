import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { dbQuery, isDbConnected } from '@/lib/db';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { emitSupportEvent } from '@/lib/supportEvents';
import type { QueryResultRow } from 'pg';

export type SupportRole = 'seller' | 'admin';

export interface SupportAttachment {
  url: string;
  name: string;
  type: string;
}

export interface SupportMessage {
  id: string;
  role: SupportRole;
  text: string;
  at: string;
  edited?: boolean;
  deleted?: boolean;
  pinned?: boolean;
  hiddenFor?: string[];
  read?: boolean;
  delivered?: boolean;
  attachment?: SupportAttachment;
  reply?: string;
}

export interface SupportConversation {
  id: string;
  email: string;
  name: string;
  status: 'open' | 'closed';
  presence?: Record<string, number>;
  messages: SupportMessage[];
  updatedAt?: string;
}

const CHATS_FILE = path.join(process.cwd(), 'src', 'data', 'support_chats.json');
const PROFILES_FILE = path.join(process.cwd(), 'src', 'data', 'support_profiles.json');
const SELLERS_FILE = path.join(process.cwd(), 'src', 'data', 'sellers.json');

const LOCK_KEY = '__galleriaSupportWriteQueue__';
const MIGRATION_KEY = '__galleriaSupportDbMigratedV2__';

async function requireSupportDbQuery<T extends QueryResultRow = any>(sql: string, params?: any[]) {
  const result = await dbQuery<T>(sql, params);
  if (!result) throw new Error('Support database query failed.');
  return result;
}

function markSupportDbNeedsMigration(): void {
  const g = globalThis as typeof globalThis & { [MIGRATION_KEY]?: Promise<void> | boolean };
  g[MIGRATION_KEY] = false;
}

function getGlobalQueue(): Promise<unknown> {
  const g = globalThis as typeof globalThis & { [LOCK_KEY]?: Promise<unknown> };
  if (!g[LOCK_KEY]) g[LOCK_KEY] = Promise.resolve();
  return g[LOCK_KEY];
}

function setGlobalQueue(next: Promise<unknown>): void {
  const g = globalThis as typeof globalThis & { [LOCK_KEY]?: Promise<unknown> };
  g[LOCK_KEY] = next;
}

export async function withSupportLock<T>(task: () => Promise<T>): Promise<T> {
  const prev = getGlobalQueue();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.catch(() => undefined).then(() => current);
  setGlobalQueue(chained);
  await prev.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
  }
}

export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function toIso(value: unknown, fallback?: string): string {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : (fallback || new Date().toISOString());
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return fallback || new Date().toISOString();
}

function normalizeMessage(raw: any): SupportMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const role: SupportRole = raw.role === 'admin' ? 'admin' : 'seller';
  const msg: SupportMessage = {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID(),
    role,
    text: typeof raw.text === 'string' ? raw.text : '',
    at: toIso(raw.at),
  };
  if (raw.edited) msg.edited = true;
  if (raw.deleted) msg.deleted = true;
  if (raw.pinned) msg.pinned = true;
  if (Array.isArray(raw.hiddenFor) && raw.hiddenFor.length > 0) {
    msg.hiddenFor = Array.from(new Set(raw.hiddenFor.filter((r: unknown) => typeof r === 'string')));
  }
  if (raw.read) msg.read = true;
  if (raw.delivered) msg.delivered = true;
  if (raw.attachment && typeof raw.attachment === 'object' && typeof raw.attachment.url === 'string') {
    msg.attachment = {
      url: raw.attachment.url,
      name: typeof raw.attachment.name === 'string' ? raw.attachment.name : 'attachment',
      type: typeof raw.attachment.type === 'string' ? raw.attachment.type : 'application/octet-stream',
    };
  }
  if (typeof raw.reply === 'string' && raw.reply) msg.reply = raw.reply;
  return msg;
}

export function conversationActivityTime(chat: SupportConversation): number {
  const lastMsg = chat.messages.at(-1);
  if (lastMsg?.at) {
    const t = Date.parse(lastMsg.at);
    if (Number.isFinite(t)) return t;
  }
  if (chat.updatedAt) {
    const t = Date.parse(chat.updatedAt);
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

export function sortConversations(chats: SupportConversation[]): SupportConversation[] {
  return [...chats].sort((a, b) => {
    const diff = conversationActivityTime(b) - conversationActivityTime(a);
    if (diff !== 0) return diff;
    return a.email.localeCompare(b.email);
  });
}

function normalizeConversation(raw: any): SupportConversation | null {
  if (!raw || typeof raw !== 'object') return null;
  const email = normalizeEmail(raw.email || '');
  if (!email) return null;
  const messages = Array.isArray(raw.messages)
    ? raw.messages
        .map(normalizeMessage)
        .filter((m: SupportMessage | null): m is SupportMessage => Boolean(m))
        .sort((a: SupportMessage, b: SupportMessage) => Date.parse(a.at) - Date.parse(b.at))
    : [];
  const lastAt = messages.at(-1)?.at;
  const updatedAt = raw.updatedAt ? toIso(raw.updatedAt, lastAt) : lastAt;
  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID(),
    email,
    name: String(raw.name || email).trim().slice(0, 120) || email,
    status: raw.status === 'closed' ? 'closed' : 'open',
    presence: raw.presence && typeof raw.presence === 'object' ? { ...raw.presence } : {},
    messages,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function readDiskChats(): SupportConversation[] {
  try {
    if (!fs.existsSync(CHATS_FILE)) return [];
    const content = fs.readFileSync(CHATS_FILE, 'utf8').replace(/^\uFEFF/, '').trim();
    if (!content) return [];
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return sortConversations(
      parsed
        .map(normalizeConversation)
        .filter((c: SupportConversation | null): c is SupportConversation => Boolean(c))
    );
  } catch (err) {
    console.error('Failed to read support_chats.json:', err);
    return [];
  }
}

function writeDiskChats(chats: SupportConversation[]): void {
  const dir = path.dirname(CHATS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempFile = `${CHATS_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(chats), 'utf8');
  fs.renameSync(tempFile, CHATS_FILE);
}

function readDiskProfiles(): Record<string, string> {
  try {
    if (!fs.existsSync(PROFILES_FILE)) return {};
    const content = fs.readFileSync(PROFILES_FILE, 'utf8').replace(/^\uFEFF/, '').trim();
    if (!content) return {};
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    console.error('Failed to read support_profiles.json:', err);
    return {};
  }
}

function writeDiskProfiles(profiles: Record<string, string>): void {
  const dir = path.dirname(PROFILES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempFile = `${PROFILES_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(profiles), 'utf8');
  fs.renameSync(tempFile, PROFILES_FILE);
}

async function getSellerDirectoryMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    if (fs.existsSync(SELLERS_FILE)) {
      const content = fs.readFileSync(SELLERS_FILE, 'utf8').replace(/^\uFEFF/, '').trim();
      if (content) {
        const parsed = JSON.parse(content);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        for (const row of rows) {
          const email = normalizeEmail(row?.email || '');
          const label = String(row?.shopName || row?.fullName || '').trim();
          if (email && label) map.set(email, label.slice(0, 120));
        }
      }
    }
  } catch {
    // Ignore disk seller read fallback errors
  }

  try {
    const dbOnline = await isDbConnected();
    if (dbOnline) {
      const res = await dbQuery<{ email: string; shop_name: string | null; full_name: string | null }>(
        'SELECT email, shop_name, full_name FROM sellers'
      );
      if (res?.rows) {
        for (const row of res.rows) {
          const email = normalizeEmail(row.email);
          const label = String(row.shop_name || row.full_name || '').trim();
          if (email && label) map.set(email, label.slice(0, 120));
        }
      }
    }
  } catch {
    // Keep file-based map if DB query fails
  }
  return map;
}

async function ensureDbMigrated(): Promise<boolean> {
  const dbOnline = await isDbConnected();
  if (!dbOnline) return false;

  const g = globalThis as typeof globalThis & { [MIGRATION_KEY]?: Promise<void> | boolean };
  if (g[MIGRATION_KEY] === true) return true;
  if (g[MIGRATION_KEY] instanceof Promise) {
    try {
      await g[MIGRATION_KEY];
      return true;
    } catch {
      return false;
    }
  }

  const runMigration = (async () => {
    // Merge the legacy JSON store even when PostgreSQL already contains some
    // conversations. A partially populated database must not hide older chats.
    // Every insert is idempotent so concurrent app instances can safely repair it.
    const diskChats = readDiskChats();
    for (const chat of diskChats) {
      await requireSupportDbQuery(
        `INSERT INTO support_conversations (id, seller_email, seller_name, status, presence, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
         ON CONFLICT (seller_email) DO NOTHING`,
        [
          chat.id,
          chat.email,
          chat.name,
          chat.status,
          JSON.stringify(chat.presence || {}),
          chat.messages[0]?.at || chat.updatedAt || new Date().toISOString(),
          chat.updatedAt || chat.messages.at(-1)?.at || new Date().toISOString(),
        ]
      );
      const convRow = await requireSupportDbQuery<{ id: string }>(
        'SELECT id FROM support_conversations WHERE LOWER(seller_email) = LOWER($1) LIMIT 1',
        [chat.email]
      );
      const convId = convRow.rows[0]?.id;
      if (!convId) throw new Error(`Support conversation could not be restored for ${chat.email}.`);

      const maxBatchRows = 100;
      const maxBatchBytes = 8 * 1024 * 1024;
      let batch: Array<{ message: SupportMessage; attachmentJson: string | null }> = [];
      let batchBytes = 0;
      const flushMessageBatch = async () => {
        if (batch.length === 0) return;
        const params: any[] = [];
        const rows = batch.map(({ message: msg, attachmentJson }) => {
          const start = params.length + 1;
          params.push(
            msg.id,
            convId,
            msg.role,
            msg.text || '',
            attachmentJson,
            msg.reply || null,
            Boolean(msg.edited),
            Boolean(msg.deleted),
            Boolean(msg.pinned),
            JSON.stringify(msg.hiddenFor || []),
            Boolean(msg.read),
            Boolean(msg.delivered),
            toIso(msg.at)
          );
          return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}::jsonb, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8}, $${start + 9}::jsonb, $${start + 10}, $${start + 11}, $${start + 12})`;
        });
        await requireSupportDbQuery(
          `INSERT INTO support_messages (id, conversation_id, role, text, attachment, reply, edited, deleted, pinned, hidden_for, read, delivered, created_at)
           VALUES ${rows.join(', ')}
           ON CONFLICT (id) DO NOTHING`,
          params
        );
        batch = [];
        batchBytes = 0;
      };

      for (const msg of chat.messages) {
        const attachmentJson = msg.attachment ? JSON.stringify(msg.attachment) : null;
        const rowBytes = Buffer.byteLength(msg.id) + Buffer.byteLength(msg.text || '') +
          Buffer.byteLength(attachmentJson || '') + Buffer.byteLength(msg.reply || '') + 256;
        if (batch.length > 0 && (batch.length >= maxBatchRows || batchBytes + rowBytes > maxBatchBytes)) {
          await flushMessageBatch();
        }
        batch.push({ message: msg, attachmentJson });
        batchBytes += rowBytes;
        if (batch.length >= maxBatchRows || batchBytes >= maxBatchBytes) await flushMessageBatch();
      }
      await flushMessageBatch();
    }

    const diskProfiles = readDiskProfiles();
    for (const [key, photo] of Object.entries(diskProfiles)) {
      if (!photo) continue;
      await requireSupportDbQuery(
        `INSERT INTO support_profiles (profile_key, photo) VALUES ($1, $2) ON CONFLICT (profile_key) DO NOTHING`,
        [key, photo]
      );
    }
    g[MIGRATION_KEY] = true;
  })();

  g[MIGRATION_KEY] = runMigration;
  try {
    await runMigration;
    return true;
  } catch (err) {
    console.error('Support DB migration failed, using file fallback:', err);
    g[MIGRATION_KEY] = false;
    return false;
  }
}

async function readChatsFromStore(filterEmail?: string): Promise<SupportConversation[]> {
  const sellerNames = await getSellerDirectoryMap();
  const normalizedTarget = filterEmail ? normalizeEmail(filterEmail) : '';
  const dbReady = await ensureDbMigrated();

  let chats: SupportConversation[] | null = null;
  if (dbReady) {
    const convResult = normalizedTarget
      ? await dbQuery<{
          id: string;
          seller_email: string;
          seller_name: string;
          status: string;
          presence: Record<string, number> | null;
          updated_at: Date | string;
        }>(
          'SELECT id, seller_email, seller_name, status, presence, updated_at FROM support_conversations WHERE LOWER(seller_email) = $1',
          [normalizedTarget]
        )
      : await dbQuery<{
          id: string;
          seller_email: string;
          seller_name: string;
          status: string;
          presence: Record<string, number> | null;
          updated_at: Date | string;
        }>('SELECT id, seller_email, seller_name, status, presence, updated_at FROM support_conversations ORDER BY updated_at DESC');

    if (convResult) {
      const convIds = convResult.rows.map((r) => r.id);
      const msgsByConv = new Map<string, SupportMessage[]>();
      if (convIds.length > 0) {
        const msgResult = await dbQuery<{
          id: string;
          conversation_id: string;
          role: string;
          text: string;
          attachment: SupportAttachment | null;
          reply: string | null;
          edited: boolean;
          deleted: boolean;
          pinned: boolean;
          hidden_for: string[] | null;
          read: boolean;
          delivered: boolean;
          created_at: Date | string;
        }>(
          `SELECT id, conversation_id, role, text, attachment, reply, edited, deleted, pinned, hidden_for, read, delivered, created_at
           FROM support_messages
           WHERE conversation_id = ANY($1::varchar[])
           ORDER BY created_at ASC`,
          [convIds]
        );
        if (msgResult) {
          for (const row of msgResult.rows) {
            const msg: SupportMessage = {
              id: row.id,
              role: row.role === 'admin' ? 'admin' : 'seller',
              text: row.text || '',
              at: toIso(row.created_at),
              ...(row.edited ? { edited: true } : {}),
              ...(row.deleted ? { deleted: true } : {}),
              ...(row.pinned ? { pinned: true } : {}),
              ...(Array.isArray(row.hidden_for) && row.hidden_for.length ? { hiddenFor: row.hidden_for } : {}),
              ...(row.read ? { read: true } : {}),
              ...(row.delivered ? { delivered: true } : {}),
              ...(row.attachment ? { attachment: row.attachment } : {}),
              ...(row.reply ? { reply: row.reply } : {}),
            };
            const list = msgsByConv.get(row.conversation_id) || [];
            list.push(msg);
            msgsByConv.set(row.conversation_id, list);
          }
        } else {
          // Do not present conversations with missing message history as a
          // successful empty inbox. Fall back to the local backup for this read.
          chats = null;
        }
      }

      if (chats !== null) {
        chats = convResult.rows.map((row) => {
          const email = normalizeEmail(row.seller_email);
          const enrichedName = sellerNames.get(email);
          const storedName = String(row.seller_name || '').trim();
          const displayName = storedName && storedName.toLowerCase() !== email ? storedName : (enrichedName || storedName || email);
          const messages = msgsByConv.get(row.id) || [];
          return {
            id: row.id,
            email,
            name: displayName,
            status: row.status === 'closed' ? 'closed' : 'open',
            presence: row.presence || {},
            messages,
            updatedAt: toIso(row.updated_at, messages.at(-1)?.at),
          };
        });
      }
    }
  }

  if (chats === null) {
    const disk = readDiskChats();
    chats = normalizedTarget ? disk.filter((c) => c.email === normalizedTarget) : disk;
  }

  // Enrich seller names if needed
  chats = chats.map((chat) => {
    const enriched = sellerNames.get(chat.email);
    const hasGenericName = !chat.name || chat.name.toLowerCase() === chat.email;
    return hasGenericName && enriched ? { ...chat, name: enriched } : chat;
  });

  return sortConversations(chats);
}

export async function readProfilesFromStore(): Promise<Record<string, string>> {
  const dbReady = await ensureDbMigrated();
  if (dbReady) {
    const res = await dbQuery<{ profile_key: string; photo: string }>('SELECT profile_key, photo FROM support_profiles');
    if (res) {
      const result: Record<string, string> = {};
      for (const row of res.rows) {
        if (row.profile_key && row.photo) result[row.profile_key] = row.photo;
      }
      return result;
    }
  }
  return readDiskProfiles();
}

export async function getSupportInbox(filterEmail?: string): Promise<{
  chats: SupportConversation[];
  profiles: Record<string, string>;
}> {
  const [chats, profiles] = await Promise.all([
    readChatsFromStore(filterEmail),
    readProfilesFromStore(),
  ]);
  return { chats, profiles };
}

export async function updateSupportProfile(key: string, photo: string | null): Promise<void> {
  await withSupportLock(async () => {
    if (photo) {
      if (typeof photo !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(photo) || photo.length > 2800000) {
        throw new Error('Choose a valid image smaller than 2 MB.');
      }
    }
    const dbReady = await ensureDbMigrated();
    if (dbReady) {
      if (photo) {
        await requireSupportDbQuery(
          `INSERT INTO support_profiles (profile_key, photo, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (profile_key) DO UPDATE SET photo = EXCLUDED.photo, updated_at = CURRENT_TIMESTAMP`,
          [key, photo]
        );
      } else {
        await requireSupportDbQuery('DELETE FROM support_profiles WHERE profile_key = $1', [key]);
      }
    }

    const diskProfiles = readDiskProfiles();
    if (photo) diskProfiles[key] = photo;
    else delete diskProfiles[key];
    writeDiskProfiles(diskProfiles);
    if (!dbReady) markSupportDbNeedsMigration();

    emitSupportEvent({ type: 'profiles-updated', email: key, reason: 'profile' });
  });
}

async function persistConversationToStores(chat: SupportConversation, newMessage?: SupportMessage, updatedMessage?: SupportMessage): Promise<void> {
  const dbReady = await ensureDbMigrated();
  if (dbReady) {
    const persistedConversation = await requireSupportDbQuery<{ id: string }>(
      `INSERT INTO support_conversations (id, seller_email, seller_name, status, presence, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       ON CONFLICT (seller_email) DO UPDATE SET
         seller_name = EXCLUDED.seller_name,
         status = EXCLUDED.status,
         presence = EXCLUDED.presence,
         updated_at = EXCLUDED.updated_at
       RETURNING id`,
      [
        chat.id,
        chat.email,
        chat.name,
        chat.status,
        JSON.stringify(chat.presence || {}),
        chat.messages[0]?.at || chat.updatedAt || new Date().toISOString(),
        chat.updatedAt || new Date().toISOString(),
      ]
    );
    const persistedConversationId = persistedConversation.rows[0]?.id;
    if (!persistedConversationId) throw new Error('Support conversation could not be saved.');

    if (newMessage) {
      await requireSupportDbQuery(
        `INSERT INTO support_messages (id, conversation_id, role, text, attachment, reply, edited, deleted, pinned, hidden_for, read, delivered, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          newMessage.id,
          persistedConversationId,
          newMessage.role,
          newMessage.text || '',
          newMessage.attachment ? JSON.stringify(newMessage.attachment) : null,
          newMessage.reply || null,
          Boolean(newMessage.edited),
          Boolean(newMessage.deleted),
          Boolean(newMessage.pinned),
          JSON.stringify(newMessage.hiddenFor || []),
          Boolean(newMessage.read),
          Boolean(newMessage.delivered),
          newMessage.at,
        ]
      );
    } else if (updatedMessage) {
      await requireSupportDbQuery(
        `UPDATE support_messages
         SET text = $2, attachment = $3::jsonb, edited = $4, deleted = $5, pinned = $6, hidden_for = $7::jsonb, read = $8, delivered = $9
         WHERE id = $1 AND conversation_id = $10`,
        [
          updatedMessage.id,
          updatedMessage.text || '',
          updatedMessage.attachment ? JSON.stringify(updatedMessage.attachment) : null,
          Boolean(updatedMessage.edited),
          Boolean(updatedMessage.deleted),
          Boolean(updatedMessage.pinned),
          JSON.stringify(updatedMessage.hiddenFor || []),
          Boolean(updatedMessage.read),
          Boolean(updatedMessage.delivered),
          persistedConversationId,
        ]
      );
    } else {
      // Bulk sync read/delivered flags for incoming messages
      for (const msg of chat.messages) {
        await requireSupportDbQuery(
          `UPDATE support_messages SET read = $2, delivered = $3 WHERE id = $1 AND conversation_id = $4 AND (read IS DISTINCT FROM $2 OR delivered IS DISTINCT FROM $3)`,
          [msg.id, Boolean(msg.read), Boolean(msg.delivered), persistedConversationId]
        );
      }
    }
  }

  // Keep JSON backup in sync atomically
  const diskChats = readDiskChats();
  const idx = diskChats.findIndex((c) => c.email === chat.email);
  if (idx >= 0) diskChats[idx] = chat;
  else diskChats.push(chat);
  writeDiskChats(sortConversations(diskChats));
  if (!dbReady) markSupportDbNeedsMigration();
}

export async function handleSupportAction(params: {
  action: string;
  email: string;
  role: SupportRole;
  name?: string;
  text?: string;
  attachment?: SupportAttachment | null;
  reply?: string;
  messageId?: string;
}): Promise<{ chat: SupportConversation | null }> {
  const email = normalizeEmail(params.email);
  const role = params.role;
  const action = String(params.action || '');

  return await withSupportLock(async () => {
    const sellerNames = await getSellerDirectoryMap();
    const existingList = await readChatsFromStore(email);
    let chat = existingList[0] || null;

    const preferredName = (() => {
      const provided = String(params.name || '').trim().slice(0, 120);
      const fromDirectory = sellerNames.get(email);
      if (role === 'seller' && provided && provided.toLowerCase() !== email) return provided;
      if (chat?.name && chat.name.toLowerCase() !== email) return chat.name;
      if (fromDirectory) return fromDirectory;
      return provided || email;
    })();

    // Heartbeat / presence / read on a conversation that hasn't started yet: don't create an empty phantom chat!
    if (!chat && ['heartbeat', 'presence', 'read'].includes(action)) {
      return { chat: null };
    }

    if (!chat) {
      chat = {
        id: randomUUID(),
        email,
        name: preferredName,
        status: 'open',
        presence: {},
        messages: [],
        updatedAt: new Date().toISOString(),
      };
    } else if (preferredName && preferredName !== chat.name && chat.name.toLowerCase() === email) {
      chat.name = preferredName;
    }

    const now = Date.now();
    let newMessage: SupportMessage | undefined;
    let updatedMessage: SupportMessage | undefined;
    let sellerNotification: Parameters<typeof createSellerNotificationServer>[0] | undefined;
    let shouldPersist = true;
    let shouldEmit = true;

    if (action === 'heartbeat') {
      const prevPresence = chat.presence?.[role] || 0;
      const wasOffline = now - prevPresence >= 30_000;
      chat.presence = { ...(chat.presence || {}), [role]: now };
      let readStateChanged = false;
      chat.messages.forEach((m) => {
        if (m.role !== role && (!m.read || !m.delivered)) {
          m.delivered = true;
          m.read = true;
          readStateChanged = true;
        }
      });
      // Persist presence / read status; only emit SSE if read state changed or online state transitioned
      shouldPersist = readStateChanged || now - prevPresence >= 10_000;
      shouldEmit = readStateChanged || wasOffline;
    } else if (action === 'presence') {
      const prevPresence = chat.presence?.[role] || 0;
      const wasOffline = now - prevPresence >= 30_000;
      chat.presence = { ...(chat.presence || {}), [role]: now };
      let deliveredChanged = false;
      chat.messages.forEach((m) => {
        if (m.role !== role && !m.delivered) {
          m.delivered = true;
          deliveredChanged = true;
        }
      });
      shouldPersist = deliveredChanged || now - prevPresence >= 10_000;
      shouldEmit = deliveredChanged || wasOffline;
    } else if (action === 'read') {
      let readChanged = false;
      chat.messages.forEach((m) => {
        if (m.role !== role && (!m.read || !m.delivered)) {
          m.read = true;
          m.delivered = true;
          readChanged = true;
        }
      });
      shouldPersist = readChanged;
      shouldEmit = readChanged;
    } else if (action === 'send') {
      const text = String(params.text || '').trim().slice(0, 4000);
      const attachment = params.attachment || undefined;
      if (
        attachment &&
        (!/^data:(image\/(png|jpeg|webp)|audio\/(webm|ogg|mp4))([;,])/.test(attachment.url) ||
          attachment.url.length > 7000000)
      ) {
        throw new Error('Unsupported attachment or file too large.');
      }
      if (!text && !attachment) throw new Error('Enter a message or attach a file.');

      const otherRole = role === 'admin' ? 'seller' : 'admin';
      const createdAt = new Date().toISOString();
      const message: SupportMessage = {
        id: randomUUID(),
        role,
        text,
        at: createdAt,
        delivered: now - (chat.presence?.[otherRole] || 0) < 20000,
        ...(attachment ? { attachment } : {}),
        ...(params.reply ? { reply: String(params.reply).slice(0, 500) } : {}),
      };
      chat.messages.push(message);
      chat.status = 'open';
      chat.presence = { ...(chat.presence || {}), [role]: now };
      chat.updatedAt = createdAt;
      newMessage = message;

      if (role === 'admin') {
        sellerNotification = {
          sellerEmail: email,
          category: 'Support',
          title: 'A new message from Galleria Enterprises, Inc. Support',
          message: [
            { text: 'Galleria Enterprises, Inc. Support sent you a message: ' },
            { text: text || 'An attachment was added to your support conversation.', emphasis: 'blue' },
            { text: ' Open your Support conversation to reply.' },
          ],
          tone: 'info',
          href: '/seller/dashboard?tab=support',
          dedupeKey: `support-message:${message.id}`,
        };
      }
    } else if (action === 'pin') {
      const m = chat.messages.find((msg) => msg.id === params.messageId);
      if (!m || m.deleted) throw new Error('Message not found.');
      m.pinned = !m.pinned;
      updatedMessage = m;
    } else if (action === 'deleteForMe') {
      const m = chat.messages.find((msg) => msg.id === params.messageId);
      if (!m) throw new Error('Message not found.');
      m.hiddenFor = Array.from(new Set([...(m.hiddenFor || []), role]));
      updatedMessage = m;
    } else if (action === 'edit' || action === 'delete') {
      const m = chat.messages.find((msg) => msg.id === params.messageId);
      if (!m || m.role !== role || m.deleted) throw new Error('You can only change your own messages.');
      if (action === 'delete') {
        m.deleted = true;
        m.text = '';
        delete m.attachment;
      } else {
        const text = String(params.text || '').trim().slice(0, 4000);
        if (!text) throw new Error('Message cannot be empty.');
        m.text = text;
        m.edited = true;
      }
      updatedMessage = m;
    } else if (action === 'status' && role === 'admin') {
      chat.status = chat.status === 'closed' ? 'open' : 'closed';
      chat.updatedAt = new Date().toISOString();
      if (chat.status === 'closed') {
        sellerNotification = {
          sellerEmail: email,
          category: 'Support',
          title: 'Your support case has been resolved',
          message: [
            { text: 'Your support conversation has been marked as ' },
            { text: 'resolved', emphasis: 'blue' },
            { text: '. You can contact us again if you still need help.' },
          ],
          tone: 'success',
          href: '/seller/dashboard?tab=support',
          dedupeKey: `support-closed:${chat.id}:${Date.now()}`,
        };
      }
    } else {
      throw new Error('Unsupported action.');
    }

    if (shouldPersist) {
      await persistConversationToStores(chat, newMessage, updatedMessage);
    }
    if (shouldEmit) {
      emitSupportEvent({ type: 'chat-updated', email, reason: action });
    }
    if (sellerNotification) {
      const notification = sellerNotification;
      setImmediate(() => {
        try {
          createSellerNotificationServer(notification);
        } catch (notificationError) {
          console.error('Unable to create support notification:', notificationError);
        }
      });
    }

    return { chat };
  });
}
