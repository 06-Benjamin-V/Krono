import { createEventRepository, type EventRepository } from '@/database/repositories/EventRepository.ts';
import { notifyWidgetsUpdated } from '@/plugins/WidgetBridge.ts';
export function createEventService(): EventRepository {
  const repo = createEventRepository();
  return {
    getAll: () => repo.getAll(), getById: id => repo.getById(id),
    getByDateRange: (start, end) => repo.getByDateRange(start, end), countByDay: day => repo.countByDay(day),
    async create(input) { const item = await repo.create(input); await notifyWidgetsUpdated(); return item; },
    async update(id, input) { const item = await repo.update(id, input); if (!item) throw new Error('El evento ya no existe'); await notifyWidgetsUpdated(); return item; },
    async remove(id) { await repo.remove(id); await notifyWidgetsUpdated(); },
  };
}
