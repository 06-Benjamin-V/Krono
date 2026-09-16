import { useCallback, useEffect, useState } from 'react';
import type { EventItem } from '@/features/events/types.ts';
import type { ISODateString } from '@/types/common.ts';
import { startOfDayISO, endOfDayISO } from '@/utils/date.ts';

interface UseEventsByDayResult {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
}

export function useEventsByDay(day: ISODateString): UseEventsByDayResult {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { createEventRepository } = await import('@/database/repositories/EventRepository.ts');
      const repo = createEventRepository();
      const items = await repo.getByDateRange(startOfDayISO(day), endOfDayISO(day));
      setEvents(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando eventos');
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const removeEvent = useCallback(async (id: string): Promise<void> => {
    const { createEventRepository } = await import('@/database/repositories/EventRepository.ts');
    const repo = createEventRepository();
    await repo.remove(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, loading, error, reload, removeEvent };
}