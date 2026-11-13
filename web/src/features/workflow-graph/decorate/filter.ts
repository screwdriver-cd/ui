import type { WorkflowGraphData } from '../types';

const EXTERNAL_JOB_PREFIX = 'sd@';

/**
 * Removes `sd@...` external job nodes that are leaves (nothing is triggered
 * from them), together with the edges pointing at them.
 */
export function getFilteredGraph(graph: WorkflowGraphData): WorkflowGraphData {
  if (!graph.nodes.some(n => n.name.startsWith(EXTERNAL_JOB_PREFIX))) {
    return graph;
  }

  const keep = new Set<string>();

  graph.edges.forEach(e => {
    if (e.src.startsWith(EXTERNAL_JOB_PREFIX)) keep.add(e.src);
  });

  return {
    nodes: graph.nodes.filter(n => !n.name.startsWith(EXTERNAL_JOB_PREFIX) || keep.has(n.name)),
    edges: graph.edges.filter(e => !e.dest.startsWith(EXTERNAL_JOB_PREFIX) || keep.has(e.dest))
  };
}

export interface DownstreamTrigger {
  jobName: string;
  triggers: string[];
}

/** Filtered graph plus a `~sd-<job>-triggers` node per job that triggers other pipelines. */
export function withDownstreamTriggers(
  graph: WorkflowGraphData,
  triggers?: DownstreamTrigger[]
): WorkflowGraphData {
  const filtered = getFilteredGraph(graph);

  if (!triggers) {
    return filtered;
  }

  const result = structuredClone(filtered);

  triggers.forEach(t => {
    if (t.triggers.length > 0) {
      result.nodes.push({ name: `~sd-${t.jobName}-triggers`, triggers: t.triggers, status: 'DOWNSTREAM_TRIGGER' });
      result.edges.push({ src: t.jobName, dest: `~sd-${t.jobName}-triggers` });
    }
  });

  return result;
}
