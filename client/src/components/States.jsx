import { AlertCircle, Inbox, Loader2, RotateCcw } from 'lucide-react';

export function Spinner({ size = 20, label = 'Loading' }) {
  return <Loader2 className="spin" size={size} aria-label={label} role="status" />;
}

export function FullPageLoader() {
  return (
    <div className="full-page">
      <Spinner size={32} />
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <AlertCircle size={28} />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <RotateCcw size={16} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="state">
      <Icon size={28} />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8 }) {
  return <span className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <div className="alert" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  );
}
