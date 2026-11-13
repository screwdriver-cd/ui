import type { WorkflowEdge } from '../types';

export type JoinKind = 'AND' | 'OR';

export interface JoinInfo {
  kind: JoinKind;
  /** AND: the sources that must all finish. OR: every source (any one triggers). */
  inputs: string[];
  /** AND joins only: other sources that trigger the node on their own. */
  alternatives: string[];
}

/**
 * Join semantics per destination node. Edges marked `join: true` into the same
 * node form an AND join (wait for all of them); with fewer than two such edges
 * but several incoming edges the node is an OR join (any parent triggers it).
 * Nodes with fewer than two incoming edges are not joins and are omitted.
 */
export function computeJoins(edges: WorkflowEdge[]): Map<string, JoinInfo> {
  const incoming = new Map<string, WorkflowEdge[]>();

  edges.forEach(e => {
    const l = incoming.get(e.dest);

    if (l) l.push(e);
    else incoming.set(e.dest, [e]);
  });

  const result = new Map<string, JoinInfo>();

  incoming.forEach((list, dest) => {
    const and = list.filter(e => e.join);

    if (and.length >= 2) {
      result.set(dest, {
        kind: 'AND',
        inputs: and.map(e => e.src),
        alternatives: list.filter(e => !e.join).map(e => e.src)
      });
    } else if (list.length >= 2) {
      result.set(dest, { kind: 'OR', inputs: list.map(e => e.src), alternatives: [] });
    }
  });

  return result;
}
