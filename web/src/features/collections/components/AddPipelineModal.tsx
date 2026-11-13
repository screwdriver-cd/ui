import { SvgIcon } from '~/components/SvgIcon';
import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { Link } from '@tanstack/react-router';
import { useT } from '~/i18n/useT';
import { SearchInput } from '~/features/search/components/SearchInput';
import { searchPipelines } from '../lib/api';
import { pipelineEventsPath } from '../lib/links';
import type { PipelineSummary } from '../lib/types';
import styles from '../collections.module.scss';

interface AddPipelineModalProps {
  show: boolean;
  existingIds: number[];
  /** Called with the chosen pipeline ids when the modal is closed. */
  onClose: (addedIds: number[]) => void;
}

export function AddPipelineModal({
  show,
  existingIds,
  onClose
}: AddPipelineModalProps) {
  const t = useT();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PipelineSummary[]>([]);
  const [added, setAdded] = useState<number[]>([]);
  const [error, setError] = useState(false);

  const search = async (query: string) => {
    try {
      setError(false);
      setResults(await searchPipelines(query.trim()));
    } catch {
      setError(true);
    }
  };

  const close = () => {
    const ids = added;

    setTerm('');
    setResults([]);
    setAdded([]);
    onClose(ids);
  };

  const visible = results.filter(
    pipeline =>
      !existingIds.includes(pipeline.id) && !added.includes(pipeline.id)
  );

  return (
    <Modal
      className={styles.modal}
      show={show}
      onHide={close}
      aria-labelledby="add-pipeline-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="add-pipeline-title">
          {t('collections.add.title')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <SearchInput
          className={styles.searchBar}
          value={term}
          onChange={setTerm}
          onSubmit={search}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          buttonLabel={t('search.submit')}
          buttonContent={<SvgIcon name="search" size={16} />}
          autoFocus
        />
        {error ? <p className="text-danger mt-2">{t('common.error')}</p> : null}
        {added.length ? (
          <p className="mt-2 mb-0">
            {t('collections.add.selected', { count: added.length })}
          </p>
        ) : null}
        <ul className={styles.searched}>
          {visible.map(pipeline => (
            <li key={pipeline.id}>
              <span className={styles.searchedName}>
                <Link to={pipelineEventsPath(pipeline.id)}>
                  {pipeline.scmRepo.name}
                </Link>
              </span>
              <span className={`${styles.searchedBranch} text-truncate`}>
                {pipeline.scmRepo.branch}
              </span>
              <button
                type="button"
                className={styles.addPipeline}
                aria-label={t('collections.add.add', {
                  name: pipeline.scmRepo.name
                })}
                onClick={() => setAdded(ids => [...ids, pipeline.id])}
              >
                <SvgIcon name="add" />
              </button>
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>{t('collections.add.done')}</Button>
      </Modal.Footer>
    </Modal>
  );
}
