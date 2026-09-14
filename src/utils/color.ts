import type { ColorHex } from '@/types/common.ts';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_COLORS: ColorHex[] = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

export function isValidHexColor(value: string): value is ColorHex {
  return HEX_RE.test(value);
}

export function normalizeColor(value: string, fallback = '#3B82F6'): ColorHex {
  return isValidHexColor(value) ? value : (fallback as ColorHex);
}
