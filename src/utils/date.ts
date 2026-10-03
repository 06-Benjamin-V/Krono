import {
  addDays,
  addHours,
  endOfDay,
  endOfMonth,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { ISODateString } from '@/types/common.ts';

/** Centralized date operations. All values are ISO-8601 UTC strings. No `new Date()` outside this module. */

/** Format time as "HH:mm". */
export function formatTime(iso: ISODateString): string {
  return format(parseISO(iso), 'HH:mm');
}

/** Format date as "d MMM yyyy" in Spanish, e.g. "14 sep 2026". */
export function formatDate(iso: ISODateString): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: es });
}

/** Format date+time as "d MMM yyyy, HH:mm" in Spanish, e.g. "14 sep 2026, 10:00". */
export function formatDateTime(iso: ISODateString): string {
  return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });
}

/**
 * Format a duration between two ISO timestamps as a readable Spanish string.
 * Examples: "24 h", "2 h 30 min", "45 min", "1 d 2 h".
 * Returns '' if the range is invalid (endAt <= startAt).
 */
export function formatDuration(startAt: ISODateString, endAt: ISODateString): string {
  const start = parseISO(startAt).getTime();
  const end = parseISO(endAt).getTime();
  const totalMs = end - start;
  if (totalMs <= 0) return '';
  const totalMinutes = Math.floor(totalMs / 60_000);
  if (totalMinutes === 1440) return '24 h';
  const days = Math.floor(totalMinutes / 1440);
  const remaining = totalMinutes % 1440;
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (parts.length === 0) parts.push('0 min');
  return parts.join(' ');
}

export function nowISO(): ISODateString {
  return new Date().toISOString();
}

export function parseISOOrThrow(value: string): ISODateString {
  const d = parseISO(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ISO date: ${value}`);
  return d.toISOString();
}

export function addHoursISO(iso: ISODateString, hours: number): ISODateString {
  return addHours(parseISO(iso), hours).toISOString();
}

export function addDaysISO(iso: ISODateString, days: number): ISODateString {
  return addDays(parseISO(iso), days).toISOString();
}

/** DAILY tasks last exactly 24h. */
export function computeDailyEndAt(startAt: ISODateString): ISODateString {
  return addHoursISO(startAt, 24);
}

export function startOfDayISO(day: ISODateString): ISODateString {
  return startOfDay(parseISO(day)).toISOString();
}

export function endOfDayISO(day: ISODateString): ISODateString {
  return endOfDay(parseISO(day)).toISOString();
}

export function startOfMonthISO(day: ISODateString): ISODateString {
  return startOfMonth(parseISO(day)).toISOString();
}

export function endOfMonthISO(day: ISODateString): ISODateString {
  return endOfMonth(parseISO(day)).toISOString();
}

export function isSameDayISO(a: ISODateString, b: ISODateString): boolean {
  return isSameDay(parseISO(a), parseISO(b));
}

/** True if `iso` falls within the calendar day of `day`. */
export function isWithinDayISO(iso: ISODateString, day: ISODateString): boolean {
  const target = parseISO(day);
  return isWithinInterval(parseISO(iso), {
    start: startOfDay(target),
    end: endOfDay(target),
  });
}

export function formatDayHeader(day: ISODateString, locale?: string): string {
  const d = parseISO(day);
  void locale;
  return format(d, 'd MMMM yyyy');
}

/** Month header, e.g. "septiembre 2026". */
export function formatMonthHeader(iso: ISODateString): string {
  return format(parseISO(iso), 'MMMM yyyy', { locale: es });
}

/** All reminder times strictly before endAt, starting at startAt + interval. */
export function computeReminderTimes(
  startAt: ISODateString,
  endAt: ISODateString,
  intervalHours: number,
): ISODateString[] {
  const start = parseISO(startAt).getTime();
  const end = parseISO(endAt).getTime();
  if (!(end > start)) return [];
  if (intervalHours <= 0) return [];
  const out: ISODateString[] = [];
  let t = start + intervalHours * 3_600_000;
  while (t < end) {
    out.push(new Date(t).toISOString());
    t += intervalHours * 3_600_000;
  }
  return out;
}

export { parseISO };
