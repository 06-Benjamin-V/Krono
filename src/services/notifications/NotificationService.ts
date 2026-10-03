import { createTaskRepository } from '@/database/repositories/TaskRepository.ts';
import { createSettingsRepository } from '@/database/repositories/SettingsRepository.ts';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { WidgetBridge } from '@/plugins/WidgetBridge.ts';
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

/** Formatea el tiempo restante hasta `endAt` desde `fireAt`, p. ej. "Quedan 4h 30m". */
function formatRemainingTime(fireAt: string, endAt: string): string {
  const ms = Date.parse(endAt) - Date.parse(fireAt);
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `Quedan ${hours}h ${minutes}m`;
  if (hours > 0) return `Quedan ${hours}h`;
  return `Quedan ${minutes}m`;
}

function buildReminders(task: Task, intervalHours: number, after = Number.NEGATIVE_INFINITY): ScheduledReminder[] {
  if (task.completed) return [];
  const times = computeReminderTimes(task.startAt, task.endAt, intervalHours, after);
  return times.map((fireAt) => {
    const remaining = formatRemainingTime(fireAt, task.endAt);
    return {
      notificationId: notificationIdFor(task.id, Math.round((Date.parse(fireAt) - Date.parse(task.startAt)) / (intervalHours * 3_600_000)) - 1),
      taskId: task.id,
      fireAt,
      title: task.title,
      body: remaining ? `${remaining}: ${task.title}` : `Reminder: ${task.title}`,
    };
  });
}

class CentralNotificationService implements NotificationService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.addListener('localNotificationActionPerformed', event => {
        const taskId = (event.notification.extra as {taskId?: string} | undefined)?.taskId;
        if (taskId) window.location.hash = `/tasks/${encodeURIComponent(taskId)}`;
      });
    }
    this.initialized = true;
  }

  async scheduleTaskNotifications(task: Task, intervalHours?: number): Promise<ScheduledReminder[]> {
    const interval = intervalFor(task, intervalHours);
    const reminders = buildReminders(task, interval, Date.now());
    if (!Capacitor.isNativePlatform()) return reminders; // web/dev: return plan without native scheduling
    if (Capacitor.getPlatform() === 'android') { await this.rescheduleAllPendingTasks(); return reminders; }
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
    if (Capacitor.getPlatform() === 'android') {
      const result = await WidgetBridge.reconcileNotifications();
      return result.count;
    }
    const repo = createTaskRepository();
    const pending = await repo.getPending();
    intervalHours ??= await createSettingsRepository().getIntervalHours();
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
