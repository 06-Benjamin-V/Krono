import { useState } from 'react';
import { useMonthData } from '@/hooks/useMonthData.ts';
import { MonthCalendar, MonthCounters, addMonthsISO } from '@/features/calendar/components/MonthCalendar.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/Icons.tsx';
import { nowISO, formatDayHeader, formatMonthHeader } from '@/utils/date.ts';

export function CalendarPage(): JSX.Element {
  const [month, setMonth] = useState(() => nowISO());
  const [selectedDay, setSelectedDay] = useState(() => nowISO());
  const { data, loading } = useMonthData(month);

  return (
    <div className="anim-fade-in">
      <div className="day-selector">
        <button type="button" className="btn-icon" onClick={() => setMonth((m) => addMonthsISO(m, -1))} aria-label="Mes anterior">
          <ChevronLeftIcon />
        </button>
        <div className="day-label" style={{ textTransform: 'capitalize' }}>
          {formatMonthHeader(month)}
        </div>
        <button type="button" className="btn-icon" onClick={() => setMonth((m) => addMonthsISO(m, 1))} aria-label="Mes siguiente">
          <ChevronRightIcon />
        </button>
      </div>

      {loading ? (
        <SkeletonList count={2} />
      ) : (
        <>
          <MonthCalendar
            month={month}
            selectedDay={selectedDay}
            tasks={data.tasks}
            events={data.events}
            onSelectDay={setSelectedDay}
          />
          <MonthCounters day={selectedDay} tasks={data.tasks} events={data.events} />
          <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 12 }}>
            {formatDayHeader(selectedDay)}
          </p>
        </>
      )}
    </div>
  );
}