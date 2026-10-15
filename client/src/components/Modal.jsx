import { useEffect, useRef } from 'react';

export function Modal({ open, title, onClose, children, size = 'md' }) {
  const ref = useRef(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleCancel = (event) => {
    event.preventDefault();
    onClose();
  };

  const handleBackdropClick = (event) => {
    if (event.target === ref.current && pressedBackdrop.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      className={`modal modal-${size}`}
      onCancel={handleCancel}
      onMouseDown={(event) => {
        pressedBackdrop.current = event.target === ref.current;
      }}
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="modal-body">
          <header className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close dialog">
              &times;
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={busy ? () => {} : onClose} size="sm">
      <p className="modal-text">{message}</p>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy} autoFocus>
          {busy ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
