import fs from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

type CategoryFile = 'store_category_overrides.json' | 'storehouse_product_feed_categories.json';

function categoryFilePaths(file: CategoryFile) {
  const legacyDirectory = path.join(process.cwd(), 'src', 'data');
  const directory = process.env.PRODUCT_FEED_CATEGORY_DIR?.trim() || (process.env.NODE_ENV === 'production'
    ? path.join(homedir(), '.local', 'share', 'galleria-enterprises', 'product-feed-categories')
    : legacyDirectory);
  return { saved: path.resolve(directory, file), legacy: path.join(legacyDirectory, file) };
}

function readSnapshot<T>(location: string): Partial<T> | undefined {
  let text: string;
  try {
    text = fs.readFileSync(location, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }

  const data: unknown = JSON.parse(text.replace(/^\uFEFF/, ''));
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Invalid saved Product Feed categories in ${path.basename(location)}.`);
  }
  return data as Partial<T>;
}

function saveSnapshot(location: string, data: unknown, initialize: boolean): void {
  fs.mkdirSync(path.dirname(location), { recursive: true, mode: 0o700 });
  const temporaryFile = `${location}.${process.pid}.${randomUUID()}.tmp`;
  const descriptor = fs.openSync(temporaryFile, 'wx', 0o600);
  try {
    try {
      fs.writeFileSync(descriptor, JSON.stringify(data, null, 2), 'utf8');
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    if (initialize) {
      try {
        fs.linkSync(temporaryFile, location);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
    } else {
      fs.renameSync(temporaryFile, location);
    }
  } finally {
    fs.rmSync(temporaryFile, { force: true });
  }
}

export function readProductFeedCategorySnapshot<T>(file: CategoryFile): Partial<T> | undefined {
  const { saved, legacy } = categoryFilePaths(file);
  const current = readSnapshot<T>(saved);
  if (current || saved === legacy) return current;

  // Import an existing checkout's category data once. An initialized file is authoritative.
  const previous = readSnapshot<T>(legacy);
  if (!previous) return undefined;
  // The running server may still accept category changes while a new release builds.
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return previous;
  saveSnapshot(saved, previous, true);
  return readSnapshot<T>(saved);
}

export function writeProductFeedCategorySnapshot(file: CategoryFile, data: unknown): void {
  saveSnapshot(categoryFilePaths(file).saved, data, false);
}

const processState = globalThis as typeof globalThis & { productFeedCategoryWrites?: Promise<void> };

export function withProductFeedCategoryWrite<T>(operation: () => T | Promise<T>): Promise<T> {
  const previous = processState.productFeedCategoryWrites ?? Promise.resolve();
  const current = previous.then(operation);
  processState.productFeedCategoryWrites = current.then(() => {}, () => {});
  return current;
}
