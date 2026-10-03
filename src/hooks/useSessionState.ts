import { useState, type Dispatch, type SetStateAction } from 'react';
export function useSessionState(key: string, fallback: string): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState(() => { try { return sessionStorage.getItem(key) ?? fallback; } catch { return fallback; } });
  const update: Dispatch<SetStateAction<string>> = action => setValue(previous => {
    const next = typeof action === 'function' ? action(previous) : action;
    try { sessionStorage.setItem(key, next); } catch { /* State still works without storage. */ }
    return next;
  });
  return [value, update];
}
