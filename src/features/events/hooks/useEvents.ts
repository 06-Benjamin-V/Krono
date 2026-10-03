import { useCallback, useEffect, useState } from 'react';
import type { EventItem } from '@/features/events/types.ts';
import { createEventRepository } from '@/database/repositories/EventRepository.ts';

interface UseEventsResult {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const repo = createEventRepository();
      const items = await repo.getAll();
      setEvents(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Recarga al volver a la app: el widget nativo puede haber modificado datos
  // mientras la app estaba en segundo plano.
  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void reload();
    };
    const onFocus = (): void => {
      void reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload]);

  const removeEvent = useCallback(
    async (id: string): Promise<void> => {
      const repo = createEventRepository();
      await repo.remove(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [],
  );

  return { events, loading, error, reload, removeEvent };
}
