import { createEventService } from '@/services/EventService.ts';
import { useState } from 'react';
import { toLocalInputValue } from '@/utils/date.ts';
import type { EventItem, EventInput } from '@/features/events/types.ts';
import { ColorPicker } from '@/components/ui/ColorPicker.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { DEFAULT_COLORS } from '@/utils/color.ts';

interface EventFormProps {
  onCreated?: () => void;
  onCancel: () => void;
  initialEvent?: EventItem | null;
}


export function EventForm({ onCreated, onCancel, initialEvent }: EventFormProps): JSX.Element {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [description, setDescription] = useState(initialEvent?.description ?? '');
  const [startAt, setStartAt] = useState(() => initialEvent ? toLocalInputValue(initialEvent.startAt) : toLocalInputValue(new Date().toISOString()));
  const [endAt, setEndAt] = useState(() => initialEvent ? toLocalInputValue(initialEvent.endAt) : '');
  const [color, setColor] = useState(initialEvent?.color ?? DEFAULT_COLORS[3]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = initialEvent != null;

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
    if (!endAt || Number.isNaN(Date.parse(endAt))) {
      setError('La fecha de término es obligatoria');
      return;
    }
    const startIso = new Date(startAt).toISOString();
    const endIso = new Date(endAt).toISOString();
    if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
      setError('La fecha de término no puede ser anterior a la de inicio');
      return;
    }
    setSaving(true);
    try {
      const input: EventInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: startIso,
        endAt: endIso,
        color,
      };
      const repo = createEventService();
      if (isEdit && initialEvent) {
        await repo.update(initialEvent.id, input);
      } else {
        await repo.create(input);
      }
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el evento');
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
        <label htmlFor="event-title">Título</label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué evento tienes?"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="event-desc">Descripción</label>
        <textarea
          id="event-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles opcionales…"
          rows={2}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="event-start">Inicio</label>
          <input id="event-start" required type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="event-end">Término</label>
          <input id="event-end" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
      </div>

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
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </form>
  );
}