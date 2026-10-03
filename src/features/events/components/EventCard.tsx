import type { EventItem } from '@/features/events/types.ts';
import { ExpandableCard } from '@/components/ui/ExpandableCard.tsx';
import { EditIcon, TrashIcon } from '@/components/ui/Icons.tsx';
import { formatDateTime, formatDate, formatDuration } from '@/utils/date.ts';

interface EventCardProps {
  busy?: boolean;
  event: EventItem;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

export function EventCard({ event, busy = false, onRemove, onEdit }: EventCardProps): JSX.Element {
  const details = (
    <>
      <div className="detail-divider" />
      <div className="detail-row">
        <span className="detail-label">Descripción</span>
        <span className="detail-value">{event.description || 'Sin descripción'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Inicio</span>
        <span className="detail-value">{formatDateTime(event.startAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Término</span>
        <span className="detail-value">{formatDateTime(event.endAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Duración</span>
        <span className="detail-value">{formatDuration(event.startAt, event.endAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Creado</span>
        <span className="detail-value">{formatDate(event.createdAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Actualizado</span>
        <span className="detail-value">{formatDate(event.updatedAt)}</span>
      </div>
    </>
  );

  return (
    <ExpandableCard
      color={event.color}
      title={event.title}
      meta={
        <>
          <span className="chip chip-event">EVENTO</span>
          <span style={{ marginLeft: 6 }}>{formatDateTime(event.startAt)}</span>
        </>
      }
      actions={
        <>
          <button
            type="button" disabled={busy}
            className="btn-icon"
            onClick={() => onEdit(event.id)}
            aria-label={`Editar evento ${event.title}`}
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            type="button" disabled={busy}
            className="btn-icon"
            onClick={() => onRemove(event.id)}
            aria-label={`Eliminar evento ${event.title}`}
          >
            <TrashIcon />
          </button>
        </>
      }
      details={details}
      detailsLabel="Detalles del evento"
    />
  );
}
