interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = 'Cargando…' }: LoadingScreenProps): JSX.Element {
  return (
    <div className="loading-screen anim-fade-in" role="status" aria-live="polite">
      <div className="spinner" />
      <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  );
}

export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }): JSX.Element {
  return <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />;
}

export function SkeletonList({ count = 4 }: { count?: number }): JSX.Element {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}