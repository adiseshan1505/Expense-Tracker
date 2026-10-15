export function Pagination({ page, pages, total, limit, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="muted">
        Showing {from}-{to} of {total}
      </span>
      {pages > 1 && (
        <div className="pagination-controls">
          <button className="btn btn-outline btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
            Prev
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => onChange(page + 1)} disabled={page >= pages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
