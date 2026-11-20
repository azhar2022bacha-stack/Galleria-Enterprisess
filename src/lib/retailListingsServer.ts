import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { isDeepStrictEqual } from 'node:util';
import type { RetailListing } from '@/lib/retailListings';
import type { PoolClient } from 'pg';
import { dbQuery, initDb } from '@/lib/db';

const LISTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'retail_listings.json');
const DATABASE_CATALOG_ENABLED = Boolean(process.env.DATABASE_URL?.trim());

export class RetailListingsChangedError extends Error {
  constructor() {
    super('The Main Store catalog changed during this operation. Refresh and try again.');
  }
}

function ensureListingsFile() {
  fs.mkdirSync(path.dirname(LISTINGS_FILE), { recursive: true });
  if (!fs.existsSync(LISTINGS_FILE)) fs.writeFileSync(LISTINGS_FILE, '[]', 'utf8');
}

function readFileListings(): RetailListing[] {
  ensureListingsFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readRetailListingsFallbackFile(): RetailListing[] {
  return readFileListings();
}

export function writeRetailListingsFallbackFile(listings: RetailListing[]): void {
  ensureListingsFile();
  const temporaryFile = `${LISTINGS_FILE}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(listings, null, 2), { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryFile, LISTINGS_FILE);
}

function parseDatabaseListings(value: unknown): RetailListing[] {
  if (Array.isArray(value)) return value as RetailListing[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed as RetailListing[] : [];
    } catch { return []; }
  }
  return [];
}

export async function readRetailListingsForUpdate(client: PoolClient): Promise<RetailListing[]> {
  const read = () => client.query<{ listings: unknown }>('SELECT listings FROM retail_catalog_state WHERE id = 1 FOR UPDATE');
  let result = await read();
  if (!result.rows[0]) {
    await client.query(
      'INSERT INTO retail_catalog_state (id, listings) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(readFileListings())],
    );
    result = await read();
  }
  if (!result.rows[0]) throw new Error('Unable to initialize the shared product catalog.');
  return parseDatabaseListings(result.rows[0].listings);
}

export async function writeRetailListingsInTransaction(client: PoolClient, listings: RetailListing[]): Promise<void> {
  await client.query('UPDATE retail_catalog_state SET listings = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [JSON.stringify(listings)]);
}

export async function readRetailListings(): Promise<RetailListing[]> {
  if (!DATABASE_CATALOG_ENABLED) return readFileListings();
  if (!(await initDb())) throw new Error('The shared product catalog database is unavailable.');

  const result = await dbQuery<{ listings: unknown }>('SELECT listings FROM retail_catalog_state WHERE id = 1');
  if (!result) throw new Error('Unable to read the shared product catalog.');
  if (result.rows[0]) return parseDatabaseListings(result.rows[0].listings);

  // Seed the shared catalog once from the existing file-based catalog during rollout.
  const legacyListings = readFileListings();
  const inserted = await dbQuery(
    `INSERT INTO retail_catalog_state (id, listings) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id`,
    [JSON.stringify(legacyListings)],
  );
  if (!inserted) throw new Error('Unable to initialize the shared product catalog.');
  const seeded = await dbQuery<{ listings: unknown }>('SELECT listings FROM retail_catalog_state WHERE id = 1');
  if (!seeded?.rows[0]) throw new Error('Unable to load the shared product catalog.');
  return parseDatabaseListings(seeded.rows[0].listings);
}

export async function writeRetailListingsAtomically(listings: RetailListing[], previous: RetailListing[]): Promise<void> {
  if (DATABASE_CATALOG_ENABLED) {
    if (!(await initDb())) throw new Error('The shared product catalog database is unavailable.');
    const result = await dbQuery(
      `UPDATE retail_catalog_state SET listings = $1::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1 AND listings = $2::jsonb RETURNING id`,
      [JSON.stringify(listings), JSON.stringify(previous)],
    );
    if (!result) throw new Error('Unable to save the shared product catalog.');
    if (!result.rowCount) throw new RetailListingsChangedError();
    return;
  }
  if (!isDeepStrictEqual(readFileListings(), JSON.parse(JSON.stringify(previous)))) throw new RetailListingsChangedError();
  writeRetailListingsFallbackFile(listings);
}
