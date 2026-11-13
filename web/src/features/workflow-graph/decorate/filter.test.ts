import { describe, expect, it } from 'vitest';
import { JOIN_GRAPH, MORE_COMPLEX_GRAPH } from '../fixtures/graphs';
import { getFilteredGraph, withDownstreamTriggers } from './filter';

// Basic leaf-dropping and trigger-node cases live in eligibility.test.ts.

describe('getFilteredGraph', () => {
  it('drops an external leaf at the end of an internal chain', () => {
    const r = getFilteredGraph(JOIN_GRAPH);

    expect(r.nodes.map(n => n.name)).not.toContain('sd@5:ext');
    expect(r.edges.some(e => e.dest === 'sd@5:ext')).toBe(false);
    expect(r.nodes).toHaveLength(JOIN_GRAPH.nodes.length - 1);
    expect(r.edges).toHaveLength(JOIN_GRAPH.edges.length - 1);
  });

  it('keeps an external job that triggers another external job, and drops the leaf one', () => {
    const r = getFilteredGraph({
      nodes: [{ name: 'a' }, { name: 'sd@1:mid' }, { name: 'sd@2:leaf' }],
      edges: [
        { src: 'a', dest: 'sd@1:mid' },
        { src: 'sd@1:mid', dest: 'sd@2:leaf' }
      ]
    });

    expect(r.nodes.map(n => n.name)).toEqual(['a', 'sd@1:mid']);
    expect(r.edges).toEqual([{ src: 'a', dest: 'sd@1:mid' }]);
  });

  it('leaves ~sd@ external triggers alone', () => {
    expect(getFilteredGraph(MORE_COMPLEX_GRAPH)).toBe(MORE_COMPLEX_GRAPH);
  });

  it('keeps a lone external node only when it has outgoing edges', () => {
    const r = getFilteredGraph({
      nodes: [{ name: 'sd@1:orphan' }, { name: 'main' }],
      edges: []
    });

    expect(r.nodes).toEqual([{ name: 'main' }]);
  });
});

describe('withDownstreamTriggers', () => {
  it('returns the filtered graph unchanged when no triggers are given', () => {
    const r = withDownstreamTriggers(JOIN_GRAPH);

    expect(r).toEqual(getFilteredGraph(JOIN_GRAPH));
    expect(withDownstreamTriggers(MORE_COMPLEX_GRAPH)).toBe(MORE_COMPLEX_GRAPH);
  });

  it('filters external leaves before adding trigger nodes', () => {
    const r = withDownstreamTriggers(JOIN_GRAPH, [
      { jobName: 'deploy', triggers: ['~sd@9:a', '~sd@9:b'] }
    ]);

    expect(r.nodes.map(n => n.name)).not.toContain('sd@5:ext');
    expect(r.nodes.at(-1)).toEqual({
      name: '~sd-deploy-triggers',
      triggers: ['~sd@9:a', '~sd@9:b'],
      status: 'DOWNSTREAM_TRIGGER'
    });
    expect(r.edges.filter(e => e.src === 'deploy')).toEqual([
      { src: 'deploy', dest: '~sd-deploy-triggers' }
    ]);
  });

  it('returns a copy even when every trigger list is empty', () => {
    const r = withDownstreamTriggers(MORE_COMPLEX_GRAPH, [
      { jobName: 'publish', triggers: [] }
    ]);

    expect(r).toEqual(MORE_COMPLEX_GRAPH);
    expect(r).not.toBe(MORE_COMPLEX_GRAPH);
  });
});
