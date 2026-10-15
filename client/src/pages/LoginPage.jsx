import { useState } from 'react';
import { Link } from 'react-router';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { FormField, PasswordInput } from '../components/FormField';
import { Alert } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { hasErrors, validateEmail } from '../utils/validation';
import { AuthLayout } from './AuthLayout';

export default function LoginPage() {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
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
      email: validateEmail(values.email),
      password: values.password ? '' : 'Password is required',
    };
    setErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your pocket money dashboard."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{formError}</Alert>
        <FormField label="Email" error={errors.email}>
          {(props) => (
            <input
              {...props}
              className="input"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={update('email')}
              autoFocus
            />
          )}
        </FormField>
        <FormField label="Password" error={errors.password}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="current-password"
              value={values.password}
              onChange={update('password')}
            />
          )}
        </FormField>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
