import { BarChart3, ShieldCheck, Tags } from 'lucide-react';
import { Logo } from '../components/Logo';

const HIGHLIGHTS = [
  { icon: Tags, text: 'Log pocket money and every canteen, hostel, and college expense' },
  { icon: BarChart3, text: 'See where your money goes each month with simple charts' },
  { icon: ShieldCheck, text: 'Your data stays private to your account' },
];

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Logo />
        <div>
          <h1>Know where your pocket money goes.</h1>
          <ul className="auth-highlights">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={18} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="muted">Built for school and college students.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo />
          </div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-footer">{footer}</p>
        </div>
      </main>
    </div>
  );
}
