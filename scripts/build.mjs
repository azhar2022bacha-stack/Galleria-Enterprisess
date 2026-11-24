import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';

const require = createRequire(import.meta.url);
const next = require.resolve('next/dist/bin/next');
const build = [process.execPath, next, 'build', ...process.argv.slice(2)];
// The SSH workflow holds this same lock from fetch through restart.
// A manual npm run build on the production checkout must wait for it.
const needsLock = process.platform === 'linux' &&
  realpathSync('.') === '/var/www/nextjs-ap' &&
  process.env.GALLERIA_DEPLOY_LOCK_HELD !== '1';
const [command, ...args] = needsLock
  ? ['flock', '--close', '--timeout', '600', '.git/galleria-deploy.lock', ...build]
  : build;
const result = spawnSync(command, args, { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
