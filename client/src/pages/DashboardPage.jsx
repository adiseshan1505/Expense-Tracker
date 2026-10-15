import { useState } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '../api/client';
import { transactionsApi } from '../api/transactions';
import { ChartCard, Legend } from '../components/ChartCard';
import { BreakdownList, DailySpendingChart, TrendChart } from '../components/Charts';
import { MonthPicker } from '../components/MonthPicker';
import { EmptyState, ErrorState, Loading } from '../components/States';
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
      label: `Others (${rest.length})`,
      total: rest.reduce((sum, c) => sum + c.total, 0),
      percent: rest.reduce((sum, c) => sum + c.percent, 0),
    },
  ];
}

function DataTable({ columns, rows }) {
  return (
    <table className="table">
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
  const { paymentMethodLabel } = useMeta();
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
  const elapsedDays = data?.daily.filter((d) => d.date <= todayISO()).length || data?.daily.length || 1;

  let content;
  if (summary.error && !data) {
    content = <ErrorState message={getErrorMessage(summary.error)} onRetry={summary.reload} />;
  } else if (!data) {
    content = <Loading />;
  } else {
    content = (
      <div className={summary.loading ? 'is-refreshing' : undefined}>
        <SummaryCards summary={data} currency={currency} />

        {hasMonthData ? (
          <div className="grid-2">
            <ChartCard
              title="Daily spending"
              subtitle={`Avg. ${money(data.totals.expense / elapsedDays)} per day`}
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
            </ChartCard>

            <ChartCard
              title="By category"
              actions={
                <select
                  className="input input-sm"
                  value={breakdownType}
                  onChange={(e) => setBreakdownType(e.target.value)}
                  aria-label="Breakdown type"
                >
                  <option value="expense">Expenses</option>
                  <option value="income">Pocket money</option>
                </select>
              }
            >
              {breakdownItems.length ? (
                <BreakdownList items={breakdownItems} currency={currency} color={breakdownType} />
              ) : (
                <p className="muted">Nothing recorded this month.</p>
              )}
            </ChartCard>
          </div>
        ) : (
          <div className="box">
            <EmptyState
              title={`No transactions in ${formatMonth(month)}`}
              message="Add your pocket money or an expense to see the charts."
              action={
                <button className="btn btn-primary" onClick={actions.openCreate}>
                  + Add Transaction
                </button>
              }
            />
          </div>
        )}

        <div className="grid-2">
          <ChartCard
            title="Last 6 months"
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

          <ChartCard title="Payment methods">
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
              <p className="muted">No expenses this month.</p>
            )}
          </ChartCard>
        </div>

        {hasMonthData && (
          <section className="box">
            <div className="box-header">
              <h2>Recent transactions</h2>
              <Link to={`/transactions?month=${month}`}>View all</Link>
            </div>
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
              <Loading />
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="page-actions">
          <MonthPicker month={month} onChange={setMonth} />
          <button className="btn btn-primary" onClick={actions.openCreate}>
            + Add Transaction
          </button>
        </div>
      </div>

      {content}

      {actions.dialogs}
    </>
  );
}
