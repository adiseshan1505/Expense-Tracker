import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="full-page">
      <div className="empty">
        <h1>404</h1>
        <p className="muted">This page does not exist.</p>
        <Link className="btn btn-primary" to="/">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
