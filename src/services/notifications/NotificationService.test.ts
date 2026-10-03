import { describe, expect, it } from 'vitest';
import { __testables } from './NotificationService.ts';
import type { Task } from '@/features/tasks/types.ts';

const baseTask: Task = {
  id: 'task-1',
  title: 'Demo',
  type: 'DAILY',
  startAt: '2026-09-14T10:00:00.000Z',
  endAt: '2026-09-15T10:00:00.000Z',
  color: '#EF4444',
  completed: false,
  createdAt: '2026-09-14T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
};

describe('NotificationService planning', () => {
  it('retains IDs when historical reminders are skipped', () => {
    const all = __testables.buildReminders(baseTask, 2);
    const future = __testables.buildReminders(baseTask, 2, Date.parse(all[2].fireAt));
    expect(future).toEqual(all.slice(3));
  });
  it('uses 2h cadence for DAILY and stable ids', () => {
    const reminders = __testables.buildReminders(baseTask, __testables.intervalFor(baseTask));
    expect(reminders).toHaveLength(11);
    expect(reminders[0].notificationId).toBeGreaterThanOrEqual(0);
    expect(new Set(reminders.map((r) => r.notificationId)).size).toBe(reminders.length);
  });

  it('schedules nothing for completed tasks', () => {
    const reminders = __testables.buildReminders({ ...baseTask, completed: true }, 2);
    expect(reminders).toEqual([]);
  });

  it('honours custom DEADLINE interval', () => {
    const deadline: Task = { ...baseTask, type: 'DEADLINE', endAt: '2026-09-14T16:00:00.000Z' };
    const every2h = __testables.buildReminders(deadline, 2);
    const every6h = __testables.buildReminders(deadline, 6);
    expect(every2h).toHaveLength(2);
    expect(every6h).toHaveLength(0);
  });
});
