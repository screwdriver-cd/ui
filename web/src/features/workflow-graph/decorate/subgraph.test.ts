import { describe, expect, it } from 'vitest';
import { COMPLEX_GRAPH, CYCLE_GRAPH } from '../fixtures/graphs';
import { graphDepth, isRoot, reverseGraph, subgraphFilter } from './subgraph';

// Fixture-based depth/root/subgraph/reverse cases live in decorate.test.ts.

describe('subgraphFilter', () => {
  it('terminates on cycles and keeps the back edge inside the reachable set', () => {
    const r = subgraphFilter(CYCLE_GRAPH, 'b');

    expect(r.nodes.map(n => n.name)).toEqual(['a', 'b', 'c']);
    expect(r.edges).toEqual([
      { src: 'a', dest: 'b' },
      { src: 'b', dest: 'c' },
      { src: 'c', dest: 'a' }
    ]);
  });

  it('drops edges into the subgraph from nodes outside it', () => {
    const r = subgraphFilter(COMPLEX_GRAPH, 'main');

    expect(r.nodes.map(n => n.name)).toEqual(['main', 'A', 'B', 'C', 'D']);
    expect(r.edges.some(e => e.src.startsWith('~'))).toBe(false);
    expect(r.edges).toHaveLength(5);
  });

  it('returns an empty graph for a start node that is not in the graph', () => {
    expect(subgraphFilter(COMPLEX_GRAPH, 'missing')).toEqual({
      nodes: [],
      edges: []
    });
  });

  it('only strips a PR-<number>: prefix', () => {
    expect(
      subgraphFilter(COMPLEX_GRAPH, 'PR-12:B').nodes.map(n => n.name)
    ).toEqual(['B', 'D']);
    expect(subgraphFilter(COMPLEX_GRAPH, 'PR-x:B').nodes).toEqual([]);
  });

  it('returns the original arrays when there is no start node or no nodes', () => {
    const empty = { nodes: [], edges: [{ src: 'a', dest: 'b' }] };

    expect(subgraphFilter(COMPLEX_GRAPH, '').nodes).toBe(COMPLEX_GRAPH.nodes);
    expect(subgraphFilter(empty, 'a').edges).toBe(empty.edges);
  });
});

describe('reverseGraph', () => {
  it('deep-copies nodes and keeps other edge attributes', () => {
    const graph = {
      nodes: [{ name: 'a' }, { name: 'b' }],
      edges: [{ src: 'a', dest: 'b', join: true }]
    };
    const rev = reverseGraph(graph);

    expect(rev.edges).toEqual([{ src: 'b', dest: 'a', join: true }]);
    rev.nodes[0]!.name = 'changed';
    expect(graph.nodes[0]!.name).toBe('a');
  });
});

describe('graphDepth / isRoot', () => {
  it('does not count a ~ start node but counts every job reached from it', () => {
    const edges = [
      { src: '~commit', dest: 'a' },
      { src: 'a', dest: 'b' }
    ];

    expect(graphDepth(edges, '~commit')).toBe(2);
    expect(graphDepth(edges, 'a')).toBe(2);
    expect(graphDepth(edges, 'b')).toBe(1);
    expect(graphDepth([], 'lonely')).toBe(1);
  });

  it('counts a shared descendant once', () => {
    expect(graphDepth(COMPLEX_GRAPH.edges, 'main')).toBe(5);
  });

  it('treats a node with no incoming edges, or one not in the graph, as a root', () => {
    expect(isRoot(CYCLE_GRAPH.edges, 'x')).toBe(false);
    expect(isRoot(CYCLE_GRAPH.edges, '~commit')).toBe(true);
    expect(isRoot([], 'anything')).toBe(true);
  });
});
