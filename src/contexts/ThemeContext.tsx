import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getExecutor } from '@/database/sqlite.ts';
import { saveThemeToDb, THEME_STORAGE_KEY } from '@/database/repositories/ThemeRepository.ts';
import { notifyWidgetsUpdated } from '@/plugins/WidgetBridge.ts';
export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';
interface ThemeContextValue {
  theme: ThemeMode; preference: ThemePreference; error: string | null;
  toggleTheme: () => void; setTheme: (value: ThemePreference) => Promise<void>;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);
const systemDark = (): boolean => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
export function ThemeProvider({children}: {children: ReactNode}): JSX.Element {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [dark, setDark] = useState(systemDark);
  const [error, setError] = useState<string | null>(null);
  const changedByUser = useRef(false);
  const theme: ThemeMode = preference === 'system' ? dark ? 'dark' : 'light' : preference;
  useEffect(() => {
    let alive = true;
    void getExecutor().query<{value: string}>('SELECT value FROM app_settings WHERE key = ?', ['themePreference']).then(async rows => {
      let value = rows[0]?.value;
      if (!value) { try { value = localStorage.getItem(THEME_STORAGE_KEY) ?? 'system'; } catch { value = 'system'; } }
      if (alive && !changedByUser.current && ['system','light','dark'].includes(value)) setPreference(value as ThemePreference);
    }).catch(() => { if (alive) setError('No se pudo leer la apariencia guardada'); });
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const changed = (): void => setDark(systemDark());
    media?.addEventListener('change', changed);
    return () => { alive = false; media?.removeEventListener('change', changed); };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    void saveThemeToDb(theme).then(notifyWidgetsUpdated).catch(() => setError('No se pudo actualizar la apariencia de los widgets'));
  }, [theme]);
  const setTheme = useCallback(async (value: ThemePreference): Promise<void> => {
    changedByUser.current = true;
    setError(null);
    try {
      await getExecutor().execute('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['themePreference', value]);
      setPreference(value);
      try { localStorage.setItem(THEME_STORAGE_KEY, value); } catch { /* SQLite remains authoritative. */ }
    } catch { setError('No se pudo guardar la apariencia'); }
  }, []);
  return <ThemeContext.Provider value={{theme, preference, error, setTheme, toggleTheme: () => { void setTheme(theme === 'light' ? 'dark' : 'light'); }}}>{children}</ThemeContext.Provider>;
}
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider no está disponible');
  return value;
}
