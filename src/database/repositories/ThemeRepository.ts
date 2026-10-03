import { getExecutor } from '../sqlite.ts';

export const THEME_STORAGE_KEY = 'taskmanager:theme';

export type ThemeMode = 'light' | 'dark';

/**
 * Persists the app theme to SQLite (app_settings) so native home-screen
 * widgets can read it and match the app's appearance.
 * Best-effort: callers should catch errors (DB may not be ready yet).
 */
export async function saveThemeToDb(mode: ThemeMode): Promise<void> {
  await getExecutor().execute(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    ['theme', mode],
  );
}