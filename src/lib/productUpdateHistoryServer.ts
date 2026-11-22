import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import type { RetailListing } from '@/lib/retailListings';
import { dbQuery, initDb } from '@/lib/db';

export interface ProductUpdateBatch {
  id: string;
  fileName: string;
  createdAt: string;
  committedAt: string;
  createdBy: string;
  status: 'committed' | 'rolled_back';
  createdCount: number;
  updatedCount: number;
  productIds: string[];
  createdProductIds: string[];
  previousListings: RetailListing[];
  categoryCounts: { category: string; subcategory: string; created: number; updated: number; totalBefore?: number; totalAfter?: number }[];
  rolledBackAt?: string;
}

const HISTORY_FILE = path.join(process.cwd(), 'src', 'data', 'product_update_history.json');
const DATABASE_HISTORY_ENABLED = Boolean(process.env.DATABASE_URL?.trim());

function ensureFile() {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
}

function readFileHistory(): ProductUpdateBatch[] {
  ensureFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readProductUpdateHistoryFallbackFile(): ProductUpdateBatch[] {
  return readFileHistory();
}

export function writeProductUpdateHistoryFallbackFile(batches: ProductUpdateBatch[]): void {
  ensureFile();
  const temporaryFile = `${HISTORY_FILE}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(batches, null, 2), { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryFile, HISTORY_FILE);
}

function parseDatabaseHistory(value: unknown): ProductUpdateBatch[] {
  if (Array.isArray(value)) return value as ProductUpdateBatch[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed as ProductUpdateBatch[] : [];
    } catch { return []; }
  }
  return [];
}

export async function readProductUpdateHistoryForUpdate(client: PoolClient): Promise<ProductUpdateBatch[]> {
  const read = () => client.query<{ batches: unknown }>('SELECT batches FROM product_update_history_state WHERE id = 1 FOR UPDATE');
  let result = await read();
  if (!result.rows[0]) {
    await client.query(
      'INSERT INTO product_update_history_state (id, batches) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(readFileHistory())],
    );
    result = await read();
  }
  if (!result.rows[0]) throw new Error('Unable to initialize product import history.');
  return parseDatabaseHistory(result.rows[0].batches);
}

export async function writeProductUpdateHistoryInTransaction(client: PoolClient, batches: ProductUpdateBatch[]): Promise<void> {
  await client.query(
    'UPDATE product_update_history_state SET batches = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [JSON.stringify(batches)],
  );
}

export async function readProductUpdateHistory(): Promise<ProductUpdateBatch[]> {
  if (!DATABASE_HISTORY_ENABLED) return readFileHistory();
  if (!(await initDb())) throw new Error('The shared product catalog database is unavailable.');

  const result = await dbQuery<{ batches: unknown }>('SELECT batches FROM product_update_history_state WHERE id = 1');
  if (!result) throw new Error('Unable to read product import history.');
  if (result.rows[0]) return parseDatabaseHistory(result.rows[0].batches);

  const legacyHistory = readFileHistory();
  const inserted = await dbQuery(
    `INSERT INTO product_update_history_state (id, batches) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id`,
    [JSON.stringify(legacyHistory)],
  );
  if (!inserted) throw new Error('Unable to initialize product import history.');
  const seeded = await dbQuery<{ batches: unknown }>('SELECT batches FROM product_update_history_state WHERE id = 1');
  if (!seeded?.rows[0]) throw new Error('Unable to load product import history.');
  return parseDatabaseHistory(seeded.rows[0].batches);
}

export async function writeProductUpdateHistory(batches: ProductUpdateBatch[]): Promise<void> {
  if (DATABASE_HISTORY_ENABLED) {
    if (!(await initDb())) throw new Error('The shared product catalog database is unavailable.');
    const result = await dbQuery(
      `INSERT INTO product_update_history_state (id, batches, updated_at)
       VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET batches = EXCLUDED.batches, updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [JSON.stringify(batches)],
    );
    if (!result) throw new Error('Unable to save product import history.');
    return;
  }

  ensureFile();
  const temporaryFile = `${HISTORY_FILE}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(batches, null, 2), { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryFile, HISTORY_FILE);
}
