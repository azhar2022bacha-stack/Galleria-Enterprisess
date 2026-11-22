import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import {
  InviteCode,
  RegisteredUserInfo,
  EXACT_INVALID_INVITE_ERROR,
  EXACT_EXHAUSTED_INVITE_ERROR,
} from './inviteCodes';
import { dbQuery, isDbConnected } from './db';
import {
  hashPasswordWithSalt,
  verifyPasswordWithSalt,
  verifyCombinedPasswordHash,
} from './passwordValidation';
import { getAllKycSubmissionsServer, getKycSubmissionByEmailServer, type KycSubmission } from './kycServer';
import { readAllSellerProductsMap } from './sellerProductsServer';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'invite_codes.json');
const SELLERS_FILE = path.join(process.cwd(), 'src', 'data', 'sellers.json');

// In-memory cache for fast response and smooth fallback
let cache: InviteCode[] | null = null;
let hasSyncedToDb = false;

export interface StoredSellerAccount {
  id?: string | number;
  fullName: string;
  email: string;
  shopName: string;
  loginHash: string;
  transactionHash?: string;
  salt?: string;
  inviteCode?: string;
  status?: 'approved' | 'review' | 'suspended';
  packageTier?: string;
  phone?: string;
  idStatus?: string;
  isApproved?: boolean;
  createdAt?: string;
}

function ensureDataFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
    if (!fs.existsSync(SELLERS_FILE)) {
      fs.writeFileSync(SELLERS_FILE, '[]', 'utf8');
    }
  } catch (err) {
    console.error('Failed to ensure data files', err);
  }
}

function readDiskSellers(): StoredSellerAccount[] {
  ensureDataFile();
  try {
    const content = fs.readFileSync(SELLERS_FILE, 'utf8');
    const clean = content.replace(/^\uFEFF/, '').trim();
    if (!clean) return [];
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
    return [];
  } catch {
    return [];
  }
}

function preserveStoredSellerVerification(
  rawStatus: string | undefined,
  rawIdStatus: string | undefined
): { status: 'approved' | 'review' | 'suspended'; idStatus: string } {
  const status = (rawStatus || 'review').trim().toLowerCase();
  const idStatus = (rawIdStatus || 'No ID uploaded').trim() || 'No ID uploaded';
  if (status === 'suspended') return { status: 'suspended', idStatus };
  // Account approval and government-ID verification are separate states.
  // Keep an approved shop approved even if its owner has not submitted ID documents yet.
  if (status === 'approved') return { status: 'approved', idStatus: idStatus.toLowerCase() === 'verified' ? 'Verified' : idStatus };
  return { status: 'review', idStatus };
}

function writeDiskSellers(sellers: StoredSellerAccount[]): boolean {
  ensureDataFile();
  try {
    fs.writeFileSync(SELLERS_FILE, JSON.stringify(sellers, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing sellers file', err);
    return false;
  }
}

/**
 * Read from local persistent file storage
 */
function readDiskCodes(): InviteCode[] {
  ensureDataFile();
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const clean = content.replace(/^\uFEFF/, '').trim();
    if (!clean) return [];
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error reading invite codes file', err);
    return [];
  }
}

/**
 * Write to local persistent file storage
 */
function writeDiskCodes(codes: InviteCode[]) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(codes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing invite codes file', err);
  }
}

/**
 * Sync disk codes to PostgreSQL if database was empty
 */
async function syncDiskToDbIfEmpty() {
  if (hasSyncedToDb) return;
  const dbOnline = await isDbConnected();
  if (!dbOnline) return;

  try {
    const countRes = await dbQuery<{ count: string }>('SELECT COUNT(*) as count FROM invite_codes');
    const dbCount = Number(countRes?.rows?.[0]?.count || 0);

    const diskCodes = readDiskCodes();
    if (dbCount === 0 && diskCodes.length > 0) {
      for (const item of diskCodes) {
        await dbQuery(
          `INSERT INTO invite_codes (id, code, note, usage, max_usage, status, created_str)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            item.id,
            item.code,
            item.note || '',
            item.usage || 0,
            item.maxUsage || 1,
            item.status || 'usable',
            item.created || new Date().toISOString(),
          ]
        );

        if (Array.isArray(item.usedBy)) {
          for (const u of item.usedBy) {
            const userInfo = typeof u === 'string' ? { fullName: 'Merchant', email: u, shopName: "Merchant's Shop" } : u;
            await dbQuery(
              `INSERT INTO registered_users (invite_code_id, invite_code, full_name, email, shop_name, registered_at)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                item.id,
                item.code,
                userInfo.fullName,
                userInfo.email,
                userInfo.shopName,
                userInfo.registeredAt || new Date().toISOString(),
              ]
            );
          }
        }
      }
      console.log(`Synced ${diskCodes.length} codes from disk into PostgreSQL.`);
    }
    hasSyncedToDb = true;
  } catch (err: any) {
    console.warn('Initial sync to PostgreSQL skipped:', err.message);
  }
}

/**
 * Get all invitation codes from PostgreSQL with registered users
 */
export async function getStoredCodesServer(): Promise<InviteCode[]> {
  await syncDiskToDbIfEmpty();
  const dbOnline = await isDbConnected();

  if (dbOnline) {
    try {
      const codesRes = await dbQuery<{
        id: string;
        code: string;
        note: string;
        usage: number;
        max_usage: number;
        status: 'usable' | 'exhausted' | 'disabled';
        created_str: string;
      }>('SELECT * FROM invite_codes ORDER BY created_at DESC');

      const usersRes = await dbQuery<{
        invite_code_id: string;
        invite_code: string;
        full_name: string;
        email: string;
        shop_name: string;
        registered_at: string;
      }>('SELECT * FROM registered_users ORDER BY created_at ASC');

      if (codesRes && codesRes.rows) {
        const usersByCodeId: Record<string, RegisteredUserInfo[]> = {};
        for (const u of usersRes?.rows || []) {
          if (!usersByCodeId[u.invite_code_id]) {
            usersByCodeId[u.invite_code_id] = [];
          }
          usersByCodeId[u.invite_code_id].push({
            fullName: u.full_name,
            email: u.email,
            shopName: u.shop_name,
            registeredAt: u.registered_at,
          });
        }

        const formatted: InviteCode[] = codesRes.rows.map((row) => ({
          id: row.id,
          code: row.code,
          note: row.note || '',
          usage: Number(row.usage) || 0,
          maxUsage: Number(row.max_usage) || 1,
          status: row.status,
          created: row.created_str,
          usedBy: usersByCodeId[row.id] || [],
        }));

        cache = formatted;
        writeDiskCodes(formatted);
        return formatted;
      }
    } catch (err: any) {
      console.warn('PostgreSQL fetch error, reading from disk backup:', err.message);
    }
  }

  // Resilient fallback to persistent disk storage
  const disk = readDiskCodes();
  cache = disk;
  return disk;
}

/**
 * Generate N invitation codes with M uses each in PostgreSQL and persistent storage
 */
export async function generateCodesServer(
  howMany: number,
  usesPerCode: number,
  note = ''
): Promise<InviteCode[]> {
  const count = Math.max(1, Math.min(500, Number(howMany) || 1));
  const maxUses = Math.max(1, Number(usesPerCode) || 1);

  const now = new Date();
  const formattedDate = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
    now.getSeconds()
  ).padStart(2, '0')}`;

  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newItems: InviteCode[] = [];

  for (let i = 0; i < count; i++) {
    let randCode = 'BX-';
    for (let j = 0; j < 6; j++) {
      randCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    newItems.push({
      id: `inv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      code: randCode,
      note: note.trim(),
      usage: 0,
      maxUsage: maxUses,
      status: 'usable',
      created: formattedDate,
      usedBy: [],
    });
  }

  // Insert into PostgreSQL
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    for (const item of newItems) {
      try {
        await dbQuery(
          `INSERT INTO invite_codes (id, code, note, usage, max_usage, status, created_str)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.id, item.code, item.note, item.usage, item.maxUsage, item.status, item.created]
        );
      } catch (err: any) {
        console.warn('Failed to insert code into PostgreSQL:', err.message);
      }
    }
  }

  // Save to persistent disk mirror as safety backup
  const existing = await getStoredCodesServer();
  const updated = [...newItems, ...existing];
  cache = updated;
  writeDiskCodes(updated);

  return newItems;
}

/**
 * Validate an invitation code from PostgreSQL
 */
export async function validateCodeServer(codeStr: string): Promise<{
  isValid: boolean;
  error?: string;
  invite?: InviteCode;
  remainingUses?: number;
}> {
  const trimmed = (codeStr || '').trim().toUpperCase();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Invitation code is required to register an account.',
    };
  }

  const allCodes = await getStoredCodesServer();
  const found = allCodes.find((c) => c.code.toUpperCase() === trimmed);

  if (!found || found.status === 'disabled') {
    return {
      isValid: false,
      error: EXACT_INVALID_INVITE_ERROR,
    };
  }

  const remaining = Math.max(0, found.maxUsage - found.usage);

  if (found.status === 'exhausted' || remaining <= 0 || found.usage >= found.maxUsage) {
    return {
      isValid: false,
      error: EXACT_EXHAUSTED_INVITE_ERROR,
      invite: found,
      remainingUses: 0,
    };
  }

  return {
    isValid: true,
    invite: found,
    remainingUses: remaining,
  };
}

/**
 * Consume 1 usage of an invitation code in PostgreSQL and record user registration
 */
export async function consumeCodeServer(
  codeStr: string,
  user: { fullName: string; email: string; shopName: string }
): Promise<{ success: boolean; error?: string; remainingUses?: number; invite?: InviteCode }> {
  const trimmed = (codeStr || '').trim().toUpperCase();
  const allCodes = await getStoredCodesServer();
  const index = allCodes.findIndex((c) => c.code.toUpperCase() === trimmed);

  if (index === -1) {
    return { success: false, error: EXACT_INVALID_INVITE_ERROR };
  }

  const target = allCodes[index];
  if (target.status === 'disabled') {
    return { success: false, error: EXACT_INVALID_INVITE_ERROR };
  }

  if (target.usage >= target.maxUsage || target.status === 'exhausted') {
    return { success: false, error: EXACT_EXHAUSTED_INVITE_ERROR };
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const userInfo: RegisteredUserInfo = {
    fullName: user.fullName || 'Merchant',
    email: user.email,
    shopName: user.shopName || 'Wholesale Shop',
    registeredAt: formattedDate,
  };

  const newUsage = target.usage + 1;
  const isExhausted = newUsage >= target.maxUsage;
  const updatedStatus = isExhausted ? 'exhausted' : 'usable';

  // Execute in PostgreSQL
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      await dbQuery(
        `UPDATE invite_codes
         SET usage = $1, status = $2
         WHERE id = $3`,
        [newUsage, updatedStatus, target.id]
      );

      await dbQuery(
        `INSERT INTO registered_users (invite_code_id, invite_code, full_name, email, shop_name, registered_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [target.id, target.code, userInfo.fullName, userInfo.email, userInfo.shopName, userInfo.registeredAt]
      );
    } catch (err: any) {
      console.warn('PostgreSQL update error during consume:', err.message);
    }
  }

  const updatedUsedBy = [...(target.usedBy || []), userInfo];
  const updatedTarget: InviteCode = {
    ...target,
    usage: newUsage,
    status: updatedStatus,
    usedBy: updatedUsedBy,
  };

  const updatedList = [...allCodes];
  updatedList[index] = updatedTarget;
  cache = updatedList;
  writeDiskCodes(updatedList);

  return {
    success: true,
    remainingUses: Math.max(0, target.maxUsage - newUsage),
    invite: updatedTarget,
  };
}


/**
 * Record seller user account in PostgreSQL and disk storage
 */
export async function recordSellerAccount(sellerData: {
  fullName: string;
  email: string;
  shopName: string;
  loginHash: string;
  transactionHash: string;
  salt?: string;
  inviteCode: string;
  status?: 'approved' | 'review' | 'suspended';
  idStatus?: string;
  packageTier?: string;
  phone?: string;
}): Promise<void> {
  const normalizedEmail = sellerData.email.trim().toLowerCase();
  const salt = sellerData.salt || '';
  const combinedLoginHash = salt ? `${salt}$${sellerData.loginHash}` : sellerData.loginHash;
  const now = new Date().toISOString();
  const status = sellerData.status || 'review';
  const idStatus = sellerData.idStatus || (status === 'approved' ? 'Verified' : 'No ID uploaded');
  const packageTier = sellerData.packageTier || 'Free Shop';
  const phone = sellerData.phone || '';

  const diskAccount: StoredSellerAccount = {
    fullName: sellerData.fullName,
    email: normalizedEmail,
    shopName: sellerData.shopName,
    loginHash: combinedLoginHash,
    transactionHash: sellerData.transactionHash,
    salt,
    inviteCode: sellerData.inviteCode,
    status,
    idStatus,
    packageTier,
    phone,
    createdAt: now,
  };

  // 1. Dual persistence: Save to disk mirror
  const diskSellers = readDiskSellers();
  const existingIdx = diskSellers.findIndex((s) => s.email.toLowerCase() === normalizedEmail);
  if (existingIdx >= 0) {
    diskSellers[existingIdx] = { ...diskSellers[existingIdx], ...diskAccount };
  } else {
    diskSellers.push(diskAccount);
  }
  writeDiskSellers(diskSellers);

  // 2. Save to PostgreSQL database
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      await dbQuery(
        `INSERT INTO sellers (full_name, email, shop_name, login_hash, transaction_hash, salt, invite_code, status, package_tier, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             shop_name = EXCLUDED.shop_name,
             login_hash = EXCLUDED.login_hash,
             transaction_hash = EXCLUDED.transaction_hash,
             salt = EXCLUDED.salt,
             status = COALESCE(sellers.status, EXCLUDED.status),
             package_tier = COALESCE(sellers.package_tier, EXCLUDED.package_tier),
             phone = COALESCE(sellers.phone, EXCLUDED.phone)`,
        [
          sellerData.fullName,
          normalizedEmail,
          sellerData.shopName,
          combinedLoginHash,
          sellerData.transactionHash,
          salt,
          sellerData.inviteCode,
          status,
          packageTier,
          phone,
        ]
      );
      console.log('Seller account permanently stored in PostgreSQL:', normalizedEmail);
    } catch (err: any) {
      console.warn('Failed to record seller account in PostgreSQL:', err.message);
    }
  }
}

/**
 * Toggle code status between usable/exhausted and disabled
 */
export async function toggleCodeStatusServer(id: string): Promise<InviteCode[]> {
  const allCodes = await getStoredCodesServer();
  const target = allCodes.find((c) => c.id === id);
  if (!target) return allCodes;

  let nextStatus: 'usable' | 'exhausted' | 'disabled';
  if (target.status === 'disabled') {
    nextStatus = target.usage >= target.maxUsage ? 'exhausted' : 'usable';
  } else {
    nextStatus = 'disabled';
  }

  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      await dbQuery('UPDATE invite_codes SET status = $1 WHERE id = $2', [nextStatus, id]);
    } catch (err: any) {
      console.warn('Failed to update status in PostgreSQL:', err.message);
    }
  }

  const updated = allCodes.map((item) => {
    if (item.id === id) {
      return { ...item, status: nextStatus };
    }
    return item;
  });

  cache = updated;
  writeDiskCodes(updated);
  return updated;
}

/**
 * Clear all invitation codes and seller accounts from PostgreSQL and disk
 */
export async function clearCodesServer(): Promise<void> {
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      await dbQuery('DELETE FROM registered_users');
      await dbQuery('DELETE FROM sellers');
      await dbQuery('DELETE FROM invite_codes');
    } catch (err: any) {
      console.warn('Failed to clear PostgreSQL invite tables:', err.message);
    }
  }
  cache = [];
  writeDiskCodes([]);
  writeDiskSellers([]);
}

/**
 * Fetch a seller account by email from PostgreSQL or disk
 */
export async function getSellerByEmailServer(email: string): Promise<StoredSellerAccount | null> {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return null;

  // Retrieve KYC status for this seller email
  const userKyc = await getKycSubmissionByEmailServer(normalized);

  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      const res = await dbQuery<{
        id: number;
        full_name: string;
        email: string;
        shop_name: string;
        login_hash: string;
        transaction_hash: string;
        salt: string;
        invite_code: string;
        status: string;
        id_status: string;
      }>('SELECT * FROM sellers WHERE LOWER(email) = LOWER($1) LIMIT 1', [normalized]);

      if (res && res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        const rawStatus = (row.status || 'review').toLowerCase();
        const storedVerification = preserveStoredSellerVerification(rawStatus, row.id_status);
        let idStatus = storedVerification.idStatus;
        const status = storedVerification.status;

        if (userKyc) {
          if (userKyc.status === 'approved') {
            idStatus = 'Verified';
          } else if (userKyc.status === 'rejected') {
            idStatus = 'Rejected';
          } else {
            idStatus = 'Pending verification';
          }
        }

        const isApproved = status === 'approved' && idStatus === 'Verified';

        return {
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          shopName: row.shop_name,
          loginHash: row.login_hash,
          transactionHash: row.transaction_hash,
          salt: row.salt,
          inviteCode: row.invite_code,
          status,
          idStatus,
          isApproved,
        };
      }
    } catch (err: any) {
      console.warn('Failed to fetch seller by email from PostgreSQL:', err.message);
    }
  }

  // Fallback to disk mirror
  const diskSellers = readDiskSellers();
  const found = diskSellers.find((s) => s.email.toLowerCase() === normalized);
  if (!found) return null;

  const storedVerification = preserveStoredSellerVerification(found.status, found.idStatus);
  let idStatus = storedVerification.idStatus;
  const status = storedVerification.status;

  if (userKyc) {
    if (userKyc.status === 'approved') {
      idStatus = 'Verified';
    } else if (userKyc.status === 'rejected') {
      idStatus = 'Rejected';
    } else {
      idStatus = 'Pending verification';
    }
  }

  const isApproved = status === 'approved' && idStatus === 'Verified';

  return { ...found, idStatus, status, isApproved };
}

/**
 * Fetch the latest registered seller account from PostgreSQL or disk
 */
export async function getLatestSellerServer(): Promise<{
  fullName: string;
  email: string;
  shopName: string;
  inviteCode?: string;
  status?: 'approved' | 'review' | 'suspended';
  idStatus?: string;
  isApproved?: boolean;
} | null> {
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      const res = await dbQuery<{ email: string }>(
        'SELECT email FROM sellers ORDER BY id DESC LIMIT 1'
      );
      if (res && res.rows && res.rows.length > 0 && res.rows[0].email) {
        return await getSellerByEmailServer(res.rows[0].email);
      }
    } catch (err: any) {
      console.warn('Failed to fetch latest seller from PostgreSQL:', err.message);
    }
  }

  // Fallback 1: check disk sellers
  const diskSellers = readDiskSellers();
  if (diskSellers.length > 0) {
    const latest = diskSellers[diskSellers.length - 1];
    return await getSellerByEmailServer(latest.email);
  }

  // Fallback 2: check registered users in stored codes
  const allCodes = await getStoredCodesServer();
  for (const c of allCodes) {
    if (c.usedBy && c.usedBy.length > 0) {
      const lastUser = c.usedBy[c.usedBy.length - 1];
      const parsed =
        typeof lastUser === 'string'
          ? { fullName: lastUser.split('@')[0], email: lastUser, shopName: `${lastUser.split('@')[0]}'s Shop` }
          : lastUser;
      return await getSellerByEmailServer(parsed.email);
    }
  }

  return null;
}

/**
 * Authenticate seller using email and password strictly matched to their specific account
 */
export async function authenticateSellerServer(
  emailStr: string,
  passwordStr: string
): Promise<{
  success: boolean;
  error?: string;
  seller?: {
    fullName: string;
    email: string;
    shopName: string;
    inviteCode?: string;
  };
}> {
  const email = (emailStr || '').trim().toLowerCase();
  const password = passwordStr || '';

  if (!email) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  // 1. Look up the specific account linked exclusively to this email
  const seller = await getSellerByEmailServer(email);
  if (!seller) {
    return {
      success: false,
      error: 'No account found with this email address. Please check your email or register a new shop.',
    };
  }

  // 2. Strict password verification against THAT account's specific salt and hash
  let isPasswordValid = false;
  if (seller.loginHash && seller.loginHash.includes('$')) {
    isPasswordValid = await verifyCombinedPasswordHash(password, seller.loginHash);
  } else if (seller.salt) {
    isPasswordValid = await verifyPasswordWithSalt(password, seller.loginHash, seller.salt);
  } else if (seller.loginHash && seller.loginHash.includes(':')) {
    isPasswordValid = await verifyCombinedPasswordHash(password, seller.loginHash);
  } else {
    // If no salt stored, attempt direct match
    isPasswordValid = password === seller.loginHash;
  }

  if (!isPasswordValid) {
    return {
      success: false,
      error: 'Incorrect password. Please enter the correct password for this account.',
    };
  }

  return {
    success: true,
    seller: {
      fullName: seller.fullName,
      email: seller.email,
      shopName: seller.shopName,
      inviteCode: seller.inviteCode,
    },
  };
}

export interface FormattedAdminOwner {
  id: string;
  name: string; // Shop Name
  shopName: string; // Shop Name
  subtitle: string; // Owner Name
  fullName: string; // Owner Name
  email: string; // Owner Email
  phone?: string;
  tiktok?: string;
  inviteCode?: string;
  creatorId?: string;
  walletOwnerId?: string;
  tempPassword?: string;
  forcePasswordChange?: boolean;
  createdAtFormatted?: string;
  createdAt?: string;
  joinedDate: string;
  promoteRate?: string;
  shopType?: string;
  visitorsCount?: number;
  targetExposure?: number;
  packageTier: string;
  productLimit: number | 'Unlimited';
  profitMargin: number;
  status: 'approved' | 'review' | 'suspended';
  idStatus: string;
  productsCount: number;
  products?: any[];
  balances: {
    pending: number;
    wallet: number;
    guarantee: number;
  };
  creditScore?: number;
  creditLogs?: any[];
  notes?: string;
  kycSubmission?: any;
}

function formatSellerDate(dateVal?: string | Date): { joinedDate: string; createdAtFormatted: string } {
  try {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) {
      return { joinedDate: 'Recently', createdAtFormatted: String(dateVal || 'Recently') };
    }
    const joinedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const createdAtFormatted = `${d.toLocaleDateString('en-US')}, ${d.toLocaleTimeString('en-US')}`;
    return { joinedDate, createdAtFormatted };
  } catch {
    return { joinedDate: 'Recently', createdAtFormatted: 'Just now' };
  }
}

export async function getConsignMerchantDirectory() {
  const result = await dbQuery<{ id: number; full_name: string; email: string; shop_name: string; status: string; id_status: string }>(
    'SELECT id, full_name, email, shop_name, status, id_status FROM sellers ORDER BY id DESC'
  );
  const sellers = new Map<string, { id: string; name: string; fullName: string; email: string; verified: boolean }>();
  const addSeller = (id: string, email: string, shopName: string, fullName: string, status?: string, idStatus?: string) => {
    const key = email?.trim().toLowerCase();
    if (!key || sellers.has(key)) return;
    const account = preserveStoredSellerVerification(status, idStatus);
    sellers.set(key, { id, email: key, name: shopName || fullName || key, fullName, verified: account.status === 'approved' && account.idStatus === 'Verified' });
  };
  for (const row of result?.rows ?? []) addSeller(`seller-db-${row.id}`, row.email, row.shop_name, row.full_name, row.status, row.id_status);
  for (const seller of readDiskSellers()) {
    addSeller(seller.id ? String(seller.id) : `seller-${seller.email}`, seller.email, seller.shopName, seller.fullName, seller.status, seller.idStatus);
  }
  const products = readAllSellerProductsMap();
  return [...sellers.values()].map((seller) => ({ ...seller, productsCount: products[seller.email]?.length ?? 0 }));
}

/**
 * Fetch all registered shops / owners dynamically from PostgreSQL and disk mirror
 */
export async function getAdminTodoSellerStatuses() {
  const result = await dbQuery<{ status: string; created_at: Date | string }>(
    'SELECT status, created_at FROM sellers'
  );
  if (!result?.rows.length) return readDiskSellers().map(({ status, createdAt }) => ({
    status: preserveStoredSellerVerification(status, undefined).status,
    createdAt,
  }));
  return result.rows.map(({ status, created_at }) => ({
    status: preserveStoredSellerVerification(status, undefined).status,
    createdAt: created_at,
  }));
}

export async function getAllSellersServer({ summary = false, kycSubmissions }: {
  summary?: boolean;
  kycSubmissions?: KycSubmission[];
} = {}): Promise<FormattedAdminOwner[]> {
  const allKyc = kycSubmissions ?? await getAllKycSubmissionsServer({ summary });
  const kycMap = new Map(allKyc.map((k) => [(k.sellerEmail || '').toLowerCase(), k]));
  const productsMap = readAllSellerProductsMap();

  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      const res = await dbQuery<{
        id: number;
        full_name: string;
        email: string;
        shop_name: string;
        login_hash: string;
        transaction_hash: string;
        salt: string;
        invite_code: string;
        status: string;
        package_tier: string;
        phone: string;
        id_status?: string;
        created_at: Date | string;
      }>('SELECT * FROM sellers ORDER BY id DESC');

      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map((row) => {
          const { joinedDate, createdAtFormatted } = formatSellerDate(row.created_at);
          const rawStatus = (row.status || 'review').toLowerCase();
          const userKyc = kycMap.get((row.email || '').toLowerCase());
          const storedVerification = preserveStoredSellerVerification(rawStatus, row.id_status);
          let idStatus = storedVerification.idStatus;
          const status = storedVerification.status;

          if (userKyc) {
            if (userKyc.status === 'approved') {
              idStatus = 'Verified';
            } else if (userKyc.status === 'rejected') {
              idStatus = 'Rejected';
            } else {
              idStatus = 'Pending verification';
            }
          }

          const sellerEmail = (row.email || '').toLowerCase().trim();
          const sellerProducts = productsMap[sellerEmail] || productsMap['default'] || [];

          return {
            id: `seller-db-${row.id}`,
            name: row.shop_name,
            shopName: row.shop_name,
            subtitle: row.full_name,
            fullName: row.full_name,
            email: row.email,
            phone: row.phone || '+1 555-0100',
            tiktok: '—',
            inviteCode: row.invite_code || '',
            creatorId: `01M${String(row.id).padStart(6, '0')}BK8RG`,
            walletOwnerId: `01M${String(row.id).padStart(6, '0')}BK8RG`,
            tempPassword: 'no',
            createdAtFormatted,
            createdAt: String(row.created_at || ''),
            joinedDate,
            promoteRate: '10%',
            shopType: 'independent',
            visitorsCount: 0,
            targetExposure: 300,
            packageTier: row.package_tier || 'Free Shop',
            productLimit: 300,
            profitMargin: 15,
            status,
            idStatus,
            kycSubmission: userKyc || null,
            productsCount: sellerProducts.length,
            products: summary ? [] : sellerProducts,
            balances: { pending: 0, wallet: 0, guarantee: 0 },
            creditScore: 100,
            creditLogs: [],
            notes: 'Registered merchant wholesale shop.',
          };
        });
      }
    } catch (err: any) {
      console.warn('Failed to query sellers from PostgreSQL, falling back to disk:', err.message);
    }
  }

  // Fallback to disk mirror
  const diskSellers = readDiskSellers();
  return diskSellers.map((item, idx) => {
    const { joinedDate, createdAtFormatted } = formatSellerDate(item.createdAt);
    const rawStatus = (item.status || 'review').toLowerCase();
    const userKyc = kycMap.get((item.email || '').toLowerCase());
    const storedVerification = preserveStoredSellerVerification(rawStatus, item.idStatus);
    let idStatus = storedVerification.idStatus;
    const status = storedVerification.status;

    if (userKyc) {
      if (userKyc.status === 'approved') {
        idStatus = 'Verified';
      } else if (userKyc.status === 'rejected') {
        idStatus = 'Rejected';
      } else {
        idStatus = 'Pending verification';
      }
    }

    const sellerEmail = (item.email || '').toLowerCase().trim();
    const sellerProducts = productsMap[sellerEmail] || productsMap['default'] || [];

    return {
      id: item.id ? String(item.id) : `seller-disk-${idx + 1}`,
      name: item.shopName,
      shopName: item.shopName,
      subtitle: item.fullName,
      fullName: item.fullName,
      email: item.email,
      phone: item.phone || '+1 555-0100',
      tiktok: '—',
      inviteCode: item.inviteCode || '',
      creatorId: `01M${String(idx + 1).padStart(6, '0')}BK8RG`,
      walletOwnerId: `01M${String(idx + 1).padStart(6, '0')}BK8RG`,
      tempPassword: 'no',
      createdAtFormatted,
      createdAt: item.createdAt || '',
      joinedDate,
      promoteRate: '10%',
      shopType: 'independent',
      visitorsCount: 0,
      targetExposure: 300,
      packageTier: item.packageTier || 'Free Shop',
      productLimit: 300,
      profitMargin: 15,
      status,
      idStatus,
      kycSubmission: userKyc || null,
      productsCount: sellerProducts.length,
      products: summary ? [] : sellerProducts,
      balances: { pending: 0, wallet: 0, guarantee: 0 },
      creditScore: 100,
      creditLogs: [],
      notes: 'Registered merchant wholesale shop.',
    };
  });
}

/**
 * Update seller status in both PostgreSQL and disk mirror
 */
export async function updateSellerStatusServer(
  identifier: string,
  newStatus: 'approved' | 'review' | 'suspended'
): Promise<boolean> {
  const normalized = (identifier || '').trim().toLowerCase();

  // 1. Update in disk mirror
  const diskSellers = readDiskSellers();
  let updatedDisk = false;
  const updatedSellers = diskSellers.map((s) => {
    if (
      s.email.toLowerCase() === normalized ||
      String(s.id) === identifier ||
      `seller-db-${s.id}` === identifier ||
      `seller-disk-${s.id}` === identifier
    ) {
      updatedDisk = true;
      return { ...s, status: newStatus };
    }
    return s;
  });
  if (updatedDisk) {
    writeDiskSellers(updatedSellers);
  }

  // 2. Update in PostgreSQL
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      const cleanId = identifier.replace(/^seller-db-/, '').replace(/^seller-disk-/, '');
      await dbQuery(
        'UPDATE sellers SET status = $1 WHERE LOWER(email) = $2 OR CAST(id AS TEXT) = $3',
        [newStatus, normalized, cleanId]
      );
    } catch (err: any) {
      console.warn('Failed to update seller status in PostgreSQL:', err.message);
    }
  }

  return true;
}

/** Update the seller's public shop name in the persistent seller stores. */
export async function updateSellerShopNameServer(email: string, shopName: string): Promise<boolean> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanShopName = (shopName || '').trim();
  if (!normalizedEmail || !cleanShopName) return false;

  const diskSellers = readDiskSellers();
  let updatedDisk = false;
  const updatedSellers = diskSellers.map((seller) => {
    if (seller.email.toLowerCase() !== normalizedEmail) return seller;
    updatedDisk = true;
    return { ...seller, shopName: cleanShopName };
  });
  const diskSaved = updatedDisk && writeDiskSellers(updatedSellers);

  const dbOnline = await isDbConnected();
  if (!dbOnline) return diskSaved;
  const result = await dbQuery<{ email: string }>(
    'UPDATE sellers SET shop_name = $1 WHERE LOWER(email) = $2 RETURNING email',
    [cleanShopName, normalizedEmail]
  );
  if (!result) return false;
  return diskSaved || Boolean(result.rowCount);
}

/** Persist a newly verified login password without changing the transaction password. */
export async function updateSellerLoginPasswordServer(
  email: string,
  newPassword: string
): Promise<boolean> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !newPassword) return false;

  // The combined login hash carries its own salt. Keep the legacy account salt for the transaction password.
  const salt = randomBytes(16).toString('hex');
  const hash = await hashPasswordWithSalt(newPassword, salt);
  const combinedHash = `${salt}$${hash}`;

  const diskSellers = readDiskSellers();
  let updatedDisk = false;
  const updatedSellers = diskSellers.map((seller) => {
    if (seller.email.toLowerCase() !== normalizedEmail) return seller;
    updatedDisk = true;
    return { ...seller, loginHash: combinedHash };
  });
  const diskSaved = updatedDisk && writeDiskSellers(updatedSellers);

  const dbOnline = await isDbConnected();
  if (!dbOnline) return diskSaved;
  const result = await dbQuery<{ email: string }>(
    'UPDATE sellers SET login_hash = $1 WHERE LOWER(email) = $2 RETURNING email',
    [combinedHash, normalizedEmail]
  );
  if (!result) return false;
  return diskSaved || Boolean(result.rowCount);
}

/**
 * Create a new seller directly from Admin modal
 */
export async function createAdminSellerServer(data: {
  fullName: string;
  email: string;
  shopName: string;
  phone?: string;
  packageTier?: string;
  productLimit?: number | 'Unlimited';
  profitMargin?: number;
  status?: 'approved' | 'review' | 'suspended';
}): Promise<FormattedAdminOwner> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const status = data.status || 'approved';
  const packageTier = data.packageTier || 'Free Shop';
  const phone = data.phone || '+1 555-0100';

  const defaultPassword = 'DefaultPassword123!';
  const salt = `${normalizedEmail}_${Date.now()}`;
  const combinedLoginHash = `${salt}$${defaultPassword}`;

  const diskAccount: StoredSellerAccount = {
    id: `seller-${Date.now()}`,
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    shopName: data.shopName.trim(),
    loginHash: combinedLoginHash,
    transactionHash: defaultPassword,
    salt,
    inviteCode: 'ADMIN-DIRECT',
    status,
    packageTier,
    phone,
    createdAt: now,
  };

  // 1. Save to disk mirror
  const diskSellers = readDiskSellers();
  const existingIdx = diskSellers.findIndex((s) => s.email.toLowerCase() === normalizedEmail);
  if (existingIdx >= 0) {
    diskSellers[existingIdx] = { ...diskSellers[existingIdx], ...diskAccount };
  } else {
    diskSellers.unshift(diskAccount);
  }
  writeDiskSellers(diskSellers);

  // 2. Save to PostgreSQL
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      await dbQuery(
        `INSERT INTO sellers (full_name, email, shop_name, login_hash, transaction_hash, salt, invite_code, status, package_tier, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             shop_name = EXCLUDED.shop_name,
             login_hash = EXCLUDED.login_hash,
             status = EXCLUDED.status,
             package_tier = EXCLUDED.package_tier,
             phone = EXCLUDED.phone`,
        [
          data.fullName.trim(),
          normalizedEmail,
          data.shopName.trim(),
          combinedLoginHash,
          defaultPassword,
          salt,
          'ADMIN-DIRECT',
          status,
          packageTier,
          phone,
        ]
      );
    } catch (err: any) {
      console.warn('Failed to insert seller in PostgreSQL:', err.message);
    }
  }

  const { joinedDate, createdAtFormatted } = formatSellerDate(now);
  return {
    id: String(diskAccount.id),
    name: data.shopName.trim(),
    shopName: data.shopName.trim(),
    subtitle: data.fullName.trim(),
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    phone,
    tiktok: '—',
    inviteCode: 'ADMIN-DIRECT',
    creatorId: `01M${Math.random().toString(36).substring(2, 8).toUpperCase()}BK8RG`,
    walletOwnerId: `01M${Math.random().toString(36).substring(2, 8).toUpperCase()}BK8RG`,
    tempPassword: 'no',
    createdAtFormatted,
    createdAt: now,
    joinedDate,
    promoteRate: '10%',
    shopType: 'independent',
    visitorsCount: 0,
    targetExposure: 300,
    packageTier,
    productLimit: data.productLimit || 300,
    profitMargin: data.profitMargin || 15,
    status,
    idStatus: 'No ID uploaded',
    productsCount: 0,
    balances: { pending: 0, wallet: 0, guarantee: 0 },
    creditScore: 100,
    creditLogs: [],
    notes: 'Onboarded via Admin Panel.',
  };
}

