import type { ColorHex, ISODateString, UUID } from '@/types/common.ts';

export type TaskType = 'DAILY' | 'DEADLINE';

export interface Task {
  id: UUID;
  title: string;
  description?: string;
  type: TaskType;
  /** ISO-8601 UTC */
  startAt: ISODateString;
  /** DAILY: startAt + 24h. DEADLINE: user-selected, must be > startAt. */
  endAt: ISODateString;
  color: ColorHex;
  completed: boolean;
  completedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TaskInput {
  title: string;
  description?: string;
  type: TaskType;
  startAt: ISODateString;
  /** Required for DEADLINE, ignored for DAILY (computed). */
  endAt?: ISODateString;
  color: ColorHex;
}
