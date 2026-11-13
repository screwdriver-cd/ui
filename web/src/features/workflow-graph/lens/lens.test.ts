import { describe, expect, it } from 'vitest';
import { decorateGraph } from '../decorate';
import { activeNodes, createLensContext, lensFor, progressOf, type FlowBuild } from './lens';
import { CYCLE_GRAPH, JOIN_GRAPH, STAGES, STAGES_GRAPH, STAGE_JOBS } from '../fixtures/graphs';
import type { WorkflowGraphData } from '../types';

function ctx(graph: WorkflowGraphData, builds: FlowBuild[], start = '~commit') {
  const d = decorateGraph({ graph, builds, start });

  return createLensContext({ nodes: d.nodes, edges: d.edges, builds });
}

// job ids: build=1 t1=2 t2=3 t3=4 deploy=5 notify=6
// ~commit -> build -> t1,t2,t3 ; t1,t2,t3 -AND-> deploy ; t1,t2 -OR-> notify ; deploy -> sd@5:ext
const b = (id: number, jobId: number, status: string, parentBuildId?: FlowBuild['parentBuildId']): FlowBuild => ({
  id,
  jobId,
  status,
  parentBuildId
});

describe('flow states', () => {
  it('classifies nodes, propagating "will not run" through joins', () => {
    const c = ctx(JOIN_GRAPH, [b(1, 1, 'SUCCESS'), b(2, 2, 'SUCCESS', 1), b(3, 3, 'RUNNING', 1), b(4, 4, 'FAILURE', 1)]);

    expect(c.states.get('~commit')).toBe('done');
    expect(c.states.get('build')).toBe('done');
    expect(c.states.get('t2')).toBe('running');
    expect(c.states.get('t3')).toBe('failed');
    expect(c.states.get('deploy')).toBe('wont-run');
    expect(c.states.get('sd@5:ext')).toBe('wont-run');
    expect(c.states.get('notify')).toBe('pending');
  });

  it('treats triggers other than the one that started the event as inactive', () => {
    const c = ctx(
      { nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main', id: 1 }, { name: 'prOnly', id: 2 }], edges: [{ src: '~commit', dest: 'main' }, { src: '~pr', dest: 'prOnly' }] },
      [b(1, 1, 'RUNNING')]
    );

    expect(c.states.get('prOnly')).toBe('wont-run');
    expect(c.states.get('main')).toBe('running');
  });

  it('disabled jobs without a build will not run', () => {
    const d = decorateGraph({
      graph: { nodes: [{ name: '~commit' }, { name: 'a', id: 1 }, { name: 'b', id: 2 }], edges: [{ src: '~commit', dest: 'a' }, { src: 'a', dest: 'b' }] },
      jobs: [{ id: 1, name: 'a', isDisabled: true, state: 'DISABLED' }, { id: 2, name: 'b' }],
      start: '~commit'
    });
    const c = createLensContext({ nodes: d.nodes, edges: d.edges, builds: [] });

    expect(c.states.get('a')).toBe('wont-run');
    expect(c.states.get('b')).toBe('wont-run');
  });

  it('terminates on cycles and rootless components', () => {
    const c = ctx(CYCLE_GRAPH, []);

    expect(c.states.size).toBe(CYCLE_GRAPH.nodes.length);
    expect(lensFor(c, 'a')).not.toBeNull();
  });
});

describe('progress', () => {
  it('counts jobs only and exposes the node lists for filtering', () => {
    const c = ctx(JOIN_GRAPH, [b(1, 1, 'SUCCESS'), b(2, 2, 'SUCCESS', 1), b(3, 3, 'RUNNING', 1), b(4, 4, 'QUEUED', 1)]);
    const p = progressOf(c);

    expect(p).toMatchObject({ total: 7, done: 2, failed: 0, running: 1, queued: 1, pending: 3, wontRun: 0 });
    expect(p.byState.done).toEqual(['build', 't1']);
    expect(p.byState.running).toEqual(['t2']);
    expect(p.byState.queued).toEqual(['t3']);
    expect(p.byState.pending).toEqual(['deploy', 'notify', 'sd@5:ext']);
  });

  it('lists running and blocked builds as active', () => {
    const c = ctx(JOIN_GRAPH, [b(1, 1, 'SUCCESS'), b(2, 2, 'BLOCKED', 1), b(3, 3, 'RUNNING', 1)]);

    expect(activeNodes(c)).toEqual(['t1', 't2']);
  });
});

describe('upstream route actually taken', () => {
  // OR join: deploy2 can be reached from a or b; in this event only b ran.
  const graph: WorkflowGraphData = {
    nodes: [{ name: '~commit' }, { name: 'a', id: 1 }, { name: 'b', id: 2 }, { name: 'c', id: 3 }, { name: 'x', id: 4 }, { name: 'end', id: 5 }],
    edges: [
      { src: '~commit', dest: 'a' },
      { src: '~commit', dest: 'b' },
      { src: 'a', dest: 'c' },
      { src: 'b', dest: 'c' },
      { src: 'c', dest: 'end' },
      { src: 'x', dest: 'c' }
    ]
  };

  it('follows parentBuildId and separates routes that were possible but did not run', () => {
    const c = ctx(graph, [b(10, 2, 'SUCCESS'), b(11, 3, 'SUCCESS', 10)]);
    const lens = lensFor(c, 'c') as NonNullable<ReturnType<typeof lensFor>>;

    expect([...lens.upstream.taken].sort()).toEqual(['b', '~commit']);
    expect([...lens.upstream.takenEdges].sort()).toEqual(['b->c', '~commit->b']);
    expect([...lens.upstream.possible].sort()).toEqual(['a', 'x']);
    expect(lens.upstream.inferred).toBe(false);
    expect(lens.tierOf('b')).toBe('upstream-taken');
    expect(lens.tierOf('a')).toBe('upstream-possible');
    expect(lens.tierOf('c')).toBe('focus');
    expect(lens.tierOf('end')).toBe('downstream');
    expect(lens.edgeTierOf('b', 'c')).toBe('upstream-taken');
    expect(lens.edgeTierOf('a', 'c')).toBe('upstream-possible');
    expect(lens.edgeTierOf('c', 'end')).toBe('downstream');
    expect(lens.edgeTierOf('~commit', 'a')).toBe('upstream-possible');
  });

  it('handles joins with several parents', () => {
    const c = ctx(JOIN_GRAPH, [
      b(1, 1, 'SUCCESS'),
      b(2, 2, 'SUCCESS', 1),
      b(3, 3, 'SUCCESS', 1),
      b(4, 4, 'SUCCESS', 1),
      b(5, 5, 'SUCCESS', [2, 3, 4])
    ]);
    const lens = lensFor(c, 'deploy') as NonNullable<ReturnType<typeof lensFor>>;

    expect([...lens.upstream.taken].sort()).toEqual(['build', 't1', 't2', 't3', '~commit']);
    expect(lens.upstream.takenEdges.has('t2->deploy')).toBe(true);
    expect(lens.upstream.possible.size).toBe(0);
  });

  it('falls back to adjacent nodes with builds when parentBuildId is missing', () => {
    const c = ctx(graph, [b(10, 2, 'SUCCESS'), b(11, 3, 'SUCCESS')]);
    const lens = lensFor(c, 'c') as NonNullable<ReturnType<typeof lensFor>>;

    expect([...lens.upstream.taken].sort()).toEqual(['b', '~commit']);
    expect(lens.upstream.inferred).toBe(true);
  });

  it('infers the route for a focus that has not run', () => {
    const c = ctx(graph, [b(10, 2, 'SUCCESS'), b(11, 3, 'SUCCESS', 10)]);
    const lens = lensFor(c, 'end') as NonNullable<ReturnType<typeof lensFor>>;

    expect(lens.upstream.taken.has('c')).toBe(true);
    expect(lens.upstream.taken.has('a')).toBe(false);
    expect(lens.upstream.inferred).toBe(true);
  });

  it('ignores parent builds that are not in this graph (other events / pipelines)', () => {
    const c = ctx(graph, [b(10, 2, 'SUCCESS', 999)]);
    const lens = lensFor(c, 'b') as NonNullable<ReturnType<typeof lensFor>>;

    expect([...lens.upstream.taken]).toEqual(['~commit']);
  });

  it('returns null for an unknown focus', () => {
    expect(lensFor(ctx(graph, []), 'nope')).toBeNull();
  });
});

describe('downstream in play', () => {
  it('groups running, queued, waiting on a join, and will not run', () => {
    const c = ctx(JOIN_GRAPH, [b(1, 1, 'SUCCESS'), b(2, 2, 'SUCCESS', 1), b(3, 3, 'RUNNING', 1), b(4, 4, 'QUEUED', 1)]);
    const d = lensFor(c, 'build')!.downstream;

    expect(d.done).toEqual(['t1']);
    expect(d.running).toEqual(['t2']);
    expect(d.queued).toEqual(['t3']);
    expect(d.waitingOnJoin).toEqual([{ name: 'deploy', satisfied: ['t1'], pending: ['t2', 't3'], total: 3 }]);
    expect(d.pending).toEqual(['notify', 'sd@5:ext']);
    expect(d.wontRun).toEqual([]);
  });

  it('moves everything behind a failed join input to will-not-run', () => {
    const c = ctx(JOIN_GRAPH, [b(1, 1, 'SUCCESS'), b(2, 2, 'SUCCESS', 1), b(3, 3, 'SUCCESS', 1), b(4, 4, 'FAILURE', 1)]);
    const d = lensFor(c, 't1')!.downstream;

    expect(d.wontRun).toEqual(['deploy', 'sd@5:ext']);
    expect(d.waitingOnJoin).toEqual([]);
    expect(d.pending).toEqual(['notify']);
  });

  it('dims everything else', () => {
    const c = ctx(JOIN_GRAPH, [b(1, 1, 'SUCCESS'), b(2, 2, 'SUCCESS', 1)]);
    const lens = lensFor(c, 't1')!;

    expect(lens.tierOf('t3')).toBe('dimmed');
  });
});

describe('collapsed stages', () => {
  const collapsedCtx = (stageStatus: string | undefined) => {
    const builds = [b(1, 1, 'SUCCESS'), b(2, 2, 'SUCCESS', 1)];
    const d = decorateGraph({
      graph: STAGES_GRAPH,
      builds,
      stageBuilds: stageStatus ? [{ id: 90, stageId: 7, status: stageStatus as never }] : [],
      jobs: STAGE_JOBS,
      stages: STAGES,
      collapsedStages: new Set(['integration']),
      start: '~commit'
    });

    return createLensContext({ nodes: d.nodes, edges: d.edges, builds });
  };
  const group = 'stage@integration jobs (3)';

  it.each([
    ['FAILURE', 'failed'],
    ['RUNNING', 'running'],
    ['QUEUED', 'queued'],
    ['SUCCESS', 'done']
  ])('takes the %s stage build status instead of "pending"', (status, state) => {
    const c = collapsedCtx(status);

    expect(c.states.get(group)).toBe(state);
    expect(c.buildByNode.get(group)?.status).toBe(status);
  });

  it('counts a running stage as active and a failed one as failed', () => {
    expect(activeNodes(collapsedCtx('RUNNING'))).toContain(group);
    expect(progressOf(collapsedCtx('FAILURE')).failed).toBeGreaterThan(0);
  });

  it('leaves a stage without a stage build unchanged', () => {
    expect(collapsedCtx(undefined).buildByNode.has(group)).toBe(false);
  });
});
