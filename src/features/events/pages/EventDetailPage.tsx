import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createEventRepository } from '@/database/repositories/EventRepository.ts';
import { Button } from '@/components/ui/Button.tsx';
import { TrashIcon, ChevronLeftIcon } from '@/components/ui/Icons.tsx';
import { formatDateTime } from '@/utils/date.ts';
import type { EventItem } from '@/features/events/types.ts';

export function EventDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    createEventRepository()
      .getById(id)
      .then((e) => setEvent(e))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async (): Promise<void> => {
    if (!event) return;
    if (!window.confirm('¿Eliminar este evento?')) return;
    await createEventRepository().remove(event.id);
    navigate('/events');
  };

  if (loading) {
    return (
      <div className="anim-fade-in">
        <div className="page-header">
          <Button variant="ghost" onClick={() => navigate('/events')}>
            <ChevronLeftIcon /> Volver
          </Button>
        </div>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="anim-fade-in">
        <div className="page-header">
          <Button variant="ghost" onClick={() => navigate('/events')}>
            <ChevronLeftIcon /> Volver
          </Button>
        </div>
        <div className="empty-state">
          <p style={{ fontWeight: 600 }}>Evento no encontrado</p>
          <Button onClick={() => navigate('/events')}>Volver a la lista</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-in">
      <div className="page-header">
        <Button variant="ghost" onClick={() => navigate('/events')}>
          <ChevronLeftIcon /> Volver
        </Button>
        <h2 className="page-title">Detalle</h2>
        <div />
      </div>

      <div className="card" style={{ '--item-color': event.color } as React.CSSProperties}>
        <div className="item-body">
          <div className="item-title">{event.title}</div>
          <div className="item-subtitle" style={{ marginBottom: 8 }}>
            <span className="chip chip-event">EVENTO</span>
          </div>
          {event.description && (
            <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>{event.description}</p>
          )}
          <div className="item-time">
            {formatDateTime(event.startAt)} → {formatDateTime(event.endAt)}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
            Creado: {new Date(event.createdAt).toLocaleDateString('es-ES')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => navigate(`/events/${event.id}/edit`)}>
          Editar
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          <TrashIcon /> Eliminar
        </Button>
      </div>
    </div>
  );
}
