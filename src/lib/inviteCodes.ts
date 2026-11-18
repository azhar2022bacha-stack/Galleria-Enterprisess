/**
 * PRD: Admin Invitation Code Generation & User Registration System
 * Shared Invitation Code engine for Admin Panel, API routes, and Seller Registration.
 */

export interface RegisteredUserInfo {
  fullName: string;
  email: string;
  shopName: string;
  registeredAt?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  note: string;
  usage: number;
  maxUsage: number;
  status: 'usable' | 'exhausted' | 'disabled';
  created: string;
  usedBy?: (string | RegisteredUserInfo)[]; // Array of registered merchant complete profiles or emails
}

/**
 * Gracefully normalizes registered user data, supporting both new structured profiles and legacy email strings
 */
export function parseRegisteredUser(item: string | RegisteredUserInfo): RegisteredUserInfo {
  if (typeof item === 'string') {
    const namePart = item.split('@')[0] || 'Merchant';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    return {
      fullName: formattedName,
      email: item,
      shopName: `${formattedName}'s Wholesale Shop`,
    };
  }
  return {
    fullName: item.fullName || 'Merchant',
    email: item.email || '',
    shopName: item.shopName || 'Wholesale Store',
    registeredAt: item.registeredAt,
  };
}

export const STORAGE_KEY = 'buyxoco_admin_invite_codes_v2';
export const INVITES_CHANGED_EVENT = 'buyxoco_invites_changed';

export const EXACT_INVALID_INVITE_ERROR =
  'Invalid invitation code. Please enter a valid code provided by the Admin.';

export const EXACT_EXHAUSTED_INVITE_ERROR =
  'This invitation code has reached its maximum usage limit. Please contact the Admin for a new invitation code.';

// Start completely clean with no initial sample codes
export const INITIAL_INVITE_CODES: InviteCode[] = [];

// In-memory fallback for SSR / Node environment
let memoryCodes: InviteCode[] = [];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitChange() {
  if (isBrowser()) {
    window.dispatchEvent(new Event(INVITES_CHANGED_EVENT));
  }
}

/**
 * Get all current invite codes from localStorage or memory cache
 */
export function getInviteCodes(): InviteCode[] {
  if (isBrowser()) {
    try {
      // Clean up legacy dummy data if present from earlier versions
      if (window.localStorage.getItem('buyxoco_admin_invite_codes')) {
        window.localStorage.removeItem('buyxoco_admin_invite_codes');
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryCodes = parsed;
          return parsed;
        }
      }
      // Initialize with empty array
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      memoryCodes = [];
      return [];
    } catch {
      return memoryCodes;
    }
  }
  return memoryCodes;
}

/**
 * Persist invite codes to localStorage and memory
 */
export function saveInviteCodes(codes: InviteCode[]) {
  memoryCodes = codes;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    } catch (err) {
      console.error('Failed to save invite codes', err);
    }
  }
  emitChange();
}

/**
 * Clear all invite codes completely
 */
export function clearInviteCodes(): void {
  saveInviteCodes([]);
}

/**
 * Generate N unique codes with M permitted uses each
 */
export function generateInviteCodes(
  howMany: number,
  usesPerCode: number,
  note = ''
): InviteCode[] {
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

  const existing = getInviteCodes();
  const updated = [...newItems, ...existing];
  saveInviteCodes(updated);
  return newItems;
}

/**
 * Validates an invitation code against the system
 */
export function validateInviteCode(codeStr: string): {
  isValid: boolean;
  error?: string;
  invite?: InviteCode;
  remainingUses?: number;
} {
  const trimmed = (codeStr || '').trim().toUpperCase();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Invitation code is required to register an account.',
    };
  }

  const allCodes = getInviteCodes();
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
 * Atomically consumes 1 usage of an invitation code and records registrant
 */
export function consumeInviteCode(
  codeStr: string,
  userEmail: string
): { success: boolean; error?: string; remainingUses?: number } {
  const trimmed = (codeStr || '').trim().toUpperCase();
  const allCodes = getInviteCodes();
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

  const newUsage = target.usage + 1;
  const isExhausted = newUsage >= target.maxUsage;
  const updatedUsedBy = [...(target.usedBy || []), userEmail];

  const updatedTarget: InviteCode = {
    ...target,
    usage: newUsage,
    status: isExhausted ? 'exhausted' : 'usable',
    usedBy: updatedUsedBy,
  };

  const updatedList = [...allCodes];
  updatedList[index] = updatedTarget;
  saveInviteCodes(updatedList);

  return {
    success: true,
    remainingUses: Math.max(0, target.maxUsage - newUsage),
  };
}

/**
 * Reactively subscribe to invite code changes
 */
export function subscribeToInviteCodes(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(INVITES_CHANGED_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(INVITES_CHANGED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
