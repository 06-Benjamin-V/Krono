import { ThemeProvider } from '@/contexts/ThemeContext.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { AppRoutes } from '@/routes.tsx';
import { useAppInit } from '@/hooks/useAppInit.ts';
import { LoadingScreen } from '@/components/ui/Loading.tsx';

export function App(): JSX.Element {
  const { ready, error, retry } = useAppInit();

  if (error) {
    return (
      <div className="loading-screen">
        <ErrorNotice message={error} onRetry={retry} />
      </div>
    );
  }

  if (!ready) return <LoadingScreen label="Preparando tu espacio…" />;

  return <ThemeProvider><AppRoutes /></ThemeProvider>;
}
