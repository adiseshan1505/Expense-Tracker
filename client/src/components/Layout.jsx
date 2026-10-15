import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loading } from './States';

const NAV = [
  { to: '/', label: 'Dashboard', keepMonth: true },
  { to: '/transactions', label: 'Transactions', keepMonth: true },
  { to: '/profile', label: 'Profile' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const month = params.get('month');

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand">
            Expense Tracker
          </Link>
          <nav className="nav-links">
            {NAV.map(({ to, label, keepMonth }) => (
              <NavLink
                key={to}
                to={{ pathname: to, search: keepMonth && month ? `?month=${month}` : '' }}
                end={to === '/'}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-user">
            <span className="nav-name">{user.name}</span>
            <button className="btn btn-light btn-sm" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main className="container page">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
