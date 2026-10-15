import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatMonth, formatPercent } from '../utils/format';

function percentChange(current, previous) {
  if (!previous || !current) return null;
  return ((current - previous) / previous) * 100;
}

function Delta({ change, goodWhenUp, previousMonth }) {
  if (change === null || !Number.isFinite(change)) return null;
  const up = change >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`stat-delta ${good ? 'delta-good' : 'delta-bad'}`}>
      <Icon size={14} aria-hidden="true" />
      {up ? 'Up' : 'Down'} {formatPercent(Math.abs(change))} vs {formatMonth(previousMonth, 'short')}
    </span>
  );
}

export function SummaryCards({ summary, currency }) {
  const { totals, trend } = summary;
  const previous = trend.length > 1 ? trend[trend.length - 2] : null;
  const monthName = formatMonth(summary.month);

  return (
    <div className="stats-grid">
      <article className="card stat">
        <span className="stat-label">
          <span className="swatch swatch-income" aria-hidden="true" /> Pocket money
        </span>
        <strong className="stat-value">{formatCurrency(totals.income, currency)}</strong>
        <span className="stat-sub">Received in {monthName}</span>
        {previous && (
          <Delta
            change={percentChange(totals.income, previous.income)}
            goodWhenUp
            previousMonth={previous.month}
          />
        )}
      </article>

      <article className="card stat">
        <span className="stat-label">
          <span className="swatch swatch-expense" aria-hidden="true" /> Spent
        </span>
        <strong className="stat-value">{formatCurrency(totals.expense, currency)}</strong>
        <span className="stat-sub">Spent in {monthName}</span>
        {previous && (
          <Delta
            change={percentChange(totals.expense, previous.expense)}
            goodWhenUp={false}
            previousMonth={previous.month}
          />
        )}
      </article>

      <article className="card stat">
        <span className="stat-label">Left over</span>
        <strong className="stat-value">{formatCurrency(totals.balance, currency, { sign: true })}</strong>
        <span className="stat-sub">
          {totals.count} transaction{totals.count === 1 ? '' : 's'} in {monthName}
        </span>
      </article>

      <article className="card stat">
        <span className="stat-label">Saved</span>
        <strong className="stat-value">{totals.income ? formatPercent(totals.savingsRate, 1) : '—'}</strong>
        <span className="stat-sub">{totals.income ? `of pocket money saved in ${monthName}` : `No pocket money recorded in ${monthName}`}</span>
      </article>
    </div>
  );
}
