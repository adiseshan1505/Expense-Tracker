import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, pages, total, limit, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">
        Showing {from}–{to} of {total}
      </span>
      {pages > 1 && (
        <div className="pagination-controls">
          <button className="btn btn-secondary btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="muted">
            Page {page} of {pages}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => onChange(page + 1)} disabled={page >= pages}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}
