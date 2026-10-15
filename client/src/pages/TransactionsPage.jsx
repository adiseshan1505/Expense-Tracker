import { FilterX, Plus, Search, SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getErrorMessage } from '../api/client';
import { transactionsApi } from '../api/transactions';
import { MonthPicker } from '../components/MonthPicker';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { useTransactionActions } from '../components/TransactionActions';
import { TransactionList } from '../components/TransactionList';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useAsync } from '../hooks/useAsync';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMonth } from '../hooks/useMonth';
import { formatCurrency, formatMonth } from '../utils/format';

const PAGE_SIZE = 15;
const FILTER_KEYS = ['type', 'category', 'paymentMethod', 'q'];

const SORT_OPTIONS = [
  { value: '-date', label: 'Newest first' },
  { value: 'date', label: 'Oldest first' },
  { value: '-amount', label: 'Highest amount' },
  { value: 'amount', label: 'Lowest amount' },
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const meta = useMeta();
  const [month, setMonth] = useMonth();
  const [params, setParams] = useSearchParams();

  const filters = {
    type: params.get('type') ?? '',
    category: params.get('category') ?? '',
    paymentMethod: params.get('paymentMethod') ?? '',
    q: params.get('q') ?? '',
    sort: params.get('sort') ?? '-date',
    page: Math.max(1, Number(params.get('page')) || 1),
  };

  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(search.trim());

  const setFilter = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        if (key === 'type' && value && !meta.categories[value].includes(next.get('category'))) {
          next.delete('category');
        }
        return next;
      },
      { replace: key !== 'page' },
    );

  useEffect(() => {
    if (debouncedSearch !== filters.q) setFilter('q', debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useAsync(
    (signal) =>
      transactionsApi.list(
        {
          month,
          type: filters.type,
          category: filters.category,
          paymentMethod: filters.paymentMethod,
          q: filters.q,
          sort: filters.sort,
          page: filters.page,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    [month, params.toString()],
  );

  const categoryOptions = useMemo(
    () =>
      filters.type
        ? meta.categories[filters.type]
        : [...new Set([...meta.categories.expense, ...meta.categories.income])],
    [filters.type, meta.categories],
  );

  const activeFilters = FILTER_KEYS.some((key) => filters[key]);

  const clearFilters = () => {
    setSearch('');
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      [...FILTER_KEYS, 'page'].forEach((key) => next.delete(key));
      return next;
    });
  };

  const actions = useTransactionActions({
    month,
    onSaved: query.reload,
    onDeleted: () => {
      if (query.data?.transactions.length === 1 && filters.page > 1) setFilter('page', String(filters.page - 1));
      else query.reload();
    },
  });

  const currency = user.currency;
  const data = query.data;

  let body;
  if (query.error && !data) {
    body = <ErrorState message={getErrorMessage(query.error)} onRetry={query.reload} />;
  } else if (!data) {
    body = (
      <div className="stack" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={56} />
        ))}
      </div>
    );
  } else if (!data.transactions.length) {
    body = activeFilters ? (
      <EmptyState
        icon={SearchX}
        title="No matching transactions"
        message="Try a different search term or clear the filters."
        action={
          <button className="btn btn-secondary" onClick={clearFilters}>
            <FilterX size={16} /> Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title={`Nothing recorded in ${formatMonth(month)}`}
        message="Add your pocket money or an expense to start tracking this month."
        action={
          <button className="btn btn-primary" onClick={actions.openCreate}>
            <Plus size={16} /> Add transaction
          </button>
        }
      />
    );
  } else {
    body = (
      <>
        <TransactionList
          transactions={data.transactions}
          currency={currency}
          onEdit={actions.openEdit}
          onDelete={actions.requestDelete}
        />
        <Pagination {...data.pagination} onChange={(page) => setFilter('page', String(page))} />
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="muted">Everything you recorded in {formatMonth(month)}.</p>
        </div>
        <div className="page-actions">
          <MonthPicker month={month} onChange={setMonth} />
          <button className="btn btn-primary" aria-label="Add transaction" onClick={actions.openCreate}>
            <Plus size={16} /> <span>Add transaction</span>
          </button>
        </div>
      </header>

      <section className="card filters" aria-label="Filters">
        <label className="input-icon">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search notes or categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search transactions"
          />
        </label>
        <select
          className="input"
          value={filters.type}
          onChange={(e) => setFilter('type', e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="expense">{meta.typeLabel('expense')}</option>
          <option value="income">{meta.typeLabel('income')}</option>
        </select>
        <select
          className="input"
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.paymentMethod}
          onChange={(e) => setFilter('paymentMethod', e.target.value)}
          aria-label="Filter by payment method"
        >
          <option value="">All payment methods</option>
          {meta.paymentMethods.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value === '-date' ? '' : e.target.value)}
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {activeFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            <FilterX size={16} /> Clear
          </button>
        )}
      </section>

      {data && data.pagination.total > 0 && (
        <div className="totals-strip">
          <span>
            <span className="swatch swatch-income" aria-hidden="true" /> Pocket money
            <strong>{formatCurrency(data.totals.income, currency)}</strong>
          </span>
          <span>
            <span className="swatch swatch-expense" aria-hidden="true" /> Spent
            <strong>{formatCurrency(data.totals.expense, currency)}</strong>
          </span>
          <span>
            Left over <strong>{formatCurrency(data.totals.balance, currency, { sign: true })}</strong>
          </span>
          {activeFilters && <span className="muted">(filtered)</span>}
        </div>
      )}

      <section className={`card list-card${query.loading && data ? ' is-refreshing' : ''}`}>{body}</section>

      {actions.dialogs}
    </>
  );
}
