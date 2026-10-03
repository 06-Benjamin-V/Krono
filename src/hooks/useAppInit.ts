import { useEffect, useState } from 'react';
import { initDatabase } from '@/database/sqlite.ts';
import { getNotificationService } from '@/services/notifications/NotificationService.ts';
import { saveThemeToDb, THEME_STORAGE_KEY } from '@/database/repositories/ThemeRepository.ts';

export function useAppInit(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initDatabase();
        // Persist the current theme to SQLite so native widgets can read it.
        // ThemeContext may run before the DB is ready on first launch.
        try {
          const stored = localStorage.getItem(THEME_STORAGE_KEY);
          if (stored === 'light' || stored === 'dark') {
            await saveThemeToDb(stored);
          }
        } catch {
          // Best-effort: widget theming must not break app startup.
        }
        await getNotificationService().initialize();
        if (alive) setReady(true);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Init failed');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { ready, error };
}
