import { describe, expect, it, vi } from 'vitest';
import {
  buildModel,
  descendantsOf,
  ancestorsOf,
  rootNames,
  hasCycle,
  edgeList,
  nodeList
} from './model';

const g = {
  nodes: [{ name: '~commit' }, { name: 'main', id: 1 }, { name: 'A', id: 2 }, { name: 'B', id: 3 }],
  edges: [
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'A' },
    { src: 'main', dest: 'B', join: true }
  ]
};

describe('buildModel', () => {
  it('keeps node order and attributes', () => {
    const { graph } = buildModel(g);

    expect(nodeList(graph).map(n => n.name)).toEqual(['~commit', 'main', 'A', 'B']);
    expect(graph.getNodeAttributes('main').id).toBe(1);
    expect(edgeList(graph)).toEqual([
      { src: '~commit', dest: 'main' },
      { src: 'main', dest: 'A' },
      { src: 'main', dest: 'B', join: true }
    ]);
  });

  it('does not mutate or alias the input, and attributes are frozen', () => {
    const input = structuredClone(g);
    const { graph } = buildModel(input);

    expect(input).toEqual(g);
    expect(Object.isFrozen(graph.getNodeAttributes('main'))).toBe(true);
    input.nodes[1]!.id = 99;
    expect(graph.getNodeAttributes('main').id).toBe(1);
  });

  it('drops edges to missing nodes, self loops and duplicates and logs them', () => {
    const log = vi.fn();
    const { graph, dropped } = buildModel(
      {
        nodes: [{ name: 'a' }, { name: 'b' }],
        edges: [
          { src: 'a', dest: 'b' },
          { src: 'a', dest: 'b' },
          { src: 'a', dest: 'zzz' },
          { src: 'nope', dest: 'b' },
          { src: 'b', dest: 'b' }
        ]
      },
      { log }
    );

    expect(graph.size).toBe(1);
    expect(dropped.map(d => d.reason)).toEqual(['duplicate', 'missing-node', 'missing-node', 'self-loop']);
    expect(log).toHaveBeenCalledTimes(4);
  });

  it('ignores duplicate node names', () => {
    const { graph } = buildModel({ nodes: [{ name: 'a' }, { name: 'a', id: 5 }], edges: [] }, { log: () => {} });

    expect(graph.order).toBe(1);
  });

  it('computes reachability', () => {
    const { graph } = buildModel(g);

    expect([...descendantsOf(graph, 'main')].sort()).toEqual(['A', 'B']);
    expect([...ancestorsOf(graph, 'A')].sort()).toEqual(['main', '~commit']);
    expect(rootNames(graph)).toEqual(['~commit']);
    expect(hasCycle(graph)).toBe(false);
  });

  it('is cycle safe', () => {
    const { graph } = buildModel({
      nodes: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      edges: [
        { src: 'a', dest: 'b' },
        { src: 'b', dest: 'c' },
        { src: 'c', dest: 'a' }
      ]
    });

    expect(hasCycle(graph)).toBe(true);
    expect([...descendantsOf(graph, 'a')].sort()).toEqual(['b', 'c']);
    expect(rootNames(graph)).toEqual([]);
  });
});
