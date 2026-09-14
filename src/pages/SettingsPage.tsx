import { useEffect, useState } from 'react';
import { createSettingsRepository } from '@/database/repositories/SettingsRepository.ts';

export function SettingsPage(): JSX.Element {
  const [interval, setInterval] = useState(4);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    createSettingsRepository()
      .load()
      .then((s) => setInterval(s.deadlineTaskNotificationIntervalHours))
      .catch(() => undefined);
  }, []);

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h1>Configuración</h1>
      <label>
        Intervalo de notificación (horas) para tareas con plazo
        <input
          type="number"
          min={1}
          value={interval}
          onChange={(e) => {
            setInterval(Number(e.target.value));
            setSaved(false);
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          void createSettingsRepository()
            .setIntervalHours(interval)
            .then(() => setSaved(true))
            .catch(() => setSaved(false));
        }}
      >
        Guardar
      </button>
      {saved && <p>Guardado.</p>}
    </main>
  );
}
