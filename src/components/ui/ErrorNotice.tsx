export function ErrorNotice({message, onRetry}: {message: string | null; onRetry?: () => void}): JSX.Element | null {
  if (!message) return null;
  return <div className="error-notice" role="alert"><p>{message}</p>{onRetry && <button className="btn btn-secondary" onClick={onRetry}>Reintentar</button>}</div>;
}
