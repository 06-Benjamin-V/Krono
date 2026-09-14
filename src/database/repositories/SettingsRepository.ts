import { DEFAULT_SETTINGS, type AppSettings } from '@/features/settings/types.ts';

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
  getIntervalHours(): Promise<number>;
  setIntervalHours(hours: number): Promise<void>;
}

const store = new Map<string, string>([
  ['deadlineTaskNotificationIntervalHours', String(DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours)],
]);

export function createSettingsRepository(): SettingsRepository {
  return {
    async load(): Promise<AppSettings> {
      const raw = store.get('deadlineTaskNotificationIntervalHours');
      const n = raw ? Number(raw) : DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours;
      return { deadlineTaskNotificationIntervalHours: Number.isFinite(n) && n > 0 ? n : 4 };
    },
    async save(s: AppSettings): Promise<void> {
      store.set('deadlineTaskNotificationIntervalHours', String(s.deadlineTaskNotificationIntervalHours));
    },
    async getIntervalHours(): Promise<number> {
      return (await this.load()).deadlineTaskNotificationIntervalHours;
    },
    async setIntervalHours(hours: number): Promise<void> {
      if (!(hours > 0)) throw new Error('Interval must be > 0');
      const current = await this.load();
      await this.save({ ...current, deadlineTaskNotificationIntervalHours: hours });
    },
  };
}

export function __resetSettingsForTests(): void {
  store.set('deadlineTaskNotificationIntervalHours', String(DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours));
}
