import { CalendarX2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '../api/client';
import { transactionsApi } from '../api/transactions';
import { ChartCard, Legend } from '../components/ChartCard';
import { BreakdownList, DailySpendingChart, TrendChart } from '../components/Charts';
import { MonthPicker } from '../components/MonthPicker';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { SummaryCards } from '../components/SummaryCards';
import { useTransactionActions } from '../components/TransactionActions';
import { TransactionList } from '../components/TransactionList';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useAsync } from '../hooks/useAsync';
import { useMonth } from '../hooks/useMonth';
import { todayISO } from '../utils/date';
import { formatCurrency, formatMonth, formatShortDate } from '../utils/format';

const MAX_CATEGORIES = 6;

function foldTail(categories) {
  const items = categories.map((c) => ({ ...c, label: c.category }));
  if (items.length <= MAX_CATEGORIES + 1) return items;
  const rest = items.slice(MAX_CATEGORIES);
  return [
    ...items.slice(0, MAX_CATEGORIES),
    {
      label: `All others (${rest.length})`,
      total: rest.reduce((sum, c) => sum + c.total, 0),
      percent: rest.reduce((sum, c) => sum + c.percent, 0),
    },
  ];
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-grid" aria-busy="true">
      <div className="stats-grid span-full">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card stat">
            <Skeleton width="40%" />
            <Skeleton height={28} width="70%" />
            <Skeleton width="50%" />
          </div>
        ))}
      </div>
      <div className="card span-2">
        <Skeleton height={280} />
      </div>
      <div className="card">
        <Skeleton height={280} />
      </div>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={c.numeric ? 'num' : undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key} className={c.numeric ? 'num' : undefined}>
                {c.format ? c.format(row[c.key]) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { paymentMethodLabel, typeLabel } = useMeta();
  const [month, setMonth] = useMonth();
  const [breakdownType, setBreakdownType] = useState('expense');

  const summary = useAsync((signal) => transactionsApi.summary({ month }, signal), [month]);
  const recent = useAsync((signal) => transactionsApi.list({ month, limit: 5 }, signal), [month]);

  const currency = user.currency;
  const money = (v) => formatCurrency(v, currency);
  const refresh = () => {
    summary.reload();
    recent.reload();
  };
  const actions = useTransactionActions({ month, onSaved: refresh, onDeleted: refresh });

  const data = summary.data;
  const hasMonthData = data?.totals.count > 0;
  const breakdownItems = foldTail(data?.byCategory[breakdownType] ?? []);
  const activeDays = data?.daily.filter((d) => d.expense > 0) ?? [];
  const elapsedDays = data?.daily.filter((d) => d.date <= todayISO()).length || data?.daily.length || 1;

  let content;
  if (summary.error && !data) {
    content = <ErrorState message={getErrorMessage(summary.error)} onRetry={summary.reload} />;
  } else if (!data) {
    content = <DashboardSkeleton />;
  } else {
    content = (
      <div className={`dashboard-grid${summary.loading ? ' is-refreshing' : ''}`}>
        <div className="span-full">
          <SummaryCards summary={data} currency={currency} />
        </div>

        {hasMonthData ? (
          <>
            <ChartCard
              className="span-2"
              title="Daily spending"
              subtitle={`Average ${money(data.totals.expense / elapsedDays)} per day`}
              table={
                <DataTable
                  columns={[
                    { key: 'date', label: 'Date', format: formatShortDate },
                    { key: 'expense', label: 'Spent', numeric: true, format: money },
                    { key: 'income', label: 'Received', numeric: true, format: money },
                  ]}
                  rows={data.daily.filter((d) => d.expense || d.income)}
                />
              }
            >
              <DailySpendingChart data={data.daily} currency={currency} />
              <p className="chart-caption">
                Spending recorded on {activeDays.length} of {data.daily.length} days
              </p>
            </ChartCard>

            <ChartCard
              title="By category"
              subtitle={breakdownType === 'expense' ? 'Where your money went' : 'Where your pocket money came from'}
              actions={
                <div className="segmented segmented-sm" role="group" aria-label="Breakdown type">
                  {['expense', 'income'].map((type) => (
                    <button
                      key={type}
                      className={`segmented-option${breakdownType === type ? ' is-active' : ''}`}
                      aria-pressed={breakdownType === type}
                      onClick={() => setBreakdownType(type)}
                    >
                      {type === 'expense' ? 'Expenses' : typeLabel(type)}
                    </button>
                  ))}
                </div>
              }
            >
              {breakdownItems.length ? (
                <BreakdownList items={breakdownItems} currency={currency} color={breakdownType} />
              ) : (
                <p className="muted empty-inline">No {typeLabel(breakdownType).toLowerCase()} recorded this month.</p>
              )}
            </ChartCard>
          </>
        ) : (
          <div className="card span-full">
            <EmptyState
              icon={CalendarX2}
              title={`No transactions in ${formatMonth(month)}`}
              message="Add your pocket money or a college expense for this month to see charts and breakdowns."
              action={
                <button className="btn btn-primary" onClick={actions.openCreate}>
                  <Plus size={16} /> Add transaction
                </button>
              }
            />
          </div>
        )}

        <ChartCard
          className="span-2"
          title="Pocket money vs spending"
          subtitle={`Last ${data.trend.length} months`}
          legend={
            <Legend
              items={[
                { key: 'income', label: 'Pocket money' },
                { key: 'expense', label: 'Spent' },
              ]}
            />
          }
          table={
            <DataTable
              columns={[
                { key: 'month', label: 'Month', format: (m) => formatMonth(m) },
                { key: 'income', label: 'Pocket money', numeric: true, format: money },
                { key: 'expense', label: 'Spent', numeric: true, format: money },
                { key: 'balance', label: 'Left over', numeric: true, format: money },
              ]}
              rows={data.trend}
            />
          }
        >
          <TrendChart data={data.trend} currency={currency} />
        </ChartCard>

        <ChartCard title="Payment methods" subtitle="Spending by how you paid">
          {data.byPaymentMethod.length ? (
            <BreakdownList
              items={data.byPaymentMethod.map((m) => ({
                ...m,
                label: paymentMethodLabel(m.paymentMethod),
                percent: data.totals.expense ? (m.total / data.totals.expense) * 100 : 0,
              }))}
              currency={currency}
              color="expense"
            />
          ) : (
            <p className="muted empty-inline">No expenses recorded this month.</p>
          )}
        </ChartCard>

        {hasMonthData && (
          <section className="card span-full">
            <header className="card-header">
              <div>
                <h2>Recent transactions</h2>
                <p className="card-subtitle">Latest activity in {formatMonth(month)}</p>
              </div>
              <Link className="btn btn-ghost btn-sm" to={`/transactions?month=${month}`}>
                View all
              </Link>
            </header>
            {recent.error && !recent.data ? (
              <ErrorState message={getErrorMessage(recent.error)} onRetry={recent.reload} />
            ) : recent.data ? (
              <TransactionList
                transactions={recent.data.transactions}
                currency={currency}
                onEdit={actions.openEdit}
                onDelete={actions.requestDelete}
              />
            ) : (
              <Skeleton height={200} />
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Hi, {user.name.split(' ')[0]}</h1>
          <p className="muted">Here is your summary for {formatMonth(month)}.</p>
        </div>
        <div className="page-actions">
          <MonthPicker month={month} onChange={setMonth} />
          <button className="btn btn-primary" aria-label="Add transaction" onClick={actions.openCreate}>
            <Plus size={16} /> <span>Add transaction</span>
          </button>
        </div>
      </header>

      {content}

      {actions.dialogs}
    </>
  );
}
