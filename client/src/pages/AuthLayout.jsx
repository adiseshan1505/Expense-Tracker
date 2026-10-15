export function AuthLayout({ title, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <p className="auth-brand">Expense Tracker</p>
        <p className="muted auth-tagline">Track your pocket money and college expenses</p>
        <div className="box">
          <h1>{title}</h1>
          {children}
        </div>
        <p className="auth-footer">{footer}</p>
      </div>
    </div>
  );
}
