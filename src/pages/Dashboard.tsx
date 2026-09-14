import { CalendarWidget, DailyListWidget } from '@/features/calendar/components/Widgets.tsx';

export function Dashboard(): JSX.Element {
  return (
    <main style={{ padding: 16, display: 'grid', gap: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Task Manager</h1>
      <DailyListWidget />
      <CalendarWidget />
    </main>
  );
}
