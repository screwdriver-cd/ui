import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { Link } from '@tanstack/react-router';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { collectionPath } from '../lib/links';
import {
  readLastViewed,
  useCollectionMutations,
  useCollections,
  writeLastViewed
} from '../lib/api';
import type { Collection } from '../lib/types';
import { CollectionModal } from './CollectionModal';
import styles from '../collections.module.scss';

interface CollectionsFlyoutProps {
  selectedId?: number | string;
  onDeleted?: () => void;
}

export function CollectionsFlyout({
  selectedId,
  onDeleted
}: CollectionsFlyoutProps) {
  const t = useT();
  const isAuthenticated = useSession(s => s.isAuthenticated);
  const { data: collections = [] } = useCollections();
  const { remove } = useCollectionMutations();
  const [toDelete, setToDelete] = useState<Collection | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // The default collection always comes first.
  const ordered = [...collections].sort(
    (a, b) => Number(b.type === 'default') - Number(a.type === 'default')
  );

  const confirmDelete = async () => {
    if (!toDelete) {
      return;
    }
    if (String(toDelete.id) === readLastViewed()) {
      writeLastViewed(null);
    }
    await remove.mutateAsync(toDelete.id);
    setToDelete(null);
    onDeleted?.();
  };

  return (
    <nav className={styles.flyout} aria-label={t('collections.flyout.title')}>
      <div className={styles.flyoutHeader}>
        <h2>{t('collections.flyout.title')}</h2>
        {isAuthenticated ? (
          <button
            type="button"
            className={styles.flyoutCreate}
            onClick={() => setShowCreate(true)}
          >
            {t('collections.flyout.create')}
          </button>
        ) : null}
      </div>
      <ScrollRegion>
        {ordered.length === 0 ? (
          <p className={styles.flyoutNone}>{t('collections.flyout.none')}</p>
        ) : null}
        {ordered.map(collection => (
          <div
            key={collection.id}
            className={`${styles.flyoutItem} ${
              String(collection.id) === String(selectedId) ? styles.active : ''
            }`}
          >
            <Link to={collectionPath(collection.id)} title={collection.name}>
              {collection.name}
            </Link>
            {collection.type === 'normal' ? (
              <button
                type="button"
                className={styles.flyoutDelete}
                aria-label={t('collections.flyout.delete', {
                  name: collection.name
                })}
                onClick={() => setToDelete(collection)}
              >
                <Icon name="trash" />
              </button>
            ) : null}
          </div>
        ))}
      </ScrollRegion>
      <Modal
        className={styles.modal}
        show={toDelete !== null}
        onHide={() => setToDelete(null)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('collections.flyout.confirmTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('collections.flyout.confirmBody', { name: toDelete?.name ?? '' })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            {t('collections.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={confirmDelete}
            disabled={remove.isPending}
          >
            {t('collections.flyout.confirm')}
          </Button>
        </Modal.Footer>
      </Modal>
      <CollectionModal show={showCreate} onHide={() => setShowCreate(false)} />
    </nav>
  );
}
