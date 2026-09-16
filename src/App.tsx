import { useState } from 'react';
import { useAppInit } from '@/hooks/useAppInit.ts';
import { Dashboard } from '@/pages/Dashboard.tsx';
import { CalendarPage } from '@/pages/CalendarPage.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';
import { BottomNav, type Route } from '@/components/ui/BottomNav.tsx';
import { TopBar } from '@/components/ui/TopBar.tsx';
import { LoadingScreen } from '@/components/ui/Loading.tsx';

const TITLES: Record<Route, string> = {
  home: 'Task Manager',
  calendar: 'Calendario',
  settings: 'Ajustes',
};

export function App(): JSX.Element {
  const { ready, error } = useAppInit();
  const [route, setRoute] = useState<Route>('home');

  if (error) {
    return (
      <div className="loading-screen">
        <p role="alert" style={{ color: 'var(--danger)', fontWeight: 600 }}>
          Error al iniciar: {error}
        </p>
      </div>
    );
  }

  if (!ready) return <LoadingScreen label="Preparando tu espacio…" />;

  return (
    <div className="app-shell">
      <TopBar title={TITLES[route]} />
      <main className="page" key={route}>
        {route === 'home' && <Dashboard />}
        {route === 'calendar' && <CalendarPage />}
        {route === 'settings' && <SettingsPage />}
      </main>
      <BottomNav route={route} onChange={setRoute} />
    </div>
  );
}