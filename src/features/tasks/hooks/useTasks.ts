import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@/features/tasks/types.ts';
import { createTaskRepository } from '@/database/repositories/TaskRepository.ts';

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const repo = createTaskRepository();
      const items = await repo.getAll();
      setTasks(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tareas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Recarga al volver a la app: el widget nativo puede haber completado tareas
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

  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
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
      const repo = createTaskRepository();
      await repo.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [],
  );

  return { tasks, loading, error, reload, toggleComplete, removeTask };
}
