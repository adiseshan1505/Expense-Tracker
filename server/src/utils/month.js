const pad = (n) => String(n).padStart(2, '0');

const parse = (month) => month.split('-').map(Number);

export const toMonthString = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;

export const currentMonth = () => toMonthString(new Date());

export function monthRange(month) {
  const [year, m] = parse(month);
  return {
    start: new Date(Date.UTC(year, m - 1, 1)),
    end: new Date(Date.UTC(year, m, 1)),
  };
}

export function shiftMonth(month, delta) {
  const [year, m] = parse(month);
  return toMonthString(new Date(Date.UTC(year, m - 1 + delta, 1)));
}

export function listMonths(endMonth, count) {
  return Array.from({ length: count }, (_, i) => shiftMonth(endMonth, i - count + 1));
}

export function listDays(month) {
  const [year, m] = parse(month);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return Array.from({ length: days }, (_, i) => `${month}-${pad(i + 1)}`);
}
