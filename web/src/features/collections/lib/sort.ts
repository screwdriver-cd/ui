import type { LastEventInfo } from './metrics';
import type { PipelineSummary } from './types';

export type SortKey = 'pipelineName' | 'branch' | 'lastRun' | 'duration' | 'lastRunStatus' | 'history';
export type SortOrder = 'asc' | 'desc';

export interface SortablePipeline {
  pipeline: PipelineSummary;
  last: LastEventInfo | undefined;
  failedBuildCount: number;
}

/** Same priority order as app/utils/sort-functions.js. */
const STATUS_PRIORITY = [
  'success',
  'running',
  'queued',
  'created',
  'unstable',
  'aborted',
  'collapsed',
  'frozen',
  'failure',
  'blocked'
];

const byName = (a: SortablePipeline, b: SortablePipeline) =>
  a.pipeline.scmRepo.name.localeCompare(b.pipeline.scmRepo.name, 'en', { sensitivity: 'base' });

const comparators: Record<SortKey, (a: SortablePipeline, b: SortablePipeline) => number> = {
  pipelineName: byName,
  branch: (a, b) => a.pipeline.scmRepo.branch.localeCompare(b.pipeline.scmRepo.branch, 'en', { sensitivity: 'base' }),
  lastRun: (a, b) => new Date(a.last?.createTime ?? 0).getTime() - new Date(b.last?.createTime ?? 0).getTime(),
  duration: (a, b) => (a.last?.duration ?? 0) - (b.last?.duration ?? 0),
  lastRunStatus: (a, b) => STATUS_PRIORITY.indexOf(a.last?.status ?? '') - STATUS_PRIORITY.indexOf(b.last?.status ?? ''),
  history: (a, b) => a.failedBuildCount - b.failedBuildCount
};

/**
 * Pipelines whose events are not known yet (or that never ran) always go last,
 * like the Ember view put `build-empty` pipelines at the end.
 */
export function sortPipelines(items: SortablePipeline[], key: SortKey, order: SortOrder): SortablePipeline[] {
  if (key === 'pipelineName') {
    const sortedByName = [...items].sort(byName);

    return order === 'desc' ? sortedByName.reverse() : sortedByName;
  }

  const known = items.filter(item => item.last && !item.last.empty);
  const unknown = items.filter(item => !item.last || item.last.empty).sort(byName);
  const sorted = [...known].sort(comparators[key]);

  return [...(order === 'desc' ? sorted.reverse() : sorted), ...unknown];
}
