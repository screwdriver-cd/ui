import type {
  WorkflowEdge,
  WorkflowGraphData,
  WorkflowNode
} from '~/features/workflow-graph';
import { removeEntryBranches } from './removeBranch';

export interface VizPipeline {
  id: number | string;
  name?: string;
  scmRepo?: { name?: string };
  workflowGraph?: WorkflowGraphData;
}

const SPECIAL = ['~pr', '~commit'];

export const isExternalTrigger = (name: string) => /^~?sd@/.test(name);

/** Prefix a job name with its pipeline, like Ember's `prefixJobName`. */
export function prefixJobName(
  name: string,
  pipelineId: number | string
): string {
  return SPECIAL.includes(name) || isExternalTrigger(name)
    ? name
    : `~sd@${pipelineId}:${name}`;
}

/** Pipeline ids referenced by external triggers in a workflow graph, excluding itself. */
export function connectedPipelineIds(pipeline: VizPipeline): string[] {
  const ids = new Set<string>();

  for (const edge of pipeline.workflowGraph?.edges ?? []) {
    for (const name of [edge.src, edge.dest]) {
      if (isExternalTrigger(name)) {
        const id = /^~?sd@(\d+):/.exec(name)?.[1];

        if (id) {
          ids.add(id);
        }
      }
    }
  }
  ids.delete(String(pipeline.id));

  return [...ids];
}

/**
 * One graph with every job namespaced by pipeline. When the pipeline has
 * connected pipelines, its ~pr/~commit branches are removed (removeBranch:
 * only jobs reachable solely from them go) and the connected pipelines' jobs
 * and edges (minus their own entry points) are merged in.
 */
export function mergeGraphs(
  selected: VizPipeline,
  connected: VizPipeline[]
): WorkflowGraphData {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  const nodeNames = new Set<string>();
  const edgeKeys = new Set<string>();
  const addNode = (n: WorkflowNode, name: string) => {
    if (!nodeNames.has(name)) {
      nodeNames.add(name);
      nodes.push({ ...n, name });
    }
  };
  const addEdge = (e: WorkflowEdge, src: string, dest: string) => {
    const key = `${src}\u0000${dest}`;

    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push({ ...e, src, dest });
    }
  };
  const include = (
    pipeline: VizPipeline,
    graph: WorkflowGraphData | undefined,
    dropEntry: boolean
  ) => {
    graph?.nodes.forEach(n => {
      if (!(dropEntry && SPECIAL.includes(n.name))) {
        addNode(n, prefixJobName(n.name, pipeline.id));
      }
    });
    graph?.edges.forEach(e => {
      if (
        !(dropEntry && (SPECIAL.includes(e.src) || SPECIAL.includes(e.dest)))
      ) {
        addEdge(
          e,
          prefixJobName(e.src, pipeline.id),
          prefixJobName(e.dest, pipeline.id)
        );
      }
    });
  };
  const hasConnected = connected.length > 0;
  const selectedGraph = selected.workflowGraph;

  // Ember prunes the selected pipeline's entry branches; the connected pipelines
  // only lose their own ~pr/~commit nodes and edges.
  include(
    selected,
    hasConnected && selectedGraph
      ? removeEntryBranches(selectedGraph)
      : selectedGraph,
    false
  );
  connected.forEach(p => include(p, p.workflowGraph, true));

  return { nodes, edges };
}

/** Names of the merged graph's nodes that belong to one pipeline (prefixed `~sd@<id>:`). */
export function pipelineNodeNames(
  graph: WorkflowGraphData,
  pipelineId: number | string
): Set<string> {
  const prefix = `~sd@${pipelineId}:`;

  return new Set(
    graph.nodes.filter(n => n.name.startsWith(prefix)).map(n => n.name)
  );
}
