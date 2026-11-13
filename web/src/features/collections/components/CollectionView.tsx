import { SvgIcon } from '~/components/SvgIcon';
import { Icon } from '~/components/Icon';
import { assetUrl } from '~/config/config';
import { useMemo, useState, type FormEvent } from 'react';
import { Button, CloseButton, Form, Modal } from 'react-bootstrap';
import { Link } from '@tanstack/react-router';
import { useQueries } from '@tanstack/react-query';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { errorMessage, metricsQuery, useCollectionMutations } from '../lib/api';
import { formatMetrics } from '../lib/metrics';
import { sortPipelines, type SortKey, type SortOrder } from '../lib/sort';
import type { Collection } from '../lib/types';
import { AddPipelineModal } from './AddPipelineModal';
import { CollectionDropdown } from './CollectionDropdown';
import { PipelineCard, PipelineRow } from './PipelineItem';
import styles from '../collections.module.scss';

const VIEW_KEY = 'activeViewOptionValue';
type ViewMode = 'Card' | 'List';

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'List' ? 'List' : 'Card';
  } catch {
    return 'Card';
  }
}

const COLUMN_CLASS: Record<SortKey, string> = {
  pipelineName: styles.colName ?? '',
  branch: styles.colBranch ?? '',
  lastRun: styles.colLastRun ?? '',
  duration: styles.colDuration ?? '',
  lastRunStatus: styles.colStatus ?? '',
  history: styles.colHistory ?? ''
};

const COLUMNS: Array<{ key: SortKey; label: string; tip?: string }> = [
  { key: 'pipelineName', label: 'collections.column.name' },
  { key: 'branch', label: 'collections.column.branch' },
  { key: 'lastRun', label: 'collections.column.lastRun' },
  { key: 'duration', label: 'collections.column.duration' },
  { key: 'lastRunStatus', label: 'collections.column.status' },
  {
    key: 'history',
    label: 'collections.column.history',
    tip: 'collections.column.historyTip'
  }
];

export function CollectionView({ collection }: { collection: Collection }) {
  const t = useT();
  const isAuthenticated = useSession(s => s.isAuthenticated);
  const { update, addPipelines, removePipelines } = useCollectionMutations();
  const pipelines = useMemo(
    () => collection.pipelines ?? [],
    [collection.pipelines]
  );
  const isDefault = collection.type === 'default';

  const [view, setViewState] = useState<ViewMode>(readView);
  const [sortBy, setSortBy] = useState<SortKey>('pipelineName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [organizing, setOrganizing] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const setView = (next: ViewMode) => {
    setViewState(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // not persisted
    }
    resetSelection();
  };

  const resetSelection = () => {
    setOrganizing(false);
    setSelected([]);
  };

  // Sorting by anything but name needs every pipeline's latest events.
  const needAll = sortBy !== 'pipelineName';
  const metrics = useQueries({
    queries: pipelines.map(pipeline => ({
      ...metricsQuery(pipeline.id),
      enabled: needAll
    }))
  });

  const sorted = useMemo(
    () =>
      sortPipelines(
        pipelines.map((pipeline, index) => {
          const data = metrics[index]?.data;

          return {
            pipeline,
            last: data ? formatMetrics(data).lastEventInfo : undefined,
            failedBuildCount: data
              ? data.filter(m => ['FAILURE', 'ABORTED'].includes(m.status))
                  .length
              : 0
          };
        }),
        sortBy,
        sortOrder
      ),
    [pipelines, metrics, sortBy, sortOrder]
  );

  const hasAlias = pipelines.some(pipeline => pipeline.settings?.aliasName);
  const toggle = (id: number) =>
    setSelected(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );

  const remove = async (ids: number[], label?: string) => {
    try {
      await removePipelines.mutateAsync({
        id: collection.id,
        pipelineIds: ids
      });
      setError(null);
      setNotice(
        label
          ? t('collections.removed', {
              name: label,
              collection: collection.name
            })
          : t('collections.removedMany')
      );
      resetSelection();
    } catch (e) {
      setError(errorMessage(e, t('common.error')));
    }
  };

  const copyTo = async (target: Collection) => {
    try {
      await addPipelines.mutateAsync({ id: target.id, pipelineIds: selected });
      setError(null);
      resetSelection();
    } catch {
      setError(t('collections.copyError', { name: target.name }));
    }
  };

  const openSettings = () => {
    setDraftName(collection.name);
    setDraftDescription(collection.description ?? '');
    setShowSettings(true);
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftName.trim()) {
      return;
    }
    try {
      await update.mutateAsync({
        id: collection.id,
        name: draftName.trim(),
        description: draftDescription
      });
      setShowSettings(false);
    } catch (e) {
      setError(errorMessage(e, t('common.error')));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice(t('collections.linkCopied'));
    } catch {
      setError(t('collections.linkCopyFailed'));
    }
  };

  const sortHeader = (key: SortKey) =>
    sortBy === key
      ? sortOrder === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none';
  const clickSort = (key: SortKey) => {
    setSortOrder(sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortBy(key);
  };

  const rowProps = (pipeline: (typeof pipelines)[number]) => ({
    pipeline,
    canRemove: !isDefault && isAuthenticated,
    organizing: organizing && isAuthenticated,
    eager: needAll,
    selected: selected.includes(pipeline.id),
    collectionName: collection.name,
    hasAlias,
    onToggle: toggle,
    onRemove: (p: (typeof pipelines)[number]) => remove([p.id], p.scmRepo.name)
  });

  return (
    <section className={styles.view} aria-label={collection.name}>
      <div className={styles.viewHeader}>
        <div>
          <h2>
            {collection.name}
            {collection.type === 'normal' ? (
              <>
                <button
                  type="button"
                  className={styles.viewOp}
                  onClick={() => setShowAdd(true)}
                  title={t('collections.addPipelines')}
                  aria-label={t('collections.addPipelines')}
                >
                  <SvgIcon name="add" />
                </button>
                <button
                  type="button"
                  className={styles.viewOp}
                  onClick={openSettings}
                  title={t('collections.settings')}
                  aria-label={t('collections.settings')}
                >
                  <SvgIcon name="setting" />
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={styles.viewOp}
              onClick={copyLink}
              title={t('collections.copyLink')}
              aria-label={t('collections.copyLink')}
            >
              <SvgIcon name="link" />
            </button>
          </h2>
          <p
            className={
              collection.description ? styles.description : styles.placeholder
            }
          >
            {collection.description || t('collections.noDescription')}
          </p>
        </div>
        <div className={styles.headerControls}>
          {isAuthenticated && pipelines.length > 0 ? (
            organizing ? (
              <>
                {selected.length > 0 ? (
                  <>
                    <span>
                      {t('collections.selected', { count: selected.length })}
                    </span>
                    {!isDefault ? (
                      <button
                        type="button"
                        className={`${styles.headerButton} ${styles.operationButton}`}
                        onClick={() => remove(selected)}
                      >
                        {t('collections.removeSelected')}
                      </button>
                    ) : null}
                    <CollectionDropdown
                      label={t('collections.copyTo')}
                      ariaLabel={t('collections.copyTo')}
                      onSelect={copyTo}
                      toggleClassName={`${styles.headerButton} ${styles.operationButton}`}
                    />
                  </>
                ) : null}
                <button
                  type="button"
                  className={styles.headerButton}
                  onClick={resetSelection}
                >
                  {t('collections.cancel')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.headerButton}
                onClick={() => setOrganizing(true)}
              >
                {t('collections.organize')}
              </button>
            )
          ) : null}
          {pipelines.length > 0 ? (
            <div
              className={styles.viewSwitch}
              role="group"
              aria-label={t('collections.view.label')}
            >
              {(['Card', 'List'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={view === mode ? 'active' : undefined}
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                >
                  <SvgIcon name={mode === 'Card' ? 'apps' : 'list'} />
                  <span className="visually-hidden">
                    {t(`collections.view.${mode}`)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.alertArea}>
        {error ? (
          <div className={`${styles.info} ${styles.warning}`} role="alert">
            <span>{error}</span>
            <CloseButton onClick={() => setError(null)} />
          </div>
        ) : null}
        {notice ? (
          <div className={`${styles.info} ${styles.success}`} role="alert">
            <span>{notice}</span>
            <CloseButton onClick={() => setNotice(null)} />
          </div>
        ) : null}
      </div>
      <ScrollRegion>
        {pipelines.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.guide}>
              <img
                src={assetUrl('/assets/images/jobs-example.png')}
                alt={t('collections.empty.imageAlt')}
              />
              <p>{t('collections.empty.text')}</p>
              <div className={styles.guideButtons}>
                <Link to="/create" className={styles.guideCreate}>
                  {t('collections.empty.create')}
                </Link>
                <a
                  className={styles.guideDocs}
                  href="https://docs.screwdriver.cd/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('collections.empty.docs')}
                </a>
              </div>
            </div>
          </div>
        ) : view === 'List' ? (
          <div className={styles.listView}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colChoose} />
                  {COLUMNS.map(({ key, label, tip }) => (
                    <th
                      key={key}
                      className={COLUMN_CLASS[key]}
                      aria-sort={sortHeader(key)}
                      title={tip ? t(tip) : undefined}
                    >
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => clickSort(key)}
                      >
                        {key === 'pipelineName' && hasAlias
                          ? `${t('collections.column.alias')} / `
                          : ''}
                        {t(label)}{' '}
                        <Icon
                          name={
                            sortBy === key
                              ? sortOrder === 'asc'
                                ? 'sortUp'
                                : 'sortDown'
                              : 'sort'
                          }
                        />
                      </button>
                    </th>
                  ))}
                  <th className={styles.colRemove} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ pipeline }) => (
                  <PipelineRow key={pipeline.id} {...rowProps(pipeline)} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.cards}>
            {sorted.map(({ pipeline }) => (
              <PipelineCard key={pipeline.id} {...rowProps(pipeline)} />
            ))}
          </div>
        )}
      </ScrollRegion>

      <AddPipelineModal
        show={showAdd}
        existingIds={collection.pipelineIds ?? pipelines.map(p => p.id)}
        onClose={async ids => {
          setShowAdd(false);
          if (ids.length) {
            try {
              await addPipelines.mutateAsync({
                id: collection.id,
                pipelineIds: ids
              });
            } catch {
              setError(t('collections.copyError', { name: collection.name }));
            }
          }
        }}
      />
      <Modal
        className={styles.modal}
        show={showSettings}
        onHide={() => setShowSettings(false)}
      >
        <Form onSubmit={saveSettings}>
          <Modal.Header closeButton>
            <Modal.Title>{t('collections.settings')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="settings-name">
              <Form.Label>{t('collections.modal.name')}</Form.Label>
              <Form.Control
                required
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="settings-description">
              <Form.Label>{t('collections.modal.description')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={draftDescription}
                onChange={e => setDraftDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSettings(false)}>
              {t('collections.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                !draftName.trim() ||
                (draftName === collection.name &&
                  draftDescription === (collection.description ?? '')) ||
                update.isPending
              }
            >
              {t('collections.save')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
