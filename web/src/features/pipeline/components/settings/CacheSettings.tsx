import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Icon } from '~/components/Icon';
import { useT } from '~/i18n/useT';
import { clearCache } from '../../api/mutations';
import type { Pipeline } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { SettingsCard } from './SettingsCard';
import { SettingsTable, type SettingsColumn } from './SettingsTable';
import { distinct, useSettingsJobs, type JobRow } from './useSettingsJobs';

type Target = { kind: 'pipeline' } | { kind: 'jobs'; rows: JobRow[] };

export function CacheSettings({ pipeline }: { pipeline: Pipeline }) {
  const t = useT();
  const { rows, query } = useSettingsJobs(pipeline.id);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cleared, setCleared] = useState<Set<number>>(new Set());
  const [pipelineCleared, setPipelineCleared] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const visible = rows.filter(r => !cleared.has(r.id));
  const chosen = visible.filter(r => selected.has(r.id));
  const columns: Array<SettingsColumn<JobRow>> = [
    {
      key: 'name',
      header: t('pipeline.settings.colJob'),
      className: 'job-column',
      filter: 'text',
      filterValue: r => r.name,
      render: r => r.name
    },
    {
      key: 'stage',
      header: t('pipeline.settings.colStage'),
      className: 'stage-column',
      filter: distinct(rows.map(r => r.stage)).map(v => ({
        value: v,
        label: v
      })),
      filterValue: r => r.stage,
      render: r => r.stage
    },
    {
      key: 'clear',
      header: t('pipeline.settings.colClearCache'),
      className: 'action-column',
      render: r => (
        <div className="settings-action-cell">
          <button
            type="button"
            className="settings-icon-button primary small"
            aria-label={t('pipeline.settings.clearCacheFor', { name: r.name })}
            title={t('pipeline.settings.clearCacheFor', { name: r.name })}
            onClick={() => setTarget({ kind: 'jobs', rows: [r] })}
          >
            <Icon name="trash" />
          </button>
        </div>
      )
    }
  ];
  const jobsInTarget = target?.kind === 'jobs' ? target.rows : [];

  return (
    <>
      {message ? (
        <Alert variant="success" dismissible onClose={() => setMessage(null)}>
          {message}
        </Alert>
      ) : null}
      <SettingsCard
        id="pipeline-settings-cache-tab-contents"
        title={t('pipeline.settings.clearCacheTitleCard')}
        description={t('pipeline.settings.cacheHelp')}
        action={
          <Button
            id="clear-pipeline-cache-button"
            variant="primary"
            disabled={pipelineCleared}
            onClick={() => setTarget({ kind: 'pipeline' })}
          >
            {t('pipeline.settings.clearPipelineCache')}
          </Button>
        }
      />
      {query.isError ? (
        <Alert variant="danger">{t('common.error')}</Alert>
      ) : null}
      <div className="settings-selection-bar">
        <Button
          id="clear-jobs-cache-button"
          variant="primary"
          disabled={chosen.length === 0}
          onClick={() => setTarget({ kind: 'jobs', rows: chosen })}
        >
          {t('pipeline.settings.clearJobsCache')}
        </Button>
        {chosen.length > 0 ? (
          <span>
            {t('pipeline.settings.jobsSelected', { count: chosen.length })}
          </span>
        ) : null}
      </div>
      <SettingsTable
        id="cache-table"
        rows={visible}
        columns={columns}
        selected={selected}
        onSelect={setSelected}
        rowLabel={r => r.name}
        emptyText={t('pipeline.jobs.empty')}
      />
      {target ? (
        <ConfirmModal
          id="clear-cache-modal"
          title={
            target.kind === 'pipeline'
              ? t('pipeline.settings.clearPipelineTitle')
              : jobsInTarget.length === 1
              ? t('pipeline.settings.clearCacheTitle', {
                  name: jobsInTarget[0]?.name ?? ''
                })
              : t('pipeline.settings.clearJobsTitle', {
                  count: jobsInTarget.length
                })
          }
          confirmLabel={t('pipeline.settings.clear')}
          pendingLabel={t('pipeline.settings.clearing')}
          variant="primary"
          onClose={() => setTarget(null)}
          onConfirm={async () => {
            if (target.kind === 'pipeline') {
              await clearCache(pipeline.id, 'pipelines', pipeline.id);
              setPipelineCleared(true);
              setMessage(t('pipeline.settings.pipelineCacheCleared'));
              setTarget(null);

              return;
            }

            const results = await Promise.allSettled(
              jobsInTarget.map(r => clearCache(pipeline.id, 'jobs', r.id))
            );
            const ok = jobsInTarget.filter(
              (_, i) => results[i]?.status === 'fulfilled'
            );

            if (ok.length > 0) {
              setCleared(c => new Set([...c, ...ok.map(r => r.id)]));
              setSelected(s => {
                const next = new Set(s);

                ok.forEach(r => next.delete(r.id));

                return next;
              });
            }
            if (ok.length === jobsInTarget.length) {
              setTarget(null);

              return;
            }

            const failed = jobsInTarget.filter(
              (_, i) => results[i]?.status === 'rejected'
            );
            const first = results.find(
              (r): r is PromiseRejectedResult => r.status === 'rejected'
            );

            if (ok.length > 0) {
              setTarget({ kind: 'jobs', rows: failed });
            }
            throw new Error(
              `${(first?.reason as Error)?.message ?? ''}\n${t(
                'pipeline.settings.retryFailed'
              )}`.trim()
            );
          }}
        >
          <p>
            {target.kind === 'pipeline'
              ? t('pipeline.settings.clearPipelineBody')
              : jobsInTarget.length === 1
              ? t('pipeline.settings.clearJobBody', {
                  name: jobsInTarget[0]?.name ?? ''
                })
              : t('pipeline.settings.clearJobsBody')}
          </p>
          {jobsInTarget.length > 1 ? (
            <div className="settings-job-list">
              {jobsInTarget
                .map(r => r.name)
                .sort()
                .join(', ')}
            </div>
          ) : null}
        </ConfirmModal>
      ) : null}
    </>
  );
}
