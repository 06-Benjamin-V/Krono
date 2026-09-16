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
import type { ISODateString } from '@/types/common.ts';

/** Centralized date operations. All values are ISO-8601 UTC strings. No `new Date()` outside this module. */

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

/** Short time label, e.g. "10:00". */
export function formatTime(iso: ISODateString): string {
  return format(parseISO(iso), 'HH:mm');
}

/** Month header, e.g. "septiembre 2026". */
export function formatMonthHeader(iso: ISODateString): string {
  return new Date(parseISO(iso)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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
