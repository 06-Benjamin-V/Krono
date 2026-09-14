import type { ColorHex, ISODateString, UUID } from '@/types/common.ts';

/** Events are NOT completable and have NO notifications (v1). */
export interface EventItem {
  id: UUID;
  title: string;
  description?: string;
  startAt: ISODateString;
  endAt: ISODateString;
  color: ColorHex;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EventInput {
  title: string;
  description?: string;
  startAt: ISODateString;
  endAt: ISODateString;
  color: ColorHex;
}
