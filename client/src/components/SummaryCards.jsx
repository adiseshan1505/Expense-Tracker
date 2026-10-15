import { formatCurrency, formatMonth, formatPercent } from '../utils/format';

function percentChange(current, previous) {
  if (!previous || !current) return null;
  return ((current - previous) / previous) * 100;
}

function Change({ value, goodWhenUp, previousMonth }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <small className={up === goodWhenUp ? 'text-success' : 'text-danger'}>
      {up ? '▲' : '▼'} {formatPercent(Math.abs(value))} vs {formatMonth(previousMonth, 'short')}
    </small>
  );
}

export function SummaryCards({ summary, currency }) {
  const { totals, trend } = summary;
  const previous = trend.length > 1 ? trend[trend.length - 2] : null;
  const monthName = formatMonth(summary.month);

  return (
    <div className="stats">
      <div className="box stat stat-income">
        <span className="stat-label">Pocket money</span>
        <span className="stat-value">{formatCurrency(totals.income, currency)}</span>
        <small className="muted">Received in {monthName}</small>
        {previous && <Change value={percentChange(totals.income, previous.income)} goodWhenUp previousMonth={previous.month} />}
      </div>

      <div className="box stat stat-expense">
        <span className="stat-label">Spent</span>
        <span className="stat-value">{formatCurrency(totals.expense, currency)}</span>
        <small className="muted">Spent in {monthName}</small>
        {previous && (
          <Change value={percentChange(totals.expense, previous.expense)} goodWhenUp={false} previousMonth={previous.month} />
        )}
      </div>

      <div className="box stat">
        <span className="stat-label">Left over</span>
        <span className={`stat-value ${totals.balance < 0 ? 'text-danger' : ''}`}>
          {formatCurrency(totals.balance, currency)}
        </span>
        <small className="muted">
          {totals.count} transaction{totals.count === 1 ? '' : 's'} in {monthName}
        </small>
      </div>

      <div className="box stat">
        <span className="stat-label">Saved</span>
        <span className="stat-value">{totals.income ? formatPercent(totals.savingsRate, 1) : '-'}</span>
        <small className="muted">{totals.income ? 'of pocket money' : `No pocket money in ${monthName}`}</small>
      </div>
    </div>
  );
}
