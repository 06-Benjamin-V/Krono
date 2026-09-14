import { v4 as uuidv4 } from 'uuid';
import type { UUID } from '@/types/common.ts';

export function newId(): UUID {
  return uuidv4();
}
