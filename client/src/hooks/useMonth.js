import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { currentMonth, isValidMonth } from '../utils/date';

export function useMonth() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('month');
  const month = isValidMonth(raw) ? raw : currentMonth();

  const setMonth = useCallback(
    (next) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set('month', next);
          updated.delete('page');
          return updated;
        },
        { replace: true },
      ),
    [setParams],
  );

  return [month, setMonth];
}
