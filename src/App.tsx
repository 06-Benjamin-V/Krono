import { useState } from 'react';
import { useAppInit } from '@/hooks/useAppInit.ts';
import { Dashboard } from '@/pages/Dashboard.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';

export function App(): JSX.Element {
  const { ready, error } = useAppInit();
  const [route, setRoute] = useState<'home' | 'settings'>('home');

  if (error) return <p role="alert">Error al iniciar: {error}</p>;
  if (!ready) return <p>Cargando…</p>;

  return (
    <div>
      <nav style={{ display: 'flex', gap: 12, padding: 12 }}>
        <button type="button" onClick={() => setRoute('home')}>
          Inicio
        </button>
        <button type="button" onClick={() => setRoute('settings')}>
          Configuración
        </button>
      </nav>
      {route === 'home' ? <Dashboard /> : <SettingsPage />}
    </div>
  );
}
