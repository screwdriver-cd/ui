import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';
import { api } from '~/api/client';
import { Icon } from '~/components/Icon';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '../hooks/useStartGuard';
import { fetchJobs, keys, useJobs } from '../api/queries';
import { useEventBuilds } from '../hooks/useEventBuilds';
import type { Job, Pipeline, SdEvent } from '../types';
import { isSkipped } from '../utils/event';
import { canRestrictPr, isDisabled, isInactive } from '../utils/pipeline';
import { buildRows, jobsFromGraph } from './JobsTable';
import { PipelineJobsTable, buildJobRows } from './PipelineJobsTable';
import { useJobActions } from './useJobActions';
import { StartEventModal } from './event/StartEventModal';
import { WorkflowGraphView } from './WorkflowGraphView';

interface Props {
  pipeline: Pipeline;
  event: SdEvent;
  mode: 'events' | 'pulls';
  allowEventAction?: boolean;
}

export function WorkflowView({
  pipeline,
  event,
  mode,
  allowEventAction = true
}: Props) {
  const t = useT();
  const navigate = useNavigate();
  const [view, setView] = useState<'graph' | 'table'>('graph');
  // The event the restart dialog was opened on. This view stays mounted when Back/Forward selects
  // another event, and the dialog must not restart that one with the parameters typed for this.
  const [restart, setRestart] = useState<SdEvent | null>(null);
  const canStart = useStartGuard(pipeline);
  const jobs = useJobs(pipeline.id, mode === 'pulls' ? 'pr' : 'pipeline');
  const builds = useEventBuilds(event);
  const full = useQuery({
    queryKey: ['event', event.id],
    queryFn: () => api.get<SdEvent>(`/events/${event.id}`),
    initialData: event,
    staleTime: 60_000
  });
  const graph =
    full.data.workflowGraph ?? event.workflowGraph ?? pipeline.workflowGraph;
  // A PR graph needs the pipeline jobs too (a PR job's state is its parent's) and this PR's jobs
  // tagged with their PR number, as Ember's pr-jobs service builds them.
  const pipelineJobs = useJobs(pipeline.id, 'pipeline', mode === 'pulls');
  const parentOf = (job: Job): Job =>
    (job.prParentJobId &&
      pipelineJobs.data?.find(j => j.id === job.prParentJobId)) ||
    job;
  const openPrJobs = useMemo(
    () =>
      mode === 'pulls'
        ? jobs.data?.filter(
            j => j.name.startsWith(`PR-${event.prNum}:`) && !j.archived
          )
        : undefined,
    [mode, jobs.data, event.prNum]
  );
  // Closing a PR archives its jobs, and the jobs list leaves archived ones out, so an event of a
  // closed PR reads them from the archived list instead.
  const closedPr = !!openPrJobs && openPrJobs.length === 0;
  // A later commit that drops a job archives it too: an older event that built it reads it there.
  const ranRemovedJob =
    !!openPrJobs &&
    !!builds.data?.some(b => !openPrJobs.some(j => j.id === b.jobId));
  const archivedJobs = useQuery({
    queryKey: [...keys.jobs(pipeline.id, 'pr'), 'archived'],
    queryFn: () => fetchJobs(pipeline.id, 'pr', true),
    staleTime: 30_000,
    enabled: closedPr || ranRemovedJob
  });
  const prJobs = useMemo(() => {
    const archived = archivedJobs.data?.filter(j =>
      j.name.startsWith(`PR-${event.prNum}:`)
    );

    if (closedPr) {
      return archived;
    }

    return (
      openPrJobs && [
        ...openPrJobs,
        ...(archived ?? []).filter(
          j =>
            !openPrJobs.some(o => o.id === j.id) &&
            builds.data?.some(b => b.jobId === j.id)
        )
      ]
    );
  }, [closedPr, archivedJobs.data, openPrJobs, builds.data, event.prNum]);
  const eventJobs =
    mode === 'pulls'
      ? (prJobs ?? []).map(j => ({ ...j, state: parentOf(j).state }))
      : jobsFromGraph(graph, jobs.data);
  const graphJobs = useMemo(
    () =>
      mode === 'pulls'
        ? prJobs &&
          pipelineJobs.data && [
            ...pipelineJobs.data,
            ...prJobs.map(j => ({ ...j, group: event.prNum }))
          ]
        : jobs.data,
    [mode, jobs.data, prJobs, pipelineJobs.data, event.prNum]
  );
  const rows = buildRows(
    eventJobs,
    builds.data,
    graph,
    mode === 'pulls' ? event.prNum : undefined
  );
  // Queries do not retry: without this the jobs table would say "no jobs" until a remount.
  const jobQueries = [
    jobs,
    ...(mode === 'pulls' ? [pipelineJobs, archivedJobs] : [])
  ];
  const jobsFailed = jobQueries.some(q => q.isError);
  const restriction = canRestrictPr(pipeline);
  const prNum = mode === 'pulls' ? event.prNum : undefined;
  const actions = useJobActions({
    pipeline,
    event: full.data,
    isPr: mode === 'pulls'
  });

  return (
    <section
      className="workflow-view"
      aria-label={t('pipeline.workflow.label')}
    >
      <header className="workflow-header">
        <ButtonGroup aria-label={t('pipeline.workflow.toggle')}>
          <Button
            id="show-workflow-graph-button"
            variant="outline-primary"
            aria-pressed={view === 'graph'}
            aria-label={t('pipeline.workflow.graph')}
            title={t('pipeline.workflow.graphAria')}
            disabled={view === 'graph'}
            onClick={() => setView('graph')}
          >
            <Icon name="codeBranch" rotation={90} />
          </Button>
          <Button
            id="show-workflow-table-button"
            variant="outline-primary"
            aria-pressed={view === 'table'}
            aria-label={t('pipeline.workflow.table')}
            title={t('pipeline.workflow.tableAria')}
            disabled={view === 'table'}
            onClick={() => setView('table')}
          >
            <Icon name="tableList" />
          </Button>
        </ButtonGroup>
        {isSkipped(event, builds.data) ? (
          <span className="badge bg-secondary">
            {t('pipeline.workflow.skipped')}
          </span>
        ) : null}
        {allowEventAction ? (
          <Button
            variant="outline-primary"
            id="restart-event-button"
            className="ms-auto"
            disabled={isInactive(pipeline) || isDisabled(pipeline)}
            title={
              mode === 'pulls'
                ? t('pipeline.workflow.restartPr')
                : t('pipeline.workflow.restart')
            }
            aria-label={
              mode === 'pulls'
                ? t('pipeline.workflow.restartPr')
                : t('pipeline.workflow.restart')
            }
            onClick={() => canStart() && setRestart(event)}
          >
            <Icon name="rotateRight" />
          </Button>
        ) : null}
      </header>
      {mode === 'pulls' && restriction !== 'none' ? (
        <Alert
          variant="info"
          className="mx-2 my-1 py-1"
          id="pr-restriction-notice"
        >
          {t(`pipeline.workflow.restrict.${restriction}`)}
        </Alert>
      ) : null}
      {jobsFailed ? (
        <Alert
          variant="danger"
          className="mx-2 my-1 py-1"
          id="workflow-jobs-error"
        >
          {t('common.error')}{' '}
          <Button
            variant="link"
            size="sm"
            className="p-0 align-baseline"
            onClick={() =>
              jobQueries.forEach(q => q.isError && void q.refetch())
            }
          >
            {t('common.retry')}
          </Button>
        </Alert>
      ) : null}
      <div className="workflow-body">
        {view === 'graph' ? (
          <WorkflowGraphView
            pipeline={pipeline}
            graph={graph}
            event={event}
            builds={builds.data}
            jobs={graphJobs}
            mode={mode}
            allowEventAction={allowEventAction}
          />
        ) : (
          <PipelineJobsTable
            pipeline={pipeline}
            rows={buildJobRows(
              rows.map(r => r.job),
              prNum
            )}
            event={{
              builds: builds.data ?? [],
              workflowGraph: graph,
              view: mode
            }}
            onStart={actions.onStart}
            onStop={actions.onStop}
            // A PR job is enabled and disabled through its parent pipeline job.
            onToggleState={job => actions.onToggleState(parentOf(job))}
          />
        )}
      </div>
      {actions.modals}
      {restart ? (
        <StartEventModal
          pipeline={pipeline}
          event={restart}
          action="restart"
          isPr={mode === 'pulls'}
          onClose={() => setRestart(null)}
          onStarted={created => {
            setRestart(null);
            navigate({
              to: `/v2/pipelines/${pipeline.id}/${
                mode === 'pulls' ? 'pulls' : 'events'
              }/${created.id}` as never
            });
          }}
        />
      ) : null}
    </section>
  );
}
