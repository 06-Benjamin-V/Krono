import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRecords } from './useRecords.ts';
describe('Estados de carga y operaciones', () => {
  it('muestra un fallo de carga y permite reintentar', async () => {
    const load = vi.fn<() => Promise<string[]>>().mockRejectedValueOnce(new Error('Lectura fallida')).mockResolvedValue(['guardado']);
    const {result} = renderHook(() => useRecords(load));
    await waitFor(() => expect(result.current.error).toBe('Lectura fallida'));
    await act(() => result.current.reload());
    expect(result.current.items).toEqual(['guardado']); expect(result.current.error).toBeNull();
  });
  it('evita dobles escrituras y expone un fallo de operación', async () => {
    const load = vi.fn().mockResolvedValue(['original']);
    const {result} = renderHook(() => useRecords(load));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const operation = vi.fn().mockRejectedValue(new Error('Escritura fallida'));
    await act(async () => { await Promise.all([result.current.run(operation),result.current.run(operation)]); });
    expect(operation).toHaveBeenCalledTimes(1); expect(result.current.items).toEqual(['original']);
    expect(result.current.error).toBe('Escritura fallida');
  });
});
