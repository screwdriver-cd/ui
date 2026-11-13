import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { startEvent, type StartEventBody } from '../../api/mutations';
import { keys, useJobs, useLatestCommitEvent } from '../../api/queries';
import { fetchEventBuilds } from '../../hooks/useEventBuilds';
import type { Job, Pipeline, SdEvent } from '../../types';
import { failedUpstreamJobs } from '../../utils/upstream';
import { getPrNumber } from '../../utils/pr';
import {
  extractDefaultJobParameters,
  extractDefaultParameters,
  extractEventParameters,
  extractJobParameters,
  isParameterized,
  type RawParameters
} from '../../utils/parameters';
import { ConfirmModal } from '../ConfirmModal';
import { ParametersForm } from './ParametersForm';

interface Props {
  pipeline: Pipeline;
  /** The event being restarted / started from (omit to start from the latest commit). */
  event?: SdEvent | null;
  job?: Pick<Job, 'name' | 'state'> & { status?: string };
  action: 'start' | 'restart';
  isPr: boolean;
  onClose: () => void;
  /** Called with the new event when the API created one. */
  onStarted?: (event: SdEvent) => void;
}

const isPrClosedLineage = (event?: SdEvent | null) =>
  Boolean(
    event &&
      (event.startFrom?.startsWith('~pr-closed') ||
        (event.meta as { sd?: { pr?: unknown } } | undefined)?.sd?.pr)
  );

export function buildStartBody(args: {
  pipelineId: number;
  jobName: string;
  startAction: StartEventBody['startAction'];
  event?: SdEvent | null;
  sha?: string;
  prNum?: number;
  causeMessage: string;
  parameters?: Record<string, unknown>;
}): StartEventBody {
  const {
    pipelineId,
    jobName,
    startAction,
    event,
    sha,
    prNum,
    causeMessage,
    parameters
  } = args;
  const body: StartEventBody = {
    pipelineId,
    causeMessage,
    startFrom: jobName,
    startAction
  };

  if (prNum && !isPrClosedLineage(event) && event) {
    body.prNum = prNum;
    body.parentEventId = event.id;
    body.groupEventId = event.groupEventId;
    if (jobName !== '~pr' && !jobName.startsWith(`PR-${prNum}:`)) {
      body.startFrom = `PR-${prNum}:${jobName}`;
    }
  } else if (event) {
    body.parentEventId = event.id;
    body.groupEventId = event.groupEventId;
  } else if (sha) {
    body.sha = sha;
  }
  if (parameters) {
    body.meta = { parameters };
  }

  return body;
}

const baseJobName = (name: string) => name.replace(/^PR-\d+:/, '');

export function StartEventModal({
  pipeline,
  event,
  job,
  action,
  isPr,
  onClose,
  onStarted
}: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const username = useSession(s => s.data?.username);
  const isFrozen = job?.status === 'FROZEN';
  const [reason, setReason] = useState('');
  const fresh = action === 'start';
  const startFrom = job ? job.name : isPr ? '~pr' : '~commit';
  // Starting a pipeline-level event from the latest commit never reuses an old event.
  const sourceEvent = fresh && !job && !isPr ? null : event;
  const startAction: StartEventBody['startAction'] = sourceEvent
    ? fresh
      ? 'START_FROM_EVENT'
      : 'RESTART_FROM_EVENT'
    : 'START_FROM_LATEST_COMMIT';
  const displayName = job ? baseJobName(job.name) : startFrom;
  const [parameters, setParameters] = useState<{
    values: Record<string, unknown>;
    valid: boolean;
  } | null>(null);
  const onParameters = useCallback(
    (values: Record<string, unknown>, valid: boolean) =>
      setParameters({ values, valid }),
    []
  );
  // Parameter definitions live on the jobs. A PR event takes only this PR's jobs, and the API reads
  // their parameters under the base job name (`main`, not `PR-7:main`), so they are keyed by it.
  const pipelineJobs = useJobs(pipeline.id, 'pipeline', !isPr);
  const prJobs = useJobs(pipeline.id, 'pr', isPr);
  const jobsQuery = isPr ? prJobs : pipelineJobs;
  // A failed read is not "no parameters": starting then would drop the job parameters.
  const jobsReady = jobsQuery.data !== undefined;
  const jobsFailed = !jobsReady && jobsQuery.isError;
  const jobList = useMemo(
    () =>
      isPr
        ? (prJobs.data ?? [])
            .filter(j => getPrNumber(j) === event?.prNum)
            .map(j => ({ ...j, name: baseJobName(j.name) }))
        : (pipelineJobs.data ?? []),
    [pipelineJobs.data, prJobs.data, isPr, event?.prNum]
  );
  const latest = useLatestCommitEvent(pipeline.id, false);
  const formInputs = useMemo(() => {
    // An event that ran without parameters has nothing to restore: offer the current defaults.
    const restoring =
      Boolean(event) &&
      !fresh &&
      Object.keys(event?.meta?.parameters ?? {}).length > 0;
    const defaults = {
      pipeline: extractDefaultParameters(pipeline.parameters),
      job: extractDefaultJobParameters(jobList)
    };
    const fromEvent = extractEventParameters(event?.meta?.parameters);
    const jobDefinitions = extractJobParameters(jobList);

    return {
      parameterized: isParameterized(
        pipeline.parameters,
        defaults.job,
        event?.meta?.parameters
      ),
      pipelineDefinitions: (pipeline.parameters ?? {}) as RawParameters,
      jobDefinitions,
      pipelineParameters: (restoring
        ? fromEvent.pipelineParameters
        : defaults.pipeline) as RawParameters,
      jobParameters: (restoring
        ? fromEvent.jobParameters
        : defaults.job) as RawParameters
    };
  }, [pipeline.parameters, jobList, event, fresh]);
  // Upstream builds of this event that failed: the job may depend on what they never produced.
  const upstreamBuilds = useQuery({
    queryKey: keys.eventBuilds(sourceEvent?.id ?? -1),
    queryFn: () => fetchEventBuilds(sourceEvent!.id),
    enabled: Boolean(job && sourceEvent),
    staleTime: 10_000
  });
  const failedUpstream = useMemo(
    () =>
      job && sourceEvent
        ? failedUpstreamJobs(
            sourceEvent.workflowGraph ?? pipeline.workflowGraph,
            job.name,
            upstreamBuilds.data,
            jobList
          )
        : [],
    [job, sourceEvent, pipeline.workflowGraph, upstreamBuilds.data, jobList]
  );
  const isLatest = !event || !latest.data || event.sha === latest.data.sha;

  const [noJobs, setNoJobs] = useState<SdEvent | null>(null);
  const close = () => {
    onClose();
    if (noJobs) {
      onStarted?.(noJobs);
    }
  };

  const confirm = async () => {
    const body = buildStartBody({
      pipelineId: pipeline.id,
      jobName: startFrom,
      startAction,
      event: sourceEvent,
      sha: event?.sha,
      prNum: event?.prNum,
      causeMessage: isFrozen
        ? `[force start] ${reason}`
        : `Manually started by ${username ?? ''}`,
      parameters: formInputs.parameterized ? parameters?.values : undefined
    });
    const { event: created, statusMessage } = await startEvent(body);

    await queryClient.invalidateQueries({ queryKey: ['eventRailHead'] });
    queryClient.removeQueries({
      queryKey: keys.latestCommitEvent(pipeline.id)
    });

    if (statusMessage) {
      // Nothing to run (Ember isNoJobsToStart): explain why, and open the event once closed.
      setNoJobs(created);
      throw new Error(statusMessage);
    }

    onClose();
    onStarted?.(created);
  };

  return (
    <ConfirmModal
      id="start-event-modal"
      title={t(
        fresh ? 'pipeline.start.titleStart' : 'pipeline.start.titleRestart',
        { name: displayName }
      )}
      confirmLabel={t(
        fresh ? 'pipeline.start.confirmStart' : 'pipeline.start.confirmRestart'
      )}
      pendingLabel={t(
        fresh ? 'pipeline.start.pendingStart' : 'pipeline.start.pendingRestart'
      )}
      disabled={
        noJobs !== null ||
        (isFrozen && reason.trim().length === 0) ||
        !jobsReady ||
        (formInputs.parameterized && parameters?.valid === false)
      }
      onConfirm={confirm}
      onClose={close}
    >
      {sourceEvent ? (
        <p>
          {t('pipeline.start.fromEvent', {
            id: sourceEvent.id,
            sha: sourceEvent.commit?.url ? (
              <a
                id="start-commit-link"
                href={sourceEvent.commit.url}
                target="_blank"
                rel="noreferrer"
              >
                {sourceEvent.sha.substring(0, 7)}
              </a>
            ) : (
              sourceEvent.sha.substring(0, 7)
            )
          })}
        </p>
      ) : (
        <p>{t('pipeline.start.fromLatest')}</p>
      )}
      {job && !isPr && !isLatest ? (
        <Alert variant="warning" className="py-1" id="not-latest-warning">
          {t('pipeline.start.notLatest')}
        </Alert>
      ) : null}
      {failedUpstream.length > 0 ? (
        <Alert variant="warning" className="py-1" id="upstream-failed-warning">
          {t('pipeline.start.upstreamFailed', {
            count: failedUpstream.length,
            jobs: failedUpstream.join(', ')
          })}
        </Alert>
      ) : null}
      {job ? (
        <p className="text-muted">
          {t('pipeline.start.notice', { name: displayName })}
        </p>
      ) : null}
      {sourceEvent ? (
        <p className="small" id="start-commit">
          {t('pipeline.start.commit', {
            message: sourceEvent.commit.message.slice(0, 150)
          })}
        </p>
      ) : null}
      <p className="small" id="start-parent">
        {sourceEvent
          ? t('pipeline.start.parent', { id: sourceEvent.id })
          : t('pipeline.start.noParent')}
      </p>
      {isFrozen ? (
        <Form.Group>
          <Form.Label htmlFor="start-reason">
            {t('pipeline.start.reason')}
          </Form.Label>
          <Form.Control
            id="start-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </Form.Group>
      ) : null}
      {jobsFailed ? (
        <p className="text-danger small" role="alert">
          {t('pipeline.parameters.loadFailed')}{' '}
          <button
            type="button"
            className="btn btn-link btn-sm p-0 align-baseline"
            onClick={() => void jobsQuery.refetch()}
          >
            {t('common.retry')}
          </button>
        </p>
      ) : !jobsReady ? (
        <p className="text-muted small">{t('pipeline.parameters.loading')}</p>
      ) : formInputs.parameterized ? (
        <ParametersForm
          pipelineParameters={formInputs.pipelineParameters}
          jobParameters={formInputs.jobParameters}
          pipelineDefinitions={formInputs.pipelineDefinitions}
          jobDefinitions={formInputs.jobDefinitions}
          startFrom={displayName}
          onChange={onParameters}
        />
      ) : (
        <p className="text-muted small" id="no-parameters">
          {t('pipeline.start.noParameters')}
        </p>
      )}
    </ConfirmModal>
  );
}
