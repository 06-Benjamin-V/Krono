import type { CSSProperties } from 'react';
import type { EventItem } from '@/features/events/types.ts';
import { TrashIcon } from '@/components/ui/Icons.tsx';
import { formatTime } from '@/utils/date.ts';

interface EventCardProps {
  event: EventItem;
  onRemove: (id: string) => void;
}

export function EventCard({ event, onRemove }: EventCardProps): JSX.Element {
  const timeLabel = `${formatTime(event.startAt)} → ${formatTime(event.endAt)}`;
  return (
    <div className="item-card" style={{ '--item-color': event.color } as CSSProperties}>
      <div className="item-body">
        <div className="item-title">{event.title}</div>
        <div className="item-subtitle">
          <span className="chip chip-event">EVENTO</span>
        </div>
        <div className="item-time">{timeLabel}</div>
      </div>
      <button
        type="button"
        className="btn-icon"
        onClick={() => onRemove(event.id)}
        aria-label={`Eliminar evento ${event.title}`}
      >
        <TrashIcon />
      </button>
    </div>
  );
}