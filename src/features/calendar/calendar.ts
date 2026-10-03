import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import type { Task } from '@/features/tasks/types.ts';
import type { EventItem } from '@/features/events/types.ts';
import { overlapsDay } from '@/utils/date.ts';
export type AgendaItem = {kind: 'task'; item: Task} | {kind: 'event'; item: EventItem};
export function monthDays(selected: Date): Date[] {
  return eachDayOfInterval({start: startOfWeek(startOfMonth(selected), {weekStartsOn: 1}), end: endOfWeek(endOfMonth(selected), {weekStartsOn: 1})});
}
export function weekDays(selected: Date): Date[] {
  const start = startOfWeek(selected, {weekStartsOn: 1});
  return Array.from({length: 7}, (_, i) => addDays(start, i));
}
/** Closed time ranges match native widgets; midnight and instantaneous events are included. */
export function itemsForDay(items: AgendaItem[], day: string): AgendaItem[] {
  return items.filter(({item}) => overlapsDay(item, day)).sort((a,b) => a.item.startAt.localeCompare(b.item.startAt) || a.item.title.localeCompare(b.item.title, 'es'));
}
