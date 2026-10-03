import { AppRoutes } from '@/routes.tsx';
import { useAppInit } from '@/hooks/useAppInit.ts';
import { LoadingScreen } from '@/components/ui/Loading.tsx';

export function App(): JSX.Element {
  const { ready, error } = useAppInit();

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

  return <AppRoutes />;
}
