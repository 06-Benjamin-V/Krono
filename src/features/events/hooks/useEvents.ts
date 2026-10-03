import { createEventService } from '@/services/EventService.ts';
import { useRecords } from '@/hooks/useRecords.ts';
const service = createEventService();
const load = () => service.getAll();
export function useEvents() {
  const state = useRecords(load);
  return { ...state, events: state.items,
    removeEvent: (id: string) => state.run(() => service.remove(id)),

  };
}
