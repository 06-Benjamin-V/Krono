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
}
