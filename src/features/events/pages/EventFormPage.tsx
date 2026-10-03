import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createEventRepository } from '@/database/repositories/EventRepository.ts';
import { EventForm } from '@/features/events/components/EventForm.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ChevronLeftIcon } from '@/components/ui/Icons.tsx';
import type { EventItem } from '@/features/events/types.ts';

export function EventFormPage(): JSX.Element {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = id != null;
  const [initialEvent, setInitialEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }
    createEventRepository()
      .getById(id)
      .then((event) => setInitialEvent(event))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const handleSaved = (): void => {
    navigate('/events');
  };

  const handleCancel = (): void => {
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
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (isEdit && !initialEvent) {
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
        <Button variant="ghost" onClick={handleCancel}>
          <ChevronLeftIcon /> Volver
        </Button>
        <h2 className="page-title">{isEdit ? 'Editar evento' : 'Nuevo evento'}</h2>
        <div />
      </div>
      <EventForm
        initialEvent={initialEvent}
        onCreated={handleSaved}
        onCancel={handleCancel}
      />
    </div>
  );
}
