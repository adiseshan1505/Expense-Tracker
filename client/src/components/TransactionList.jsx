import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { useMeta } from '../context/MetaContext';
import { formatCurrency, formatDate } from '../utils/format';

export function TransactionList({ transactions, currency, onEdit, onDelete }) {
  const { paymentMethodLabel, typeLabels } = useMeta();
  const editable = Boolean(onEdit);

  return (
    <ul className={`tx-list${editable ? ' tx-list-editable' : ''}`}>
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const details = (
          <>
            <span className="tx-category">{tx.category}</span>
            {tx.note && <span className="tx-note">{tx.note}</span>}
          </>
        );

        return (
          <li key={tx.id} className="tx-row">
            <span className={`tx-icon tx-icon-${tx.type}`} aria-hidden="true">
              {isIncome ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
            </span>
            {editable ? (
              <button type="button" className="tx-main tx-main-button" onClick={() => onEdit(tx)} title="Edit">
                {details}
              </button>
            ) : (
              <div className="tx-main">{details}</div>
            )}
            <span className="tx-meta">
              <span>{formatDate(tx.date)}</span>
              <span className="badge">{paymentMethodLabel(tx.paymentMethod)}</span>
            </span>
            <span className={`tx-amount${isIncome ? ' tx-amount-income' : ''}`}>
              <span className="sr-only">{typeLabels[tx.type]} </span>
              {isIncome ? '+' : '−'}
              {formatCurrency(tx.amount, currency)}
            </span>
            {editable && (
              <div className="tx-actions">
                <button
                  className="btn btn-ghost btn-sm tx-edit"
                  onClick={() => onEdit(tx)}
                  aria-label={`Edit ${tx.category} transaction`}
                >
                  <Pencil size={15} aria-hidden="true" />
                  <span aria-hidden="true">Edit</span>
                </button>
                {onDelete && (
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => onDelete(tx)}
                    aria-label={`Delete ${tx.category} transaction`}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
