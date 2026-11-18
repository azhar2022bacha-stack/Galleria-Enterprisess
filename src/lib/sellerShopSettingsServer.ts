import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export interface StoredShopSettings {
  shopName: string;
  description: string;
  logoUrl?: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'seller_shop_settings.json');

function readSettingsMap(): Record<string, StoredShopSettings> {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getSellerShopSettingsServer(
  email: string,
  defaults: StoredShopSettings
): StoredShopSettings {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const stored = readSettingsMap()[normalizedEmail];
  if (!stored) return defaults;
  return {
    shopName: stored.shopName || defaults.shopName,
    description: stored.description || '',
    ...(stored.logoUrl ? { logoUrl: stored.logoUrl } : {}),
  };
}

export function hasSellerShopSettingsServer(email: string): boolean {
  const normalizedEmail = (email || '').trim().toLowerCase();
  return Boolean(normalizedEmail && readSettingsMap()[normalizedEmail]);
}

export function saveSellerShopSettingsServer(
  email: string,
  settings: StoredShopSettings
): boolean {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) return false;
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    const settingsMap = readSettingsMap();
    settingsMap[normalizedEmail] = settings;
    const tempFile = `${SETTINGS_FILE}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(settingsMap, null, 2), 'utf8');
    fs.renameSync(tempFile, SETTINGS_FILE);
    return true;
  } catch (error) {
    console.error('Failed to save seller shop settings:', error);
    return false;
  }
}
