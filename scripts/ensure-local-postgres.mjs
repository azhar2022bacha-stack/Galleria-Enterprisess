import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { Client } from 'pg';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectRoot);

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) process.exit(0);

const databaseUrl = new URL(connectionString);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (process.platform !== 'win32' || !localHosts.has(databaseUrl.hostname)) process.exit(0);

const port = Number(databaseUrl.port || 5432);
const postgresRoot = path.join(projectRoot, '.local-postgres');
const dataDirectory = path.join(postgresRoot, 'data');
const pgCtl = path.join(postgresRoot, 'runtime', 'pgsql', 'bin', 'pg_ctl.exe');
const logFile = path.join(postgresRoot, 'runtime', 'postgres.log');

if (!fs.existsSync(pgCtl) || !fs.existsSync(path.join(dataDirectory, 'PG_VERSION'))) {
  console.warn('Local PostgreSQL runtime is not installed; continuing with the configured database connection.');
  process.exit(0);
}

async function canConnect() {
  const client = new Client({ connectionString, connectionTimeoutMillis: 1500 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

if (await canConnect()) {
  console.log(`Local PostgreSQL is ready on port ${port}.`);
  process.exit(0);
}

const start = spawnSync(
  pgCtl,
  ['-D', dataDirectory, '-l', logFile, '-o', `-p ${port}`, '-w', 'start'],
  { encoding: 'utf8', windowsHide: true, timeout: 30000 },
);

if (start.stdout?.trim()) console.log(start.stdout.trim());
if (start.stderr?.trim()) console.error(start.stderr.trim());
if (start.error) throw start.error;

for (let attempt = 0; attempt < 20; attempt += 1) {
  if (await canConnect()) {
    console.log(`Local PostgreSQL is ready on port ${port}.`);
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

throw new Error(`Could not connect to the configured local PostgreSQL database on port ${port}.`);
