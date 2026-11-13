import { useState, type FormEvent } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { errorMessage, useCollectionMutations } from '../lib/api';
import type { Collection } from '../lib/types';
import styles from '../collections.module.scss';

interface CollectionModalProps {
  show: boolean;
  onHide: () => void;
  onCreated?: (collection: Collection) => void;
}

export function CollectionModal({
  show,
  onHide,
  onCreated
}: CollectionModalProps) {
  const t = useT();
  const { create } = useCollectionMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName('');
    setDescription('');
    setError(null);
    onHide();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    try {
      const collection = await create.mutateAsync({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {})
      });

      close();
      onCreated?.(collection);
    } catch (e) {
      setError(errorMessage(e, t('common.error')));
    }
  };

  return (
    <Modal
      className={styles.collectionModal}
      show={show}
      onHide={close}
      aria-labelledby="collection-modal-title"
    >
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title id="collection-modal-title">
            {t('collections.modal.title')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error ? (
            <div className={`${styles.info} ${styles.warning}`} role="alert">
              {error}
            </div>
          ) : null}
          <Form.Group
            className={styles.collectionName}
            controlId="collection-name"
          >
            <Form.Label>{t('collections.modal.name')}</Form.Label>
            <Form.Control
              required
              value={name}
              placeholder={t('collections.modal.namePlaceholder')}
              onChange={event => setName(event.target.value)}
              autoFocus
            />
          </Form.Group>
          <Form.Group
            className={styles.collectionDescription}
            controlId="collection-description"
          >
            <Form.Label>{t('collections.modal.description')}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              placeholder={t('collections.modal.descriptionPlaceholder')}
              onChange={event => setDescription(event.target.value)}
            />
          </Form.Group>
          <div className={styles.collectionButtons}>
            <Button
              className={styles.collectionCancel}
              variant="outline-primary"
              onClick={close}
            >
              {t('collections.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {t('collections.modal.create')}
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
