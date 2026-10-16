import { Suspense } from 'react';
import { Link, NavLink, Outlet, useSearchParams } from 'react-router';
import { Loading } from './States';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
];

export function Layout() {
  const [params] = useSearchParams();
  const month = params.get('month');

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand">
            Expense Tracker
          </Link>
          <nav className="nav-links">
            {NAV.map(({ to, label }) => (
              <NavLink key={to} to={{ pathname: to, search: month ? `?month=${month}` : '' }} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
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
