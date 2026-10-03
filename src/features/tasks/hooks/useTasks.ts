import { createTaskService } from '@/services/TaskService.ts';
import { useRecords } from '@/hooks/useRecords.ts';
const service = createTaskService();
const load = () => service.getAll();
export function useTasks() {
  const state = useRecords(load);
  return { ...state, tasks: state.items,
    removeTask: (id: string) => state.run(() => service.remove(id)),
    toggleComplete: (id: string) => state.run(async () => {
      const task = await service.getById(id);
      if (!task) throw new Error('La tarea ya no existe');
      return task.completed ? service.uncomplete(id) : service.complete(id);
    }),
  };
}
