import { useMemo } from 'react';
import { addMonths } from 'date-fns';
import type { Task } from '@/features/tasks/types.ts';
import type { EventItem } from '@/features/events/types.ts';
import type { ISODateString } from '@/types/common.ts';
import { startOfMonthISO, isSameDayISO, startOfDayISO, endOfDayISO } from '@/utils/date.ts';

interface MonthCalendarProps {
  month: ISODateString;
  selectedDay: ISODateString;
  tasks: Task[];
  events: EventItem[];
  onSelectDay: (day: ISODateString) => void;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** True si el rango [start, end] solapa el día calendario `day` (spans multi-día incluidos). */
function overlapsDay(start: ISODateString, end: ISODateString, day: ISODateString): boolean {
  return start <= endOfDayISO(day) && end >= startOfDayISO(day);
}

function buildMonthGrid(month: ISODateString): ISODateString[] {
  const first = new Date(startOfMonthISO(month));
  const startWeekday = first.getDay(); // 0 = domingo
  const offset = (startWeekday + 6) % 7; // lunes = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  const days: ISODateString[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d.toISOString());
  }
  return days;
}

export function MonthCalendar({
  month,
  selectedDay,
  tasks,
  events,
  onSelectDay,
}: MonthCalendarProps): JSX.Element {
  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const today = new Date().toISOString();

  const dotsForDay = (day: ISODateString): string[] => {
    const colors: string[] = [];
    for (const t of tasks) {
      if (overlapsDay(t.startAt, t.endAt, day)) colors.push(t.color);
    }
    for (const e of events) {
      if (overlapsDay(e.startAt, e.endAt, day)) colors.push(e.color);
    }
    return colors.slice(0, 4);
  };

  const isCurrentMonth = (day: ISODateString): boolean => {
    const d = new Date(day);
    const m = new Date(month);
    return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
  };

  return (
    <div className="card anim-slide-up">
      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-weekday">
            {w}
          </div>
        ))}
        {grid.map((day) => {
          const dots = dotsForDay(day);
          const selected = isSameDayISO(day, selectedDay);
          const isToday = isSameDayISO(day, today);
          return (
            <button
              key={day}
              type="button"
              className={`calendar-day ${selected ? 'selected' : ''} ${isToday ? 'today' : ''} ${
                isCurrentMonth(day) ? '' : 'other-month'
              }`}
              onClick={() => onSelectDay(day)}
              aria-label={`Día ${new Date(day).getDate()}`}
              aria-pressed={selected}
            >
              {new Date(day).getDate()}
              {dots.length > 0 && (
                <span className="day-dots">
                  {dots.map((c, i) => (
                    <span key={i} className="dot" style={{ background: c }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthCounters({
  day,
  tasks,
  events,
}: {
  day: ISODateString;
  tasks: Task[];
  events: EventItem[];
}): JSX.Element {
  const taskCount = tasks.filter((t) => overlapsDay(t.startAt, t.endAt, day)).length;
  const eventCount = events.filter((e) => overlapsDay(e.startAt, e.endAt, day)).length;

  return (
    <div className="counters anim-slide-up">
      <div className="counter">
        <span className="counter-value">{taskCount}</span>
        <span className="counter-label">Tareas</span>
      </div>
      <div className="counter">
        <span className="counter-value">{eventCount}</span>
        <span className="counter-label">Eventos</span>
      </div>
    </div>
  );
}

export function addMonthsISO(iso: ISODateString, months: number): ISODateString {
  return addMonths(new Date(iso), months).toISOString();
}