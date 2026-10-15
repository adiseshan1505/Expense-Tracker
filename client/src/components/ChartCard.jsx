import { useState } from 'react';

export function ChartCard({ title, subtitle, actions, table, legend, className = '', children }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={`box chart-card ${className}`}>
      <div className="box-header">
        <h2>{title}</h2>
        <div className="box-actions">
          {actions}
          {table && (
            <button className="btn-link" onClick={() => setShowTable((v) => !v)}>
              {showTable ? 'Show chart' : 'Show table'}
            </button>
          )}
        </div>
      </div>
      {subtitle && <p className="box-subtitle">{subtitle}</p>}
      {!showTable && legend}
      {showTable ? <div className="table-wrap table-scroll">{table}</div> : children}
    </section>
  );
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((item) => (
        <span key={item.label}>
          <span className={`swatch swatch-${item.key}`} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
