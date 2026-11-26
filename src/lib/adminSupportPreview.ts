export const ADMIN_SUPPORT_PREVIEW_KEY = 'admin-support-preview-v1';

type PreviewMessage = {
  id: string; role: string; at: string; text: string;
  deleted?: boolean; hiddenFor?: string[]; read?: boolean; delivered?: boolean; pinned?: boolean; edited?: boolean;
  attachment?: { type: string };
};
type Conversation = {
  id: string; email: string; name: string; status: string; messages: PreviewMessage[];
};

export function clearAdminSupportPreview() {
  try { sessionStorage.removeItem(ADMIN_SUPPORT_PREVIEW_KEY); } catch {}
}

export function saveAdminSupportPreview(owner: string, chats: Conversation[]) {
  if (!owner) return;
  try {
    // Keep just recent text for the first paint. Media and full history come from the inbox request.
    const preview = chats.map(({ id, email, name, status, messages }) => ({
      id, email, name, status,
      messages: messages.slice(-12).filter(m => !m.hiddenFor?.includes('admin')).map(m => ({
        id: m.id, role: m.role, at: m.at, read: m.read, delivered: m.delivered, pinned: m.pinned,
        edited: m.edited, deleted: m.deleted,
        text: m.deleted ? '' : (m.text || (m.attachment ? 'Attachment' : '')).slice(0, 512),
      })),
    }));
    sessionStorage.setItem(ADMIN_SUPPORT_PREVIEW_KEY, JSON.stringify({ owner, chats: preview }));
  } catch { clearAdminSupportPreview(); }
}

type StoredChat = Omit<Conversation, 'messages'> & { messages: Omit<PreviewMessage, 'attachment'>[] };

export function readAdminSupportPreview(owner: string): StoredChat[] | undefined {
  if (!owner) return;
  try {
    const raw = sessionStorage.getItem(ADMIN_SUPPORT_PREVIEW_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.owner !== owner) { clearAdminSupportPreview(); return; }
    if (Array.isArray(saved.chats) && saved.chats.every((c: StoredChat) =>
      typeof c?.email === 'string' && typeof c.name === 'string' && Array.isArray(c.messages) &&
      c.messages.every(m => typeof m?.text === 'string'))) return saved.chats;
  } catch { clearAdminSupportPreview(); }
}
