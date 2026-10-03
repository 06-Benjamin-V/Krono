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

function Layout(): JSX.Element {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page">
        <Routes>
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/new" element={<TaskFormPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
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
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="*" element={<Layout />} />
      </Routes>
    </HashRouter>
  );
}