const cache = new Map();

function formatter(key, factory) {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key);
}

export function formatCurrency(amount, currency = 'INR', { compact = false, sign = false } = {}) {
  const options = {
    style: 'currency',
    currency,
    signDisplay: sign ? 'exceptZero' : 'auto',
    ...(compact && { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }),
  };
  return formatter(`c|${currency}|${compact}|${sign}`, () => new Intl.NumberFormat(undefined, options)).format(
    amount,
  );
}

export const formatPercent = (value, digits = 0) =>
  formatter(`p|${digits}`, () =>
    new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: digits }),
  ).format(value / 100);

const toUTCDate = (value) => new Date(value.length === 10 ? `${value}T00:00:00Z` : value);

export const formatDate = (value) =>
  formatter('d|full', () =>
    new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
  ).format(toUTCDate(value));

export const formatShortDate = (value) =>
  formatter('d|short', () =>
    new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  ).format(toUTCDate(value));

export function formatMonth(month, style = 'long') {
  const [y, m] = month.split('-').map(Number);
  const options = style === 'long' ? { month: 'long', year: 'numeric' } : { month: 'short' };
  return formatter(`m|${style}`, () => new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' })).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}
