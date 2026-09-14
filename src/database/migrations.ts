/** Migration v1: initial schema. Additive-only policy for future migrations. */
export const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('DAILY','DEADLINE')),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  color TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_start_at ON tasks(start_at);
CREATE INDEX IF NOT EXISTS idx_tasks_end_at ON tasks(end_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_end_at ON events(end_at);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [{ version: 1, name: '001_init', sql: MIGRATION_V1 }];

export const LATEST_DB_VERSION = 1;
