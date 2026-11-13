import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { api } from '~/api/client';
import { PageLayout } from '~/components/PageLayout';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { StartWarningAlert } from '~/features/pipeline/hooks/useStartGuard';
import { ArtifactPreview } from './ArtifactPreview';
import { ArtifactTree } from './ArtifactTree';
import { BuildBanner } from './BuildBanner';
import { LogPane } from './LogPane';
import { StepList } from './StepList';
import './build.scss';
import {
  useArtifactManifest,
  useBuild,
  useBuildEvent,
  useJob,
  usePipelineSummary,
  useRestartBuild,
  useStepLogs,
  useStopBuild
} from './api';
import type { Build, BuildEvent } from './types';
import { buildInitLogs, getActiveStep, isActiveBuild, selectedArtifactPath } from './utils';

function Message({ type, children }: { type: 'warning' | 'danger' | 'info'; children: string }) {
  return (
    <div className={`alert alert-${type} py-1 my-1`} role="alert">
      {children}
    </div>
  );
}

const STATUS_ALERT = { ERROR: 'danger', INFO: 'info', WARN: 'warning' } as const;

function isVirtual(event: BuildEvent | undefined, jobName: string): boolean {
  const nodes = (event as { workflowGraph?: { nodes?: Array<{ name: string; virtual?: boolean }> } } | undefined)
    ?.workflowGraph?.nodes;

  return !!nodes?.find(n => n.name === jobName)?.virtual;
}

export function BuildPage() {
  const { buildId } = useParams({ strict: false }) as { buildId: string };

  // The route keeps this page when Back/Forward moves to another build: a fresh one per build, so
  // an open Stop/Restart confirmation (or anything else held here) cannot act on the other build.
  return <BuildView key={buildId} />;
}

function BuildView() {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    pipelineId: string;
    buildId: string;
    stepId?: string;
    _splat?: string;
  };
  const { pipelineId, buildId } = params;
  const pathname = useRouterState({ select: s => s.location.pathname });
  const onArtifacts = /\/builds\/[^/]+\/artifacts(\/|$)/.test(pathname);
  const session = useSession(s => s.data);
  const isAuthenticated = !!session;

  const buildQ = useBuild(buildId);
  const rawBuild = buildQ.data;
  const build: Build | undefined = useMemo(
    () =>
      rawBuild && rawBuild.meta?.build?.warning && rawBuild.status === 'SUCCESS'
        ? { ...rawBuild, status: 'WARNING' }
        : rawBuild,
    [rawBuild]
  );
  const jobQ = useJob(build?.jobId);
  const eventQ = useBuildEvent(build?.eventId);
  const pipelineQ = usePipelineSummary(pipelineId);
  const job = jobQ.data;
  const parentJobQ = useJob(job?.prParentJobId);
  const settingsQ = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => api.get<{ timestampFormat?: string }>('/users/settings'),
    enabled: isAuthenticated
  });
  const utc = settingsQ.data?.timestampFormat === 'UTC';

  const stop = useStopBuild(buildId);
  const restart = useRestartBuild(buildId);
  // An explicit step in the URL is not overridden by following the running step.
  const userSelected = useRef<string | null>(params.stepId ?? null);
  const steps = build?.steps ?? [];
  const active = build ? isActiveBuild(build.status, build.endTime) : false;
  const selectedName = params.stepId && steps.some(s => s.name === params.stepId) ? params.stepId : null;
  const step = steps.find(s => s.name === selectedName);

  const goStep = useCallback(
    (name: string, replace = false) =>
      navigate({ to: `/pipelines/${pipelineId}/builds/${buildId}/steps/${encodeURIComponent(name)}`, replace }),
    [navigate, pipelineId, buildId]
  );

  // The build belongs to another pipeline: show that pipeline instead.
  useEffect(() => {
    if (job && String(job.pipelineId) !== String(pipelineId)) {
      void navigate({ to: `/pipelines/${pipelineId}` });
    }
  }, [job, pipelineId, navigate]);

  // Unknown step in the URL: back to the build.
  useEffect(() => {
    if (build && params.stepId && !selectedName) {
      userSelected.current = null;
      void navigate({ to: `/pipelines/${pipelineId}/builds/${buildId}`, replace: true });
    }
  }, [build, params.stepId, selectedName, pipelineId, buildId, navigate]);

  // Follow the running/failed step until the user picks one (initial redirect + while polling).
  const activeStep = build ? getActiveStep(build.steps) : undefined;

  useEffect(() => {
    if (!build || onArtifacts) {
      return;
    }
    if (userSelected.current) {
      // Back from the Artifacts tab (bare build URL): restore the step the user had picked.
      if (!params.stepId && build.steps?.some(s => s.name === userSelected.current)) {
        void goStep(userSelected.current, true);
      }

      return;
    }
    if (!activeStep) {
      return;
    }
    if (!params.stepId || (active && params.stepId !== activeStep)) {
      void goStep(activeStep, true);
    }
  }, [build, onArtifacts, activeStep, active, params.stepId, goStep]);

  const virtual = isVirtual(eventQ.data, job?.name ?? '');
  const isInit = selectedName === 'sd-setup-init';
  const init = useMemo(
    () =>
      isInit && build && step
        ? buildInitLogs({
            stepStartTime: step.startTime,
            stepEndTime: step.endTime,
            buildStartTime: build.startTime,
            buildStatus: build.status,
            stats: build.stats,
            parameters: build.meta?.parameters
          })
        : null,
    [isInit, build, step]
  );
  const logs = useStepLogs({
    buildId,
    stepName: selectedName,
    started: !!step?.startTime,
    totalLines: step?.lines,
    enabled: !!step && !isInit && !onArtifacts
  });

  const manifest = useArtifactManifest(buildId, onArtifacts && !!build && !active);
  // The tree heading links to `/artifacts?root=1` (root, "Download All"); bare `/artifacts` shows the manifest.
  const root = useRouterState({ select: s => !!(s.location.search as { root?: unknown }).root });
  const artifactPath = selectedArtifactPath({
    splat: params._splat,
    root,
    nodes: manifest.data,
    settled: manifest.data !== undefined || manifest.isError
  });

  if (buildQ.isError || (jobQ.isError && !job)) {
    return (
      <PageLayout>
        <div className="container py-4" id="not-found">
          <h2>{t('build.notFound.title')}</h2>
          <p>{t('build.notFound.body')}</p>
          <Link to="/">{t('nav.home')}</Link>
        </div>
      </PageLayout>
    );
  }

  if (!build || !job) {
    return (
      <PageLayout>
        <div className="container py-4">{t('common.loading')}</div>
      </PageLayout>
    );
  }

  const jobDisabled = job.prParentJobId ? parentJobQ.data?.state === 'DISABLED' : job.state === 'DISABLED';
  const error = stop.error ?? restart.error;
  const errorMessage = error ? ((error as Error).message ?? t('common.error')) : '';
  const lines = init ? init.lines : logs.lines;
  const message = !selectedName
    ? t('build.log.selectStep')
    : !step?.startTime
      ? t('build.log.notStarted')
      : lines.length === 0 && !logs.done
        ? t('build.log.loading', { step: selectedName })
        : undefined;
  const header = (
    <>
      <BuildBanner
        build={build}
        job={job}
        event={eventQ.data}
        pipeline={pipelineQ.data}
        pipelineId={pipelineId}
        isAuthenticated={isAuthenticated}
        jobDisabled={jobDisabled}
        utc={utc}
        busy={stop.isPending || restart.isPending}
        onStop={() => stop.mutate()}
        onRestart={() =>
          restart.mutate(session?.username ?? '', {
            onSuccess: ({ eventId, build: newBuild }) => {
              userSelected.current = null;
              void navigate({
                to: newBuild
                  ? `/pipelines/${pipelineId}/builds/${newBuild.id}`
                  : `/v2/pipelines/${pipelineId}/${eventQ.data?.pr?.url ? 'pulls' : 'events'}/${eventId}`
              });
            }
          })
        }
      />
      <div className="padded-container">
        <StartWarningAlert pipelineId={Number(pipelineId)} />
        {errorMessage ? <Message type="warning">{errorMessage}</Message> : null}
        {build.statusMessage ? (
          <Message type={STATUS_ALERT[(build.statusMessageType ?? 'WARN') as keyof typeof STATUS_ALERT] ?? 'warning'}>
            {build.statusMessage}
          </Message>
        ) : null}
        {Object.entries(build.meta?.build?.warning ?? {}).map(([name, value]) => (
          <Message key={name} type="warning">{`${name} - ${value}`}</Message>
        ))}
      </div>
    </>
  );

  return (
    <PageLayout header={header} scroll={false}>
      {virtual ? null : (
        <div className="build-step-collection">
          <div className="build-step-collection__side">
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <Link
                  role="tab"
                  aria-selected={!onArtifacts}
                  className={`nav-link${onArtifacts ? '' : ' active'}`}
                  to={`/pipelines/${pipelineId}/builds/${buildId}`}
                >
                  {t('build.tabs.steps')}
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  role="tab"
                  aria-selected={onArtifacts}
                  className={`nav-link${onArtifacts ? ' active' : ''}`}
                  to={`/pipelines/${pipelineId}/builds/${buildId}/artifacts`}
                >
                  {t('build.tabs.artifacts')}
                </Link>
              </li>
            </ul>
            <ScrollRegion className="build-step-collection__list">
              {onArtifacts ? (
                <ArtifactTree
                  nodes={manifest.data ?? []}
                  loading={manifest.isLoading}
                  error={manifest.isError}
                  pipelineId={pipelineId}
                  buildId={buildId}
                  selected={artifactPath}
                />
              ) : (
                <StepList
                  steps={steps}
                  selected={selectedName}
                  onSelect={name => {
                    userSelected.current = name;
                    void goStep(name);
                  }}
                />
              )}
            </ScrollRegion>
          </div>
          <div className="build-step-collection__main">
            {onArtifacts ? (
              <ArtifactPreview buildId={buildId} path={artifactPath} />
            ) : (
              <LogPane
                lines={message ? [] : lines}
                message={message}
                stepName={selectedName}
                buildStartTime={build.startTime}
                stepStartTime={step?.startTime}
                inProgress={!!step && step.lines === undefined}
                preferUtc={utc}
                hasEarlier={!init && !message && logs.hasEarlier}
                loadingEarlier={logs.loadingEarlier}
                onLoadEarlier={() => void logs.loadEarlier()}
                onLoadAll={init || message ? undefined : logs.loadAll}
              />
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
