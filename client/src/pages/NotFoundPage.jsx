import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '../components/States';

export default function NotFoundPage() {
  return (
    <div className="full-page">
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you are looking for does not exist or has moved."
        action={
          <Link className="btn btn-primary" to="/">
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
}
