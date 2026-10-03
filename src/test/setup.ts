import '@testing-library/jest-dom/vitest';

import { beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createMemoryDatabase, applyMigrations, __setDatabaseForTests } from '@/database/sqlite.ts';
const require = createRequire(import.meta.url);
const wasm = readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm'));
beforeEach(async () => { const db = await createMemoryDatabase(wasm); await applyMigrations(db); __setDatabaseForTests(db); });
