import type { Build, Job, WorkflowGraph } from '../types';

export const FAILED_STATUSES = ['FAILURE', 'ABORTED'];

const stripPr = (name: string) => name.replace(/^PR-\d+:/, '');

/**
 * Names of the jobs upstream of `jobName` (transitively, in the event's workflow graph) whose
 * latest build in this event failed. Triggers such as `~commit` are never reported.
 */
export function failedUpstreamJobs(
  graph: WorkflowGraph | undefined,
  jobName: string,
  builds: Build[] | undefined,
  jobs: Array<Pick<Job, 'id' | 'name'>>
): string[] {
  if (!graph || !builds?.length) {
    return [];
  }

  const target = stripPr(jobName);
  const incoming = new Map<string, string[]>();

  graph.edges.forEach(e =>
    incoming.set(stripPr(e.dest), [
      ...(incoming.get(stripPr(e.dest)) ?? []),
      stripPr(e.src)
    ])
  );

  const ancestors = new Set<string>();
  const stack = [target];

  while (stack.length) {
    for (const src of incoming.get(stack.pop() as string) ?? []) {
      if (src !== target && !ancestors.has(src)) {
        ancestors.add(src);
        stack.push(src);
      }
    }
  }

  const nameById = new Map<number, string>();

  graph.nodes.forEach(
    n => n.id !== undefined && nameById.set(n.id, stripPr(n.name))
  );
  jobs.forEach(j => nameById.has(j.id) || nameById.set(j.id, stripPr(j.name)));

  const latest = new Map<string, Build>();

  builds.forEach(b => {
    const name = nameById.get(b.jobId);
    const seen = name ? latest.get(name) : undefined;

    if (name && (!seen || b.id > seen.id)) {
      latest.set(name, b);
    }
  });

  return [...ancestors].filter(
    name =>
      !name.startsWith('~') &&
      FAILED_STATUSES.includes(latest.get(name)?.status ?? '')
  );
}
