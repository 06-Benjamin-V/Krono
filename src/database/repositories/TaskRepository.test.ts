import { describe, expect, it } from 'vitest';
import { createTaskRepository } from './TaskRepository.ts';

describe('TaskRepository (stage-1)', () => {
  it('creates DAILY task with end = start + 24h', async () => {
    const repo = createTaskRepository();
    const task = await repo.create({
      title: 'Estudiar',
      type: 'DAILY',
      startAt: '2026-09-14T10:00:00.000Z',
      color: '#FF5733',
    });
    expect(task.endAt).toBe('2026-09-15T10:00:00.000Z');
    expect(task.completed).toBe(false);
  });

  it('rejects DEADLINE with endAt <= startAt', async () => {
    const repo = createTaskRepository();
    await expect(
      repo.create({
        title: 'Bad',
        type: 'DEADLINE',
        startAt: '2026-09-14T10:00:00.000Z',
        endAt: '2026-09-14T09:00:00.000Z',
        color: '#3B82F6',
      }),
    ).rejects.toThrow();
  });

  it('marks task completed with completedAt', async () => {
    const repo = createTaskRepository();
    const task = await repo.create({
      title: 'X',
      type: 'DAILY',
      startAt: '2026-09-14T10:00:00.000Z',
      color: '#10B981',
    });
    const done = await repo.complete(task.id);
    expect(done?.completed).toBe(true);
    expect(done?.completedAt).toBeDefined();
  });
});
