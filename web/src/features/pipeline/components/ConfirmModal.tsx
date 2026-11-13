import { useState, type ReactNode } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
import { useT } from '~/i18n/useT';

interface Props {
  title: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  variant?: 'primary' | 'danger';
  /** Disables the confirm button until the form is valid. */
  disabled?: boolean;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
  id?: string;
}

/** Modal with an error banner and a confirm button that stays busy while the request runs. */
export function ConfirmModal({
  title,
  children,
  confirmLabel,
  pendingLabel,
  variant = 'primary',
  disabled,
  onConfirm,
  onClose,
  id
}: Props) {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError((e as Error).message || t('common.error'));
      setBusy(false);
    }
  };

  // The request keeps running after the modal is gone, so it cannot be dismissed while busy:
  // reopening it would allow a second submission of the same request.
  const close = () => {
    if (!busy) {
      onClose();
    }
  };

  return (
    <Modal
      show
      onHide={close}
      backdrop={busy ? 'static' : true}
      keyboard={!busy}
      id={id}
      centered
      className="pipeline-modal"
    >
      <Modal.Header closeButton={!busy}>
        <Modal.Title as="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <Alert variant="warning" className="modal-error">
            {error}
          </Alert>
        ) : null}
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" disabled={busy} onClick={close}>
          {t('pipeline.common.cancel')}
        </Button>
        <Button
          variant={variant}
          disabled={disabled || busy}
          onClick={submit}
          className="confirm"
        >
          {busy ? pendingLabel ?? confirmLabel : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
