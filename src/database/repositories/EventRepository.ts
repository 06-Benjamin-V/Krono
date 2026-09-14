import type { EventInput, EventItem } from '@/features/events/types.ts';
import type { ISODateString, UUID } from '@/types/common.ts';
import { nowISO } from '@/utils/date.ts';
import { normalizeColor } from '@/utils/color.ts';
import { newId } from '@/utils/id.ts';

export interface EventRepository {
  getAll(): Promise<EventItem[]>;
  getById(id: UUID): Promise<EventItem | null>;
  getByDateRange(start: ISODateString, end: ISODateString): Promise<EventItem[]>;
  countByDay(day: ISODateString): Promise<number>;
  create(input: EventInput): Promise<EventItem>;
  remove(id: UUID): Promise<void>;
}

class InMemoryEventRepository implements EventRepository {
  private store = new Map<UUID, EventItem>();

  async getAll(): Promise<EventItem[]> {
    return [...this.store.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  async getById(id: UUID): Promise<EventItem | null> {
    return this.store.get(id) ?? null;
  }
  async getByDateRange(start: ISODateString, end: ISODateString): Promise<EventItem[]> {
    return [...this.store.values()].filter((e) => e.startAt <= end && e.endAt >= start);
  }
  async countByDay(day: ISODateString): Promise<number> {
    const { isWithinDayISO } = await import('@/utils/date.ts');
    return [...this.store.values()].filter(
      (e) => isWithinDayISO(e.startAt, day) || isWithinDayISO(e.endAt, day),
    ).length;
  }
  async create(input: EventInput): Promise<EventItem> {
    if (!input.title.trim()) throw new Error('Event title is required');
    if (!(Date.parse(input.endAt) >= Date.parse(input.startAt))) {
      throw new Error('Event endAt must be >= startAt');
    }
    const now = nowISO();
    const item: EventItem = {
      id: newId(),
      title: input.title.trim(),
      description: input.description,
      startAt: input.startAt,
      endAt: input.endAt,
      color: normalizeColor(input.color),
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(item.id, item);
    return item;
  }
  async remove(id: UUID): Promise<void> {
    this.store.delete(id);
  }
}

export function createEventRepository(): EventRepository {
  return new InMemoryEventRepository();
}
