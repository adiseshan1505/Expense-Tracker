import { useRef, useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { useMeta } from '../context/MetaContext';
import { todayISO, toDateInput } from '../utils/date';
import { hasErrors, validateTransaction } from '../utils/validation';
import { FormField } from './FormField';
import { Alert } from './States';

const FIELD_ORDER = ['type', 'amount', 'category', 'date', 'paymentMethod', 'note'];

export const toFormValues = (transaction) =>
  transaction && {
    type: transaction.type,
    amount: String(transaction.amount),
    category: transaction.category,
    date: toDateInput(transaction.date),
    paymentMethod: transaction.paymentMethod,
    note: transaction.note ?? '',
  };

export function TransactionForm({ initialValues, defaultDate, submitLabel, onSubmit, onCancel }) {
  const meta = useMeta();
  const formRef = useRef(null);
  const [values, setValues] = useState(
    () =>
      initialValues ?? {
        type: 'expense',
        amount: '',
        category: '',
        date: defaultDate ?? todayISO(),
        paymentMethod: meta.paymentMethods[0].value,
        note: '',
      },
  );
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validateTransaction(values, meta);
  const errorFor = (field) =>
    ((submitted || touched[field]) && clientErrors[field]) || serverErrors[field] || '';

  const update = (field, value) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'type' && !meta.categories[value].includes(prev.category)) next.category = '';
      return next;
    });
    setServerErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const touch = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError('');

    if (hasErrors(clientErrors)) {
      const first = FIELD_ORDER.find((f) => clientErrors[f]);
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type: values.type,
        amount: Number(values.amount),
        category: values.category,
        date: values.date,
        paymentMethod: values.paymentMethod,
        note: values.note.trim(),
      });
    } catch (err) {
      setServerErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
      <Alert>{formError}</Alert>

      <fieldset className="segmented" aria-label="Transaction type">
        {['expense', 'income'].map((type) => (
          <label key={type} className={`segmented-option segmented-${type}`}>
            <input
              type="radio"
              name="type"
              value={type}
              checked={values.type === type}
              onChange={() => update('type', type)}
            />
            <span>{meta.typeLabel(type)}</span>
          </label>
        ))}
      </fieldset>

      <div className="form-grid">
        <FormField label="Amount" error={errorFor('amount')}>
          {(props) => (
            <input
              {...props}
              name="amount"
              className="input"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={values.amount}
              onChange={(e) => update('amount', e.target.value)}
              onBlur={touch('amount')}
              autoFocus
            />
          )}
        </FormField>

        <FormField label="Date" error={errorFor('date')}>
          {(props) => (
            <input
              {...props}
              name="date"
              className="input"
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={values.date}
              onChange={(e) => update('date', e.target.value)}
              onBlur={touch('date')}
            />
          )}
        </FormField>

        <FormField label="Category" error={errorFor('category')}>
          {(props) => (
            <select
              {...props}
              name="category"
              className="input"
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              onBlur={touch('category')}
            >
              <option value="">Select a category</option>
              {meta.categories[values.type].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Payment method" error={errorFor('paymentMethod')}>
          {(props) => (
            <select
              {...props}
              name="paymentMethod"
              className="input"
              value={values.paymentMethod}
              onChange={(e) => update('paymentMethod', e.target.value)}
              onBlur={touch('paymentMethod')}
            >
              {meta.paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <FormField
        label="Note (optional)"
        error={errorFor('note')}
        hint={`${values.note.length}/${meta.noteMaxLength}`}
      >
        {(props) => (
          <textarea
            {...props}
            name="note"
            className="input"
            rows={2}
            maxLength={meta.noteMaxLength}
            placeholder="e.g. Lunch at canteen"
            value={values.note}
            onChange={(e) => update('note', e.target.value)}
            onBlur={touch('note')}
          />
        )}
      </FormField>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
