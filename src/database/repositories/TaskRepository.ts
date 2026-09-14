import type { Task, TaskInput } from '@/features/tasks/types.ts';
import type { ISODateString, UUID } from '@/types/common.ts';
import { appConfig } from '@/config.ts';
import { computeDailyEndAt, nowISO } from '@/utils/date.ts';
import { normalizeColor } from '@/utils/color.ts';
import { newId } from '@/utils/id.ts';
import { getExecutor } from '../sqlite.ts';

export interface TaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: UUID): Promise<Task | null>;
  getByDateRange(start: ISODateString, end: ISODateString): Promise<Task[]>;
  getPending(): Promise<Task[]>;
  countByDay(day: ISODateString): Promise<number>;
  create(input: TaskInput): Promise<Task>;
  complete(id: UUID): Promise<Task | null>;
  remove(id: UUID): Promise<void>;
}

function validate(input: TaskInput): void {
  if (!input.title.trim()) throw new Error('Task title is required');
  if (input.type === 'DEADLINE') {
    if (!input.endAt) throw new Error('DEADLINE tasks require endAt');
    if (!(Date.parse(input.endAt) > Date.parse(input.startAt))) {
      throw new Error('endAt must be later than startAt');
    }
  }
}

/** Stage-1 in-memory implementation behind the repository interface. SQL-backed native impl plugs into getExecutor() in stage 2. */
class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<UUID, Task>();

  async getAll(): Promise<Task[]> {
    return [...this.store.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  async getById(id: UUID): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }
  async getByDateRange(start: ISODateString, end: ISODateString): Promise<Task[]> {
    void getExecutor();
    return [...this.store.values()].filter((t) => t.startAt <= end && t.endAt >= start);
  }
  async getPending(): Promise<Task[]> {
    return [...this.store.values()].filter((t) => !t.completed);
  }
  async countByDay(day: ISODateString): Promise<number> {
    const { isWithinDayISO } = await import('@/utils/date.ts');
    return [...this.store.values()].filter(
      (t) => isWithinDayISO(t.startAt, day) || isWithinDayISO(t.endAt, day),
    ).length;
  }
  async create(input: TaskInput): Promise<Task> {
    validate(input);
    const now = nowISO();
    const endAt = input.type === 'DAILY' ? computeDailyEndAt(input.startAt) : (input.endAt as ISODateString);
    const task: Task = {
      id: newId(),
      title: input.title.trim(),
      description: input.description,
      type: input.type,
      startAt: input.startAt,
      endAt,
      color: normalizeColor(input.color),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    void appConfig.databaseName;
    this.store.set(task.id, task);
    return task;
  }
  async complete(id: UUID): Promise<Task | null> {
    const t = this.store.get(id);
    if (!t) return null;
    const completedAt = nowISO();
    const updated: Task = { ...t, completed: true, completedAt, updatedAt: completedAt };
    this.store.set(id, updated);
    return updated;
  }
  async remove(id: UUID): Promise<void> {
    this.store.delete(id);
  }
}

export function createTaskRepository(): TaskRepository {
  return new InMemoryTaskRepository();
}
