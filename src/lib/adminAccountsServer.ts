import fs from 'fs';
import path from 'path';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'crypto';
import { dbQuery } from '@/lib/db';
import { validatePasswordComplexity } from '@/lib/passwordValidation';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'admin_accounts.json');
const PASSWORD_BYTES = 64;

export interface AdminAccountRecord {
  id: string;
  email: string;
  isRoot: boolean;
  status: 'Active' | 'Suspended';
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLogin?: string;
}

export interface PublicAdminAccount {
  id: string;
  email: string;
  role: 'admin·root' | 'Admin';
  isRoot: boolean;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLogin?: string;
}

type DbAdminRow = {
  id: string;
  email: string;
  is_root: boolean;
  status: 'Active' | 'Suspended';
  password_hash: string;
  password_salt: string;
  created_at: string | Date;
  last_login: string | Date | null;
};

function toIso(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function fromDb(row: DbAdminRow): AdminAccountRecord {
  return {
    id: row.id,
    email: row.email,
    isRoot: Boolean(row.is_root),
    status: row.status,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    lastLogin: toIso(row.last_login),
  };
}

function readFileAccounts(): AdminAccountRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed.filter((row) => row && row.id && row.email && row.passwordHash && row.passwordSalt) : [];
  } catch {
    return [];
  }
}

function writeFileAccounts(accounts: AdminAccountRecord[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(accounts, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

async function readAccountsFromPrimaryStore(): Promise<AdminAccountRecord[]> {
  const result = await dbQuery<DbAdminRow>(
    `SELECT id, email, is_root, status, password_hash, password_salt, created_at, last_login
     FROM admin_accounts ORDER BY is_root DESC, created_at ASC`
  );
  if (!result) return readFileAccounts();

  let accounts = result.rows.map(fromDb);
  const diskAccounts = readFileAccounts();
  if (accounts.length === 0 && diskAccounts.length > 0) {
    for (const diskAccount of diskAccounts) {
      await dbQuery(
        `INSERT INTO admin_accounts (id, email, role, is_root, status, password_hash, password_salt, created_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [diskAccount.id, diskAccount.email, diskAccount.isRoot ? 'admin·root' : 'Admin', diskAccount.isRoot, diskAccount.status, diskAccount.passwordHash, diskAccount.passwordSalt, diskAccount.createdAt, diskAccount.lastLogin || null]
      );
    }
    const migrated = await dbQuery<DbAdminRow>(
      `SELECT id, email, is_root, status, password_hash, password_salt, created_at, last_login
       FROM admin_accounts ORDER BY is_root DESC, created_at ASC`
    );
    if (migrated) accounts = migrated.rows.map(fromDb);
  }
  // Keep a fallback copy intact if the primary database has no rows yet and migration did not complete.
  if (accounts.length === 0 && diskAccounts.length > 0) return diskAccounts;
  accounts.sort((left, right) => Number(right.isRoot) - Number(left.isRoot) || left.createdAt.localeCompare(right.createdAt));
  if (JSON.stringify(accounts) !== JSON.stringify(diskAccounts)) writeFileAccounts(accounts);
  return accounts;
}

async function makePasswordHash(password: string, salt: string): Promise<string> {
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, PASSWORD_BYTES, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
  return hash.toString('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function ensureComplexPassword(password: string): void {
  if (password.length > 256) throw new Error('Password must be 256 characters or fewer.');
  const result = validatePasswordComplexity(password);
  if (!result.isValid) throw new Error(result.errors[0]);
}

async function insertAccount(input: {
  email: string;
  password: string;
  isRoot: boolean;
}): Promise<AdminAccountRecord> {
  const email = normalizeEmail(input.email);
  if (email.length > 255) throw new Error('Email address must be 255 characters or fewer.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  ensureComplexPassword(input.password);
  const salt = randomBytes(16).toString('hex');
  const record: AdminAccountRecord = {
    id: randomUUID(),
    email,
    isRoot: input.isRoot,
    status: 'Active',
    passwordHash: await makePasswordHash(input.password, salt),
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };

  const inserted = await dbQuery(
    `INSERT INTO admin_accounts (id, email, role, is_root, status, password_hash, password_salt, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [record.id, record.email, record.isRoot ? 'admin·root' : 'Admin', record.isRoot, record.status, record.passwordHash, record.passwordSalt, record.createdAt]
  );
  if (!inserted) {
    const accounts = readFileAccounts();
    if (accounts.some((account) => account.email === email)) throw new Error('An admin account with this email already exists.');
    accounts.push(record);
    writeFileAccounts(accounts);
  } else {
    const accounts = readFileAccounts().filter((account) => account.email !== email);
    accounts.push(record);
    writeFileAccounts(accounts);
  }
  return record;
}

/** Seed the first root account from environment configuration when set. */
export async function getAdminAccounts(): Promise<AdminAccountRecord[]> {
  let accounts = await readAccountsFromPrimaryStore();
  if (!accounts.some((account) => account.isRoot) && process.env.ADMIN_ROOT_PASSWORD) {
    try {
      await insertAccount({
        email: process.env.ADMIN_ROOT_EMAIL || 'admin@buyxoco.com',
        password: process.env.ADMIN_ROOT_PASSWORD,
        isRoot: true,
      });
    } catch (error) {
      // Another server may have initialized the root account at the same time.
      console.warn('Unable to initialize the root admin account:', error instanceof Error ? error.message : error);
    }
    accounts = await readAccountsFromPrimaryStore();
  }
  return accounts;
}

export async function getAdminAccountByEmail(email: string): Promise<AdminAccountRecord | null> {
  const normalized = normalizeEmail(email);
  return (await getAdminAccounts()).find((account) => account.email === normalized) || null;
}

export async function getAdminAccountById(id: string): Promise<AdminAccountRecord | null> {
  return (await getAdminAccounts()).find((account) => account.id === id) || null;
}

export function toPublicAdminAccount(account: AdminAccountRecord): PublicAdminAccount {
  return {
    id: account.id,
    email: account.email,
    role: account.isRoot ? 'admin·root' : 'Admin',
    isRoot: account.isRoot,
    status: account.status,
    createdAt: account.createdAt,
    lastLogin: account.lastLogin,
  };
}

export async function verifyAdminPassword(account: AdminAccountRecord, password: string): Promise<boolean> {
  if (!password || password.length > 256) return false;
  const computed = Buffer.from(await makePasswordHash(password, account.passwordSalt), 'hex');
  const expected = Buffer.from(account.passwordHash, 'hex');
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

async function updateAccount(id: string, patch: Partial<AdminAccountRecord>): Promise<boolean> {
  const passwordFields = patch.passwordHash !== undefined || patch.passwordSalt !== undefined;
  const result = passwordFields
    ? await dbQuery(
        `UPDATE admin_accounts SET password_hash = COALESCE($2, password_hash), password_salt = COALESCE($3, password_salt) WHERE id = $1 RETURNING id`,
        [id, patch.passwordHash ?? null, patch.passwordSalt ?? null]
      )
    : patch.status
      ? await dbQuery(`UPDATE admin_accounts SET status = $2 WHERE id = $1 RETURNING id`, [id, patch.status])
      : patch.lastLogin
        ? await dbQuery(`UPDATE admin_accounts SET last_login = $2 WHERE id = $1 RETURNING id`, [id, patch.lastLogin])
        : null;

  if (result) {
    if (!(result.rowCount || 0)) return false;
    const accounts = readFileAccounts();
    const index = accounts.findIndex((account) => account.id === id);
    if (index >= 0) {
      accounts[index] = { ...accounts[index], ...patch };
      writeFileAccounts(accounts);
    }
    return true;
  }
  const accounts = readFileAccounts();
  const index = accounts.findIndex((account) => account.id === id);
  if (index < 0) return false;
  accounts[index] = { ...accounts[index], ...patch };
  writeFileAccounts(accounts);
  return true;
}

export async function updateAdminPassword(id: string, newPassword: string): Promise<boolean> {
  ensureComplexPassword(newPassword);
  const salt = randomBytes(16).toString('hex');
  const passwordHash = await makePasswordHash(newPassword, salt);
  return updateAccount(id, { passwordHash, passwordSalt: salt });
}

export async function setAdminLastLogin(id: string): Promise<void> {
  await updateAccount(id, { lastLogin: new Date().toISOString() });
}

export async function createAdminAccount(email: string, password: string): Promise<AdminAccountRecord> {
  const normalized = normalizeEmail(email);
  if (normalized.length > 255) throw new Error('Email address must be 255 characters or fewer.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Enter a valid email address.');
  if ((await getAdminAccounts()).some((account) => account.email === normalized)) {
    throw new Error('An admin account with this email already exists.');
  }
  return insertAccount({ email: normalized, password, isRoot: false });
}

export async function setAdminStatus(id: string, status: 'Active' | 'Suspended'): Promise<boolean> {
  const account = await getAdminAccountById(id);
  if (!account || account.isRoot) return false;
  return updateAccount(id, { status });
}

export async function removeAdminAccount(id: string): Promise<boolean> {
  const account = await getAdminAccountById(id);
  if (!account || account.isRoot) return false;
  const result = await dbQuery(`DELETE FROM admin_accounts WHERE id = $1 AND is_root = FALSE RETURNING id`, [id]);
  if (result) {
    if (!(result.rowCount || 0)) return false;
    writeFileAccounts(readFileAccounts().filter((entry) => entry.id !== id));
    return true;
  }
  const accounts = readFileAccounts();
  const next = accounts.filter((entry) => entry.id !== id || entry.isRoot);
  if (next.length === accounts.length) return false;
  writeFileAccounts(next);
  return true;
}

export async function bootstrapRootAdmin(email: string, password: string): Promise<AdminAccountRecord> {
  const existingRoot = (await getAdminAccounts()).find((account) => account.isRoot);
  if (existingRoot) throw new Error('The main admin account is already set up. Please sign in.');
  const normalized = normalizeEmail(email);
  if (normalized.length > 255) throw new Error('Email address must be 255 characters or fewer.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Enter a valid email address.');
  if ((await getAdminAccounts()).some((account) => account.email === normalized)) throw new Error('An account with this email already exists.');
  return insertAccount({ email: normalized, password, isRoot: true });
}
