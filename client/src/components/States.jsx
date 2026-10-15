export function Loading({ text = 'Loading...' }) {
  return (
    <p className="loading" role="status">
      {text}
    </p>
  );
}

export function FullPageLoader() {
  return (
    <div className="full-page">
      <Loading />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-box" role="alert">
      <p>{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty">
      <p>
        <strong>{title}</strong>
      </p>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <div className="alert" role="alert">
      {children}
    </div>
  );
}
