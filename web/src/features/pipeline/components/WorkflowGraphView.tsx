import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '../hooks/useStartGuard';
import { assetUrl } from '~/config/config';
import {
  useEventStageBuilds,
  usePipelineStages,
  usePipelineTriggers,
  useUserSettings
} from '../api/queries';
import { isEventDone, virtualJobIdsOf } from '../hooks/useEventBuilds';
import { removeBranch } from '~/features/visualizer/lib/removeBranch';
import {
  WorkflowGraph,
  type JobAction,
  type WorkflowNodeInfo
} from '~/features/workflow-graph';
import type {
  Build,
  Job,
  Pipeline,
  SdEvent,
  WorkflowGraph as GraphData
} from '../types';
import { showPrJobsOf } from '../utils/pipeline';
import { StartEventModal } from './event/StartEventModal';
import { StopEventModal } from './event/StopEventModal';
import { useJobActions } from './useJobActions';

interface Props {
  pipeline: Pipeline;
  graph?: GraphData;
  event: SdEvent;
  builds?: Build[];
  jobs?: Job[];
  mode: 'events' | 'pulls';
  allowEventAction?: boolean;
}

/** Jobs as the graph expects them: `isDisabled` derived from `state` (as Ember does). `group` is the PR number from the API. */
export const toGraphJobs = (jobs: Job[] | undefined) =>
  jobs?.map(j => ({ ...j, isDisabled: j.state === 'DISABLED' }));

/** The setup job that starts a stage. */
export const stageSetupJob = (
  stageName: string
): Pick<Job, 'name' | 'state'> => ({
  name: `stage@${stageName}:setup`,
  state: 'ENABLED'
});

/**
 * The job a popover enable/disable acts on. A PR job toggles its parent pipeline job, and its
 * state is the parent's (Ember: `job.prParentJobId || job.id`).
 */
export const toggleTarget = (
  node: WorkflowNodeInfo,
  jobs: Job[] | undefined
): Job | undefined => {
  const job = jobs?.find(j => j.id === node.jobId);

  if (!job) {
    return node.jobId === undefined
      ? undefined
      : ({
          id: node.jobId,
          name: node.name,
          state: node.isDisabled ? 'DISABLED' : 'ENABLED'
        } as Job);
  }
  if (!job.prParentJobId) return job;

  return (
    jobs?.find(j => j.id === job.prParentJobId) ??
    ({
      ...job,
      id: job.prParentJobId,
      name: node.name,
      state: node.isDisabled ? 'DISABLED' : 'ENABLED'
    } as Job)
  );
};

/** The shared workflow graph plus the dialogs its job actions open. */
export function WorkflowGraphView({
  pipeline,
  graph: fullGraph,
  event,
  builds,
  jobs,
  mode,
  allowEventAction = true
}: Props) {
  const t = useT();
  const navigate = useNavigate();
  const [start, setStart] = useState<{
    job: Pick<Job, 'name' | 'state'> & { status?: string };
    action: 'start' | 'restart';
    /** The event it was opened on: Back/Forward can select another while it is open. */
    event: SdEvent;
  } | null>(null);
  const [stopBuild, setStopBuild] = useState<number | null>(null);
  const userSettings = useUserSettings();
  const showPrJobs = showPrJobsOf(userSettings.data, pipeline.id);
  // Events (not PR pages) hide the jobs only a pull request starts when the user turned them off (as Ember does).
  const graph = useMemo(
    () =>
      fullGraph && event.prNum === undefined && !showPrJobs
        ? removeBranch(fullGraph, '~pr')
        : fullGraph,
    [fullGraph, event.prNum, showPrJobs]
  );
  const hasStages = Boolean(graph?.nodes.some(n => n.stageName));
  const stages = usePipelineStages(pipeline.id, hasStages);
  const done = useMemo(
    () => isEventDone(event, builds, virtualJobIdsOf(jobs)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event, builds, jobs]
  );
  const stageBuilds = useEventStageBuilds(event.id, hasStages, !done);
  const showTriggers = Boolean(pipeline.settings?.showEventTriggers);
  const triggers = usePipelineTriggers(pipeline.id, showTriggers);
  const graphJobs = useMemo(() => toGraphJobs(jobs), [jobs]);
  // Enable / disable with a reason: the same flow (and modal) as the Jobs page.
  const canStart = useStartGuard(pipeline);
  const jobActions = useJobActions({
    pipeline,
    event,
    isPr: mode === 'pulls'
  });

  if (!graph) {
    return <p className="text-muted p-3">{t('pipeline.workflow.noGraph')}</p>;
  }

  const onJobAction = (action: JobAction) => {
    if (action.type === 'view-build') {
      navigate({
        to: `/v2/pipelines/${event.pipelineId}/builds/${action.node.buildId}` as never
      });
    } else if (action.type === 'view-metrics') {
      navigate({
        to: `/v2/pipelines/${pipeline.id}/metrics` as never,
        search: { jobId: action.node.jobId } as never
      });
    } else if (action.type === 'open-external') {
      // Ember opens remote and downstream pipelines in a new tab. A raw URL misses the router's
      // ROOT_URL basepath, so add it.
      window.open(
        assetUrl(`/v2/pipelines/${action.pipelineId}`),
        '_blank',
        'noopener,noreferrer'
      );
    } else if (action.type === 'stop' && action.node.buildId) {
      // Also "Stop frozen build": Ember aborts the FROZEN build the same way.
      setStopBuild(action.node.buildId);
    } else if (action.type === 'toggle-job') {
      const job = toggleTarget(action.node, jobs);

      if (job) jobActions.onToggleState(job);
    } else if (action.type === 'start-stage') {
      if (!canStart()) return;
      // Ember posts the setup job with the stage status (FROZEN asks for a reason) and the
      // chosen mode: RESTART_FROM_EVENT (inherit) or START_FROM_EVENT (fresh), both parented.
      setStart({
        job: {
          ...stageSetupJob(action.stage.name),
          status: action.stage.status
        },
        action: action.action,
        event
      });
    } else if (action.type === 'start' || action.type === 'restart') {
      if (!canStart()) return;

      const job =
        jobs?.find(j => j.id === action.node.jobId) ??
        ({ name: action.node.name, state: 'ENABLED' } as Job);

      setStart({
        job: { ...job, status: action.node.status },
        action: action.type,
        event
      });
    }
  };

  return (
    <div className="workflow-graph-host" data-testid="workflow-graph">
      <WorkflowGraph
        graph={graph}
        builds={builds}
        jobs={graphJobs}
        stages={stages.data}
        stageBuilds={stageBuilds.data}
        chainPR={pipeline.prChain}
        downstreamTriggers={showTriggers ? triggers.data : undefined}
        start={event.startFrom}
        sha={event.sha}
        prNum={event.prNum}
        eventId={event.id}
        activeTab={mode}
        readOnly={!allowEventAction}
        onJobAction={onJobAction}
      />
      {start ? (
        <StartEventModal
          pipeline={pipeline}
          event={start.event}
          job={start.job}
          action={start.action}
          isPr={mode === 'pulls'}
          onClose={() => setStart(null)}
          onStarted={created => {
            setStart(null);
            navigate({
              to: `/v2/pipelines/${pipeline.id}/${mode}/${created.id}` as never
            });
          }}
        />
      ) : null}
      {stopBuild ? (
        <StopEventModal
          buildId={stopBuild}
          onClose={() => setStopBuild(null)}
        />
      ) : null}
      {jobActions.modals}
    </div>
  );
}
