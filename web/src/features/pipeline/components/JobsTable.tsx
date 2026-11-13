import type { Build, Job, WorkflowGraph, WorkflowGraphNode } from '../types';
import {
  getDisplayName,
  getStageName,
  isVirtualJob,
  sortJobsTopologically
} from '../utils/job';

/** An event's jobs in workflow order with their build in the event (table view, start dialog). */
export interface JobRow {
  job: Job;
  displayName: string;
  stage?: string;
  build?: Build;
  status: string;
}

/**
 * The jobs of a past event are the ones in its own workflow graph, shown with their current
 * record when the job still exists (Ember: `getJobsFromWorkflowGraph`). Jobs removed since keep
 * their row and build; jobs added since are not part of the event.
 */
export function jobsFromGraph(
  graph: WorkflowGraph | undefined,
  jobs: Job[] | undefined
): Job[] {
  const current = new Map((jobs ?? []).map(j => [j.id, j]));

  return (graph?.nodes ?? [])
    .filter(n => n.id && !n.name.startsWith('sd@'))
    .map(n => current.get(n.id as number) ?? removedJob(n));
}

/**
 * A job deleted since the event ran. The API archives it and never starts it again; its graph
 * node still says whether it was virtual, and its display and stage names.
 */
function removedJob(node: WorkflowGraphNode): Job {
  const annotations: Record<string, unknown> = {};

  if (node.virtual === true) {
    annotations['screwdriver.cd/virtualJob'] = true;
  }
  if (typeof node.displayName === 'string' && node.displayName) {
    annotations['screwdriver.cd/displayName'] = node.displayName;
  }

  return {
    id: node.id,
    name: node.name,
    archived: true,
    permutations: [
      {
        annotations,
        ...(typeof node.stageName === 'string' ? { stage: { name: node.stageName } } : {})
      }
    ]
  } as Job;
}

export function buildRows(
  jobs: Job[],
  builds: Build[] | undefined,
  graph: WorkflowGraph | undefined,
  prNum?: number
): JobRow[] {
  const byJob = new Map<number, Build>();

  [...(builds ?? [])]
    .sort((a, b) => a.id - b.id)
    .forEach(b => byJob.set(b.jobId, b));

  const visible = jobs.filter(j => !isVirtualJob(j));
  const ordered = sortJobsTopologically(
    visible.map(j => ({
      ...j,
      name: prNum ? j.name.slice(`PR-${prNum}:`.length) : j.name,
      original: j
    })),
    graph
  );

  return ordered.map(o => {
    const job = o.original;
    const build = byJob.get(job.id);

    return {
      job,
      displayName: getDisplayName(job, prNum),
      stage: getStageName(job),
      build,
      status: build?.status ?? 'CREATED'
    };
  });
}
