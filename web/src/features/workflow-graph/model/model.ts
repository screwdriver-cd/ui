import { DirectedGraph } from 'graphology';
import { hasCycle as dagHasCycle } from 'graphology-dag';
import type { WorkflowEdge, WorkflowGraphData, WorkflowNode } from '../types';

export type EdgeAttrs = { join?: boolean };
export type WorkflowModel = DirectedGraph<Readonly<WorkflowNode>, Readonly<EdgeAttrs>>;

export interface DroppedEdge {
  edge: WorkflowEdge;
  reason: 'missing-node' | 'self-loop' | 'duplicate';
}

export interface BuildModelOptions {
  /** Called once per dropped edge. Defaults to console.warn. */
  log?: (message: string, edge: WorkflowEdge) => void;
}

/**
 * Builds an immutable-by-convention graphology model from the API workflowGraph.
 * Input is copied; node/edge attribute objects are frozen. Edges that point at
 * missing nodes, self loops and duplicates are dropped and reported.
 */
export function buildModel(
  input: WorkflowGraphData,
  { log = (m, e) => console.warn(m, e) }: BuildModelOptions = {}
): { graph: WorkflowModel; dropped: DroppedEdge[] } {
  const graph: WorkflowModel = new DirectedGraph({ multi: false, allowSelfLoops: false });
  const dropped: DroppedEdge[] = [];

  for (const n of input.nodes) {
    if (!graph.hasNode(n.name)) {
      graph.addNode(n.name, Object.freeze({ ...n }));
    }
  }

  for (const e of input.edges) {
    let reason: DroppedEdge['reason'] | null = null;

    if (!graph.hasNode(e.src) || !graph.hasNode(e.dest)) {
      reason = 'missing-node';
    } else if (e.src === e.dest) {
      reason = 'self-loop';
    } else if (graph.hasDirectedEdge(e.src, e.dest)) {
      reason = 'duplicate';
    }

    if (reason) {
      dropped.push({ edge: e, reason });
      log(`workflow-graph: dropped edge ${e.src} -> ${e.dest} (${reason})`, e);
    } else {
      graph.addDirectedEdge(e.src, e.dest, Object.freeze(e.join === undefined ? {} : { join: e.join }));
    }
  }

  return { graph, dropped };
}

export const nodeList = (graph: WorkflowModel): WorkflowNode[] =>
  graph.mapNodes((_, attrs) => attrs as WorkflowNode);

export const edgeList = (graph: WorkflowModel): WorkflowEdge[] =>
  graph.mapEdges((_, attrs, src, dest) => ({ src, dest, ...attrs }));

export const hasCycle = (graph: WorkflowModel): boolean => dagHasCycle(graph);

function reach(graph: WorkflowModel, start: string, next: (n: string) => string[]): Set<string> {
  const seen = new Set<string>();

  if (!graph.hasNode(start)) {
    return seen;
  }

  const stack = [start];

  while (stack.length) {
    const cur = stack.pop() as string;

    for (const n of next(cur)) {
      if (n !== start && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }

  return seen;
}

/** All nodes reachable from `name` (excluding itself). Cycle safe. */
export const descendantsOf = (graph: WorkflowModel, name: string): Set<string> =>
  reach(graph, name, n => graph.outNeighbors(n));

/** All nodes that can reach `name` (excluding itself). Cycle safe. */
export const ancestorsOf = (graph: WorkflowModel, name: string): Set<string> =>
  reach(graph, name, n => graph.inNeighbors(n));

/** Nodes with no incoming edge, in input order. */
export const rootNames = (graph: WorkflowModel): string[] =>
  graph.filterNodes(n => graph.inDegree(n) === 0);
