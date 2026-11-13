import type { Job, WorkflowGraph } from '../types';

export function getDisplayName(
  job: Pick<Job, 'name' | 'permutations'>,
  prNum?: number
): string {
  const jobName = prNum ? job.name.slice(`PR-${prNum}:`.length) : job.name;
  const annotations = job.permutations?.[0]?.annotations;
  const display = annotations?.['screwdriver.cd/displayName'];

  return typeof display === 'string' && display ? display : jobName;
}

export const getStageName = (
  job: Pick<Job, 'permutations'>
): string | undefined => job.permutations?.[0]?.stage?.name;

export const isVirtualJob = (job: Pick<Job, 'permutations'>): boolean =>
  Boolean(job.permutations?.[0]?.annotations?.['screwdriver.cd/virtualJob']);

/**
 * Topological level of every job name (longest path from a root), so a jobs
 * table can list jobs in the order the workflow runs them. Cycles and
 * unreachable nodes get level 0 instead of recursing forever.
 */
export function topologicalLevels(graph?: WorkflowGraph): Map<string, number> {
  const levels = new Map<string, number>();

  if (!graph) {
    return levels;
  }

  const names = new Set(graph.nodes.map(n => n.name));
  const edges = graph.edges.filter(
    e => names.has(e.src) && names.has(e.dest) && e.src !== e.dest
  );
  const indegree = new Map<string, number>([...names].map(n => [n, 0]));

  edges.forEach(e => indegree.set(e.dest, (indegree.get(e.dest) ?? 0) + 1));

  const queue = [...names].filter(n => indegree.get(n) === 0);

  queue.forEach(n => levels.set(n, 0));

  while (queue.length) {
    const name = queue.shift() as string;

    for (const edge of edges.filter(e => e.src === name)) {
      levels.set(
        edge.dest,
        Math.max(levels.get(edge.dest) ?? 0, (levels.get(name) ?? 0) + 1)
      );
      indegree.set(edge.dest, (indegree.get(edge.dest) ?? 1) - 1);
      if (indegree.get(edge.dest) === 0) {
        queue.push(edge.dest);
      }
    }
  }

  names.forEach(n => {
    if (!levels.has(n)) {
      levels.set(n, 0);
    }
  });

  return levels;
}

/** Orders jobs by workflow level, then name. Jobs missing from the graph go last. */
export function sortJobsTopologically<T extends { name: string }>(
  jobs: T[],
  graph?: WorkflowGraph
): T[] {
  const levels = topologicalLevels(graph);

  return [...jobs].sort((a, b) => {
    const la = levels.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const lb = levels.get(b.name) ?? Number.MAX_SAFE_INTEGER;

    return la === lb
      ? a.name.localeCompare(b.name, undefined, { numeric: true })
      : la - lb;
  });
}

const STATUS_ORDER: Record<string, number> = {
  FAILURE: 1,
  ABORTED: 1,
  WARNING: 2,
  UNSTABLE: 2,
  RUNNING: 3,
  CREATED: 3,
  QUEUED: 3,
  BLOCKED: 3,
  SUCCESS: 4,
  COLLAPSED: 5,
  FROZEN: 5
};

/** Event table order: red, yellow, blue, green, grey, then jobs that did not run. */
export function compareByStatus(
  a: { status?: string; stageName?: string; name: string },
  b: { status?: string; stageName?: string; name: string }
): number {
  if (a.status === b.status) {
    if (a.stageName === b.stageName) {
      return a.name.localeCompare(b.name);
    }
    if (a.stageName && b.stageName) {
      return a.stageName.localeCompare(b.stageName);
    }

    return a.stageName ? -1 : 1;
  }

  const rank = (s?: string) => (s ? STATUS_ORDER[s] ?? 6 : 6);

  return rank(a.status) - rank(b.status);
}

export function canJobBeTriggered(
  job: Pick<Job, 'state' | 'permutations'>
): boolean {
  if (job.state === 'DISABLED') {
    return false;
  }

  return (
    job.permutations?.[0]?.annotations?.[
      'screwdriver.cd/manualStartEnabled'
    ] !== false
  );
}

export const STOPPABLE_STATUSES = ['RUNNING', 'QUEUED', 'BLOCKED', 'FROZEN'];
