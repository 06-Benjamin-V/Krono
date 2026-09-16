import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@/features/tasks/types.ts';
import type { EventItem } from '@/features/events/types.ts';
import type { ISODateString } from '@/types/common.ts';
import { startOfMonthISO, endOfMonthISO } from '@/utils/date.ts';

export interface MonthData {
  tasks: Task[];
  events: EventItem[];
}

interface UseMonthDataResult {
  data: MonthData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useMonthData(month: ISODateString): UseMonthDataResult {
  const [data, setData] = useState<MonthData>({ tasks: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [taskRepo, eventRepo] = await Promise.all([
        import('@/database/repositories/TaskRepository.ts'),
        import('@/database/repositories/EventRepository.ts'),
      ]);
      const [tasks, events] = await Promise.all([
        taskRepo.createTaskRepository().getByDateRange(startOfMonthISO(month), endOfMonthISO(month)),
        eventRepo.createEventRepository().getByDateRange(startOfMonthISO(month), endOfMonthISO(month)),
      ]);
      setData({ tasks, events });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando mes');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}