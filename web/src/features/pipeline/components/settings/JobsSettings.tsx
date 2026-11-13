import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { setJobState } from '../../api/mutations';
import { keys } from '../../api/queries';
import { useFormatDateTime, useFormatRelative } from '../../hooks/useFormat';
import type { Pipeline } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { SettingsCard } from './SettingsCard';
import { SettingsTable, Switch, type SettingsColumn } from './SettingsTable';
import { distinct, useSettingsJobs, type JobRow } from './useSettingsJobs';

type Mode = 'enable' | 'disable' | null;

function ToggleJobsModal({
  pipelineId,
  rows,
  action,
  onClose
}: {
  pipelineId: number;
  rows: JobRow[];
  action: 'enable' | 'disable';
  onClose: (updated: boolean) => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const [remaining, setRemaining] = useState(rows);
  const [reason, setReason] = useState('');
  const touched = useRef(false);
  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: keys.anyJobs(pipelineId) });

  return (
    <ConfirmModal
      id="toggle-job-modal"
      title={t('pipeline.settings.toggleJobsTitle', {
        action,
        count: remaining.length
      })}
      confirmLabel={
        action === 'enable'
          ? t('pipeline.jobs.enable')
          : t('pipeline.jobs.disable')
      }
      pendingLabel={
        action === 'enable'
          ? t('pipeline.settings.enabling')
          : t('pipeline.settings.disabling')
      }
      onClose={() => onClose(touched.current)}
      onConfirm={async () => {
        const state = action === 'enable' ? 'ENABLED' : 'DISABLED';
        const results = await Promise.allSettled(
          remaining.map(r =>
            setJobState(r.job.prParentJobId || r.job.id, state, reason)
          )
        );
        const failed = remaining.filter(
          (_, i) => results[i]?.status === 'rejected'
        );

        if (failed.length < remaining.length) {
          touched.current = true;
          await refetch();
        }
        if (failed.length === 0) {
          onClose(true);

          return;
        }

        const first = results.find(
          (r): r is PromiseRejectedResult => r.status === 'rejected'
        );

        if (failed.length < remaining.length) {
          setRemaining(failed);
        }
        throw new Error(
          `${(first?.reason as Error)?.message ?? ''}\n${t(
            'pipeline.settings.retryFailed'
          )}`.trim()
        );
      }}
    >
      <div className="settings-job-list">
        {remaining
          .map(r => r.name)
          .sort()
          .join(', ')}
      </div>
      <Form.Group>
        <Form.Label htmlFor="toggle-job-reason">
          {t('pipeline.jobs.reason')}
        </Form.Label>
        <Form.Control
          id="toggle-job-reason"
          value={reason}
          placeholder={t('pipeline.settings.jobReasonPlaceholder')}
          onChange={e => setReason(e.target.value)}
        />
      </Form.Group>
    </ConfirmModal>
  );
}

export function JobsSettings({ pipeline }: { pipeline: Pipeline }) {
  const t = useT();
  const relative = useFormatRelative();
  const formatDateTime = useFormatDateTime();
  const me = useSession(s => s.data?.username);
  const { rows, query } = useSettingsJobs(pipeline.id);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{
    rows: JobRow[];
    action: 'enable' | 'disable';
  } | null>(null);
  const visible = useMemo(
    () =>
      mode
        ? rows.filter(
            r => r.job.state === (mode === 'enable' ? 'DISABLED' : 'ENABLED')
          )
        : rows,
    [rows, mode]
  );
  const users = distinct([
    ...(me ? [me] : []),
    ...rows.map(r => r.job.stateChanger ?? '')
  ]);
  const stages = distinct(rows.map(r => r.stage));
  const options = (values: string[]) =>
    values.map(v => ({ value: v, label: v }));
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
      filter: options(stages),
      filterValue: r => r.stage,
      render: r => r.stage
    },
    {
      key: 'user',
      header: t('pipeline.settings.colUser'),
      className: 'user-column',
      filter: options(users),
      filterValue: r => r.job.stateChanger ?? '',
      render: r => r.job.stateChanger ?? ''
    },
    {
      key: 'message',
      header: t('pipeline.settings.colMessage'),
      className: 'message-column',
      filter: 'text',
      filterValue: r => r.job.stateChangeMessage ?? '',
      render: r => r.job.stateChangeMessage ?? ''
    },
    {
      key: 'date',
      header: t('pipeline.settings.colDate'),
      className: 'date-column',
      render: r =>
        r.job.stateChangeTime ? (
          <span title={formatDateTime(r.job.stateChangeTime)}>
            {relative(r.job.stateChangeTime)}
          </span>
        ) : null
    },
    {
      key: 'enabled',
      header: t('pipeline.settings.colEnabled'),
      className: 'enabled-column',
      ...(mode
        ? {}
        : {
            filter: [
              { value: 'ENABLED', label: 'ENABLED' },
              { value: 'DISABLED', label: 'DISABLED' }
            ],
            filterValue: (r: JobRow) => r.job.state
          }),
      render: r => (
        <div className="settings-switch-cell">
          <Switch
            id={`toggle-job-${r.id}`}
            label={t('pipeline.settings.toggleJob', { name: r.name })}
            checked={r.job.state === 'ENABLED'}
            onChange={checked =>
              setModal({ rows: [r], action: checked ? 'enable' : 'disable' })
            }
          />
        </div>
      )
    }
  ];
  const chosen = visible.filter(r => selected.has(r.id));
  const start = (next: 'enable' | 'disable') => {
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
        id="pipeline-settings-jobs-tab-contents"
        title={t('pipeline.settings.toggleJobs')}
        description={t('pipeline.settings.toggleJobsHelp')}
      >
        <div className="settings-card-buttons">
          <Button
            id="enable-jobs-button"
            variant="outline-primary"
            disabled={mode === 'enable'}
            onClick={() => start('enable')}
          >
            {t('pipeline.settings.enableMultiple')}
          </Button>
          <Button
            id="disable-jobs-button"
            variant="outline-primary"
            disabled={mode === 'disable'}
            onClick={() => start('disable')}
          >
            {t('pipeline.settings.disableMultiple')}
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
            onClick={() => setModal({ rows: chosen, action: mode })}
          >
            {mode === 'enable'
              ? t('pipeline.settings.enableSelected')
              : t('pipeline.settings.disableSelected')}
          </Button>
          <span>
            {t('pipeline.settings.jobsSelected', { count: chosen.length })}
          </span>
        </div>
      ) : null}
      <SettingsTable
        key={mode ?? 'all'}
        id="settings-jobs-table"
        rows={visible}
        columns={columns}
        selected={mode ? selected : undefined}
        onSelect={mode ? setSelected : undefined}
        rowLabel={r => r.name}
        emptyText={t('pipeline.jobs.empty')}
      />
      {modal ? (
        <ToggleJobsModal
          pipelineId={pipeline.id}
          rows={modal.rows}
          action={modal.action}
          onClose={updated => {
            setModal(null);
            if (updated) {
              setSelected(new Set());
            }
          }}
        />
      ) : null}
    </>
  );
}
