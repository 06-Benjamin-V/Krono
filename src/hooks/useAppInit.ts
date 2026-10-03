import { useCallback, useEffect, useState } from 'react';
import { initDatabase } from '@/database/sqlite.ts';
import { getNotificationService } from '@/services/notifications/NotificationService.ts';
import { synchronizeTasks } from '@/services/TaskService.ts';
import { setSyncWarning } from '@/services/feedback.ts';
import { useResume } from './useResume.ts';
export function useAppInit() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(null);
    void (async () => {
      try {
        await initDatabase();
        try { await getNotificationService().initialize(); }
        catch { setSyncWarning('No se pudo conectar con las notificaciones. Reintenta desde Ajustes.'); }
        if (alive) setReady(true);
        await synchronizeTasks();
      } catch(e) { if (alive) setError(e instanceof Error ? e.message : 'No se pudo iniciar'); }
    })();
    return () => { alive = false; };
  }, [attempt]);
  const resume = useCallback(() => { if (ready) void synchronizeTasks(); }, [ready]);
  useResume(resume);
  return { ready, error, retry: () => setAttempt(value => value + 1) };
}
