import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '~/api/client';
import { apiBase, config } from '~/config/config';
import { getSession } from '~/auth/session';
import type { Build, BuildEvent, Job, LogLine, PipelineSummary } from './types';
import { buildArtifactTree, isActiveBuild } from './utils';

export const buildKey = (id: number | string) => ['build', String(id)] as const;

export function useBuild(buildId: string) {
  return useQuery({
    queryKey: buildKey(buildId),
    queryFn: ({ signal }) => api.get<Build>(`/builds/${buildId}`, { signal }),
    // Reload while the build can still change, including BLOCKED and an UNSTABLE one that has not ended.
    refetchInterval: query =>
      query.state.data && isActiveBuild(query.state.data.status, query.state.data.endTime)
        ? config.buildReloadTimer
        : false
  });
}

export function useJob(jobId: number | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: ({ signal }) => api.get<Job>(`/jobs/${jobId}`, { signal }),
    enabled: jobId !== undefined
  });
}

export function useBuildEvent(eventId: number | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: ({ signal }) => api.get<BuildEvent>(`/events/${eventId}`, { signal }),
    enabled: eventId !== undefined
  });
}

export function usePipelineSummary(pipelineId: string | number | undefined) {
  return useQuery({
    queryKey: ['pipeline', String(pipelineId)],
    queryFn: ({ signal }) => api.get<PipelineSummary>(`/pipelines/${pipelineId}`, { signal }),
    enabled: pipelineId !== undefined
  });
}

export function useTemplateDetails(templateId: number | null | undefined) {
  return useQuery({
    queryKey: ['template-by-id', templateId],
    queryFn: ({ signal }) =>
      api.get<{ name: string; namespace: string; version: string }>(`/template/${templateId}`, { signal }),
    enabled: !!templateId
  });
}

export interface CoverageInfo {
  coverage: string;
  coverageUrl: string;
  tests: string;
  testsUrl: string;
}

interface CoverageInfoResponse {
  coverage?: string | number;
  tests?: string;
  projectUrl?: string;
}

/** Job annotations live in `permutations[0].annotations` (what the API and the Ember job model read). */
export function coverageScope(job: Job | undefined): string | undefined {
  const value = (job?.permutations?.[0]?.annotations ?? job?.annotations)?.['screwdriver.cd/coverageScope'];

  return typeof value === 'string' ? value : undefined;
}

/**
 * `/coverage/info` (same request as the Ember coverage service). Only asked
 * once the coverage step has finished; a failure shows as N/A and is asked again on the next mount.
 */
export function useCoverageInfo(
  build: Build | undefined,
  job: Job | undefined,
  pipeline: { id: number | string; name?: string } | undefined
) {
  const step = build?.steps.find(s => /^sd-teardown-screwdriver-coverage/.test(s.name));
  const endTime = step?.endTime;
  // The pipeline name is part of the request; asking early would cache N/A for good.
  const enabled = !!(build && job && pipeline && endTime);

  return useQuery({
    queryKey: ['coverage-info', build?.id, endTime, pipeline?.id],
    enabled,
    retry: false,
    staleTime: Infinity,
    queryFn: async ({ signal }): Promise<CoverageInfo> => {
      const prMatch = /^PR-(\d+)/.exec(job?.name ?? '');

      // A failure stays a query error (shown as N/A) rather than a cached N/A: staleTime is
      // Infinity, and a failed read is asked again on the next mount.
      const data = await api.get<CoverageInfoResponse>('/coverage/info', {
        signal,
        query: {
          buildId: build?.id,
          jobId: job?.id,
          startTime: build?.steps[0]?.startTime,
          endTime,
          pipelineId: pipeline?.id,
          prNum: prMatch ? prMatch[1] : undefined,
          jobName: job?.name,
          pipelineName: pipeline?.name,
          projectKey: build?.meta?.build?.coverageKey,
          scope: coverageScope(job)
        }
      });
      const hasCoverage = data.coverage !== undefined && data.coverage !== 'N/A';
      const hasTests = data.tests !== undefined && data.tests !== 'N/A';

      return {
        coverage: hasCoverage ? `${data.coverage}%` : 'N/A',
        coverageUrl: hasCoverage ? (data.projectUrl ?? '#') : '#',
        tests: hasTests ? String(data.tests) : 'N/A',
        testsUrl: hasTests ? (data.projectUrl ?? '#') : '#'
      };
    }
  });
}

export function useStopBuild(buildId: string) {
  const qc = useQueryClient();

  return useMutation({
    // The page keeps this hook when it moves to another build, and onSuccess sees the newest
    // options: the response goes to the build that was stopped, not the one now shown.
    mutationFn: async () => {
      const id = buildId;

      return { id, build: await api.put<Build>(`/builds/${id}`, { status: 'ABORTED' }) };
    },
    onSuccess: ({ id, build }) => qc.setQueryData(buildKey(id), (old: Build | undefined) => ({ ...old, ...build }))
  });
}

/**
 * Restart from this build: creates a new event, resolves to it and its new build. Once the event
 * exists the restart has happened: a failed build lookup must not report failure, or a retry would
 * start the jobs a second time, so it resolves without the build.
 */
export function useRestartBuild(buildId: string) {
  return useMutation({
    mutationFn: async (username: string): Promise<{ eventId: number; build?: Build }> => {
      const event = await api.post<{ id: number }>('/events', {
        buildId: Number(buildId),
        causeMessage: `Manually started by ${username}`,
        startAction: 'RESTART_FROM_BUILD'
      });

      try {
        const builds = await api.get<Build[]>(`/events/${event.id}/builds`);

        return { eventId: event.id, build: builds[builds.length - 1] };
      } catch {
        return { eventId: event.id };
      }
    }
  });
}

/** Encodes each path segment so '#', '?' or '%' in a file name can't change the URL's meaning. */
export const encodeArtifactPath = (path: string) =>
  path.split('/').map(encodeURIComponent).join('/');

export const artifactsUrl = (buildId: string | number, path = '') =>
  `${apiBase()}/builds/${buildId}/artifacts/${encodeArtifactPath(path)}`;

/**
 * The API checks pipeline access and proxies to the store; file links also go
 * through the API (redirects to the store with short-lived tokens).
 */
export function useArtifactManifest(buildId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['artifact-manifest', buildId],
    enabled,
    queryFn: async ({ signal }) => {
      try {
        const text = await api.get<string>(`/builds/${buildId}/artifacts/manifest.txt`, {
          query: { type: 'download' },
          raw: true,
          signal
        });

        return buildArtifactTree(text);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          return [];
        }
        throw e;
      }
    }
  });
}

/** A finished step with more lines than this opens at its tail instead of line 0. */
export const TAIL_THRESHOLD = 2000;
/** Lines loaded for the tail, and per "load earlier" request. */
export const LOG_CHUNK_LINES = 1000;
/** The logs API returns at most this many lines per page. */
const API_PAGE_LINES = 100;
/** Consecutive 500s retried before the read stops, as Ember stops at the first. */
const MAX_LOG_500_RETRIES = 3;

/**
 * Pages to request so a read starting at `from` reaches line `end - 1`. The store serves whole
 * storage pages (the first one from `from` to its end), so a start mid-page needs one more page
 * than the line count suggests. Sized for the smallest (100 line) pages; larger ones just cover more.
 */
export const pagesCovering = (from: number, end: number) =>
  Math.floor((Math.max(end, from + 1) - 1) / API_PAGE_LINES) - Math.floor(from / API_PAGE_LINES) + 1;

/**
 * A running step does not know its line count, so find where its log ends with ascending
 * single-page reads: gallop outwards from TAIL_THRESHOLD, then bisect. Resolves with the line
 * count when the log is longer than TAIL_THRESHOLD, otherwise (or on any error) with 0.
 */
export async function findLogEnd(buildId: string, stepName: string, signal?: AbortSignal): Promise<number> {
  const read = async (from: number) => {
    const lines = await api.get<LogLine[]>(`/builds/${buildId}/steps/${encodeURIComponent(stepName)}/logs`, {
      query: { from, pages: 1, sort: 'ascending' },
      signal
    });

    return Array.isArray(lines) ? lines : [];
  };

  try {
    let lo = -1;
    let loLines: LogLine[] = [];
    let hi = TAIL_THRESHOLD;
    let probe = await read(hi);

    if (!probe.length) {
      return 0;
    }
    while (probe.length) {
      lo = hi;
      loLines = probe;
      hi *= 2;
      probe = await read(hi);
    }
    while (hi - lo > API_PAGE_LINES) {
      const mid = lo + Math.floor((hi - lo) / 2);
      const lines = await read(mid);

      if (lines.length) {
        lo = mid;
        loLines = lines;
      } else {
        hi = mid;
      }
    }

    return (loLines[loLines.length - 1]?.n ?? lo + loLines.length - 1) + 1;
  } catch {
    return 0;
  }
}

export interface LogsState {
  lines: LogLine[];
  done: boolean;
  loading: boolean;
  /** Index (`n`) of the first loaded line; above 0 means earlier lines exist. */
  first: number;
}

export interface StepLogs extends LogsState {
  hasEarlier: boolean;
  loadingEarlier: boolean;
  /** Prepends the previous chunk; resolves with all lines loaded so far. */
  loadEarlier: () => Promise<LogLine[]>;
  /** Loads every earlier chunk. */
  loadAll: () => Promise<LogLine[]>;
}

/**
 * Loads a step's log and keeps following it while the step runs. Lines are
 * fetched `pages` at a time starting at `nextLine`; a finished step is read
 * until the API runs dry or `totalLines` is reached, a running one is polled
 * every LOG_RELOAD_TIMER.
 *
 * A step with more than TAIL_THRESHOLD lines is opened tail first: only the
 * last LOG_CHUNK_LINES are fetched and earlier chunks are paged in on demand
 * with `loadEarlier`. A finished step knows its length; a running one is
 * measured with `findLogEnd`, then followed from its tail.
 */
export function useStepLogs(opts: {
  buildId: string;
  stepName: string | null;
  started: boolean;
  /** Known only once the step finished. */
  totalLines?: number;
  enabled: boolean;
}): StepLogs {
  const { buildId, stepName, started, totalLines, enabled } = opts;
  const [state, setState] = useState<LogsState>({ lines: [], done: false, loading: false, first: 0 });
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const next = useRef(0);
  const first = useRef(0);
  const cache = useRef<LogLine[]>([]);
  const earlierBusy = useRef<Promise<LogLine[]> | null>(null);
  const generation = useRef(0);
  // The step the refs above belong to, and whether its log has been read to the end.
  const stepKey = useRef('');
  const complete = useRef(false);
  // Earlier lines the API answered with nothing for: storage is missing them, not the log empty.
  const earlierGap = useRef(false);
  const finished = totalLines !== undefined;
  const totalRef = useRef(totalLines);

  totalRef.current = totalLines;

  useEffect(() => {
    generation.current += 1;
    stepKey.current = `${buildId}/${stepName}`;
    complete.current = false;
    earlierGap.current = false;
    next.current = 0;
    first.current = 0;
    cache.current = [];
    earlierBusy.current = null;
    setLoadingEarlier(false);
    setState({ lines: [], done: false, loading: false, first: 0 });
  }, [buildId, stepName]);

  useEffect(() => {
    if (!enabled || !stepName || !started || !getSession().isAuthenticated) {
      return undefined;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // 500s in a row; a few are retried, so a brief API or storage failure does not end the read.
    let serverErrors = 0;
    const controller = new AbortController();
    const total = totalRef.current;

    if (total !== undefined && total > TAIL_THRESHOLD && next.current === 0 && cache.current.length === 0) {
      next.current = total - LOG_CHUNK_LINES;
      first.current = next.current;
    }

    // A running step of unknown length: look for its end so a long log opens at the tail.
    const probe = total === undefined && next.current === 0 && cache.current.length === 0;

    const tick = async () => {
      let more = false;
      let failed = false;

      setState(s => ({ ...s, loading: true }));
      try {
        const lines = await api.get<LogLine[]>(`/builds/${buildId}/steps/${encodeURIComponent(stepName)}/logs`, {
          query: { from: next.current, pages: config.defaultLogPageSize, sort: 'ascending' },
          signal: controller.signal
        });

        if (cancelled) {
          return;
        }
        serverErrors = 0;
        if (Array.isArray(lines) && lines.length) {
          next.current = (lines[lines.length - 1]?.n ?? next.current - 1) + 1;
          cache.current = cache.current.concat(lines);
          more = true;
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        const retry500 = e instanceof ApiError && e.status === 500 && serverErrors < MAX_LOG_500_RETRIES;

        if (retry500) {
          serverErrors += 1;
          setState(s => ({ ...s, loading: false }));
          timer = setTimeout(tick, config.logReloadTimer * 2 ** serverErrors);

          return;
        }
        if (e instanceof ApiError && [403, 404, 500].includes(e.status)) {
          // Stop reading, but this is not the end of the log: loadAll refuses a partial download.
          complete.current = false;
          setState(s => ({ ...s, done: true, loading: false }));

          return;
        }
        // Anything else (a 502, a dropped connection) is not the end of the log: retry it.
        failed = true;
      }

      const finalTotal = totalRef.current;
      const done = !failed && finalTotal !== undefined && (!more || next.current >= finalTotal);

      // The API answers a missing storage page with nothing, so running dry early ends the read
      // but leaves the log incomplete; only reaching the step's line count completes it.
      complete.current = done && next.current >= (finalTotal ?? 0);

      setState({ lines: cache.current, done, loading: false, first: first.current });
      if (done) {
        return;
      }
      // Keep draining immediately while data keeps coming, otherwise poll.
      timer = setTimeout(tick, more ? 0 : config.logReloadTimer);
    };

    const start = async () => {
      if (probe) {
        const end = await findLogEnd(buildId, stepName, controller.signal);

        if (cancelled) {
          return;
        }
        if (end > TAIL_THRESHOLD && next.current === 0 && cache.current.length === 0) {
          next.current = end - LOG_CHUNK_LINES;
          first.current = next.current;
        }
      }
      await tick();
    };

    void start();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) {
        clearTimeout(timer);
      }
    };
    // `finished` restarts the loop so a step that ends gets its final read.
  }, [buildId, stepName, started, enabled, finished]);

  const loadEarlier = useCallback((): Promise<LogLine[]> => {
    if (stepKey.current !== `${buildId}/${stepName}`) {
      // A callback kept from before a step change must not page that step into this one's log.
      return Promise.reject(new Error('The step changed'));
    }
    if (earlierBusy.current) {
      return earlierBusy.current;
    }
    if (first.current <= 0 || !stepName) {
      return Promise.resolve(cache.current);
    }

    const gen = generation.current;
    const end = first.current;
    const from = Math.max(0, end - LOG_CHUNK_LINES);
    const run = (async () => {
      setLoadingEarlier(true);
      try {
        const lines = await api.get<LogLine[]>(`/builds/${buildId}/steps/${encodeURIComponent(stepName)}/logs`, {
          query: { from, pages: pagesCovering(from, end), sort: 'ascending' }
        });

        if (gen !== generation.current) {
          return cache.current;
        }
        const older = Array.isArray(lines) ? lines.filter(l => l.n === undefined || l.n < end) : [];
        const numbered = older.filter(l => l.n !== undefined && l.n >= from);

        cache.current = older.concat(cache.current);
        // An empty or short answer means storage is missing lines: the log has a gap. An empty one
        // also means nothing earlier is stored, so stop offering more.
        if (!older.length || (numbered.length === older.length && numbered.length < end - from)) {
          earlierGap.current = true;
        }
        first.current = older.length ? from : 0;
        setState(s => ({ ...s, lines: cache.current, first: first.current }));
      } catch {
        // Leave `first` alone so the user can retry.
      } finally {
        if (gen === generation.current) {
          earlierBusy.current = null;
          setLoadingEarlier(false);
        }
      }

      return cache.current;
    })();

    earlierBusy.current = run;

    return run;
  }, [buildId, stepName]);

  const loadAll = useCallback(async () => {
    const gen = generation.current;
    let guard = 0;

    while (first.current > 0 && guard < 10_000) {
      const before = first.current;

      guard += 1;
      await loadEarlier();
      if (gen !== generation.current) {
        throw new Error('The step changed');
      }
      if (first.current >= before) {
        break;
      }
    }
    // loadEarlier swallows a failed request so the button can retry, and a failed forward read
    // is retried later; a download must not quietly save part of the log, so say it is incomplete.
    if (first.current > 0 || earlierGap.current || !complete.current) {
      throw new Error('The log is not fully loaded');
    }

    return cache.current;
  }, [loadEarlier]);

  return useMemo(
    () => ({ ...state, hasEarlier: state.first > 0, loadingEarlier, loadEarlier, loadAll }),
    [state, loadingEarlier, loadEarlier, loadAll]
  );
}
