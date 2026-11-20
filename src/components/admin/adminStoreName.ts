export const ADMIN_STORE_NAME = 'Galleria Enterprises';

export function getAdminStoreDisplayName(name: string): string {
  const trimmed = name.trim();
  return !trimmed || /^buyxoco(?: global commerce)?$/i.test(trimmed) ? ADMIN_STORE_NAME : trimmed;
}
