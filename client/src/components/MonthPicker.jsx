import { ChevronLeft, ChevronRight } from 'lucide-react';
import { currentMonth, shiftMonth } from '../utils/date';
import { formatMonth } from '../utils/format';

export function MonthPicker({ month, onChange }) {
  const isCurrent = month === currentMonth();

  return (
    <div className="month-picker">
      <button className="icon-btn" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <label className="month-picker-label">
        <span>{formatMonth(month)}</span>
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="Select month"
        />
      </label>
      <button className="icon-btn" onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month">
        <ChevronRight size={18} />
      </button>
      {!isCurrent && (
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(currentMonth())}>
          Today
        </button>
      )}
    </div>
  );
}
