import { createTaskRepository, type TaskRepository } from '@/database/repositories/TaskRepository.ts';
import { getNotificationService } from './notifications/NotificationService.ts';
import { notifyWidgetsUpdated } from '@/plugins/WidgetBridge.ts';
import { setSyncWarning } from './feedback.ts';

export async function synchronizeTasks(): Promise<void> {
  try { await getNotificationService().rescheduleAllPendingTasks(); setSyncWarning(null); }
  catch (error) { setSyncWarning(`Datos guardados. Recordatorios pendientes: ${error instanceof Error ? error.message : 'reintenta desde Ajustes'}`); }
  await notifyWidgetsUpdated();
}

export function createTaskService(): TaskRepository {
  const repo = createTaskRepository();
  return {
    getAll: () => repo.getAll(), getById: id => repo.getById(id),
    getByDateRange: (start, end) => repo.getByDateRange(start, end),
    getPending: () => repo.getPending(), countByDay: day => repo.countByDay(day),
    async create(input) { const task = await repo.create(input); await synchronizeTasks(); return task; },
    async update(id, input) { const task = await repo.update(id, input); if (!task) throw new Error('La tarea ya no existe'); await synchronizeTasks(); return task; },
    async complete(id) { const task = await repo.complete(id); if (!task) throw new Error('La tarea ya no existe'); await synchronizeTasks(); return task; },
    async uncomplete(id) { const task = await repo.uncomplete(id); if (!task) throw new Error('La tarea ya no existe'); await synchronizeTasks(); return task; },
    async remove(id) { await repo.remove(id); await synchronizeTasks(); },
  };
}
