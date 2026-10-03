import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createSettingsRepository } from '@/database/repositories/SettingsRepository.ts';
import { DEFAULT_SETTINGS } from '@/features/settings/types.ts';
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext.tsx';
import { useSyncWarning } from '@/services/feedback.ts';
import { synchronizeTasks } from '@/services/TaskService.ts';
import { INTERVAL_OPTIONS } from '@/services/validation.ts';
import { useResume } from '@/hooks/useResume.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';

export function SettingsPage(): JSX.Element {
  const [interval, setInterval] = useState<number>(DEFAULT_SETTINGS.deadlineTaskNotificationIntervalHours);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [permission, setPermission] = useState('Sin comprobar');
  const [pending, setPending] = useState<number | null>(null);
  const [nextReminder, setNextReminder] = useState<string | null>(null);
  const {preference, setTheme, error: themeError} = useTheme();
  const warning = useSyncWarning();
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setInterval((await createSettingsRepository().load()).deadlineTaskNotificationIntervalHours); }
    catch { setError('No se pudieron cargar los ajustes. Reintenta antes de guardar.'); }
    finally { setLoading(false); }
  }, []);
  const check = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) { setPermission('Vista web: los avisos se entregan en Android'); return; }
    try {
      const result = await LocalNotifications.checkPermissions();
      setPermission(result.display === 'granted' ? 'Notificaciones permitidas' : 'Notificaciones desactivadas');
      const plan = await LocalNotifications.getPending();
      setPending(plan.notifications.length);
      const times = plan.notifications.map(n => n.schedule?.at).filter(Boolean).map(time => new Date(time!).getTime()).filter(time => time > Date.now()).sort((a,b) => a-b);
      setNextReminder(times.length ? new Date(times[0]).toLocaleString('es-CL') : null);
    } catch { setPermission('No se pudo comprobar el estado'); }
  }, []);
  useEffect(() => { void load(); void check(); }, [load, check]);
  const resume = useCallback(() => { void check(); }, [check]);
  useResume(resume);
  const save = async (): Promise<void> => {
    setBusy(true); setSaved(false);
    try { await createSettingsRepository().setIntervalHours(interval); await synchronizeTasks(); setSaved(true); await check(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar'); }
    finally { setBusy(false); }
  };
  const enable = async (): Promise<void> => {
    setBusy(true);
    try { await LocalNotifications.requestPermissions(); await synchronizeTasks(); await check(); }
    catch { setPermission('No se pudo solicitar el permiso. Revisa los ajustes de Android.'); }
    finally { setBusy(false); }
  };
  return <div className="settings-page">
    <div className="page-header"><div><p className="eyebrow">A TU MANERA</p><h1>Ajustes</h1><p className="page-intro">Un espacio que se adapta a tu ritmo.</p></div></div>
    <section className="settings-group"><h2>Apariencia</h2><p className="page-intro">Elige cómo quieres ver tu día.</p><div className="segmented">{([['system','Sistema'],['light','Claro'],['dark','Oscuro']] as const).map(([key,label]) => <button key={key} aria-pressed={preference === key} className={preference === key ? 'active' : ''} onClick={() => void setTheme(key as ThemePreference)}>{label}</button>)}</div><ErrorNotice message={themeError} /></section>
    <section className="settings-group"><h2>Recordatorios</h2><p>Las tareas de 24 horas avisan cada 2 horas. Elige aquí la frecuencia para tareas con plazo.</p>
      <ErrorNotice message={error} onRetry={() => void load()} />
      <div className="segmented interval-options">{INTERVAL_OPTIONS.map(hours => <button key={hours} disabled={loading || busy || !!error} aria-pressed={interval === hours} className={interval === hours ? 'active' : ''} onClick={() => { setInterval(hours); setSaved(false); }}>{hours} h</button>)}</div>
      <Button disabled={loading || busy || !!error} onClick={() => void save()}>{busy ? 'Guardando…' : 'Guardar intervalo'}</Button>
      {saved && <p role="status">{warning ? 'Intervalo guardado; falta sincronizar los avisos.' : 'Intervalo y recordatorios actualizados.'}</p>}
    </section>
    <section className="settings-group"><h2>Estado de los avisos</h2><p>{permission}</p>{pending !== null && <p>{pending} recordatorios pendientes{nextReminder ? ` · Próximo: ${nextReminder}` : ''}</p>}
      {Capacitor.isNativePlatform() && <div className="form-actions"><Button disabled={busy} onClick={() => void enable()}>Activar notificaciones</Button><Button variant="secondary" disabled={busy} onClick={() => { setBusy(true); void synchronizeTasks().then(check).finally(() => setBusy(false)); }}>Reintentar sincronización</Button></div>}
      <p className="form-hint">Android puede retrasar los avisos por ahorro de batería. Las tareas y eventos permanecen en tu dispositivo.</p>
    </section>
    <p className="app-version">Krono · 0.2.0 · Tu tiempo, a tu ritmo</p>
  </div>;
}
