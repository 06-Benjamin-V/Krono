import type { EventInput, EventItem } from '@/features/events/types.ts';
import type { ISODateString, UUID } from '@/types/common.ts';
import { nowISO, startOfDayISO, endOfDayISO, parseISOOrThrow } from '@/utils/date.ts';
import { normalizeColor } from '@/utils/color.ts';
import { newId } from '@/utils/id.ts';
import { getExecutor } from '../sqlite.ts';
import type { EventRow } from '../schema.ts';

export interface EventRepository {
  getAll(): Promise<EventItem[]>;
  getById(id: UUID): Promise<EventItem | null>;
  getByDateRange(start: ISODateString, end: ISODateString): Promise<EventItem[]>;
  countByDay(day: ISODateString): Promise<number>;
  create(input: EventInput): Promise<EventItem>;
  update(id: UUID, input: EventInput): Promise<EventItem | null>;
  remove(id: UUID): Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateEvent(input: EventInput): void {
  if (!input.title.trim()) throw new Error('El título es obligatorio');
  if (!(Date.parse(input.endAt) >= Date.parse(input.startAt))) {
    throw new Error('El término no puede ser anterior al inicio');
  }
}

function rowToEvent(row: EventRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    startAt: row.start_at,
    endAt: row.end_at,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// SQL-backed repository
// ---------------------------------------------------------------------------

class SqlEventRepository implements EventRepository {
  async getAll(): Promise<EventItem[]> {
    const rows = await getExecutor().query<EventRow>(
      'SELECT * FROM events ORDER BY start_at ASC',
    );
    return rows.map(rowToEvent);
  }

  async getById(id: UUID): Promise<EventItem | null> {
    const rows = await getExecutor().query<EventRow>(
      'SELECT * FROM events WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rowToEvent(rows[0]) : null;
  }

  /** Returns events whose time range overlaps [start, end]. */
  async getByDateRange(start: ISODateString, end: ISODateString): Promise<EventItem[]> {
    const rows = await getExecutor().query<EventRow>(
      'SELECT * FROM events WHERE start_at <= ? AND end_at >= ? ORDER BY start_at ASC',
      [end, start],
    );
    return rows.map(rowToEvent);
  }

  /** Counts events that overlap the given calendar day (multi-day spans included). */
  async countByDay(day: ISODateString): Promise<number> {
    const dayStart = startOfDayISO(day);
    const dayEnd = endOfDayISO(day);
    const result = await getExecutor().query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM events WHERE start_at <= ? AND end_at >= ?',
      [dayEnd, dayStart],
    );
    return result[0]?.cnt ?? 0;
  }

  async create(input: EventInput): Promise<EventItem> {
    validateEvent(input);
    const now = nowISO();
    const item: EventItem = {
      id: newId(),
      title: input.title.trim(),
      description: input.description,
      startAt: parseISOOrThrow(input.startAt),
      endAt: parseISOOrThrow(input.endAt),
      color: normalizeColor(input.color),
      createdAt: now,
      updatedAt: now,
    };

    await getExecutor().execute(
      `INSERT INTO events (id, title, description, start_at, end_at, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.title,
        item.description ?? null,
        item.startAt,
        item.endAt,
        item.color,
        item.createdAt,
        item.updatedAt,
      ],
    );



    return item;
  }

  async update(id: UUID, input: EventInput): Promise<EventItem | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    validateEvent(input);

    const now = nowISO();
    await getExecutor().execute(
      `UPDATE events SET title = ?, description = ?, start_at = ?, end_at = ?, color = ?, updated_at = ? WHERE id = ?`,
      [
        input.title.trim(),
        input.description ?? null,
        parseISOOrThrow(input.startAt),
        parseISOOrThrow(input.endAt),
        normalizeColor(input.color),
        now,
        id,
      ],
    );



    return {
      ...existing,
      title: input.title.trim(),
      description: input.description,
      startAt: parseISOOrThrow(input.startAt),
      endAt: parseISOOrThrow(input.endAt),
      color: normalizeColor(input.color),
      updatedAt: now,
    };
  }

  async remove(id: UUID): Promise<void> {
    await getExecutor().execute('DELETE FROM events WHERE id = ?', [id]);

  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEventRepository(): EventRepository {
  return new SqlEventRepository();
}
