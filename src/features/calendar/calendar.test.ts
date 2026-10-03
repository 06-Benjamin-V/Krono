import { describe, it, expect } from 'vitest';
import { monthDays, itemsForDay, type AgendaItem } from './calendar.ts';
import { createTaskRepository } from '@/database/repositories/TaskRepository.ts';
import { createEventRepository } from '@/database/repositories/EventRepository.ts';
import { computeDailyEndAt, computeReminderTimes } from '@/utils/date.ts';

describe('Agenda y límites temporales', () => {
  it('completa las semanas del mes empezando en lunes', () => {
    const days = monthDays(new Date(2026, 1, 10));
    expect(days[0].getDay()).toBe(1);
    expect(days[days.length-1].getDay()).toBe(0);
    expect(days.length % 7).toBe(0);
    expect(days.filter(d => d.getMonth() === 1)).toHaveLength(28);
  });
  it('incluye medianoche y eventos instantáneos con la misma regla que SQLite', async () => {
    const start = new Date(2026,9,3,23).toISOString();
    const midnight = new Date(2026,9,4,0).toISOString();
    const tasks = createTaskRepository(); const events = createEventRepository();
    const task = await tasks.create({title:'Límite',type:'DEADLINE',startAt:start,endAt:midnight,color:'#123456'});
    const event = await events.create({title:'Instante',startAt:midnight,endAt:midnight,color:'#abcdef'});
    const items: AgendaItem[] = [{kind:'task',item:task},{kind:'event',item:event}];
    expect(itemsForDay(items,midnight)).toHaveLength(2);
    expect(await tasks.countByDay(midnight)).toBe(1);
    expect(await events.countByDay(midnight)).toBe(1);
  });
  it('DAILY siempre dura 24 horas reales con fechas alrededor de cambios horarios', () => {
    for (const start of ['2026-09-05T23:00:00-04:00','2026-04-04T23:00:00-03:00']) {
      expect(Date.parse(computeDailyEndAt(start))-Date.parse(start)).toBe(86400000);
    }
  });
  it('salta avisos pasados y limita planes excesivos', () => {
    const times = computeReminderTimes('2000-01-01T00:00:00Z','2026-10-04T00:00:00Z',2, Date.parse('2026-10-03T20:00:00Z'));
    expect(times).toEqual(['2026-10-03T22:00:00.000Z']);
    expect(() => computeReminderTimes('2000-01-01T00:00:00Z','2026-10-04T00:00:00Z',1)).toThrow();
  });
});
