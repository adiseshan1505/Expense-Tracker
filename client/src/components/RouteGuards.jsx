import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './States';

export function ProtectedRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <FullPageLoader />;
  if (user) {
    const from = location.state?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }
  return <Outlet />;
}
