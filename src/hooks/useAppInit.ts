import { useEffect, useState } from 'react';
import { initDatabase } from '@/database/sqlite.ts';
import { getNotificationService } from '@/services/notifications/NotificationService.ts';

export function useAppInit(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initDatabase();
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
