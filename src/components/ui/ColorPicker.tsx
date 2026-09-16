import { DEFAULT_COLORS } from '@/utils/color.ts';
import type { ColorHex } from '@/types/common.ts';

interface ColorPickerProps {
  value: ColorHex;
  onChange: (color: ColorHex) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
  return (
    <div className="color-picker" role="radiogroup" aria-label="Color">
      {DEFAULT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={`Color ${color}`}
          className={`color-swatch ${value === color ? 'selected' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}