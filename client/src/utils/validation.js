const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password must be at most 72 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  return '';
}

export function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be at most 50 characters';
  return '';
}

export function validateTransaction(values, meta) {
  const errors = {};
  const amount = Number(values.amount);

  if (values.amount === '' || values.amount === null) errors.amount = 'Amount is required';
  else if (!Number.isFinite(amount)) errors.amount = 'Amount must be a number';
  else if (amount <= 0) errors.amount = 'Amount must be greater than 0';
  else if (amount > 1_000_000_000) errors.amount = 'Amount is too large';
  else if (!/^\d+(\.\d{1,2})?$/.test(String(values.amount).trim())) {
    errors.amount = 'Use at most 2 decimal places';
  }

  if (!meta.types.includes(values.type)) errors.type = 'Choose pocket money or expense';

  if (!values.category) errors.category = 'Choose a category';
  else if (!meta.categories[values.type]?.includes(values.category)) {
    errors.category = 'Choose a category for this type';
  }

  if (!values.date) errors.date = 'Date is required';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = 'Enter a valid date';
  else {
    const year = Number(values.date.slice(0, 4));
    if (year < 2000 || year > 2100) errors.date = 'Date must be between 2000 and 2100';
  }

  if (!values.paymentMethod) errors.paymentMethod = 'Choose a payment method';

  if (values.note.length > meta.noteMaxLength) {
    errors.note = `Note must be at most ${meta.noteMaxLength} characters`;
  }

  return errors;
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean);
