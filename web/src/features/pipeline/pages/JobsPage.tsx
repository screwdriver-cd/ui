import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { fetchJobs, keys, useJobs } from '../api/queries';
import { usePipeline } from '../components/PipelineContext';
import { PipelineJobsTable, buildJobRows } from '../components/PipelineJobsTable';
import { useJobActions } from '../components/useJobActions';
import {
  isVirtualJob,
  sortJobsTopologically
} from '../utils/job';

export function JobsPage() {
  const t = useT();
  const { pipeline } = usePipeline();
  const jobs = useJobs(pipeline.id, 'pipeline');
  const actions = useJobActions({ pipeline });
  const [showArchived, setShowArchived] = useState(false);
  // The jobs endpoint omits archived jobs unless asked for them.
  const archivedJobs = useQuery({
    queryKey: [...keys.jobs(pipeline.id, 'pipeline'), 'archived'],
    queryFn: () => fetchJobs(pipeline.id, 'pipeline', true),
    enabled: showArchived,
    staleTime: 30_000
  });
  const known = new Set((jobs.data ?? []).map(j => j.id));
  const list = sortJobsTopologically(
    [
      ...(jobs.data ?? []),
      ...(showArchived
        ? (archivedJobs.data ?? []).filter(j => !known.has(j.id))
        : [])
    ].filter(j => !isVirtualJob(j) && (showArchived || !j.archived)),
    pipeline.workflowGraph
  );

  return (
    <div className="pipeline-jobs">
      {jobs.isError ? <Alert variant="danger">{t('common.error')}</Alert> : null}
      <PipelineJobsTable
        pipeline={pipeline}
        rows={buildJobRows(list)}
        onStart={actions.onStart}
        onStop={actions.onStop}
        onToggleState={actions.onToggleState}
        archivedToggle={
          <Form.Check
            type="switch"
            id="show-archived-jobs"
            label={t('pipeline.jobs.showArchived')}
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
          />
        }
      />
      {actions.modals}
    </div>
  );
}
