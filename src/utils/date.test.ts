import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  addHoursISO,
  computeDailyEndAt,
  computeReminderTimes,
  formatDate,
  formatDateTime,
  formatDuration,
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

describe('date formatting (Spanish locale)', () => {
  // Built from local time so assertions hold in any timezone.
  const localIso = (y: number, m: number, d: number, h: number, min: number): string =>
    new Date(y, m, d, h, min).toISOString();

  it('formats a date as "d MMM yyyy"', () => {
    expect(formatDate(localIso(2026, 8, 14, 10, 0))).toBe('14 sep 2026');
  });

  it('formats a date and time as "d MMM yyyy, HH:mm"', () => {
    expect(formatDateTime(localIso(2026, 8, 14, 10, 0))).toBe('14 sep 2026, 10:00');
    expect(formatDateTime(localIso(2026, 11, 3, 23, 5))).toBe('3 dic 2026, 23:05');
  });

  it('formats durations in Spanish', () => {
    expect(formatDuration(localIso(2026, 8, 14, 10, 0), localIso(2026, 8, 15, 10, 0))).toBe('24 h');
    expect(formatDuration(localIso(2026, 8, 14, 10, 0), localIso(2026, 8, 14, 12, 30))).toBe('2 h 30 min');
    expect(formatDuration(localIso(2026, 8, 14, 10, 0), localIso(2026, 8, 14, 10, 45))).toBe('45 min');
    expect(formatDuration(localIso(2026, 8, 14, 10, 0), localIso(2026, 8, 15, 12, 0))).toBe('1 d 2 h');
  });

  it('returns an empty duration for invalid ranges', () => {
    const same = localIso(2026, 8, 14, 10, 0);
    expect(formatDuration(same, same)).toBe('');
    expect(formatDuration(localIso(2026, 8, 15, 10, 0), localIso(2026, 8, 14, 10, 0))).toBe('');
  });
});
