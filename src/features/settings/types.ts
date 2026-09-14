export interface AppSettings {
  deadlineTaskNotificationIntervalHours: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  deadlineTaskNotificationIntervalHours: 4,
};

export const SETTINGS_KEYS = {
  deadlineTaskNotificationIntervalHours: 'deadlineTaskNotificationIntervalHours',
} as const;
