import { DEFAULT_SETTINGS } from '@/features/settings/types.ts';

/** Single source of truth for app-wide configurable values. */
export const appConfig = {
  /** Fixed reminder cadence for DAILY (24h) tasks. */
  dailyTaskNotificationIntervalHours: 2,
  dailyTaskDurationHours: 24,
  defaultDeadlineIntervalHours: DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours,
  databaseName: 'taskmanager.db',
  databaseVersion: 1,
} as const;
