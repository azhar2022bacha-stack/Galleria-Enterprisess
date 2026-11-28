import { createHash, randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface SellerAccountSuspension {
  status: 'suspended';
  reason: string;
  updatedAt: string;
}

const RESTRICTIONS_DIR = path.join(process.cwd(), 'src', 'data', 'seller-account-restrictions');

function normalizedEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function restrictionFile(email: string): string {
  const key = createHash('sha256').update(normalizedEmail(email)).digest('hex');
  return path.join(RESTRICTIONS_DIR, `${key}.json`);
}

export function getSellerAccountSuspension(email: string): SellerAccountSuspension | null {
  const normalized = normalizedEmail(email);
  if (!normalized) return null;

  try {
    const value = JSON.parse(fs.readFileSync(restrictionFile(normalized), 'utf8')) as Partial<SellerAccountSuspension>;
    if (value.status !== 'suspended') return null;
    return {
      status: 'suspended',
      reason: typeof value.reason === 'string' && value.reason.trim()
        ? value.reason.trim()
        : 'Your account is suspended. Please contact Support.',
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    console.error('Could not read seller account restriction:', error);
    // Fail closed if a restriction record exists but cannot be read.
    return {
      status: 'suspended',
      reason: 'Your account is restricted. Please contact Support.',
      updatedAt: '',
    };
  }
}

export function suspendSellerAccount(email: string, reason: string): SellerAccountSuspension {
  const normalized = normalizedEmail(email);
  const cleanReason = String(reason || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Choose a valid seller account.');
  if (!cleanReason || cleanReason.length > 2000) throw new Error('Enter a suspension reason of up to 2,000 characters.');

  fs.mkdirSync(RESTRICTIONS_DIR, { recursive: true });
  const file = restrictionFile(normalized);
  const temp = `${file}.${randomUUID()}.tmp`;
  const suspension: SellerAccountSuspension = {
    status: 'suspended',
    reason: cleanReason,
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(temp, JSON.stringify(suspension), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temp, file);
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch {}
    throw error;
  }
  return suspension;
}

export function restoreSellerAccount(email: string): void {
  const normalized = normalizedEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Choose a valid seller account.');
  try {
    fs.unlinkSync(restrictionFile(normalized));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
  }
}
