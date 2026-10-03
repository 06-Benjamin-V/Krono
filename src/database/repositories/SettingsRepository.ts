import { DEFAULT_SETTINGS, type AppSettings } from '@/features/settings/types.ts';
import { getExecutor } from '../sqlite.ts';
import { notifyWidgetsUpdated } from '@/plugins/WidgetBridge.ts';

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
  getIntervalHours(): Promise<number>;
  setIntervalHours(hours: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// SQL-backed repository
// ---------------------------------------------------------------------------

class SqlSettingsRepository implements SettingsRepository {
  async load(): Promise<AppSettings> {
    const rows = await getExecutor().query<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      ['deadlineTaskNotificationIntervalHours'],
    );
    const raw = rows[0]?.value;
    const n = raw ? Number(raw) : DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours;
    return { deadlineTaskNotificationIntervalHours: Number.isFinite(n) && n > 0 ? n : 4 };
  }

  async save(s: AppSettings): Promise<void> {
    await getExecutor().execute(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      ['deadlineTaskNotificationIntervalHours', String(s.deadlineTaskNotificationIntervalHours)],
    );
  }

  async getIntervalHours(): Promise<number> {
    return (await this.load()).deadlineTaskNotificationIntervalHours;
  }

  async setIntervalHours(hours: number): Promise<void> {
    if (!(hours > 0)) throw new Error('Interval must be > 0');
    const current = await this.load();
    await this.save({ ...current, deadlineTaskNotificationIntervalHours: hours });

    // Best-effort: reschedule all pending task notifications
    try {
      const { getNotificationService } = await import(
        '@/services/notifications/NotificationService.ts'
      );
      await getNotificationService().rescheduleAllPendingTasks(hours);
    } catch {
      // Notification failure must not break settings save
    }

    await notifyWidgetsUpdated();
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSettingsRepository(): SettingsRepository {
  return new SqlSettingsRepository();
}

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

export function __resetSettingsForTests(): void {
  const executor = getExecutor();
  // Fire-and-forget: in tests the MemoryExecutor's operations are synchronous
  // but the interface is async. This is safe because the reset is immediate.
  void executor.execute('DELETE FROM app_settings', []);
  void executor.execute(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    ['deadlineTaskNotificationIntervalHours', String(DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours)],
  );
}
