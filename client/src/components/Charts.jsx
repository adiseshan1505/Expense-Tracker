import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatMonth, formatShortDate } from '../utils/format';

const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 };
const BAR_RADIUS = [4, 4, 0, 0];

function ChartTooltip({ active, payload, label, series, currency, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{labelFormatter(label)}</p>
      {series.map((s) => (
        <div key={s.key} className="chart-tooltip-row">
          <span className={`swatch swatch-${s.key}`} aria-hidden="true" />
          <span>{s.label}</span>
          <strong>{formatCurrency(row[s.key], currency)}</strong>
        </div>
      ))}
    </div>
  );
}

function YAxisCurrency({ currency }) {
  return (
    <YAxis
      tickFormatter={(v) => formatCurrency(v, currency, { compact: true })}
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={false}
      width={64}
      allowDecimals={false}
    />
  );
}

export function DailySpendingChart({ data, currency }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => String(Number(d.slice(8)))}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: 'var(--axis)' }}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        {YAxisCurrency({ currency })}
        <Tooltip
          cursor={{ fill: 'var(--hover)' }}
          content={
            <ChartTooltip
              currency={currency}
              labelFormatter={formatShortDate}
              series={[
                { key: 'expense', label: 'Spent' },
                { key: 'income', label: 'Received' },
              ]}
            />
          }
        />
        <Bar dataKey="expense" name="Spent" fill="var(--expense)" radius={BAR_RADIUS} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data, currency }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis
          dataKey="month"
          tickFormatter={(m) => formatMonth(m, 'short')}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: 'var(--axis)' }}
        />
        {YAxisCurrency({ currency })}
        <Tooltip
          cursor={{ fill: 'var(--hover)' }}
          content={
            <ChartTooltip
              currency={currency}
              labelFormatter={(m) => formatMonth(m)}
              series={[
                { key: 'income', label: 'Pocket money' },
                { key: 'expense', label: 'Spent' },
                { key: 'balance', label: 'Left over' },
              ]}
            />
          }
        />
        <Bar dataKey="income" name="Pocket money" fill="var(--income)" radius={BAR_RADIUS} maxBarSize={28} />
        <Bar dataKey="expense" name="Spent" fill="var(--expense)" radius={BAR_RADIUS} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BreakdownList({ items, currency, color }) {
  const max = Math.max(...items.map((i) => i.total), 0);

  return (
    <ul className="breakdown">
      {items.map((item) => (
        <li key={item.label}>
          <div className="breakdown-head">
            <span className="breakdown-label">{item.label}</span>
            <span className="breakdown-value">
              {formatCurrency(item.total, currency)}
              {item.percent !== undefined && <span className="muted"> · {Math.round(item.percent)}%</span>}
            </span>
          </div>
          <div className="breakdown-track" aria-hidden="true">
            <div
              className="breakdown-fill"
              style={{ width: `${max ? (item.total / max) * 100 : 0}%`, background: `var(--${color})` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
