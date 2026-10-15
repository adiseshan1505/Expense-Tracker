import { useId, useState } from 'react';

export function FormField({ label, error, hint, children, id: providedId }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field${error ? ' field-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      ) : (
        hint && (
          <small className="field-hint" id={`${id}-hint`}>
            {hint}
          </small>
        )
      )}
    </div>
  );
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} className="input" />
      <button
        type="button"
        className="btn-link"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
