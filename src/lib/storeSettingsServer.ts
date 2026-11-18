import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { dbQuery, initDb } from '@/lib/db';

export type StoreMetadataValue = string | number | boolean | null;

export interface StoreCurrency {
  code: string;
  name: string;
  taxInclusive: boolean;
}

export interface StoreSettings {
  id: string;
  name: string;
  defaultCurrencyCode: string;
  defaultRegion: string;
  defaultSalesChannel: string;
  defaultLocation: string;
  currencies: StoreCurrency[];
  metadata: Record<string, StoreMetadataValue>;
  createdAt: string;
  updatedAt: string;
}

const SETTINGS_ID = 'default';
const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'store_settings.json');

function defaultSettings(): StoreSettings {
  const now = new Date().toISOString();
  return {
    id: `store-${randomUUID()}`,
    name: 'Buyxoco',
    defaultCurrencyCode: 'USD',
    defaultRegion: '',
    defaultSalesChannel: 'Default Sales Channel',
    defaultLocation: 'US Warehouse',
    currencies: [{ code: 'USD', name: 'US Dollar', taxInclusive: false }],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function writeFallback(settings: StoreSettings): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temporaryFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(settings, null, 2), 'utf8');
  fs.renameSync(temporaryFile, DATA_FILE);
}

function readFallback(): StoreSettings {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string' && Array.isArray(parsed.currencies)) {
        return normalizeStoreSettings(parsed, defaultSettings(), false);
      }
    }
  } catch (error) {
    console.error('Unable to read store settings fallback:', error);
  }
  const settings = defaultSettings();
  writeFallback(settings);
  return settings;
}

function stringField(value: unknown, current: string, maxLength: number): string {
  if (value === undefined) return current;
  if (typeof value !== 'string') throw new Error('Store setting values must be text.');
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error(`Store setting values must be ${maxLength} characters or fewer.`);
  return normalized;
}

function metadataField(value: unknown, current: Record<string, StoreMetadataValue>): Record<string, StoreMetadataValue> {
  if (value === undefined) return current;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Metadata must be a JSON object.');
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 100) throw new Error('Metadata can contain at most 100 keys.');
  const metadata: Record<string, StoreMetadataValue> = {};
  for (const [rawKey, entryValue] of entries) {
    const key = rawKey.trim();
    if (!key || key.length > 100) throw new Error('Metadata keys must contain 1 to 100 characters.');
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') throw new Error(`Metadata key “${key}” is reserved.`);
    if (typeof entryValue !== 'string' && typeof entryValue !== 'number' && typeof entryValue !== 'boolean' && entryValue !== null) {
      throw new Error(`Metadata value for “${key}” must be text, a number, a boolean, or null.`);
    }
    if (typeof entryValue === 'string' && entryValue.length > 4000) throw new Error(`Metadata value for “${key}” is too long.`);
    metadata[key] = entryValue;
  }
  return metadata;
}

function currencyField(value: unknown, current: StoreCurrency[]): StoreCurrency[] {
  if (value === undefined) return current;
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new Error('Add at least one currency and no more than 100.');
  }
  const seen = new Set<string>();
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Each currency must be an object.');
    const item = entry as Record<string, unknown>;
    const code = String(item.code || '').trim().toUpperCase();
    const name = String(item.name || '').trim();
    if (!/^[A-Z]{3}$/.test(code)) throw new Error('Currency codes must be three letters, such as USD or EUR.');
    if (!name || name.length > 80) throw new Error(`Enter a name of up to 80 characters for ${code}.`);
    if (seen.has(code)) throw new Error(`Currency ${code} is listed more than once.`);
    seen.add(code);
    return { code, name, taxInclusive: Boolean(item.taxInclusive ?? item.tax_inclusive) };
  });
}

function pick(input: Record<string, unknown>, camel: string, snake: string): unknown {
  return input[camel] !== undefined ? input[camel] : input[snake];
}

export function normalizeStoreSettings(
  input: unknown,
  current: StoreSettings,
  updateTimestamp = true
): StoreSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Store settings must be a JSON object.');
  const values = input as Record<string, unknown>;
  const currencies = currencyField(pick(values, 'currencies', 'supported_currencies'), current.currencies);
  const defaultCurrencyCode = stringField(pick(values, 'defaultCurrencyCode', 'default_currency_code'), current.defaultCurrencyCode, 3).toUpperCase();
  if (!currencies.some((currency) => currency.code === defaultCurrencyCode)) {
    throw new Error('The default currency must be included in the supported currencies list.');
  }

  const settings: StoreSettings = {
    id: current.id,
    name: stringField(values.name, current.name, 120),
    defaultCurrencyCode,
    defaultRegion: stringField(pick(values, 'defaultRegion', 'default_region'), current.defaultRegion, 255),
    defaultSalesChannel: stringField(pick(values, 'defaultSalesChannel', 'default_sales_channel'), current.defaultSalesChannel, 255),
    defaultLocation: stringField(pick(values, 'defaultLocation', 'default_location'), current.defaultLocation, 255),
    currencies,
    metadata: metadataField(values.metadata, current.metadata),
    createdAt: current.createdAt,
    updatedAt: updateTimestamp ? new Date().toISOString() : current.updatedAt,
  };
  if (!settings.name) throw new Error('Store name is required.');
  return settings;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!(await initDb())) return readFallback();

  const result = await dbQuery<{ settings: StoreSettings }>(
    'SELECT settings FROM admin_store_settings WHERE id = $1',
    [SETTINGS_ID]
  );
  if (!result) throw new Error('Unable to read store settings from the database.');
  if (result.rows[0]?.settings) {
    const settings = normalizeStoreSettings(result.rows[0].settings, defaultSettings(), false);
    return settings;
  }

  const fallback = readFallback();
  const inserted = await dbQuery(
    `INSERT INTO admin_store_settings (id, settings, updated_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO NOTHING`,
    [SETTINGS_ID, JSON.stringify(fallback), fallback.updatedAt]
  );
  if (!inserted) throw new Error('Unable to initialize store settings in the database.');
  const reloaded = await dbQuery<{ settings: StoreSettings }>(
    'SELECT settings FROM admin_store_settings WHERE id = $1',
    [SETTINGS_ID]
  );
  if (!reloaded?.rows[0]?.settings) throw new Error('Unable to load store settings after initialization.');
  return normalizeStoreSettings(reloaded.rows[0].settings, fallback, false);
}

export async function saveStoreSettings(input: unknown): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const settings = normalizeStoreSettings(input, current);

  if (await initDb()) {
    const result = await dbQuery(
      `INSERT INTO admin_store_settings (id, settings, updated_at)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = EXCLUDED.updated_at`,
      [SETTINGS_ID, JSON.stringify(settings), settings.updatedAt]
    );
    if (!result) throw new Error('Unable to save store settings to the database.');
  }

  writeFallback(settings);
  return settings;
}
