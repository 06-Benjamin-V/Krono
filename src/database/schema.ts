/** Row types mirror SQLite tables 1:1 (snake_case). Domain mapping lives in repositories. */

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  type: 'DAILY' | 'DEADLINE';
  start_at: string;
  end_at: string;
  color: string;
  completed: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface SettingRow {
  key: string;
  value: string;
}
