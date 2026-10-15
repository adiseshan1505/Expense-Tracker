import { ArrowLeftRight, LayoutDashboard, LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react';
import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../hooks/useTheme';
import { Logo } from './Logo';
import { Spinner } from './States';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, keepMonth: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, keepMonth: true },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon };

export function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { theme, cycleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const month = params.get('month');
  const ThemeIcon = THEME_ICONS[theme];

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  const links = NAV.map(({ to, label, icon: Icon, keepMonth }) => (
    <NavLink
      key={to}
      to={{ pathname: to, search: keepMonth && month ? `?month=${month}` : '' }}
      end={to === '/'}
      className="nav-link"
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  ));

  const themeButton = (
    <button className="icon-btn" onClick={cycleTheme} aria-label={`Theme: ${theme}. Click to change`} title={`Theme: ${theme}`}>
      <ThemeIcon size={18} />
    </button>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav className="sidebar-nav" aria-label="Main">
          {links}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="user-chip-text">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            {themeButton}
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={16} /> {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <Logo />
        <div className="topbar-actions">
          {themeButton}
          <button className="icon-btn" onClick={handleLogout} disabled={loggingOut} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="main">
        <Suspense
          fallback={
            <div className="full-page">
              <Spinner size={28} />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {links}
      </nav>
    </div>
  );
}
