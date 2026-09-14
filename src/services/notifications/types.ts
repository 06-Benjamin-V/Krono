import type { Task } from '@/features/tasks/types.ts';
import type { UUID } from '@/types/common.ts';

export interface ScheduledReminder {
  notificationId: number;
  taskId: UUID;
  fireAt: string;
  title: string;
  body: string;
}

export interface NotificationService {
  initialize(): Promise<void>;
  scheduleTaskNotifications(task: Task, intervalHours?: number): Promise<ScheduledReminder[]>;
  cancelTaskNotifications(taskId: UUID): Promise<void>;
  rescheduleTaskNotifications(task: Task, intervalHours?: number): Promise<ScheduledReminder[]>;
  /**
   * Reconcilia notificaciones para todas las tareas pendientes no completadas.
   * Usa import dinámico para obtener tareas y evitar ciclo estático con TaskRepository.
   * Best-effort en Android: Doze/ahorro de batería y restricciones de alarmas pueden retrasar
   * la entrega; no se promete exactitud en el instante programado.
   */
  rescheduleAllPendingTasks(intervalHours?: number): Promise<number>;
}
