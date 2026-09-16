import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { appConfig } from '@/config.ts';
import { computeReminderTimes } from '@/utils/date.ts';
import type { Task } from '@/features/tasks/types.ts';
import type { UUID } from '@/types/common.ts';
import type { NotificationService, ScheduledReminder } from './types.ts';

/** Stable numeric IDs derived from taskId + index so reminders can be cancelled reliably. */
export function notificationIdFor(taskId: UUID, index: number): number {
  let h = 0;
  const s = `${taskId}:${index}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 2_000_000_000);
}

function intervalFor(task: Task, override?: number): number {
  // DAILY siempre usa su cadencia fija de 2h; el override solo aplica a DEADLINE.
  if (task.type === 'DAILY') return appConfig.dailyTaskNotificationIntervalHours;
  if (typeof override === 'number' && override > 0) return override;
  return appConfig.defaultDeadlineIntervalHours;
}

function buildReminders(task: Task, intervalHours: number): ScheduledReminder[] {
  if (task.completed) return [];
  const times = computeReminderTimes(task.startAt, task.endAt, intervalHours);
  return times.map((fireAt, i) => ({
    notificationId: notificationIdFor(task.id, i),
    taskId: task.id,
    fireAt,
    title: task.title,
    body: `Reminder: ${task.title}`,
  }));
}

class CentralNotificationService implements NotificationService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.requestPermissions();
      } catch {
        // Permissions are best-effort on web/dev; native errors must not crash init.
      }
    }
    this.initialized = true;
  }

  async scheduleTaskNotifications(task: Task, intervalHours?: number): Promise<ScheduledReminder[]> {
    const interval = intervalFor(task, intervalHours);
    const reminders = buildReminders(task, interval).filter((r) => Date.parse(r.fireAt) > Date.now());
    if (!Capacitor.isNativePlatform()) return reminders; // web/dev: return plan without native scheduling
    if (reminders.length === 0) return reminders;
    await LocalNotifications.schedule({
      notifications: reminders.map((r) => ({
        id: r.notificationId,
        title: r.title,
        body: r.body,
        schedule: { at: new Date(r.fireAt) },
        extra: { taskId: r.taskId },
      })),
    });
    return reminders;
  }

  async cancelTaskNotifications(taskId: UUID): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const pending = await LocalNotifications.getPending();
    const ids = pending.notifications.filter((n) => (n.extra as { taskId?: string } | undefined)?.taskId === taskId).map((n) => ({ id: n.id }));
    if (ids.length > 0) await LocalNotifications.cancel({ notifications: ids });
  }

  async rescheduleTaskNotifications(task: Task, intervalHours?: number): Promise<ScheduledReminder[]> {
    await this.cancelTaskNotifications(task.id);
    return this.scheduleTaskNotifications(task, intervalHours);
  }

  async rescheduleAllPendingTasks(intervalHours?: number): Promise<number> {
    const { createTaskRepository } = await import('@/database/repositories/TaskRepository.ts');
    const repo = createTaskRepository();
    const pending = await repo.getPending();
    let count = 0;
    for (const task of pending) {
      if (task.completed) continue;
      await this.rescheduleTaskNotifications(task, intervalHours);
      count++;
    }
    return count;
  }
}

let instance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!instance) instance = new CentralNotificationService();
  return instance;
}

// Re-exported for tests without native side effects.
export const __testables = { buildReminders, intervalFor };
