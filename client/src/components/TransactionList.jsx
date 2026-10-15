import { useMeta } from '../context/MetaContext';
import { formatCurrency, formatDate } from '../utils/format';

export function TransactionList({ transactions, currency, onEdit, onDelete }) {
  const { paymentMethodLabel, typeLabel } = useMeta();
  const editable = Boolean(onEdit);

  return (
    <div className="table-wrap">
      <table className="table tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th className="col-note">Note</th>
            <th className="col-method">Paid via</th>
            <th className="num">Amount</th>
            {editable && <th className="num">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <tr key={tx.id}>
                <td className="nowrap">{formatDate(tx.date)}</td>
                <td>
                  {tx.category}
                  {isIncome && <span className="tag">{typeLabel('income')}</span>}
                </td>
                <td className="note-cell col-note">{tx.note || '-'}</td>
                <td className="nowrap col-method">{paymentMethodLabel(tx.paymentMethod)}</td>
                <td className={`num nowrap amount ${isIncome ? 'amount-in' : 'amount-out'}`}>
                  {isIncome ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </td>
                {editable && (
                  <td className="num nowrap actions-cell">
                    <button className="btn-link" onClick={() => onEdit(tx)} aria-label={`Edit ${tx.category} transaction`}>
                      Edit
                    </button>
                    {onDelete && (
                      <button
                        className="btn-link text-danger"
                        onClick={() => onDelete(tx)}
                        aria-label={`Delete ${tx.category} transaction`}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
