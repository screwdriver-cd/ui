import { describe, expect, it } from 'vitest';
import { canJobStart, canStageStart, nodeCanShowTooltip, nodeKind } from './eligibility';
import { getFilteredGraph, withDownstreamTriggers } from './filter';
import { computeJoins } from './joins';
import { JOIN_GRAPH } from '../fixtures/graphs';

// ~pr -> main -> publish ; ~commit -> main ; ~commit -> detached -> after ; ~pr -> prOnly
const graph = {
  nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }, { name: 'publish' }, { name: 'prOnly' }, { name: 'detached' }],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'publish' },
    { src: '~pr', dest: 'prOnly' },
    { src: '~commit', dest: 'detached' }
  ]
};

describe('canJobStart / canStageStart', () => {
  it('events tab', () => {
    expect(canJobStart('events', graph, 'main')).toBe(true);
    expect(canJobStart('events', graph, 'publish')).toBe(true);
    expect(canJobStart('events', graph, 'prOnly')).toBe(false);
    expect(canJobStart('events', graph, 'detached')).toBe(true);
  });

  it('pulls tab only allows jobs reachable from ~pr', () => {
    expect(canJobStart('pulls', graph, 'main')).toBe(true);
    expect(canJobStart('pulls', graph, 'prOnly')).toBe(true);
    expect(canJobStart('pulls', graph, 'detached')).toBe(false);
  });

  it('treats branch-filtered PR triggers like ~pr', () => {
    // ~pr:main -> lit ; ~pr:/.*/ -> re ; ~pr -> both ; ~pr:main -> both
    const g = {
      nodes: [{ name: '~pr' }, { name: '~pr:main' }, { name: '~pr:/.*/' }, { name: 'lit' }, { name: 're' }, { name: 'both' }],
      edges: [
        { src: '~pr:main', dest: 'lit' },
        { src: '~pr:/.*/', dest: 're' },
        { src: '~pr', dest: 'both' },
        { src: '~pr:main', dest: 'both' }
      ]
    };

    ['lit', 're', 'both'].forEach(name => {
      expect(canJobStart('pulls', g, name)).toBe(true);
      // Several roots, but every one is a PR trigger.
      expect(canJobStart('events', g, name)).toBe(false);
    });
  });

  it('stages start from the setup job and never from pulls', () => {
    const stage = { setup: { name: 'main' } };

    expect(canStageStart('events', graph, stage)).toBe(true);
    expect(canStageStart('pulls', graph, stage)).toBe(false);
    expect(canStageStart('events', graph, { setup: null })).toBe(false);
  });
});

describe('tooltip eligibility and node kinds', () => {
  it('excludes SCM triggers', () => {
    ['~commit', '~pr', '~commit:main', '~pr:/x/'].forEach(name => expect(nodeCanShowTooltip({ name })).toBe(false));
    ['main', '~sd@1:x', 'sd@1:x'].forEach(name => expect(nodeCanShowTooltip({ name })).toBe(true));
  });

  it('classifies nodes', () => {
    expect(nodeKind({ name: '~commit' })).toBe('trigger');
    expect(nodeKind({ name: 'sd@1:x' })).toBe('external');
    expect(nodeKind({ name: '~sd@1:x' })).toBe('external');
    expect(nodeKind({ name: '~sd-main-triggers' })).toBe('downstream');
    expect(nodeKind({ name: 'g', type: 'JOB_GROUP' })).toBe('stage-group');
    expect(nodeKind({ name: 'main' })).toBe('job');
  });
});

describe('getFilteredGraph / withDownstreamTriggers', () => {
  it('drops leaf external jobs but keeps those that trigger others', () => {
    const g = {
      nodes: [{ name: 'a' }, { name: 'sd@1:leaf' }, { name: 'sd@2:mid' }, { name: 'b' }],
      edges: [
        { src: 'a', dest: 'sd@1:leaf' },
        { src: 'a', dest: 'sd@2:mid' },
        { src: 'sd@2:mid', dest: 'b' }
      ]
    };
    const r = getFilteredGraph(g);

    expect(r.nodes.map(n => n.name)).toEqual(['a', 'sd@2:mid', 'b']);
    expect(r.edges).toEqual([
      { src: 'a', dest: 'sd@2:mid' },
      { src: 'sd@2:mid', dest: 'b' }
    ]);
  });

  it('returns the same graph when there are no external jobs', () => {
    expect(getFilteredGraph(graph)).toBe(graph);
  });

  it('adds downstream trigger nodes without mutating', () => {
    const before = structuredClone(graph);
    const r = withDownstreamTriggers(graph, [
      { jobName: 'publish', triggers: ['~sd@9:deploy'] },
      { jobName: 'main', triggers: [] }
    ]);

    expect(r.nodes.at(-1)).toEqual({ name: '~sd-publish-triggers', triggers: ['~sd@9:deploy'], status: 'DOWNSTREAM_TRIGGER' });
    expect(r.edges.at(-1)).toEqual({ src: 'publish', dest: '~sd-publish-triggers' });
    expect(r.nodes).toHaveLength(graph.nodes.length + 1);
    expect(graph).toEqual(before);
  });
});

describe('computeJoins', () => {
  it('flags AND joins from join edges and OR joins from plain fan-in', () => {
    const j = computeJoins(JOIN_GRAPH.edges);

    expect(j.get('deploy')).toEqual({ kind: 'AND', inputs: ['t1', 't2', 't3'], alternatives: [] });
    expect(j.get('notify')).toEqual({ kind: 'OR', inputs: ['t1', 't2'], alternatives: [] });
    expect(j.has('build')).toBe(false);
  });

  it('reports mixed joins with alternatives', () => {
    const j = computeJoins([
      { src: 'a', dest: 'x', join: true },
      { src: 'b', dest: 'x', join: true },
      { src: '~commit', dest: 'x' }
    ]);

    expect(j.get('x')).toEqual({ kind: 'AND', inputs: ['a', 'b'], alternatives: ['~commit'] });
  });
});
