export const INTERVAL_OPTIONS = [1, 2, 4, 6, 8, 12, 24] as const;
export function validateInterval(hours: number): void {
  if (!Number.isFinite(hours) || !INTERVAL_OPTIONS.some(value => value === hours)) {
    throw new Error('Elige un intervalo de 1, 2, 4, 6, 8, 12 o 24 horas');
  }
}
