import { KeyRound, LogOut, ShieldAlert, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '../api/auth';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { FormField, PasswordInput } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Alert } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import { hasErrors, validateName, validatePassword } from '../utils/validation';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const { currencies } = useMeta();
  const toast = useToast();
  const [values, setValues] = useState({ name: user.name, currency: user.currency });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const dirty = values.name.trim() !== user.name || values.currency !== user.currency;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = { name: validateName(values.name) };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    try {
      setUser(await authApi.updateProfile({ name: values.name.trim(), currency: values.currency }));
      toast.success('Profile updated');
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>
            <UserRound size={18} aria-hidden="true" /> Account details
          </h2>
          <p className="card-subtitle">
            {user.email} · member since {formatDate(user.createdAt)}
          </p>
        </div>
      </header>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Name" error={errors.name}>
            {(props) => (
              <input
                {...props}
                className="input"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              />
            )}
          </FormField>
          <FormField label="Currency" error={errors.currency} hint="Used to display all amounts">
            {(props) => (
              <select
                {...props}
                className="input"
                value={values.currency}
                onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

function PasswordForm() {
  const { startSession } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      currentPassword: values.currentPassword ? '' : 'Current password is required',
      newPassword: validatePassword(values.newPassword),
      confirmPassword: values.confirmPassword === values.newPassword ? '' : 'Passwords do not match',
    };
    setErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    try {
      startSession(
        await authApi.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      );
      setValues(EMPTY_PASSWORDS);
      toast.success('Password changed. Other sessions have been signed out.');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>
            <KeyRound size={18} aria-hidden="true" /> Change password
          </h2>
          <p className="card-subtitle">Changing your password signs out every other device.</p>
        </div>
      </header>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{formError}</Alert>
        <FormField label="Current password" error={errors.currentPassword}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={update('currentPassword')}
            />
          )}
        </FormField>
        <div className="form-grid">
          <FormField label="New password" error={errors.newPassword} hint="8+ characters, a letter and a number">
            {(props) => (
              <PasswordInput
                {...props}
                autoComplete="new-password"
                value={values.newPassword}
                onChange={update('newPassword')}
              />
            )}
          </FormField>
          <FormField label="Confirm new password" error={errors.confirmPassword}>
            {(props) => (
              <PasswordInput
                {...props}
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={update('confirmPassword')}
              />
            )}
          </FormField>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}

function DangerZone() {
  const { logout, endSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    setPassword('');
    setError('');
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    if (!password) return setError('Password is required');

    setBusy(true);
    try {
      await authApi.deleteAccount(password);
      endSession();
      toast.success('Your account and all its data have been deleted');
      navigate('/register', { replace: true });
    } catch (err) {
      setError(getFieldErrors(err).password || getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <section className="card danger-card">
      <header className="card-header">
        <div>
          <h2>
            <ShieldAlert size={18} aria-hidden="true" /> Session &amp; account
          </h2>
          <p className="card-subtitle">Log out of this device or permanently delete your account.</p>
        </div>
      </header>
      <div className="danger-actions">
        <button className="btn btn-secondary" onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={16} /> {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
        <button className="btn btn-danger" onClick={() => setOpen(true)}>
          Delete account
        </button>
      </div>

      <Modal open={open} title="Delete account?" onClose={close} size="sm">
        <form className="form" onSubmit={handleDelete} noValidate>
          <p className="modal-text">
            This permanently deletes your account and every transaction. This cannot be undone.
          </p>
          <FormField label="Confirm with your password" error={error}>
            {(props) => (
              <PasswordInput
                {...props}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
              />
            )}
          </FormField>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={close} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={busy}>
              {busy ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="muted">Manage your account, password, and session.</p>
        </div>
      </header>
      <div className="stack profile-stack">
        <ProfileForm />
        <PasswordForm />
        <DangerZone />
      </div>
    </>
  );
}
