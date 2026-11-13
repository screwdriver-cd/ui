import type { WorkflowEdge, WorkflowNode } from '../types';

export interface Graphish<N extends WorkflowNode = WorkflowNode, E extends WorkflowEdge = WorkflowEdge> {
  nodes: N[];
  edges: E[];
}

/** Subgraph reachable from `startNode` (PR prefix is trimmed). Cycle safe. */
export function subgraphFilter<N extends WorkflowNode, E extends WorkflowEdge>(
  graph: Graphish<N, E>,
  startNode?: string
): Graphish<N, E> {
  const { nodes, edges } = graph;

  if (!startNode || !nodes.length) {
    return { nodes, edges };
  }

  const start = /^PR-[0-9]+:/.test(startNode) ? startNode.split(':')[1] : startNode;
  const out = new Map<string, string[]>();

  edges.forEach(e => {
    const l = out.get(e.src);

    if (l) l.push(e.dest);
    else out.set(e.src, [e.dest]);
  });

  const visited = new Set([start]);
  const queue = [start];

  while (queue.length) {
    const cur = queue.shift() as string;

    (out.get(cur) ?? []).forEach(d => {
      if (!visited.has(d)) {
        visited.add(d);
        queue.push(d);
      }
    });
  }

  return {
    nodes: nodes.filter(n => visited.has(n.name)),
    edges: edges.filter(e => visited.has(e.src) && visited.has(e.dest))
  };
}

export function reverseGraph<N extends WorkflowNode, E extends WorkflowEdge>(graph: Graphish<N, E>): Graphish<N, E> {
  return {
    nodes: structuredClone(graph.nodes),
    edges: graph.edges.map(e => ({ ...e, src: e.dest, dest: e.src }))
  };
}

export const isRoot = (edges: WorkflowEdge[], name: string): boolean => !edges.some(e => e.dest === name);

/** Number of nodes visited walking from `start` (ignores `~` triggers). Cycle safe. */
export function graphDepth(edges: WorkflowEdge[], start: string): number {
  if (!Array.isArray(edges)) return Number.MAX_VALUE;

  const visited = new Set<string>();
  const stack = [start];
  const seen = new Set<string>();

  while (stack.length) {
    const cur = stack.pop() as string;

    if (seen.has(cur)) continue;
    seen.add(cur);

    if (!cur.startsWith('~')) visited.add(cur);

    edges.forEach(e => {
      if (e.src === cur) {
        visited.add(e.dest);
        stack.push(e.dest);
      }
    });
  }

  return visited.size;
}
