import type {
  WorkflowEdge,
  WorkflowGraphData
} from '~/features/workflow-graph';

/**
 * Port of Ember's `removeBranch` (app/utils/graph-tools.js), without mutating
 * its input. Starting at `start` (typically `~pr` or `~commit`) it removes that
 * node and, recursively, every downstream node that is left without incoming
 * edges once the edges leaving the removed node are gone.
 *
 * Consequences kept from the original:
 *  - a node that still has an incoming edge from anywhere else survives (a
 *    job reached from `~commit` and from a connected pipeline stays);
 *  - the call does nothing when `start` itself has incoming edges;
 *  - nodes only reachable through a cycle are never removed (their own
 *    incoming edges keep them alive).
 */
export function removeBranch(
  graph: WorkflowGraphData,
  start: string
): WorkflowGraphData {
  const nodes = [...graph.nodes];
  let edges = [...graph.edges];

  const remove = (name: string | undefined) => {
    if (!name || !nodes.some(n => n.name === name)) {
      return;
    }
    if (edges.some(e => e.dest === name)) {
      return;
    }

    // Walk a snapshot: deeper calls drop edges from `edges` while we iterate.
    const snapshot: WorkflowEdge[] = edges.slice();

    for (const edge of snapshot) {
      if (edge.src === name) {
        edges = edges.filter(e => e !== edge);
        remove(nodes.find(n => n.name === edge.dest)?.name);
      }
    }

    const index = nodes.findIndex(n => n.name === name);

    if (index >= 0) {
      nodes.splice(index, 1);
    }
  };

  remove(start);

  return { ...graph, nodes, edges };
}

/**
 * What the visualizer does once connected pipelines are known: the selected
 * pipeline's `~pr` and `~commit` entry points and the jobs only they lead to
 * are dropped, so the merged graph starts at the connection points.
 */
export function removeEntryBranches(
  graph: WorkflowGraphData
): WorkflowGraphData {
  return removeBranch(removeBranch(graph, '~pr'), '~commit');
}
