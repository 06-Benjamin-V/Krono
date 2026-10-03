import { useCallback, useEffect, useRef, useState } from 'react';
import { useResume } from './useResume.ts';
export function useRecords<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [request] = useState(() => ({version: 0}));
  const reload = useCallback(async () => {
    const version = ++request.version;
    setLoading(true);
    setError(null);
    try { const result = await load(); if (version === request.version) setItems(result); }
    catch (e) { if (version === request.version) setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos'); }
    finally { if (version === request.version) setLoading(false); }
  }, [load, request]);
  useEffect(() => { void reload(); return () => { request.version++; }; }, [reload, request]);
  const resume = useCallback(() => { void reload(); }, [reload]);
  useResume(resume);
  const run = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (locked.current) return false;
    locked.current = true; setBusy(true); setError(null);
    try { await operation(); await reload(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el cambio'); return false; }
    finally { locked.current = false; setBusy(false); }
  }, [reload]);
  return { items, loading, error, busy, reload, run };
}
