import { useState } from 'react';
import type { EventInput } from '@/features/events/types.ts';
import { ColorPicker } from '@/components/ui/ColorPicker.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { DEFAULT_COLORS } from '@/utils/color.ts';

interface EventFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ onCreated, onCancel }: EventFormProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date().toISOString()));
  const [endAt, setEndAt] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[3]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (!endAt) {
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
      const { createEventRepository } = await import('@/database/repositories/EventRepository.ts');
      await createEventRepository().create(input);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el evento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
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
          autoFocus
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
          <input id="event-start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
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
        <p className="anim-shake" style={{ color: 'var(--danger)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
          {error}
        </p>
      )}

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Crear evento'}
        </Button>
      </div>
    </form>
  );
}