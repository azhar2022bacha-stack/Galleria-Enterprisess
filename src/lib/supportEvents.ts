import { EventEmitter } from 'events';

export type SupportEventKind = 'chat-updated' | 'profiles-updated';

export interface SupportRealtimeEvent {
  type: SupportEventKind;
  email: string;
  at: number;
  reason: string;
}

const GLOBAL_KEY = '__galleriaSupportEmitter__';

function getEmitter(): EventEmitter {
  const globalObj = globalThis as typeof globalThis & { [GLOBAL_KEY]?: EventEmitter };
  if (!globalObj[GLOBAL_KEY]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(200);
    globalObj[GLOBAL_KEY] = emitter;
  }
  return globalObj[GLOBAL_KEY];
}

export function emitSupportEvent(event: Omit<SupportRealtimeEvent, 'at'>): void {
  const payload: SupportRealtimeEvent = { ...event, at: Date.now() };
  getEmitter().emit('support', payload);
}

export function subscribeSupportEvents(listener: (event: SupportRealtimeEvent) => void): () => void {
  const emitter = getEmitter();
  emitter.on('support', listener);
  return () => {
    emitter.off('support', listener);
  };
}
