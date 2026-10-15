import { currentMonth, shiftMonth } from '../utils/date';

export function MonthPicker({ month, onChange }) {
  return (
    <div className="month-picker">
      <button className="btn btn-outline btn-sm" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        &lsaquo;
      </button>
      <input
        type="month"
        className="input"
        value={month}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label="Select month"
      />
      <button className="btn btn-outline btn-sm" onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month">
        &rsaquo;
      </button>
      {month !== currentMonth() && (
        <button className="btn-link" onClick={() => onChange(currentMonth())}>
          This month
        </button>
      )}
    </div>
  );
}
