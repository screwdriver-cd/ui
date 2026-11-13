import {
  keepPreviousData,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api } from '~/api/client';
import { config } from '~/config/config';
import { settingsKey } from '~/features/user-settings/lib/settings';
import type {
  AdminUser,
  Build,
  Job,
  JobTriggers,
  Metric,
  Pipeline,
  ScmContext,
  SdEvent,
  Secret,
  Stage,
  StageBuild,
  Token
} from '../types';
import { getPrNumbers } from '../utils/pr';

export const keys = {
  pipeline: (id: number) => ['pipeline', id] as const,
  jobs: (id: number, type?: string) =>
    ['pipeline', id, 'jobs', type ?? 'all'] as const,
  /** Prefix of every jobs list of a pipeline (all, pipeline and PR), for invalidation. */
  anyJobs: (id: number) => ['pipeline', id, 'jobs'] as const,
  prNums: (id: number) => ['pipeline', id, 'prNums'] as const,
  event: (id: number) => ['event', id] as const,
  eventBuilds: (id: number) => ['eventBuilds', id] as const,
  stages: (id: number) => ['pipeline', id, 'stages'] as const,
  stageBuilds: (eventId: number) => ['stageBuilds', eventId] as const,
  triggers: (id: number) => ['pipeline', id, 'triggers'] as const,
  secrets: (id: number) => ['pipeline', id, 'secrets'] as const,
  tokens: (id: number) => ['pipeline', id, 'tokens'] as const,
  admins: (id: number) => ['pipeline', id, 'admins'] as const,
  children: (id: number) => ['pipeline', id, 'children'] as const,
  sameRepo: (scmUri: string) => ['pipelines', 'scmUri', scmUri] as const,
  scmContexts: ['scmContexts'] as const,
  userSettings: settingsKey,
  latestCommitEvent: (id: number) =>
    ['pipeline', id, 'latestCommitEvent'] as const,
  lastSuccessfulEvent: (id: number) =>
    ['pipeline', id, 'lastSuccessfulEvent'] as const,
  metrics: (id: number, start: string, end: string) =>
    ['pipeline', id, 'metrics', start, end] as const,
  jobMetrics: (id: number, start: string, end: string) =>
    ['job', id, 'metrics', start, end] as const
};

export const fetchPipeline = (id: number) =>
  api.get<Pipeline>(`/pipelines/${id}`);
export const fetchEvent = (id: number) => api.get<SdEvent>(`/events/${id}`);
export const fetchJobs = (
  id: number,
  type?: 'pipeline' | 'pr',
  archived?: boolean
) => api.get<Job[]>(`/pipelines/${id}/jobs`, { query: { type, archived } });

export const fetchLatestCommitEvent = (id: number) =>
  api.get<SdEvent>(`/pipelines/${id}/latestCommitEvent`).catch(() => null);

export function usePipelineQuery(id: number) {
  return useQuery({
    queryKey: keys.pipeline(id),
    queryFn: () => fetchPipeline(id),
    staleTime: 30_000
  });
}

export function useJobs(
  pipelineId: number,
  type?: 'pipeline' | 'pr',
  enabled = true
) {
  return useQuery({
    queryKey: keys.jobs(pipelineId, type),
    queryFn: () => fetchJobs(pipelineId, type),
    staleTime: 30_000,
    enabled
  });
}

/** Stage definitions of a pipeline (`GET /pipelines/:id/stages`). */
export function usePipelineStages(pipelineId: number, enabled = true) {
  return useQuery({
    queryKey: keys.stages(pipelineId),
    queryFn: () =>
      api
        .get<Stage[]>(`/pipelines/${pipelineId}/stages`)
        .catch(() => [] as Stage[]),
    staleTime: 30_000,
    enabled
  });
}

/** Stage builds of an event (`GET /events/:id/stageBuilds`); polls while `poll` is true. */
export function useEventStageBuilds(
  eventId: number,
  enabled: boolean,
  poll: boolean
) {
  const query = useQuery({
    queryKey: keys.stageBuilds(eventId),
    queryFn: () =>
      api
        .get<StageBuild[]>(`/events/${eventId}/stageBuilds`)
        .catch(() => [] as StageBuild[]),
    enabled,
    refetchInterval: poll ? config.buildReloadTimer : false
  });
  const polled = useRef(poll);
  const { refetch } = query;

  // The event's builds can finish between two polls: read the stage builds once more when
  // polling stops, or a stage keeps the status from before its teardown ended.
  useEffect(() => {
    if (polled.current && !poll && enabled) {
      void refetch();
    }
    polled.current = poll;
  }, [poll, enabled, refetch]);

  return query;
}

/** Downstream triggers per job (`GET /pipelines/:id/triggers`), for the showEventTriggers setting. */
export function usePipelineTriggers(pipelineId: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.triggers(pipelineId),
    queryFn: () =>
      api
        .get<JobTriggers[]>(`/pipelines/${pipelineId}/triggers`)
        .catch(() => [] as JobTriggers[]),
    staleTime: 60_000,
    enabled
  });
}

/** Open PR numbers (ascending), refreshed on the event reload timer. */
export function usePrNums(pipelineId: number, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: keys.prNums(pipelineId),
    queryFn: async () => {
      const jobs = await fetchJobs(pipelineId, 'pr');

      // The workflow reads the same list, which does not poll: without this a newly opened PR's
      // event would find none of its jobs and look closed.
      queryClient.setQueryData(keys.jobs(pipelineId, 'pr'), jobs);

      return getPrNumbers(jobs);
    },
    refetchInterval: config.eventReloadTimer,
    enabled
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: keys.userSettings,
    queryFn: () =>
      api
        .get<Record<string, unknown>>('/users/settings')
        .catch(() => ({} as Record<string, unknown>)),
    staleTime: 60_000
  });
}

export function useScmContexts() {
  return useQuery({
    queryKey: keys.scmContexts,
    // No catch: a cached [] would last the session, a failed read is asked again on the next mount.
    queryFn: () => api.get<ScmContext[]>('/auth/contexts'),
    staleTime: Infinity
  });
}

export function useLastSuccessfulEvent(pipelineId: number) {
  return useQuery({
    queryKey: keys.lastSuccessfulEvent(pipelineId),
    queryFn: () =>
      api
        .get<SdEvent>(`/pipelines/${pipelineId}/lastSuccessfulEvent`)
        .catch(() => null),
    staleTime: 60_000
  });
}

export function useLatestCommitEvent(pipelineId: number, poll = true) {
  return useQuery({
    queryKey: keys.latestCommitEvent(pipelineId),
    queryFn: () => fetchLatestCommitEvent(pipelineId),
    refetchInterval: poll ? config.eventReloadTimer : false
  });
}

export const useSecrets = (pipelineId: number) =>
  useQuery({
    queryKey: keys.secrets(pipelineId),
    queryFn: () => api.get<Secret[]>(`/pipelines/${pipelineId}/secrets`)
  });

export const useInheritedSecrets = (parentId?: number | null) =>
  useQuery({
    queryKey: keys.secrets(parentId ?? -1),
    queryFn: () => api.get<Secret[]>(`/pipelines/${parentId}/secrets`),
    enabled: Boolean(parentId)
  });

export const useTokens = (pipelineId: number) =>
  useQuery({
    queryKey: keys.tokens(pipelineId),
    queryFn: () => api.get<Token[]>(`/pipelines/${pipelineId}/tokens`)
  });

export const useAdmins = (pipelineId: number) =>
  useQuery({
    queryKey: keys.admins(pipelineId),
    queryFn: () =>
      api
        .get<AdminUser[]>(`/pipelines/${pipelineId}/admins`)
        .catch(() => [] as AdminUser[])
  });

const CHILD_PAGE_SIZE = 50;
// A guard against a server that never returns an empty page.
const MAX_CHILD_PAGES = 100;

/**
 * All child pipelines. The API pages them (50 per SCM by default) and drops private ones the user
 * cannot see after paging, so only an empty page marks the end.
 */
export async function fetchChildPipelines(pipelineId: number) {
  const all: Pipeline[] = [];

  for (let page = 1; page <= MAX_CHILD_PAGES; page += 1) {
    const batch = await api.get<Pipeline[]>('/pipelines', {
      query: { configPipelineId: pipelineId, page, count: CHILD_PAGE_SIZE }
    });

    if (batch.length === 0) {
      return all;
    }
    all.push(...batch);
  }

  return all;
}

export const useChildPipelines = (pipelineId: number) =>
  useQuery({
    queryKey: keys.children(pipelineId),
    queryFn: () => fetchChildPipelines(pipelineId)
  });

export function useSameRepoPipelines(pipeline: Pipeline | undefined) {
  const scmUri = pipeline?.scmUri;

  return useQuery({
    queryKey: keys.sameRepo(scmUri ?? ''),
    queryFn: async () => {
      const pipelines = await api.get<Pipeline[]>('/pipelines', {
        query: { scmUri, sortBy: 'scmUri', sort: 'ascending' }
      });

      return pipelines.filter(p => p.scmUri !== scmUri);
    },
    enabled: Boolean(scmUri && pipeline?.scmRepo),
    staleTime: 60_000
  });
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Job metrics omit queuedTime/imagePullTime; the charts need numbers. */
export const normalizeMetrics = (metrics: Metric[] | undefined): Metric[] =>
  (Array.isArray(metrics) ? metrics : []).map(m => ({
    ...m,
    duration: num(m.duration),
    queuedTime: num(m.queuedTime),
    imagePullTime: num(m.imagePullTime)
  }));

export function usePipelineMetrics(
  pipelineId: number,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: keys.metrics(pipelineId, startTime, endTime),
    queryFn: () =>
      api
        .get<Metric[]>(`/pipelines/${pipelineId}/metrics`, {
          query: { startTime, endTime }
        })
        .then(normalizeMetrics),
    placeholderData: keepPreviousData
  });
}

export function useJobMetrics(
  jobId: number | null,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: keys.jobMetrics(jobId ?? -1, startTime, endTime),
    queryFn: () =>
      api
        .get<Metric[]>(`/jobs/${jobId}/metrics`, {
          query: { startTime, endTime }
        })
        .then(normalizeMetrics),
    enabled: jobId !== null,
    placeholderData: keepPreviousData
  });
}

export type { Build };

export type JobBuildsMap = Map<number, Build[]>;

const STATUS_CHUNK = 50;
const LIVE_STATUSES = ['RUNNING', 'QUEUED', 'BLOCKED', 'CREATED'];

/** A successful build that carries a warning is shown as WARNING (as Ember's setBuildStatus does). */
const withDisplayStatus = (build: Build): Build =>
  build.status === 'SUCCESS' && build.meta?.build?.warning
    ? { ...build, status: 'WARNING' }
    : build;

/** The last `numBuilds` builds of each job, oldest first (`GET /builds/statuses`). Ids go in chunks to keep URLs short. */
export async function fetchJobBuilds(
  jobIds: number[],
  numBuilds: number
): Promise<JobBuildsMap> {
  const map: JobBuildsMap = new Map();

  for (let i = 0; i < jobIds.length; i += STATUS_CHUNK) {
    const ids = jobIds.slice(i, i + STATUS_CHUNK);
    const response = await api.get<Array<{ jobId: number; builds: Build[] }>>(
      `/builds/statuses?${ids
        .map(id => `jobIds=${id}`)
        .join('&')}&numBuilds=${numBuilds}`
    );

    response.forEach(entry =>
      map.set(
        entry.jobId,
        [...entry.builds].sort((a, b) => a.id - b.id).map(withDisplayStatus)
      )
    );
  }

  return map;
}

/** Recent builds for just the jobs in view; polls faster while one of them is live. */
export function useJobBuilds(jobIds: number[], numBuilds: number) {
  const idKey = jobIds.join(',');

  return useQuery({
    queryKey: ['jobBuilds', numBuilds, idKey] as const,
    queryFn: () => fetchJobBuilds(jobIds, numBuilds),
    enabled: jobIds.length > 0,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
    refetchInterval: query => {
      const live = [...(query.state.data?.values() ?? [])].some(builds =>
        LIVE_STATUSES.includes(builds[builds.length - 1]?.status ?? '')
      );

      return live ? config.buildReloadTimer : config.eventReloadTimer;
    }
  });
}

/** Coverage of a job's latest build (`GET /coverage/info`); `null` when unavailable. */
export function useJobCoverage(
  job: Pick<Job, 'id' | 'name' | 'permutations' | 'prParentJobId'>,
  build: Build | undefined,
  pipeline: Pick<Pipeline, 'id' | 'name'>,
  enabled: boolean
) {
  // The same request as Ember's jobs list: a PR job is read from its PR analysis, and a build
  // without a coverage key is found through the pipeline.
  const prNum = /^PR-(\d+):/.exec(job.name)?.[1];
  const scope = job.permutations?.[0]?.annotations?.['screwdriver.cd/coverageScope'];

  return useQuery({
    // Coverage is only reported once the build has ended (Ember's banner waits for it too),
    // so the end time is part of the key and a running build is not asked yet.
    queryKey: ['jobCoverage', job.id, build?.id, build?.endTime] as const,
    queryFn: () =>
      api
        .get<{ coverage?: string }>('/coverage/info', {
          query: {
            jobId: job.id,
            buildId: build?.id,
            startTime: build?.startTime,
            endTime: build?.endTime,
            pipelineId: pipeline.id,
            prNum,
            prParentJobId: job.prParentJobId,
            jobName: job.name,
            pipelineName: pipeline.name ?? '',
            scope: typeof scope === 'string' ? scope : undefined,
            projectKey: (
              build?.meta?.build as { coverageKey?: string } | undefined
            )?.coverageKey
          }
        })
        // No catch: a failure shows N/A without being cached for the staleTime.
        .then(r => r.coverage ?? null),
    enabled: enabled && Boolean(build?.endTime),
    staleTime: 5 * 60_000
  });
}
