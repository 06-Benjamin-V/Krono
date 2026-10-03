import type { Task, TaskInput } from '@/features/tasks/types.ts';
import type { ISODateString, UUID } from '@/types/common.ts';
import { computeDailyEndAt, nowISO, startOfDayISO, endOfDayISO, parseISOOrThrow } from '@/utils/date.ts';
import { normalizeColor } from '@/utils/color.ts';
import { newId } from '@/utils/id.ts';
import { getExecutor } from '../sqlite.ts';
import type { TaskRow } from '../schema.ts';

export interface TaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: UUID): Promise<Task | null>;
  getByDateRange(start: ISODateString, end: ISODateString): Promise<Task[]>;
  getPending(): Promise<Task[]>;
  countByDay(day: ISODateString): Promise<number>;
  create(input: TaskInput): Promise<Task>;
  update(id: UUID, input: TaskInput): Promise<Task | null>;
  complete(id: UUID): Promise<Task | null>;
  uncomplete(id: UUID): Promise<Task | null>;
  remove(id: UUID): Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validate(input: TaskInput): void {
  if (!input.title.trim()) throw new Error('El título es obligatorio');
  parseISOOrThrow(input.startAt);
  if (!['DAILY', 'DEADLINE'].includes(input.type)) throw new Error('Tipo de tarea inválido');
  if (input.type === 'DEADLINE') {
    if (!input.endAt) throw new Error('Indica la fecha de término');
    if (!(Date.parse(input.endAt) > Date.parse(input.startAt))) {
      throw new Error('El término debe ser posterior al inicio');
    }
  }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    startAt: row.start_at,
    endAt: row.end_at,
    color: row.color,
    completed: row.completed === 1,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// SQL-backed repository
// ---------------------------------------------------------------------------

class SqlTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    const rows = await getExecutor().query<TaskRow>(
      'SELECT * FROM tasks ORDER BY start_at ASC',
    );
    return rows.map(rowToTask);
  }

  async getById(id: UUID): Promise<Task | null> {
    const rows = await getExecutor().query<TaskRow>(
      'SELECT * FROM tasks WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rowToTask(rows[0]) : null;
  }

  /** Returns tasks whose time range overlaps [start, end]. */
  async getByDateRange(start: ISODateString, end: ISODateString): Promise<Task[]> {
    const rows = await getExecutor().query<TaskRow>(
      'SELECT * FROM tasks WHERE start_at <= ? AND end_at >= ? ORDER BY start_at ASC',
      [end, start],
    );
    return rows.map(rowToTask);
  }

  async getPending(): Promise<Task[]> {
    const rows = await getExecutor().query<TaskRow>(
      'SELECT * FROM tasks WHERE completed = 0 ORDER BY start_at ASC',
    );
    return rows.map(rowToTask);
  }

  /** Counts tasks that overlap the given calendar day (multi-day spans included). */
  async countByDay(day: ISODateString): Promise<number> {
    const dayStart = startOfDayISO(day);
    const dayEnd = endOfDayISO(day);
    const result = await getExecutor().query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM tasks WHERE start_at <= ? AND end_at >= ?',
      [dayEnd, dayStart],
    );
    return result[0]?.cnt ?? 0;
  }

  async create(input: TaskInput): Promise<Task> {
    validate(input);
    const now = nowISO();
    const endAt =
      input.type === 'DAILY' ? computeDailyEndAt(input.startAt) : parseISOOrThrow(input.endAt!);
    const task: Task = {
      id: newId(),
      title: input.title.trim(),
      description: input.description,
      type: input.type,
      startAt: parseISOOrThrow(input.startAt),
      endAt,
      color: normalizeColor(input.color),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await getExecutor().execute(
      `INSERT INTO tasks (id, title, description, type, start_at, end_at, color, completed, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description ?? null,
        task.type,
        task.startAt,
        task.endAt,
        task.color,
        0,
        null,
        task.createdAt,
        task.updatedAt,
      ],
    );

    return task;
  }

  async update(id: UUID, input: TaskInput): Promise<Task | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    validate(input);

    const now = nowISO();
    const endAt =
      input.type === 'DAILY' ? computeDailyEndAt(input.startAt) : parseISOOrThrow(input.endAt!);

    await getExecutor().execute(
      `UPDATE tasks SET title = ?, description = ?, type = ?, start_at = ?, end_at = ?, color = ?, updated_at = ? WHERE id = ?`,
      [
        input.title.trim(),
        input.description ?? null,
        input.type,
        parseISOOrThrow(input.startAt),
        endAt,
        normalizeColor(input.color),
        now,
        id,
      ],
    );

    const updatedTask: Task = {
      ...existing,
      title: input.title.trim(),
      description: input.description,
      type: input.type,
      startAt: parseISOOrThrow(input.startAt),
      endAt,
      color: normalizeColor(input.color),
      updatedAt: now,
    };

    return updatedTask;
  }

  async complete(id: UUID): Promise<Task | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const completedAt = nowISO();
    await getExecutor().execute(
      'UPDATE tasks SET completed = 1, completed_at = ?, updated_at = ? WHERE id = ?',
      [completedAt, completedAt, id],
    );

    return { ...existing, completed: true, completedAt, updatedAt: completedAt };
  }

  async uncomplete(id: UUID): Promise<Task | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updatedAt = nowISO();
    await getExecutor().execute(
      'UPDATE tasks SET completed = 0, completed_at = NULL, updated_at = ? WHERE id = ?',
      [updatedAt, id],
    );

    return { ...existing, completed: false, completedAt: undefined, updatedAt };
  }

  async remove(id: UUID): Promise<void> {
    await getExecutor().execute('DELETE FROM tasks WHERE id = ?', [id]);

  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createTaskRepository(): TaskRepository {
  return new SqlTaskRepository();
}
