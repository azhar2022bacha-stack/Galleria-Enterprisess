import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const derive = promisify(scrypt);
const directory = path.join(process.cwd(), 'src/data');
const file = path.join(directory, 'seller_recovery.json');
const lifetime = 30 * 60 * 1000;
type Credentials = { email: string; hash: string; version: string };
type Request = { account: string; digest: string; expires: number; destination?: string };
type State = { accounts: Record<string, Credentials>; requests: Request[] };
export class RecoveryError extends Error {}
function read(): State {
  if (!fs.existsSync(file)) return { accounts: {}, requests: [] };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function change<T>(update: (state: State) => T): T {
  fs.mkdirSync(directory, { recursive: true });
  const lock = fs.openSync(file + '.lock', 'wx', 0o600);
  try {
    const state = read();
    state.requests = state.requests.filter(row => row.expires > Date.now());
    const result = update(state);
    fs.writeFileSync(file + '.tmp', JSON.stringify(state), { mode: 0o600 });
    fs.renameSync(file + '.tmp', file);
    return result;
  } finally {
    fs.closeSync(lock);
    fs.unlinkSync(file + '.lock');
  }
}
function digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
function token() { return randomBytes(32).toString('hex'); }
export function recoveredAccount(email: string) {
  return Object.entries(read().accounts).find(([,value]) => value.email === email)?.[0];
}
export function recoveredCredentials(account: string): Credentials | undefined { return read().accounts[account]; }
async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + ((await derive(password, salt, 64)) as Buffer).toString('hex');
}
export async function matchesRecoveredPassword(password: string, hash: string) {
  const [salt, hex] = hash.split(':');
  return timingSafeEqual(await derive(password, salt, 64) as Buffer, Buffer.from(hex, 'hex'));
}
export async function updateRecoveredPassword(account: string, password: string) {
  const current = recoveredCredentials(account);
  if (!current) return false;
  const hash = await passwordHash(password);
  change(state => {
    if (state.accounts[account]?.hash !== current.hash) throw new RecoveryError('Credentials changed. Sign in again.');
    state.accounts[account].hash = hash;
    state.requests = state.requests.filter(row => row.account !== account);
  });
  return true;
}
export function issueRecovery(account: string, destination: string) {
  const raw = token();
  change(state => {
    state.requests = state.requests.filter(row => row.account !== account);
    state.requests.push({ account, digest: digest(raw), destination, expires: Date.now() + lifetime });
  });
  return raw;
}
function requestFor(state: State, raw: string) {
  const key = digest(raw);
  const row = state.requests.find(item => item.destination && item.digest === key && item.expires > Date.now());
  if (!row) throw new RecoveryError('Invalid, expired, or used link. Ask the admin to generate a new recovery link.');
  return row;
}
export function recoveryOwner(raw: string, email: string) {
  const row = requestFor(read(), raw);
  if (row.destination !== email) throw new RecoveryError('Enter the email address to which the admin sent this link.');
  return row.account;
}
export async function saveRecovery(raw: string, email: string, password: string) {
  const hash = await passwordHash(password);
  change(state => {
    const row = requestFor(state, raw);
    if (row.destination !== email) throw new RecoveryError('The recovery email does not match.');
    if (Object.entries(state.accounts).some(([account, value]) => account !== row.account && value.email === email))
      throw new RecoveryError('That sign-in email is already in use.');
    state.accounts[row.account] = { email, hash, version: randomUUID() };
    state.requests = state.requests.filter(item => item.account !== row.account);
  });
}
