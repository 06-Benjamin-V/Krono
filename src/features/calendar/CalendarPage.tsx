import { useCallback, useState } from 'react';
import { addDays, addMonths, format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createTaskService } from '@/services/TaskService.ts';
import { createEventService } from '@/services/EventService.ts';
import { useRecords } from '@/hooks/useRecords.ts';
import { useSessionState } from '@/hooks/useSessionState.ts';
import { useClock } from '@/hooks/useClock.ts';
import { startOfDayISO, endOfDayISO, formatDayHeader, formatMonthHeader } from '@/utils/date.ts';
import { TaskCard } from '@/features/tasks/components/TaskCard.tsx';
import { EventCard } from '@/features/events/components/EventCard.tsx';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@/components/ui/Icons.tsx';
import { itemsForDay, monthDays, weekDays, type AgendaItem } from './calendar.ts';

const tasks = createTaskService();
const events = createEventService();
export function CalendarPage({monthly = false}: {monthly?: boolean}): JSX.Element {
  const navigate = useNavigate();
  const now = useClock();
  const [selectedIso, setSelectedIso] = useSessionState('agenda:day', new Date().toISOString());
  const selected = Number.isNaN(Date.parse(selectedIso)) ? new Date(now) : parseISO(selectedIso);
  const days = monthDays(selected);
  const start = startOfDayISO(days[0].toISOString());
  const end = endOfDayISO(days[days.length - 1].toISOString());
  const load = useCallback(async (): Promise<AgendaItem[]> => {
    const [taskItems, eventItems] = await Promise.all([tasks.getByDateRange(start,end),events.getByDateRange(start,end)]);
    return [...taskItems.map(item => ({kind: 'task' as const, item})),...eventItems.map(item => ({kind: 'event' as const,item}))];
  }, [start,end]);
  const {items, error, loading, busy, run, reload} = useRecords(load);
  const [deleting, setDeleting] = useState<AgendaItem | null>(null);
  const selectedItems = itemsForDay(items, selected.toISOString());
  const taskCount = selectedItems.filter(item => item.kind === 'task').length;
  const done = selectedItems.filter(item => item.kind === 'task' && item.item.completed).length;
  const eventCount = selectedItems.length - taskCount;
  const moveDay = (delta: number): void => setSelectedIso(addDays(selected,delta).toISOString());
  const setDay = (day: Date): void => setSelectedIso(day.toISOString());
  const visibleDays = monthly ? days : weekDays(selected);
  const toggle = (id: string): void => { void run(async () => {
    const task = await tasks.getById(id); if (!task) throw new Error('La tarea ya no existe');
    return task.completed ? tasks.uncomplete(id) : tasks.complete(id);
  }); };
  return <div className="agenda-page anim-fade-in">
    <div className="page-header"><div><p className="eyebrow">{monthly ? 'UNA MIRADA AL MES' : format(new Date(now), "EEEE, d 'de' MMMM", {locale: es}).toLocaleUpperCase('es')}</p><h1>{monthly ? 'Tu calendario' : 'Tu día, a tu ritmo.'}</h1><p className="page-intro">{monthly ? 'Encuentra espacio para cada plan.' : 'Lo importante empieza con un pequeño paso.'}</p></div></div>
    {!monthly && <div className="day-summary"><div><span className="summary-label">EN TU DÍA</span><strong>{taskCount - done}<small> tareas pendientes</small></strong><p>{done} completadas · {eventCount} {eventCount === 1 ? 'evento' : 'eventos'}</p></div><Button onClick={() => navigate('/tasks/new')}><PlusIcon size={18} /> Crear tarea</Button></div>}
    <section className="calendar-panel" aria-label={monthly ? 'Calendario mensual' : 'Semana seleccionada'}>
      {monthly && <div className="calendar-toolbar"><button className="btn-icon" aria-label="Mes anterior" onClick={() => setDay(addMonths(selected,-1))}><ChevronLeftIcon /></button><h2>{formatMonthHeader(selected.toISOString())}</h2><button className="btn-icon" aria-label="Mes siguiente" onClick={() => setDay(addMonths(selected,1))}><ChevronRightIcon /></button></div>}
      <div className="month-grid">{['L','M','X','J','V','S','D'].map((text,i) => <span key={i} className="weekday" aria-hidden="true">{text}</span>)}
        {visibleDays.map(day => {
          const dayItems = itemsForDay(items,day.toISOString());
          const current = isSameDay(selected,day);
          return <button key={day.toISOString()} aria-pressed={current} aria-current={isSameDay(day,new Date(now)) ? 'date' : undefined} aria-label={`${formatDayHeader(day.toISOString())}, ${dayItems.filter(i => i.kind === 'task').length} tareas, ${dayItems.filter(i => i.kind === 'event').length} eventos`} className={`month-day ${current ? 'selected' : ''} ${isSameMonth(selected,day) ? '' : 'outside'}`} onClick={() => setDay(day)}>
            <span>{format(day,'d')}</span><span className="day-dots" aria-hidden="true">{dayItems.slice(0,3).map(({kind,item}) => <i key={kind+item.id} style={{backgroundColor: item.color}} />)}{dayItems.length > 3 && <small>+{dayItems.length - 3}</small>}</span>
          </button>;
        })}
      </div>
      <div className="calendar-counts"><span><b>{taskCount}</b> Tareas</span><span><b>{eventCount}</b> Eventos</span><button className="text-button" onClick={() => setDay(new Date(now))}>Volver a hoy</button></div>
    </section>
    <div className="selected-day-header"><button className="btn-icon" aria-label="Día anterior" onClick={() => moveDay(-1)}><ChevronLeftIcon /></button><h2>{formatDayHeader(selected.toISOString())}</h2><button className="btn-icon" aria-label="Día siguiente" onClick={() => moveDay(1)}><ChevronRightIcon /></button></div>
    <ErrorNotice message={error} onRetry={() => void reload()} />
    {loading ? <SkeletonList count={2} /> : !error && selectedItems.length === 0 ? <div className="empty-state"><div className="empty-orbit">✧</div><h2>Un día con espacio</h2><p>Añade una tarea o reserva un momento para ti.</p></div> : <div className="item-list" aria-busy={busy}>{selectedItems.map(entry => entry.kind === 'task' ? <TaskCard key={entry.item.id} task={entry.item} busy={busy} onToggleComplete={toggle} onRemove={() => setDeleting(entry)} onEdit={id => navigate('/tasks/'+id+'/edit')} /> : <EventCard key={entry.item.id} event={entry.item} busy={busy} onRemove={() => setDeleting(entry)} onEdit={id => navigate('/events/'+id+'/edit')} />)}</div>}
    <div className="agenda-create"><Button variant="secondary" onClick={() => navigate('/tasks/new')}><PlusIcon size={16} /> Tarea</Button><Button variant="secondary" onClick={() => navigate('/events/new')}><PlusIcon size={16} /> Evento</Button></div>
    <ConfirmDelete title={deleting?.item.title ?? null} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) void run(() => deleting.kind === 'task' ? tasks.remove(deleting.item.id) : events.remove(deleting.item.id)).then(() => setDeleting(null)); }} />
  </div>;
}
