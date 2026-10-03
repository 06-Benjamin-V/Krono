import { useId, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronDownIcon } from './Icons.tsx';

interface ExpandableCardProps {
  color: string;
  title: string;
  meta?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  details: ReactNode;
  completed?: boolean;
  defaultExpanded?: boolean;
  detailsLabel?: string;
}

export function ExpandableCard({
  color,
  title,
  meta,
  leading,
  actions,
  details,
  completed = false,
  defaultExpanded = false,
  detailsLabel = 'Detalles',
}: ExpandableCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const detailsId = useId();

  return (
    <div
      className={`item-card ${completed ? 'completed' : ''} ${expanded ? 'expanded' : ''}`}
      style={{ '--item-color': color } as CSSProperties}
    >
      {leading && <div className="leading">{leading}</div>}
      <button
        type="button"
        className="item-main"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="item-title">{title}</div>
        {meta && <div className="item-meta">{meta}</div>}
        <ChevronDownIcon className="item-chevron" />
      </button>
      {actions && <div className="item-actions">{actions}</div>}
      <div
        id={detailsId}
        className={expanded ? 'item-details open' : 'item-details'}
        role="region"
        aria-label={detailsLabel}
        aria-hidden={!expanded}
      >
        <div className="item-details-inner">{details}</div>
      </div>
    </div>
  );
}
