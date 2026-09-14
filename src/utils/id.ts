import type { UUID } from '@/types/common.ts';

/** Stable IDs via Web Crypto. Available in all modern browsers, Capacitor WebView and Node 19+. */
export function newId(): UUID {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (very old WebViews): timestamp + random.
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 2 ** 32).toString(36)}`;
}
