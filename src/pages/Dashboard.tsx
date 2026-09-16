import { useEffect, useState } from 'react';
import { useTasksByDay } from '@/hooks/useTasksByDay.ts';
import { useEventsByDay } from '@/hooks/useEventsByDay.ts';
import { TaskCard } from '@/features/tasks/components/TaskCard.tsx';
import { EventCard } from '@/features/events/components/EventCard.tsx';
import { TaskForm } from '@/features/tasks/components/TaskForm.tsx';
import { EventForm } from '@/features/events/components/EventForm.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from '@/components/ui/Icons.tsx';
import { nowISO, addDaysISO, formatDayHeader } from '@/utils/date.ts';

type FormType = 'task' | 'event' | null;

export function Dashboard(): JSX.Element {
  const [day, setDay] = useState(() => nowISO());
  const [form, setForm] = useState<FormType>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { tasks, loading: tasksLoading, toggleComplete, removeTask, reload: reloadTasks } = useTasksByDay(day);
  const { events, loading: eventsLoading, removeEvent, reload: reloadEvents } = useEventsByDay(day);

  const loading = tasksLoading || eventsLoading;
  const isEmpty = !loading && tasks.length === 0 && events.length === 0;

  // Cerrar menú con Escape y bloquear scroll mientras está abierto
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleCreated = (): void => {
    setForm(null);
    setMenuOpen(false);
    void reloadTasks();
    void reloadEvents();
  };

  const openForm = (type: 'task' | 'event'): void => {
    setMenuOpen(false);
    setForm(type);
  };

  return (
    <div className="anim-fade-in">
      <div className="day-selector">
        <button type="button" className="btn-icon" onClick={() => setDay((d) => addDaysISO(d, -1))} aria-label="Día anterior">
          <ChevronLeftIcon />
        </button>
        <div className="day-label">{formatDayHeader(day)}</div>
        <button type="button" className="btn-icon" onClick={() => setDay((d) => addDaysISO(d, 1))} aria-label="Día siguiente">
          <ChevronRightIcon />
        </button>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : isEmpty ? (
        <div className="empty-state anim-slide-up">
          <div className="icon">🗓️</div>
          <p style={{ fontWeight: 600 }}>Nada por aquí</p>
          <p>Pulsa + para crear una tarea o un evento.</p>
        </div>
      ) : (
        <div className="stagger">
          {tasks.map((task) => (
            <div key={task.id} style={{ marginBottom: 12 }}>
              <TaskCard task={task} onToggleComplete={(id) => void toggleComplete(id)} onRemove={(id) => void removeTask(id)} />
            </div>
          ))}
          {events.map((event) => (
            <div key={event.id} style={{ marginBottom: 12 }}>
              <EventCard event={event} onRemove={(id) => void removeEvent(id)} />
            </div>
          ))}
        </div>
      )}

      {/* FAB + menú de creación */}
      {menuOpen && (
        <div className="modal-overlay" onClick={() => setMenuOpen(false)}>
          <div
            className="modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Crear tarea o evento"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Crear</h2>
              <button type="button" className="btn-icon" onClick={() => setMenuOpen(false)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>
            <div className="stagger" style={{ display: 'grid', gap: 12 }}>
              <button type="button" className="card card-hover" style={{ textAlign: 'left' }} onClick={() => openForm('task')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="chip chip-daily" style={{ fontSize: 18, padding: '8px 14px' }}>✓</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Tarea</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Completable · con recordatorios</div>
                  </div>
                </div>
              </button>
              <button type="button" className="card card-hover" style={{ textAlign: 'left' }} onClick={() => openForm('event')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="chip chip-event" style={{ fontSize: 18, padding: '8px 14px' }}>★</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Evento</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No completable · sin recordatorios</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <button type="button" className="fab" onClick={() => setMenuOpen((v) => !v)} aria-label="Crear tarea o evento">
        <PlusIcon />
      </button>

      <Modal open={form === 'task'} title="Nueva tarea" onClose={() => setForm(null)}>
        <TaskForm onCreated={handleCreated} onCancel={() => setForm(null)} />
      </Modal>

      <Modal open={form === 'event'} title="Nuevo evento" onClose={() => setForm(null)}>
        <EventForm onCreated={handleCreated} onCancel={() => setForm(null)} />
      </Modal>
    </div>
  );
}