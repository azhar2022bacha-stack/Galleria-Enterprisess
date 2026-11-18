import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { dbQuery, initDb } from '@/lib/db';
import { DEFAULT_WEBSITE_INFO, type WebsiteCertificate, type WebsiteFaq, type WebsiteInfo } from '@/lib/websiteInfo';

const SETTINGS_ID = 1;
const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'website_info.json');
const DATABASE_ENABLED = Boolean(process.env.DATABASE_URL?.trim());
const TEXT_LIMITS: Record<keyof WebsiteInfo, number> = {
  siteName: 120, tagline: 220, announcement: 300, logoUrl: 1000, faviconUrl: 1000,
  primaryColor: 7, accentColor: 7, supportEmail: 255, contactPhone: 80, whatsappNumber: 80,
  contactAddress: 1000, openingHours: 500, mapUrl: 1000, legalCompanyName: 255,
  jurisdiction: 255, companyRegNumber: 120, registeredAddress: 1200, aboutHeadline: 240,
  aboutText: 12000, aboutImageUrl: 1000, certificates: 0, heroBadge: 120, heroTitle: 240,
  heroSubtitle: 1200, heroImageUrl: 1000, facebookUrl: 1000, instagramUrl: 1000, tiktokUrl: 1000,
  youtubeUrl: 1000, linkedInUrl: 1000, privacyPolicy: 25000, termsText: 25000,
  shippingText: 12000, returnsText: 12000, faqs: 0, seoTitle: 240, seoDescription: 500, socialImageUrl: 1000,
};

function fileSettings(): WebsiteInfo | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? normalizeWebsiteInfo(parsed, DEFAULT_WEBSITE_INFO) : null;
  } catch { return null; }
}

function writeFileSettings(settings: WebsiteInfo) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temporaryFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(settings, null, 2), { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryFile, DATA_FILE);
}

function optionalUrl(value: unknown, current: string, label: string): string {
  if (value === undefined) return current;
  if (typeof value !== 'string') throw new Error(`${label} must be a URL.`);
  const normalized = value.trim();
  if (!normalized) return '';
  if (/^\/uploads\/website-info\/[a-f0-9-]+\.[a-z0-9]+$/i.test(normalized)
    || /^\/api\/website-info\/assets\/[a-f0-9-]+$/i.test(normalized)) return normalized;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === 'https:') return normalized;
  } catch { /* URL validation below returns a friendly error. */ }
  throw new Error(`${label} must use HTTPS or be an uploaded website file.`);
}

function normalizeCertificates(value: unknown, current: WebsiteCertificate[]): WebsiteCertificate[] {
  if (value === undefined) return current;
  if (!Array.isArray(value) || value.length > 30) throw new Error('Add no more than 30 certificates.');
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Each certificate needs a title and uploaded file.');
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === 'string' && /^[a-z0-9-]{1,80}$/i.test(item.id) ? item.id : randomUUID();
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const fileName = typeof item.fileName === 'string' ? item.fileName.trim().slice(0, 255) : '';
    if (!name || name.length > 160) throw new Error('Certificate titles must contain 1 to 160 characters.');
    if (!fileName) throw new Error(`Upload a file for certificate “${name}”.`);
    return { id, name, fileName, fileUrl: optionalUrl(item.fileUrl, '', 'Certificate file') };
  });
}

function normalizeFaqs(value: unknown, current: WebsiteFaq[]): WebsiteFaq[] {
  if (value === undefined) return current;
  if (!Array.isArray(value) || value.length > 30) throw new Error('Add no more than 30 FAQ entries.');
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Each FAQ needs a question and answer.');
    const item = entry as Record<string, unknown>;
    const question = typeof item.question === 'string' ? item.question.trim() : '';
    const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
    if (!question || question.length > 300 || !answer || answer.length > 3000) throw new Error('FAQ questions must be 1 to 300 characters and answers 1 to 3,000 characters.');
    const id = typeof item.id === 'string' && /^[a-z0-9-]{1,80}$/i.test(item.id) ? item.id : randomUUID();
    return { id, question, answer };
  });
}

export function normalizeWebsiteInfo(input: unknown, current: WebsiteInfo): WebsiteInfo {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Website information must be an object.');
  const values = input as Record<string, unknown>;
  const next = { ...current } as WebsiteInfo;
  for (const key of Object.keys(TEXT_LIMITS) as (keyof WebsiteInfo)[]) {
    if (key === 'certificates' || key === 'faqs') continue;
    const value = values[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') throw new Error(`${key} must be text.`);
    const normalized = value.trim();
    if (normalized.length > TEXT_LIMITS[key]) throw new Error(`${key} must be ${TEXT_LIMITS[key]} characters or fewer.`);
    (next as unknown as Record<string, unknown>)[key] = normalized;
  }
  next.siteName = next.siteName || DEFAULT_WEBSITE_INFO.siteName;
  for (const colorKey of ['primaryColor', 'accentColor'] as const) {
    if (!/^#[0-9a-f]{6}$/i.test(next[colorKey])) throw new Error('Brand colors must be six-digit hex colors.');
  }
  if (next.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.supportEmail)) throw new Error('Enter a valid support email address.');
  for (const field of ['logoUrl', 'faviconUrl', 'mapUrl', 'aboutImageUrl', 'heroImageUrl', 'facebookUrl', 'instagramUrl', 'tiktokUrl', 'youtubeUrl', 'linkedInUrl', 'socialImageUrl'] as const) {
    next[field] = optionalUrl(values[field], current[field], field);
  }
  next.certificates = normalizeCertificates(values.certificates, current.certificates);
  next.faqs = normalizeFaqs(values.faqs, current.faqs);
  return next;
}

function parseDatabaseSettings(value: unknown): WebsiteInfo | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? normalizeWebsiteInfo(parsed, DEFAULT_WEBSITE_INFO) : null;
  } catch { return null; }
}

export async function getWebsiteInfo(): Promise<WebsiteInfo> {
  if (!DATABASE_ENABLED) return fileSettings() || { ...DEFAULT_WEBSITE_INFO };
  if (!(await initDb())) throw new Error('Website information storage is unavailable.');
  const result = await dbQuery<{ settings: unknown }>('SELECT settings FROM website_info_state WHERE id = $1', [SETTINGS_ID]);
  if (!result) throw new Error('Unable to read website information.');
  if (result.rows[0]) return parseDatabaseSettings(result.rows[0].settings) || { ...DEFAULT_WEBSITE_INFO };

  const legacy = fileSettings() || { ...DEFAULT_WEBSITE_INFO };
  const inserted = await dbQuery(
    'INSERT INTO website_info_state (id, settings) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id',
    [SETTINGS_ID, JSON.stringify(legacy)],
  );
  if (!inserted) throw new Error('Unable to initialize website information.');
  const seeded = await dbQuery<{ settings: unknown }>('SELECT settings FROM website_info_state WHERE id = $1', [SETTINGS_ID]);
  if (!seeded?.rows[0]) throw new Error('Unable to load website information.');
  return parseDatabaseSettings(seeded.rows[0].settings) || { ...DEFAULT_WEBSITE_INFO };
}

export async function saveWebsiteInfo(input: unknown): Promise<WebsiteInfo> {
  const current = await getWebsiteInfo();
  const settings = normalizeWebsiteInfo(input, current);
  if (DATABASE_ENABLED) {
    if (!(await initDb())) throw new Error('Website information storage is unavailable.');
    const result = await dbQuery(
      `INSERT INTO website_info_state (id, settings, updated_at) VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = CURRENT_TIMESTAMP RETURNING id`,
      [SETTINGS_ID, JSON.stringify(settings)],
    );
    if (!result) throw new Error('Unable to save website information.');
  } else {
    writeFileSettings(settings);
  }
  return settings;
}
