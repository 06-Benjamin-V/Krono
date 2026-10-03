import { useClock } from '@/hooks/useClock.ts';
import type { Task } from '@/features/tasks/types.ts';
import { ExpandableCard } from '@/components/ui/ExpandableCard.tsx';
import { CheckIcon, EditIcon, TrashIcon } from '@/components/ui/Icons.tsx';
import { formatDateTime, formatDate, formatDuration } from '@/utils/date.ts';

interface TaskCardProps {
  busy?: boolean;
  task: Task;
  onToggleComplete: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

export function TaskCard({ task, busy = false, onToggleComplete, onRemove, onEdit }: TaskCardProps): JSX.Element {
  const now = useClock();
  const status = task.completed ? 'Completada' : Date.parse(task.endAt) < now ? 'Vencida' : Date.parse(task.startAt) > now ? 'Por empezar' : 'En curso';
  const meta = (
    <>
      <span className={`chip ${task.type === 'DAILY' ? 'chip-daily' : 'chip-deadline'}`}>
        {task.type === 'DAILY' ? '24 HORAS' : 'PLAZO'}
      </span>
      <span className="card-deadline">Hasta {formatDateTime(task.endAt)}</span><span className="card-status">{status}</span>
    </>
  );

  const details = (
    <>
      <div className="detail-divider" />
      <div className="detail-row">
        <span className="detail-label">Descripción</span>
        <span className="detail-value">{task.description || 'Sin descripción'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Tipo</span>
        <span className="detail-value">{task.type === 'DAILY' ? '24 horas' : 'Con plazo'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Inicio</span>
        <span className="detail-value">{formatDateTime(task.startAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Término</span>
        <span className="detail-value">{formatDateTime(task.endAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Duración</span>
        <span className="detail-value">{formatDuration(task.startAt, task.endAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Estado</span>
        <span className="detail-value">{task.completed ? 'Completada' : 'Pendiente'}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Creada</span>
        <span className="detail-value">{formatDate(task.createdAt)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Actualizada</span>
        <span className="detail-value">{formatDate(task.updatedAt)}</span>
      </div>
      {task.completedAt && (
        <div className="detail-row">
          <span className="detail-label">Completada el</span>
          <span className="detail-value">{formatDateTime(task.completedAt)}</span>
        </div>
      )}
    </>
  );

  return (
    <ExpandableCard
      color={task.color}
      title={task.title}
      meta={meta}
      leading={
        <button
          type="button" disabled={busy}
          className={`check-circle ${task.completed ? 'checked' : ''}`}
          onClick={() => onToggleComplete(task.id)}
          aria-pressed={task.completed}
          aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {task.completed && <CheckIcon />}
        </button>
      }
      actions={
        <>
          <button
            type="button" disabled={busy}
            className="btn-icon"
            onClick={() => onEdit(task.id)}
            aria-label={`Editar tarea ${task.title}`}
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            type="button" disabled={busy}
            className="btn-icon"
            onClick={() => onRemove(task.id)}
            aria-label={`Eliminar tarea ${task.title}`}
          >
            <TrashIcon />
          </button>
        </>
      }
      details={details}
      completed={task.completed}
      detailsLabel="Detalles de la tarea"
    />
  );
}
