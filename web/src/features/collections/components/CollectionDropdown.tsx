import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { useCollections } from '../lib/api';
import type { Collection } from '../lib/types';
import { CollectionModal } from './CollectionModal';
import styles from '../collections.module.scss';

interface CollectionDropdownProps {
  onSelect: (collection: Collection) => void;
  /** Visible label; defaults to a "+" button with an accessible name. */
  label?: string;
  ariaLabel?: string;
  variant?: string;
  /** Replaces the default borderless "+" look of the toggle. */
  toggleClassName?: string;
}

export function CollectionDropdown({
  onSelect,
  label,
  ariaLabel,
  variant = '',
  toggleClassName
}: CollectionDropdownProps) {
  const t = useT();
  const { data: collections = [] } = useCollections();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Dropdown align="end">
        <Dropdown.Toggle
          variant={variant}
          className={toggleClassName ?? styles.addToCollection}
          aria-label={ariaLabel ?? t('collections.dropdown.add')}
        >
          {label ?? <Icon name="plus" />}
        </Dropdown.Toggle>
        <Dropdown.Menu className={styles.dropdownMenu}>
          {collections
            .filter(collection => collection.type === 'normal')
            .map(collection => (
              <Dropdown.Item
                key={collection.id}
                onClick={() => onSelect(collection)}
              >
                {collection.name}
              </Dropdown.Item>
            ))}
          <Dropdown.Item onClick={() => setShowModal(true)}>
            <Icon name="circlePlus" /> {t('collections.dropdown.create')}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <CollectionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onCreated={onSelect}
      />
    </>
  );
}
