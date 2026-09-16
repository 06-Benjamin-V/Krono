import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@/features/tasks/types.ts';
import type { ISODateString } from '@/types/common.ts';
import { startOfDayISO, endOfDayISO } from '@/utils/date.ts';

interface UseTasksByDayResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
}

export function useTasksByDay(day: ISODateString): UseTasksByDayResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { createTaskRepository } = await import('@/database/repositories/TaskRepository.ts');
      const repo = createTaskRepository();
      const items = await repo.getByDateRange(startOfDayISO(day), endOfDayISO(day));
      setTasks(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tareas');
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
      const { createTaskRepository } = await import('@/database/repositories/TaskRepository.ts');
      const repo = createTaskRepository();
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      if (task.completed) {
        await repo.uncomplete(id);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: false, completedAt: undefined } : t)),
        );
      } else {
        await repo.complete(id);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t)),
        );
      }
    },
    [tasks],
  );

  const removeTask = useCallback(
    async (id: string): Promise<void> => {
      const { createTaskRepository } = await import('@/database/repositories/TaskRepository.ts');
      const repo = createTaskRepository();
      await repo.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [],
  );

  return { tasks, loading, error, reload, toggleComplete, removeTask };
}