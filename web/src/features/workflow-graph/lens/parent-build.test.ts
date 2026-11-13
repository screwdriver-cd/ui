import { describe, expect, it } from 'vitest';
import { decorateGraph } from '../decorate';
import { JOIN_GRAPH } from '../fixtures/graphs';
import type { WorkflowGraphData } from '../types';
import { createLensContext, lensFor, type FlowBuild } from './lens';

/**
 * parentBuildId shapes the lens accepts:
 * - API: number, or an array of numbers for joins (job with `join` edges);
 * - strings ("2,3,4", "57"): not sent by the API, but accepted in case a caller passes them through;
 * - absent or null: builds that record no parent;
 * - remote triggers: the parent build belongs to another pipeline's event, so its id is not in this event's builds.
 */

const run = (graph: WorkflowGraphData, builds: FlowBuild[]) => {
  const d = decorateGraph({ graph, builds, start: '~commit' });

  return createLensContext({ nodes: d.nodes, edges: d.edges, builds });
};
const lens = (graph: WorkflowGraphData, builds: FlowBuild[], focus: string) => lensFor(run(graph, builds), focus) as NonNullable<ReturnType<typeof lensFor>>;
const sorted = (s: Set<string>) => [...s].sort();

// build=1 t1=2 t2=3 t3=4 deploy=5
const base: FlowBuild[] = [
  { id: 1, jobId: 1, status: 'SUCCESS' },
  { id: 2, jobId: 2, status: 'SUCCESS', parentBuildId: 1 },
  { id: 3, jobId: 3, status: 'SUCCESS', parentBuildId: 1 },
  { id: 4, jobId: 4, status: 'SUCCESS', parentBuildId: 1 }
];
const deploy = (parentBuildId: FlowBuild['parentBuildId']): FlowBuild[] => [...base, { id: 5, jobId: 5, status: 'RUNNING', parentBuildId }];
const ROUTE = ['build', 't1', 't2', 't3', '~commit'];

describe('parentBuildId shapes', () => {
  it.each([
    ['array of numbers (API join)', [2, 3, 4]],
    ['array of numeric strings', ['2', '3', '4']],
    ['comma-joined string', '2,3,4'],
    ['comma-joined string with spaces', '2, 3 ,4']
  ])('join parents as %s', (_label, parent) => {
    const l = lens(JOIN_GRAPH, deploy(parent as FlowBuild['parentBuildId']), 'deploy');

    expect(sorted(l.upstream.taken)).toEqual(ROUTE);
    expect(l.upstream.inferred).toBe(false);
  });

  it('a single numeric string parent', () => {
    const builds = base.map(b => (b.id === 2 ? { ...b, parentBuildId: '1' } : b));

    expect(sorted(lens(JOIN_GRAPH, builds, 't1').upstream.taken)).toEqual(['build', '~commit']);
  });

  it.each([
    ['null', null],
    ['missing', undefined],
    ['empty string', ''],
    ['garbage', 'abc']
  ])('%s falls back to adjacent nodes that have a build, flagged as inferred', (_l, parent) => {
    const builds = base.map(b => ({ ...b, parentBuildId: parent }));
    const l = lens(JOIN_GRAPH, builds, 't1');

    expect(sorted(l.upstream.taken)).toEqual(['build', '~commit']);
    expect(l.upstream.inferred).toBe(true);
  });

  it('a restart whose parent is its own previous build does not loop', () => {
    const builds: FlowBuild[] = [...base, { id: 9, jobId: 2, status: 'RUNNING', parentBuildId: 2 }];

    expect(() => lens(JOIN_GRAPH, builds, 't1')).not.toThrow();
  });
});

describe('join and remote cases', () => {
  it('a join with only some inputs finished is waiting, listing satisfied and pending inputs', () => {
    const builds: FlowBuild[] = [
      { id: 1, jobId: 1, status: 'SUCCESS' },
      { id: 2, jobId: 2, status: 'SUCCESS', parentBuildId: 1 },
      { id: 3, jobId: 3, status: 'RUNNING', parentBuildId: 1 },
      { id: 4, jobId: 4, status: 'RUNNING', parentBuildId: 1 }
    ];
    const l = lens(JOIN_GRAPH, builds, 'build');
    const waiting = l.downstream.waitingOnJoin.find(w => w.name === 'deploy');

    expect(waiting).toMatchObject({ satisfied: ['t1'], total: 3 });
    expect(waiting?.pending.sort()).toEqual(['t2', 't3']);
  });

  it('a failed join input moves the join and everything behind it to will-not-run', () => {
    const builds = base.map(b => (b.id === 4 ? { ...b, status: 'FAILURE' } : b));
    const l = lens(JOIN_GRAPH, builds, 'build');

    expect(l.downstream.wontRun).toEqual(expect.arrayContaining(['deploy', 'sd@5:ext']));
    expect(l.downstream.waitingOnJoin).toHaveLength(0);
  });

  describe('remote triggers', () => {
    // ~sd@456:up (another pipeline) and local `a` both feed `after`; the remote parent build is not in this event.
    const graph: WorkflowGraphData = {
      nodes: [{ name: '~commit' }, { name: 'a', id: 1 }, { name: '~sd@456:up' }, { name: 'after', id: 2 }, { name: 'tail', id: 3 }],
      edges: [
        { src: '~commit', dest: 'a' },
        { src: 'a', dest: 'after' },
        { src: '~sd@456:up', dest: 'after' },
        { src: 'after', dest: 'tail' }
      ]
    };

    it('a build started by a remote build (unknown parent id) falls back to inference without throwing', () => {
      const builds: FlowBuild[] = [{ id: 20, jobId: 2, status: 'SUCCESS', parentBuildId: 987654 }, { id: 21, jobId: 3, status: 'RUNNING', parentBuildId: 20 }];
      const l = lens(graph, builds, 'tail');

      expect(l.upstream.taken.has('after')).toBe(true);
      expect(l.upstream.taken.has('a')).toBe(false);
      expect(l.downstream.running).toEqual([]);
    });

    it('a join with one local and one remote parent keeps the local hop and does not mark it inferred', () => {
      const joined: WorkflowGraphData = {
        nodes: graph.nodes,
        edges: graph.edges.map(e => (e.dest === 'after' ? { ...e, join: true } : e))
      };
      const builds: FlowBuild[] = [
        { id: 10, jobId: 1, status: 'SUCCESS' },
        { id: 20, jobId: 2, status: 'RUNNING', parentBuildId: [10, 987654] }
      ];
      const l = lens(joined, builds, 'after');

      expect(l.upstream.taken.has('a')).toBe(true);
      expect(l.upstream.inferred).toBe(false);
      expect(l.upstream.takenEdges.has('a->after')).toBe(true);
    });
  });
});
