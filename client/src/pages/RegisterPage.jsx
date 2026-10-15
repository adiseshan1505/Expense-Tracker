import { useState } from 'react';
import { Link } from 'react-router';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { FormField, PasswordInput } from '../components/FormField';
import { Alert } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { hasErrors, validateEmail, validateName, validatePassword } from '../utils/validation';
import { AuthLayout } from './AuthLayout';

export default function RegisterPage() {
  const { register } = useAuth();
  const { currencies } = useMeta();
  const toast = useToast();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'INR',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: values.confirmPassword === values.password ? '' : 'Passwords do not match',
    };
    setErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        currency: values.currency,
      });
      toast.success('Account created. Welcome aboard!');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{formError}</Alert>
        <FormField label="Name" error={errors.name}>
          {(props) => (
            <input
              {...props}
              className="input"
              autoComplete="name"
              value={values.name}
              onChange={update('name')}
              autoFocus
            />
          )}
        </FormField>
        <FormField label="Email" error={errors.email}>
          {(props) => (
            <input
              {...props}
              className="input"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={update('email')}
            />
          )}
        </FormField>
        <FormField label="Password" error={errors.password} hint="At least 8 characters with a letter and a number">
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              value={values.password}
              onChange={update('password')}
            />
          )}
        </FormField>
        <FormField label="Confirm password" error={errors.confirmPassword}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={update('confirmPassword')}
            />
          )}
        </FormField>
        <FormField label="Currency" error={errors.currency}>
          {(props) => (
            <select {...props} className="input" value={values.currency} onChange={update('currency')}>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
