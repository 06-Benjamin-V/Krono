import initialSchema from './migrations/001_init.sql?raw';
export const MIGRATION_V1 = initialSchema;
export const MIGRATIONS = [{ version: 1, name: '001_init', sql: initialSchema }];
export const LATEST_DB_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
