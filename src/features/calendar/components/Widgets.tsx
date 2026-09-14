import { useState } from 'react';
import { nowISO, formatDayHeader, addDaysISO } from '@/utils/date.ts';

export function DailyListWidget(): JSX.Element {
  const [day, setDay] = useState(() => nowISO());
  return (
    <section aria-label="Lista del día">
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" aria-label="Día anterior" onClick={() => setDay((d) => addDaysISO(d, -1))}>
          {'<'}
        </button>
        <h2>{formatDayHeader(day)}</h2>
        <button type="button" aria-label="Día siguiente" onClick={() => setDay((d) => addDaysISO(d, 1))}>
          {'>'}
        </button>
      </header>
      <p style={{ opacity: 0.7 }}>Sin elementos para este día (etapa base).</p>
    </section>
  );
}

export function CalendarWidget(): JSX.Element {
  const [selected, setSelected] = useState(() => nowISO());
  return (
    <section aria-label="Calendario">
      <h2>Calendario</h2>
      <p style={{ opacity: 0.7 }}>Vista mensual pendiente (etapa base). Día seleccionado: {formatDayHeader(selected)}</p>
      <button type="button" onClick={() => setSelected(nowISO())}>
        Hoy
      </button>
      <div>
        <span>Tareas: 0</span> · <span>Eventos: 0</span>
      </div>
    </section>
  );
}
