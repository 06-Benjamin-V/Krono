import type { CSSProperties } from 'react';
import type { Task } from '@/features/tasks/types.ts';
import { CheckIcon, TrashIcon } from '@/components/ui/Icons.tsx';
import { formatTime } from '@/utils/date.ts';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TaskCard({ task, onToggleComplete, onRemove }: TaskCardProps): JSX.Element {
  const timeLabel = `${formatTime(task.startAt)} → ${formatTime(task.endAt)}`;
  return (
    <div
      className={`item-card ${task.completed ? 'completed' : ''}`}
      style={{ '--item-color': task.color } as CSSProperties}
    >
      <button
        type="button"
        className={`check-circle ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {task.completed && <CheckIcon />}
      </button>
      <div className="item-body">
        <div className="item-title">{task.title}</div>
        <div className="item-subtitle">
          <span className={`chip ${task.type === 'DAILY' ? 'chip-daily' : 'chip-deadline'}`}>
            {task.type === 'DAILY' ? '24 HORAS' : 'PLAZO'}
          </span>
        </div>
        <div className="item-time">{timeLabel}</div>
      </div>
      <button
        type="button"
        className="btn-icon"
        onClick={() => onRemove(task.id)}
        aria-label={`Eliminar tarea ${task.title}`}
      >
        <TrashIcon />
      </button>
    </div>
  );
}