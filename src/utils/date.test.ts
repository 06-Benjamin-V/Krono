import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  addHoursISO,
  computeDailyEndAt,
  computeReminderTimes,
  isSameDayISO,
  isWithinDayISO,
  parseISOOrThrow,
} from './date.ts';

describe('date utils', () => {
  it('computes DAILY end as start + 24h', () => {
    const start = '2026-09-14T10:00:00.000Z';
    expect(computeDailyEndAt(start)).toBe('2026-09-15T10:00:00.000Z');
  });

  it('adds hours across day boundary', () => {
    expect(addHoursISO('2026-09-14T22:00:00.000Z', 3)).toBe('2026-09-15T01:00:00.000Z');
    expect(addDaysISO('2026-09-14T10:00:00.000Z', 1)).toBe('2026-09-15T10:00:00.000Z');
  });

  it('schedules DAILY reminders every 2h without exceeding end', () => {
    const start = '2026-09-14T10:00:00.000Z';
    const end = '2026-09-15T10:00:00.000Z';
    const times = computeReminderTimes(start, end, 2);
    expect(times).toHaveLength(11);
    expect(times[0]).toBe('2026-09-14T12:00:00.000Z');
    expect(times[times.length - 1]).toBe('2026-09-15T08:00:00.000Z');
  });

  it('returns no reminders when end <= start or interval invalid', () => {
    expect(computeReminderTimes('2026-09-15T10:00:00.000Z', '2026-09-14T10:00:00.000Z', 2)).toEqual([]);
    expect(computeReminderTimes('2026-09-14T10:00:00.000Z', '2026-09-15T10:00:00.000Z', 0)).toEqual([]);
  });

  it('compares calendar days', () => {
    expect(isSameDayISO('2026-09-14T10:00:00.000Z', '2026-09-14T23:00:00.000Z')).toBe(true);
    expect(isWithinDayISO('2026-09-14T23:59:00.000Z', '2026-09-14T10:00:00.000Z')).toBe(true);
    expect(() => parseISOOrThrow('not-a-date')).toThrow();
  });
});
