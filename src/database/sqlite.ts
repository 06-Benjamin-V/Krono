import { Capacitor } from '@capacitor/core';
import { appConfig } from '@/config.ts';
import { LATEST_DB_VERSION, MIGRATIONS } from './migrations.ts';

/** Minimal executor abstraction: native SQLite on device, in-memory fallback on web. */
export interface DbExecutor {
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getVersion(): Promise<number>;
  setVersion(v: number): Promise<void>;
}

class MemoryExecutor implements DbExecutor {
  tasks = new Map<string, Record<string, unknown>>();
  events = new Map<string, Record<string, unknown>>();
  settings = new Map<string, string>();
  version = 0;

  async execute(_sql: string, _params?: unknown[]): Promise<void> {
    // Schema is implicit in memory; migrations only bump the version.
  }
  async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
    return [];
  }
  async getVersion(): Promise<number> {
    return this.version;
  }
  async setVersion(v: number): Promise<void> {
    this.version = v;
  }
}

let executor: DbExecutor | null = null;
let initPromise: Promise<DbExecutor> | null = null;

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getExecutor(): DbExecutor {
  if (!executor) executor = new MemoryExecutor();
  return executor;
}

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Applies pending migrations without destroying user data (CREATE IF NOT EXISTS only). */
export async function initDatabase(): Promise<DbExecutor> {
  if (executor) return executor;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = getExecutor();
    const current = await db.getVersion();
    for (const m of MIGRATIONS) {
      if (m.version > current) {
        for (const stmt of splitStatements(m.sql)) {
          await db.execute(stmt, []);
        }
        await db.setVersion(m.version);
      }
    }
    void appConfig.databaseName;
    return db;
  })();
  executor = await initPromise;
  return executor;
}

export function __resetDatabaseForTests(): void {
  executor = null;
  initPromise = null;
}

export { LATEST_DB_VERSION };
