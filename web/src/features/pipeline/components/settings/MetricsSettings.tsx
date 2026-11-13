import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { updatePipeline } from '../../api/mutations';
import { keys } from '../../api/queries';
import type { Pipeline } from '../../types';
import { getJobIdsForPayload } from '../../utils/pipeline';
import { ConfirmModal } from '../ConfirmModal';
import { SettingsCard } from './SettingsCard';
import { SettingsTable, Switch, type SettingsColumn } from './SettingsTable';
import { distinct, useSettingsJobs, type JobRow } from './useSettingsJobs';

type Mode = 'include' | 'exclude' | null;

export function MetricsSettings({ pipeline }: { pipeline: Pipeline }) {
  const t = useT();
  const queryClient = useQueryClient();
  const { rows, query } = useSettingsJobs(pipeline.id);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{
    rows: JobRow[];
    include: boolean;
  } | null>(null);
  // No stored list means every job counts, as in Ember.
  const stored = pipeline.settings?.metricsDowntimeJobs;
  const included = useMemo(
    () => new Set(stored?.length ? stored : rows.map(r => r.id)),
    [stored, rows]
  );
  const visible = mode
    ? rows.filter(r => included.has(r.id) === (mode === 'exclude'))
    : rows;
  const chosen = visible.filter(r => selected.has(r.id));
  const nextIds = modal
    ? getJobIdsForPayload(
        {
          ...pipeline,
          settings: { ...pipeline.settings, metricsDowntimeJobs: [...included] }
        },
        modal.rows,
        modal.include
      )
    : [];
  // The API stores no list as "every job", so excluding the last included job would bring
  // back every excluded one instead.
  const keepOne = !!modal && !modal.include && nextIds.length === 0;
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
      key: 'included',
      header: t('pipeline.settings.colIncluded'),
      className: 'included-column',
      ...(mode
        ? {}
        : {
            filter: [
              { value: 'EXCLUDED', label: 'EXCLUDED' },
              { value: 'INCLUDED', label: 'INCLUDED' }
            ],
            filterValue: (r: JobRow) =>
              included.has(r.id) ? 'INCLUDED' : 'EXCLUDED'
          }),
      render: r => (
        <div className="settings-switch-cell">
          <Switch
            id={`toggle-downtime-${r.id}`}
            tone="success"
            label={t('pipeline.settings.toggleIncluded', { name: r.name })}
            checked={included.has(r.id)}
            onChange={checked => setModal({ rows: [r], include: checked })}
          />
        </div>
      )
    }
  ];
  const start = (next: 'include' | 'exclude') => {
    setMode(next);
    setSelected(new Set());
  };
  const cancel = () => {
    setMode(null);
    setSelected(new Set());
  };

  return (
    <>
      <SettingsCard
        id="pipeline-settings-metrics-tab-contents"
        title={t('pipeline.settings.downtime')}
        description={t('pipeline.settings.downtimeHelp')}
      >
        <div className="settings-card-buttons">
          <Button
            id="include-jobs-button"
            variant="outline-primary"
            disabled={mode === 'include'}
            onClick={() => start('include')}
          >
            {t('pipeline.settings.includeMultiple')}
          </Button>
          <Button
            id="exclude-jobs-button"
            variant="outline-primary"
            disabled={mode === 'exclude'}
            onClick={() => start('exclude')}
          >
            {t('pipeline.settings.excludeMultiple')}
          </Button>
          {mode ? (
            <Button
              id="cancel-toggle-jobs-button"
              variant="outline-danger"
              className="ms-auto"
              onClick={cancel}
            >
              {t('pipeline.common.cancel')}
            </Button>
          ) : null}
        </div>
      </SettingsCard>
      {query.isError ? (
        <Alert variant="danger">{t('common.error')}</Alert>
      ) : null}
      {mode ? (
        <div className="settings-selection-bar">
          <Button
            id="toggle-multiple-jobs-button"
            variant="primary"
            disabled={chosen.length === 0}
            onClick={() =>
              setModal({ rows: chosen, include: mode === 'include' })
            }
          >
            {mode === 'include'
              ? t('pipeline.settings.includeSelected')
              : t('pipeline.settings.excludeSelected')}
          </Button>
          <span>
            {t('pipeline.settings.jobsSelected', { count: chosen.length })}
          </span>
        </div>
      ) : null}
      <SettingsTable
        key={mode ?? 'all'}
        id="settings-metrics-table"
        rows={visible}
        columns={columns}
        selected={mode ? selected : undefined}
        onSelect={mode ? setSelected : undefined}
        rowLabel={r => r.name}
        emptyText={t('pipeline.jobs.empty')}
      />
      {modal ? (
        <ConfirmModal
          id="toggle-multiple-downtime-jobs-modal"
          title={
            modal.rows.length === 1
              ? t('pipeline.settings.downtimeTitleOne', {
                  include: modal.include ? 'yes' : 'no',
                  name: modal.rows[0]?.name ?? ''
                })
              : t('pipeline.settings.downtimeTitleMany', {
                  include: modal.include ? 'yes' : 'no',
                  count: modal.rows.length
                })
          }
          confirmLabel={
            modal.include
              ? t('pipeline.settings.include')
              : t('pipeline.settings.exclude')
          }
          pendingLabel={
            modal.include
              ? t('pipeline.settings.including')
              : t('pipeline.settings.excluding')
          }
          onClose={() => setModal(null)}
          disabled={keepOne}
          onConfirm={async () => {
            await updatePipeline(pipeline.id, {
              settings: { metricsDowntimeJobs: nextIds }
            });
            await queryClient.invalidateQueries({
              queryKey: keys.pipeline(pipeline.id)
            });
            setSelected(new Set());
            setModal(null);
          }}
        >
          <p id="modal-downtime-jobs-message">
            {t(
              modal.rows.length === 1
                ? 'pipeline.settings.downtimeBodyOne'
                : 'pipeline.settings.downtimeBodyMany',
              { include: modal.include ? 'yes' : 'no' }
            )}
          </p>
          {keepOne ? (
            <Alert variant="warning" id="downtime-keep-one">
              {t('pipeline.settings.downtimeKeepOne')}
            </Alert>
          ) : null}
          {modal.rows.length > 1 ? (
            <div className="settings-job-list">
              {modal.rows
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
