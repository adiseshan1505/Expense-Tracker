import { transactionsApi } from '../api/transactions';
import { useToast } from '../context/ToastContext';
import { currentMonth } from '../utils/date';
import { formatMonth } from '../utils/format';
import { Modal } from './Modal';
import { TransactionForm, toFormValues } from './TransactionForm';

export function TransactionFormModal({ open, transaction, month, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(transaction);

  const handleSubmit = async (payload) => {
    const saved = isEdit
      ? await transactionsApi.update(transaction.id, payload)
      : await transactionsApi.create(payload);
    toast.success(`Transaction ${isEdit ? 'updated' : 'added'} · ${formatMonth(payload.date.slice(0, 7))}`);
    onClose();
    onSaved?.(saved);
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      {open && (
        <TransactionForm
          key={transaction?.id ?? 'new'}
          initialValues={toFormValues(transaction)}
          defaultDate={month && month !== currentMonth() ? `${month}-01` : undefined}
          submitLabel={isEdit ? 'Save changes' : 'Add transaction'}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
