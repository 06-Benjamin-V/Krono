import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TaskListPage } from '@/features/tasks/pages/TaskListPage.tsx';
import { TaskFormPage } from '@/features/tasks/pages/TaskFormPage.tsx';
import { TaskDetailPage } from '@/features/tasks/pages/TaskDetailPage.tsx';
import { EventListPage } from '@/features/events/pages/EventListPage.tsx';
import { EventFormPage } from '@/features/events/pages/EventFormPage.tsx';
import { EventDetailPage } from '@/features/events/pages/EventDetailPage.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';
import { TopBar } from '@/components/ui/TopBar.tsx';
import { BottomNav } from '@/components/ui/BottomNav.tsx';
import { CalendarPage } from '@/features/calendar/CalendarPage.tsx';
import { Capacitor } from '@capacitor/core';
import { useSyncWarning } from '@/services/feedback.ts';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { synchronizeTasks } from '@/services/TaskService.ts';

function Layout(): JSX.Element {
  const warning = useSyncWarning();
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page">
        {!Capacitor.isNativePlatform() && <p className="preview-notice">Vista de desarrollo · Los datos se borran al recargar. En Android se guardan en tu dispositivo.</p>}
        <ErrorNotice message={warning} onRetry={() => void synchronizeTasks()} />
        <Routes>
          <Route path="/today" element={<CalendarPage />} />
          <Route path="/calendar" element={<CalendarPage monthly />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/new" element={<TaskFormPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export function AppRoutes(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="*" element={<Layout />} />
      </Routes>
    </HashRouter>
  );
}
