import { BarChart3, Table2 } from 'lucide-react';
import { useState } from 'react';

export function ChartCard({ title, subtitle, actions, table, legend, className = '', dimmed, children }) {
  const [view, setView] = useState('chart');
  const showingTable = view === 'table';

  return (
    <section className={`card chart-card ${className}${dimmed ? ' is-refreshing' : ''}`}>
      <header className="card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        <div className="card-actions">
          {actions}
          {table && (
            <button
              className="icon-btn"
              onClick={() => setView(showingTable ? 'chart' : 'table')}
              aria-label={showingTable ? 'Show chart' : 'Show as table'}
              title={showingTable ? 'Show chart' : 'Show as table'}
            >
              {showingTable ? <BarChart3 size={18} /> : <Table2 size={18} />}
            </button>
          )}
        </div>
      </header>
      {!showingTable && legend}
      {showingTable ? <div className="table-wrap">{table}</div> : children}
    </section>
  );
}

export function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className={`swatch swatch-${item.key}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
