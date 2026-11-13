import type { Pipeline } from '../types';

export const isInactive = (p: Pipeline) => p.state === 'INACTIVE';
export const isActive = (p: Pipeline) => p.state === 'ACTIVE';
export const isDisabled = (p: Pipeline) => p.state === 'DISABLED';

export function hasSonarBadge(p: Pipeline): boolean {
  const sonar = p.badges?.sonar;

  return Boolean(sonar?.name && sonar?.uri);
}

/** Ember `getDisabledPipelineMessage`: who disabled the pipeline, when, and why. */
export function disabledMessage(
  p: Pipeline,
  t: (id: string, values?: Record<string, string>) => string,
  relative: (value: string) => string
): string {
  const user = p.stateChanger;
  const time = p.stateChangeTime ? relative(p.stateChangeTime) : undefined;
  const parts = [t('pipeline.header.disabled')];

  if (user && time) {
    parts.push(t('pipeline.header.disabledByAt', { user, time }));
  } else if (user) {
    parts.push(t('pipeline.header.disabledBy', { user }));
  } else if (time) {
    parts.push(t('pipeline.header.disabledAt', { time }));
  }
  if (p.stateChangeMessage) {
    parts.push(t('pipeline.header.reason', { reason: p.stateChangeMessage }));
  }

  return parts.join(' ');
}

export const branchLabel =(p: Pipeline) => {
  const repo = p.scmRepo;

  if (!repo) {
    return '';
  }

  return repo.rootDir ? `${repo.branch}:${repo.rootDir}` : repo.branch;
};

/** Job ids for the downtime-metrics setting after including/excluding `jobs`. */
export function getJobIdsForPayload(
  pipeline: Pipeline,
  jobs: Array<{ id: number }>,
  include: boolean
): number[] {
  const ids = new Set(pipeline.settings?.metricsDowntimeJobs ?? []);

  jobs.forEach(job => (include ? ids.add(job.id) : ids.delete(job.id)));

  return [...ids].sort((a, b) => a - b);
}

export function canRestrictPr(p: Pipeline): 'none' | 'fork' | 'branch' | 'all' {
  const value = p.annotations?.['screwdriver.cd/restrictPR'];

  return value === 'fork' || value === 'branch' || value === 'all'
    ? value
    : 'none';
}

/** The per-pipeline "show PR jobs" preference: stored as `settings[pipelineId].showPRJobs`, on by default. */
export const showPrJobsOf = (
  settings: Record<string, unknown> | undefined,
  pipelineId: number
) =>
  (settings?.[String(pipelineId)] as { showPRJobs?: boolean } | undefined)
    ?.showPRJobs ?? true;
