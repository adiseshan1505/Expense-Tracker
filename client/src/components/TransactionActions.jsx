import { useState } from 'react';
import { getErrorMessage } from '../api/client';
import { transactionsApi } from '../api/transactions';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import { ConfirmDialog } from './Modal';
import { TransactionFormModal } from './TransactionFormModal';

export function useTransactionActions({ month, onSaved, onDeleted }) {
  const { currency } = useMeta();
  const toast = useToast();
  const [form, setForm] = useState({ open: false, transaction: null });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await transactionsApi.remove(deleting.id);
      toast.success('Transaction deleted');
      setDeleting(null);
      onDeleted?.(deleting);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const dialogs = (
    <>
      <TransactionFormModal
        open={form.open}
        transaction={form.transaction}
        month={month}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        onSaved={onSaved}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete transaction?"
        message={
          deleting &&
          `This will permanently delete the ${deleting.category} ${
            deleting.type === 'income' ? 'pocket money entry' : 'expense'
          } of ${formatCurrency(deleting.amount, currency)}.`
        }
        confirmLabel="Delete"
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );

  return {
    openCreate: () => setForm({ open: true, transaction: null }),
    openEdit: (transaction) => setForm({ open: true, transaction }),
    requestDelete: setDeleting,
    dialogs,
  };
}
