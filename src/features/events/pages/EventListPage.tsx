import { useNavigate } from 'react-router-dom';
import { useEvents } from '@/features/events/hooks/useEvents.ts';
import { EventCard } from '@/features/events/components/EventCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { PlusIcon, CalendarIcon } from '@/components/ui/Icons.tsx';
import { useState, useMemo } from 'react';

type Filter = 'all' | 'upcoming' | 'past';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'past', label: 'Pasados' },
];

export function EventListPage(): JSX.Element {
  const navigate = useNavigate();
  const { events, loading, removeEvent } = useEvents();
  const [filter, setFilter] = useState<Filter>('all');
  const now = new Date().toISOString();

  const filtered = useMemo(() => {
    switch (filter) {
      case 'upcoming':
        return events.filter((e) => new Date(e.endAt) > new Date(now));
      case 'past':
        return events.filter((e) => new Date(e.endAt) <= new Date(now));
      default:
        return events;
    }
  }, [events, filter, now]);

  if (loading) return <SkeletonList count={3} />;

  return (
    <div className="anim-fade-in">
      <div className="page-header">
        <h2 className="page-title">Eventos</h2>
        <Button onClick={() => navigate('/events/new')}>
          <PlusIcon /> Nuevo
        </Button>
      </div>

      <div className="segmented segmented-scroll" style={{ marginBottom: 16 }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state anim-slide-up">
          <div className="icon"><CalendarIcon size={28} /></div>
          <p style={{ fontWeight: 600 }}>
            {filter === 'all' ? 'Sin eventos' : 'No hay eventos con este filtro'}
          </p>
          <p>
            {filter === 'all'
              ? 'Pulsa el botón + para crear un evento.'
              : 'Prueba con otro filtro.'}
          </p>
          {filter === 'all' && (
            <Button onClick={() => navigate('/events/new')}>Crear primer evento</Button>
          )}
        </div>
      ) : (
        <div className="stagger">
          {filtered.map((event) => (
            <div key={event.id} style={{ marginBottom: 12 }}>
              <EventCard
                event={event}
                onRemove={(id) => void removeEvent(id)}
                onEdit={(id) => navigate(`/events/${id}/edit`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
