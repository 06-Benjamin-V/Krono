import { useEffect, useState } from 'react';
import { createSettingsRepository } from '@/database/repositories/SettingsRepository.ts';
import { useTheme } from '@/hooks/useTheme.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Toast } from '@/components/ui/Toast.tsx';
import { MoonIcon, SunIcon } from '@/components/ui/Icons.tsx';

const INTERVAL_OPTIONS = [1, 2, 4, 6, 8, 12, 24];

export function SettingsPage(): JSX.Element {
  const [intervalHours, setIntervalHours] = useState(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    createSettingsRepository()
      .load()
      .then((s) => setIntervalHours(s.deadlineTaskNotificationIntervalHours))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await createSettingsRepository().setIntervalHours(intervalHours);
      setToast('Intervalo actualizado');
    } catch {
      setToast('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="anim-fade-in">
      <div className="settings-group">
        <h3 style={{ marginBottom: 12 }}>Apariencia</h3>
        <div className="settings-item">
          <div>
            <div className="settings-item-label">Tema oscuro</div>
            <div className="settings-item-desc">Alterna entre claro y oscuro</div>
          </div>
          <button type="button" className="btn-icon" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3 style={{ marginBottom: 12 }}>Notificaciones</h3>
        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div>
            <div className="settings-item-label">Intervalo de recordatorios</div>
            <div className="settings-item-desc">Cada cuántas horas recordar tareas con plazo (DEADLINE)</div>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 44 }} />
          ) : (
            <div className="segmented" style={{ flexWrap: 'wrap' }}>
              {INTERVAL_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={intervalHours === h ? 'active' : ''}
                  onClick={() => setIntervalHours(h)}
                  style={{ minWidth: 48 }}
                  aria-pressed={intervalHours === h}
                >
                  {h}h
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button onClick={() => void handleSave()} disabled={saving || loading} style={{ width: '100%' }}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}