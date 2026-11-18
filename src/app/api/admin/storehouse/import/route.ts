import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { getRequestAdmin } from '@/lib/adminSession';
import { dbQuery, initDb } from '@/lib/db';
import { STOREHOUSE_IMPORT_CATEGORIES } from '@/data/storehouseImportCategories';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROJECT_ROOT = process.cwd();
const IMPORT_ROOT = path.resolve(PROJECT_ROOT, 'product-imports');
const LOCK_PATH = path.join(IMPORT_ROOT, '.storehouse-import.lock');
const EXPECTED_TOTAL = STOREHOUSE_IMPORT_CATEGORIES.length * 300;

function resolveImportPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const supplied = path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
  const relative = path.relative(IMPORT_ROOT, supplied);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return supplied;
}

async function isProcessRunning(pid: number): Promise<boolean> {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

export async function GET(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  try {
    if (!(await initDb())) throw new Error('The local Storehouse database is unavailable.');
    const batchResult = await dbQuery<{
      id: string;
      status: string;
      expected_products: number;
      uploaded_products: number;
      published_products: number;
      category_counts: Record<string, number>;
      errors: unknown[];
      source_name: string;
      created_at: string;
      updated_at: string;
      completed_at: string | null;
    }>(
      `SELECT id, source_name, status, expected_products, uploaded_products, published_products,
              category_counts, errors, created_at, updated_at, completed_at
       FROM storehouse_catalog_import_batches
       ORDER BY created_at DESC
       LIMIT 20`
    );
    if (!batchResult) throw new Error('Unable to read Storehouse import history.');

    let processActive = false;
    try {
      const lock = JSON.parse(await fs.readFile(LOCK_PATH, 'utf8')) as { pid?: number; startedAt?: string };
      const lockAge = lock.startedAt ? Date.now() - Date.parse(lock.startedAt) : Number.POSITIVE_INFINITY;
      processActive = Number(lock.pid) === 0 && lockAge < 60_000
        ? true
        : await isProcessRunning(Number(lock.pid));
      if (!processActive) await fs.rm(LOCK_PATH, { force: true });
    } catch {}

    return NextResponse.json({
      success: true,
      expectedTotal: EXPECTED_TOTAL,
      targetPerCategory: 300,
      categories: STOREHOUSE_IMPORT_CATEGORIES.map(({ name, slug }) => ({ name, slug })),
      batches: batchResult.rows,
      processActive,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not load Storehouse import status.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const csvPath = resolveImportPath(body?.csvPath);
    const imagesPath = resolveImportPath(body?.imagesPath);
    if (!csvPath || !imagesPath) {
      return NextResponse.json({ success: false, error: 'Choose CSV and image-folder paths inside product-imports.' }, { status: 400 });
    }
    if (path.extname(csvPath).toLowerCase() !== '.csv') {
      return NextResponse.json({ success: false, error: 'The catalog source must be a CSV file.' }, { status: 400 });
    }
    const [csvInfo, imagesInfo] = await Promise.all([fs.stat(csvPath), fs.stat(imagesPath)]);
    if (!csvInfo.isFile() || !imagesInfo.isDirectory()) {
      return NextResponse.json({ success: false, error: 'Choose an existing CSV file and image folder.' }, { status: 400 });
    }

    try {
      const lock = JSON.parse(await fs.readFile(LOCK_PATH, 'utf8')) as { pid?: number; startedAt?: string };
      const lockAge = lock.startedAt ? Date.now() - Date.parse(lock.startedAt) : Number.POSITIVE_INFINITY;
      const active = Number(lock.pid) === 0 && lockAge < 60_000
        ? true
        : await isProcessRunning(Number(lock.pid));
      if (active) {
        return NextResponse.json({ success: false, error: 'A Storehouse catalog import is already running.' }, { status: 409 });
      }
      await fs.rm(LOCK_PATH, { force: true });
    } catch {}

    await fs.mkdir(path.join(IMPORT_ROOT, 'logs'), { recursive: true });
    const startedAt = new Date().toISOString();
    const logPath = path.join(IMPORT_ROOT, 'logs', `storehouse-import-${startedAt.replace(/[:.]/g, '-')}.log`);
    const lockHandle = await fs.open(LOCK_PATH, 'wx');
    await lockHandle.writeFile(JSON.stringify({ pid: 0, startedAt, logPath }));
    await lockHandle.close();
    const logHandle = fsSync.openSync(logPath, 'a');
    try {
      const child = spawn(
        process.execPath,
        [path.join(PROJECT_ROOT, 'scripts', 'import-storehouse-catalog.mjs'), '--csv', csvPath, '--images', imagesPath],
        { cwd: PROJECT_ROOT, detached: true, windowsHide: true, stdio: ['ignore', logHandle, logHandle] }
      );
      fsSync.closeSync(logHandle);
      if (!child.pid) throw new Error('Could not start the local catalog importer.');

      await fs.writeFile(LOCK_PATH, JSON.stringify({ pid: child.pid, startedAt, logPath }), { flag: 'w' });
      child.once('error', () => { void fs.rm(LOCK_PATH, { force: true }); });
      child.once('exit', () => { void fs.rm(LOCK_PATH, { force: true }); });
      child.unref();
    } catch (error) {
      await fs.rm(LOCK_PATH, { force: true });
      throw error;
    }

    return NextResponse.json({ success: true, processActive: true, logFile: path.relative(PROJECT_ROOT, logPath) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not start the catalog import.' }, { status: 500 });
  }
}
