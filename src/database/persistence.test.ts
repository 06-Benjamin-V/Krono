import { describe, it, expect } from 'vitest';
import { getExecutor, applyMigrations } from './sqlite.ts';
import { createTaskRepository } from './repositories/TaskRepository.ts';
import { createEventRepository } from './repositories/EventRepository.ts';
import { createSettingsRepository } from './repositories/SettingsRepository.ts';

describe('Persistencia con SQLite real', () => {
  it('normaliza offsets y conserva datos al reaplicar migraciones', async () => {
    const repo = createTaskRepository();
    const task = await repo.create({title: 'Prueba', type: 'DEADLINE', startAt: '2026-10-03T10:00:00-03:00', endAt: '2026-10-03T12:00:00-03:00',color: '#123456'});
    await repo.complete(task.id);
    await applyMigrations(getExecutor());
    const stored = await repo.getById(task.id);
    expect(stored).toMatchObject({startAt: '2026-10-03T13:00:00.000Z', endAt: '2026-10-03T15:00:00.000Z', completed: true, color: '#123456'});
  });
  it('revierte toda una migración fallida y conserva su versión', async () => {
    const db = getExecutor();
    await expect(db.migrate('CREATE TABLE test_migration (id TEXT); INSERT INTO missing_table VALUES (1);',2)).rejects.toThrow();
    expect(await db.getVersion()).toBe(1);
    expect(await db.query("SELECT name FROM sqlite_master WHERE name = 'test_migration'")).toEqual([]);
  });
  it('rechaza fechas inválidas y trata SQL del usuario como datos', async () => {
    const repo = createTaskRepository();
    await expect(repo.create({title: 'Mal',type: 'DAILY',startAt: 'invalid',color: '#123456'})).rejects.toThrow();
    const title = "'; DROP TABLE tasks; --";
    const task = await repo.create({title,type: 'DAILY',startAt: '2026-10-03T00:00:00Z',color: '#123456'});
    expect((await repo.getById(task.id))?.title).toBe(title);
  });
  it('persiste eventos sin propiedades de completado y valida intervalos', async () => {
    const repo = createEventRepository();
    const event = await repo.create({title: 'Evento',startAt: '2026-10-03T10:00:00Z',endAt: '2026-10-03T10:00:00Z',color: '#123456'});
    expect(await repo.getById(event.id)).not.toHaveProperty('completed');
    const settings = createSettingsRepository();
    for(const hours of [0,-1,NaN,Infinity,0.5,3]) await expect(settings.setIntervalHours(hours)).rejects.toThrow();
    await settings.setIntervalHours(12);
    expect(await settings.getIntervalHours()).toBe(12);
  });
});
