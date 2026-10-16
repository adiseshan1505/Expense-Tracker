import { useId } from 'react';

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
