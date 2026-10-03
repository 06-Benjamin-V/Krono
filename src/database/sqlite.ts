import { Capacitor } from '@capacitor/core';
import { WidgetBridge } from '@/plugins/WidgetBridge.ts';
import { appConfig } from '@/config.ts';
import { LATEST_DB_VERSION, MIGRATIONS } from './migrations.ts';

export interface DbExecutor {
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getVersion(): Promise<number>;
  setVersion(v: number): Promise<void>;
  migrate(sql: string, version: number): Promise<void>;
}

/** Real SQLite in memory. Web is explicitly a temporary development preview. */
export async function createMemoryDatabase(wasmBinary?: Uint8Array): Promise<DbExecutor> {
  const { default: initSqlJs } = await import('sql.js');
  const { default: wasmUrl } = await import('sql.js/dist/sql-wasm.wasm?url');
  const SQL = await initSqlJs(wasmBinary ? {wasmBinary: Uint8Array.from(wasmBinary).buffer} : { locateFile: () => wasmUrl });
  const db = new SQL.Database();
  return {
    async execute(sql, params = []) { db.run(sql, params as import('sql.js').BindParams); },
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const statement = db.prepare(sql);
      try {
        statement.bind(params as import('sql.js').BindParams);
        const rows: T[] = [];
        while (statement.step()) rows.push(statement.getAsObject() as T);
        return rows;
      } finally { statement.free(); }
    },
    async getVersion() { return Number(db.exec('PRAGMA user_version')[0].values[0][0]); },
    async setVersion(v) { db.run(`PRAGMA user_version = ${Number(v)}`); },
    async migrate(sql, version) {
      db.run('BEGIN');
      try { db.run(sql); db.run(`PRAGMA user_version = ${Number(version)}`); db.run('COMMIT'); }
      catch (error) { db.run('ROLLBACK'); throw error; }
    },
  };
}

class NativeExecutor implements DbExecutor {
  async execute(sql: string, params: unknown[] = []): Promise<void> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    await CapacitorSQLite.run({ database: appConfig.databaseName, statement: sql, values: params });
  }
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    const result = await CapacitorSQLite.query({ database: appConfig.databaseName, statement: sql, values: params });
    return (result.values ?? []) as T[];
  }
  async getVersion(): Promise<number> { return (await this.query<{user_version: number}>('PRAGMA user_version'))[0].user_version; }
  async setVersion(): Promise<void> { throw new Error('Las migraciones Android pertenecen al helper nativo'); }
  async migrate(): Promise<void> { throw new Error('Las migraciones Android pertenecen al helper nativo'); }
}

let executor: DbExecutor | null = null;
let initPromise: Promise<DbExecutor> | null = null;
let nativeConnectionCreated = false;
export function isNativePlatform(): boolean { return Capacitor.isNativePlatform(); }
export function getExecutor(): DbExecutor {
  if (!executor) throw new Error('La base de datos no está lista');
  return executor;
}

export async function applyMigrations(db: DbExecutor): Promise<void> {
  const current = await db.getVersion();
  if (current > LATEST_DB_VERSION) throw new Error('Esta base requiere una versión más reciente de Krono');
  for (const migration of MIGRATIONS) {
    if (migration.version > current) await db.migrate(migration.sql, migration.version);
  }
}

export async function initDatabase(): Promise<DbExecutor> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (isNativePlatform()) {
      await WidgetBridge.prepareDatabase();
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
      if (nativeConnectionCreated) {
        await CapacitorSQLite.closeConnection({database: appConfig.databaseName});
        nativeConnectionCreated = false;
      }
      await CapacitorSQLite.createConnection({database: appConfig.databaseName, version: LATEST_DB_VERSION, encrypted: false, mode: 'no-encryption'});
      nativeConnectionCreated = true;
      await CapacitorSQLite.open({database: appConfig.databaseName});
      executor = new NativeExecutor();
      if (await executor.getVersion() !== LATEST_DB_VERSION) throw new Error('Versión de base de datos inesperada');
    } else {
      const db = await createMemoryDatabase();
      await applyMigrations(db);
      executor = db;
    }
    return executor;
  })().catch(error => { executor = null; initPromise = null; throw error; });
  return initPromise;
}

export function __setDatabaseForTests(db: DbExecutor): void { executor = db; initPromise = Promise.resolve(db); }
export function __resetDatabaseForTests(): void { executor = null; initPromise = null; }
export { LATEST_DB_VERSION };
