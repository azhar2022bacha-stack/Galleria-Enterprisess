import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

type Schedule = { startedAt: number; intervalMinutes: number; limit: number };
type Entry = { visits: number; exposure: number; schedule?: Schedule };
const file = path.join(process.cwd(), 'src', 'data', 'store_exposure.json');

function read(): Map<string, Entry> {
  try {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(file, 'utf8'))));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
    throw error;
  }
}

function update(email: string, change: (entry: Entry) => Entry): Entry {
  const entries = read();
  const key = email.toLowerCase().trim();
  const entry = change(entries.get(key) ?? { visits: 0, exposure: 0 });
  entries.set(key, entry);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temporary, JSON.stringify(Object.fromEntries(entries)), { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return entry;
}

function scheduledCount(schedule?: Schedule, now = Date.now()) {
  if (!schedule) return 0;
  return Math.min(schedule.limit, Math.max(0, Math.floor((now - schedule.startedAt) / (schedule.intervalMinutes * 60_000))));
}

function summary(entry: Entry) {
  const added = scheduledCount(entry.schedule);
  const schedule = entry.schedule;
  return {
    visits: entry.visits,
    exposure: entry.exposure + added,
    schedule: schedule ? { intervalMinutes: schedule.intervalMinutes, remaining: schedule.limit - added, limit: schedule.limit } : null,
  };
}

export function readStoreExposure(email: string) {
  return summary(read().get(email.trim().toLowerCase()) ?? { visits: 0, exposure: 0 });
}

export function recordStoreVisit(email: string) {
  update(email, (entry) => ({ ...entry, visits: entry.visits + 1 }));
}

export function changeStoreExposure(email: string, action: 'add' | 'reduce' | 'clear' | 'schedule' | 'stop', amount: number, intervalMinutes: number) {
  return summary(update(email, (entry) => {
    if (action === 'clear') return { visits: entry.visits, exposure: 0 };
    if (action === 'add') return { ...entry, exposure: entry.exposure + amount };
    const accrued = scheduledCount(entry.schedule);
    const total = entry.exposure + accrued;
    if (action === 'reduce') {
      const schedule = entry.schedule;
      const remaining = schedule ? schedule.limit - accrued : 0;
      return {
        visits: entry.visits,
        exposure: Math.max(0, total - amount),
        ...(schedule && remaining > 0 ? { schedule: { ...schedule, startedAt: schedule.startedAt + accrued * schedule.intervalMinutes * 60_000, limit: remaining } } : {}),
      };
    }
    return {
      visits: entry.visits,
      exposure: total,
      ...(action === 'schedule' ? { schedule: { startedAt: Date.now(), intervalMinutes, limit: amount } } : {}),
    };
  }));
}
