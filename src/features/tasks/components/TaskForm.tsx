import { createTaskService } from '@/services/TaskService.ts';
import { useState } from 'react';
import { toLocalInputValue, computeDailyEndAt, formatDateTime } from '@/utils/date.ts';
import type { Task, TaskInput, TaskType } from '@/features/tasks/types.ts';
import { ColorPicker } from '@/components/ui/ColorPicker.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { DEFAULT_COLORS } from '@/utils/color.ts';

interface TaskFormProps {
  onCreated?: () => void;
  onCancel: () => void;
  initialTask?: Task | null;
}


export function TaskForm({ onCreated, onCancel, initialTask }: TaskFormProps): JSX.Element {
  const [type, setType] = useState<TaskType>(initialTask?.type ?? 'DAILY');
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [startAt, setStartAt] = useState(() => initialTask ? toLocalInputValue(initialTask.startAt) : toLocalInputValue(new Date().toISOString()));
  const [endAt, setEndAt] = useState(() => initialTask?.endAt ? toLocalInputValue(initialTask.endAt) : '');
  const [color, setColor] = useState(initialTask?.color ?? DEFAULT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = initialTask != null;

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (!startAt || Number.isNaN(Date.parse(startAt))) {
      setError('La fecha de inicio es obligatoria');
      return;
    }
    setSaving(true);
    try {
      const input: TaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startAt: new Date(startAt).toISOString(),
        color,
      };
      if (type === 'DEADLINE') {
        if (!endAt || Number.isNaN(Date.parse(endAt))) {
          setError('La fecha de término es obligatoria para tareas con plazo');
          setSaving(false);
          return;
        }
        const endIso = new Date(endAt).toISOString();
        if (new Date(endIso).getTime() <= new Date(startAt).getTime()) {
          setError('La fecha de término debe ser posterior a la de inicio');
          setSaving(false);
          return;
        }
        input.endAt = endIso;
      }
      const repo = createTaskService();
      if (isEdit && initialTask) {
        await repo.update(initialTask.id, input);
      } else {
        await repo.create(input);
      }
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form aria-describedby={error ? "form-error" : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="form-group">
        <label>Tipo</label>
        <div className="segmented">
          <button type="button" aria-pressed={type === 'DAILY'} className={type === 'DAILY' ? 'active' : ''} onClick={() => setType('DAILY')}>
            24 horas
          </button>
          <button type="button" aria-pressed={type === 'DEADLINE'} className={type === 'DEADLINE' ? 'active' : ''} onClick={() => setType('DEADLINE')}>
            Con plazo
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="task-title">Título</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué tienes que hacer?"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-desc">Descripción</label>
        <textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles opcionales…"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-start">Inicio</label>
        <input id="task-start" required type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
      </div>

      {type === 'DAILY' && startAt && !Number.isNaN(Date.parse(startAt)) && <p className="form-hint">Termina el {formatDateTime(computeDailyEndAt(new Date(startAt).toISOString()))}. Dura 24 horas, no se repite. Recordatorios cada 2 horas.</p>}
      {type === 'DEADLINE' && (
        <div className="form-group anim-slide-down">
          <label htmlFor="task-end">Término</label>
          <input id="task-end" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
      )}

      <div className="form-group">
        <label>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {error && (
        <p id="form-error" role="alert" className="anim-shake" style={{ color: 'var(--danger)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
          {error}
        </p>
      )}

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>
    </form>
  );
}