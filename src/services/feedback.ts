import { useSyncExternalStore } from 'react';
let warning: string | null = null;
const listeners = new Set<() => void>();
export function setSyncWarning(message: string | null): void { warning = message; listeners.forEach(listener => listener()); }
export function useSyncWarning(): string | null {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => warning);
}
