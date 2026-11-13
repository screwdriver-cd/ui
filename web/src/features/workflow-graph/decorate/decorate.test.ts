import { describe, expect, it } from 'vitest';
import { decorateGraph } from './decorate';
import { isTrigger } from './names';
import { graphDepth, isRoot, reverseGraph, subgraphFilter } from './subgraph';
import { COMPLEX_GRAPH, MORE_COMPLEX_GRAPH, SIMPLE_GRAPH, STAGES, STAGES_GRAPH, STAGE_JOBS } from '../fixtures/graphs';

describe('decorateGraph (golden cases, positions dropped)', () => {
  it('processes a simple graph without builds', () => {
    const r = decorateGraph({ graph: SIMPLE_GRAPH });

    expect(r).toEqual({
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: SIMPLE_GRAPH.edges,
      stages: [],
      stageEdges: []
    });
  });

  it('does not mutate its input', () => {
    const input = structuredClone(COMPLEX_GRAPH);

    decorateGraph({ graph: input, builds: [{ id: 6, jobId: 1, status: 'SUCCESS' }], start: '~commit' });
    expect(input).toEqual(COMPLEX_GRAPH);
  });

  it('stringifies numeric displayName', () => {
    const r = decorateGraph({ graph: { nodes: [{ name: 'detached', displayName: 123 }], edges: [] } });

    expect(r.nodes[0]!.displayName).toBe('123');
  });

  it('hides edges from unknown external triggers to existing external jobs', () => {
    const graph = {
      nodes: [{ name: '~commit' }, { name: 'main-job' }, { name: 'sd@123:external-job' }],
      edges: [
        { src: '~commit', dest: 'main-job' },
        { src: 'main-job', dest: 'sd@123:external-job' },
        { src: '~sd@456:upstream-job', dest: 'sd@123:external-job' }
      ]
    };
    const r = decorateGraph({ graph });

    expect(r.edges).toEqual([
      { src: '~commit', dest: 'main-job' },
      { src: 'main-job', dest: 'sd@123:external-job' },
      { src: '~sd@456:upstream-job', dest: 'sd@123:external-job', hidden: true }
    ]);
  });

  it('keeps detached jobs and misordered complex graphs intact', () => {
    const r = decorateGraph({ graph: MORE_COMPLEX_GRAPH });

    expect(r.nodes.map(n => n.name)).toEqual(MORE_COMPLEX_GRAPH.nodes.map(n => n.name));
    expect(r.edges).toEqual(MORE_COMPLEX_GRAPH.edges);
  });

  it('processes a complex graph with builds', () => {
    const builds = [
      { jobId: 1, status: 'SUCCESS', id: 6 },
      { jobId: 2, status: 'SUCCESS', id: 7 },
      { jobId: 3, status: 'SUCCESS', id: 8 },
      { jobId: 4, status: 'SUCCESS', id: 9 },
      { jobId: 5, status: 'FAILURE', id: 10 }
    ];
    const r = decorateGraph({ graph: COMPLEX_GRAPH, builds, start: '~commit' });

    expect(r.nodes).toEqual([
      { name: '~pr' },
      { name: '~commit', status: 'STARTED_FROM' },
      { name: 'main', id: 1, buildId: 6, status: 'SUCCESS' },
      { name: 'A', id: 2, buildId: 7, status: 'SUCCESS' },
      { name: 'B', id: 3, buildId: 8, status: 'SUCCESS' },
      { name: 'C', id: 4, buildId: 9, status: 'SUCCESS' },
      { name: 'D', id: 5, buildId: 10, status: 'FAILURE' }
    ]);
    expect(r.edges).toEqual([
      { src: '~pr', dest: 'main' },
      { src: '~commit', dest: 'main', status: 'STARTED_FROM' },
      { src: 'main', dest: 'A', status: 'SUCCESS' },
      { src: 'main', dest: 'B', status: 'SUCCESS' },
      { src: 'A', dest: 'C', status: 'SUCCESS' },
      { src: 'B', dest: 'D', status: 'SUCCESS' },
      { src: 'C', dest: 'D', status: 'SUCCESS' }
    ]);
  });

  it('does not give a RUNNING source edge a status', () => {
    const r = decorateGraph({ graph: COMPLEX_GRAPH, builds: [{ jobId: 1, status: 'RUNNING', id: 6 }] });

    expect(r.edges.find(e => e.src === 'main')?.status).toBeUndefined();
  });

  it('processes a complex graph with jobs (disabled, manualStart, description)', () => {
    const jobs = [
      { id: 1, name: 'main' },
      {
        id: 2,
        name: 'A',
        isDisabled: true,
        state: 'DISABLED',
        stateChanger: 'TEST user',
        permutations: [{ annotations: { 'screwdriver.cd/manualStartEnabled': true }, description: 'desc' }]
      },
      { id: 3, name: 'B', permutations: [{ annotations: { 'screwdriver.cd/manualStartEnabled': false } }] },
      { id: 4, name: 'C', permutations: [{ annotations: {} }] }
    ];
    const r = decorateGraph({ graph: COMPLEX_GRAPH, jobs });

    expect(r.nodes).toEqual([
      { name: '~pr', isDisabled: false },
      { name: '~commit', isDisabled: false },
      { name: 'main', id: 1, isDisabled: false },
      {
        name: 'A',
        id: 2,
        isDisabled: true,
        manualStartDisabled: false,
        stateChanger: 'TEST user',
        status: 'DISABLED',
        description: 'desc'
      },
      { name: 'B', id: 3, isDisabled: false, manualStartDisabled: true },
      { name: 'C', id: 4, isDisabled: false, manualStartDisabled: false },
      { name: 'D', id: 5, isDisabled: false }
    ]);
    expect(r.edges.find(e => e.src === 'A')?.status).toBe('DISABLED');
  });

  describe('non-chained PR pipelines', () => {
    const graph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }, { name: 'foo-main' }, { name: 'downstream' }],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: '~pr', dest: 'foo-main' },
        { src: 'main', dest: 'downstream' }
      ]
    };
    const jobs = [
      { id: 1, group: 2, name: 'PR-2:main' },
      { id: 111, group: 2, name: 'PR-2:foo-main' }
    ];
    const builds = [
      { id: 3, jobId: 1, status: 'SUCCESS' },
      { id: 333, jobId: 2, status: 'SUCCESS' }
    ];

    it('maps PR jobs by name, keeps their ids, and drops status on edges out of ~pr-triggered nodes', () => {
      const r = decorateGraph({ graph, builds, jobs, start: '~pr', prNum: 2 });

      expect(r.nodes).toEqual([
        { name: '~pr', isDisabled: false, status: 'STARTED_FROM' },
        { name: '~commit', isDisabled: false },
        { name: 'main', id: 1, buildId: 3, isDisabled: false, status: 'SUCCESS' },
        { name: 'foo-main', id: 111, isDisabled: false },
        { name: 'downstream', isDisabled: false }
      ]);
      expect(r.edges).toEqual([
        { src: '~pr', dest: 'main', status: 'STARTED_FROM' },
        { src: '~commit', dest: 'main' },
        { src: '~pr', dest: 'foo-main', status: 'STARTED_FROM' },
        { src: 'main', dest: 'downstream' }
      ]);
    });

    it('shows a PR job as disabled when its parent pipeline job is', () => {
      const r = decorateGraph({
        graph,
        jobs: [
          { id: 10, name: 'main', state: 'DISABLED', isDisabled: true, stateChanger: 'bob' },
          { id: 1, group: 2, name: 'PR-2:main', prParentJobId: 10 }
        ],
        prNum: 2
      });

      expect(r.nodes.find(n => n.name === 'main')).toMatchObject({
        id: 1,
        isDisabled: true,
        status: 'DISABLED',
        stateChanger: 'bob'
      });
    });

    it('chained PRs keep outbound statuses', () => {
      const r = decorateGraph({ graph, builds, jobs, start: '~pr', prNum: 2, chainPR: true });

      expect(r.edges.find(e => e.src === 'main')?.status).toBeUndefined();
      // chained PR: jobs resolved by node id only, so nothing is found for id-less nodes
      expect(r.nodes.find(n => n.name === 'main')?.buildId).toBeUndefined();
    });
  });

  describe('stages', () => {
    it('removes virtual setup/teardown, bypasses their edges and hides the bypass edges', () => {
      const r = decorateGraph({ graph: STAGES_GRAPH, stages: STAGES, collapsedStages: new Set(), jobs: STAGE_JOBS });

      expect(r.nodes.map(n => n.name)).not.toContain('stage@integration:setup');
      expect(r.nodes.map(n => n.name)).not.toContain('stage@integration:teardown');
      // non-virtual production setup/teardown remain
      expect(r.nodes.map(n => n.name)).toContain('stage@production:setup');
      expect(r.edges).toContainEqual({ src: 'publish', dest: 'ci-deploy', hidden: true });
      expect(r.edges).toContainEqual({ src: 'ci-certify', dest: 'stage@production:setup', hidden: true });
      expect(r.edges).toContainEqual({ src: 'ci-deploy', dest: 'ci-test' });
      expect(r.edges).toContainEqual({ src: 'prod-certify', dest: 'stage@production:teardown' });
    });

    it('derives event stages enriched with id, description and manualStartDisabled', () => {
      const r = decorateGraph({ graph: STAGES_GRAPH, stages: STAGES, collapsedStages: new Set(), jobs: STAGE_JOBS });

      expect(r.stages.map(s => s.name)).toEqual(['integration', 'production']);
      expect(r.stages[0]).toMatchObject({ id: 7, isCollapsed: false });
      expect(r.stages[0]!.jobs.map(j => j.name)).toEqual(['ci-deploy', 'ci-test', 'ci-certify']);
      expect(r.stages[0]!.setup?.name).toBe('stage@integration:setup');
      expect(r.stages[0]!.manualStartDisabled).toBeUndefined();
      expect(r.stages[1]).toMatchObject({ id: 8, isCollapsed: false, manualStartDisabled: true });
    });

    it("takes a stage's manual-start setting from its setup job, as the stages API has no annotations", () => {
      const jobs = STAGE_JOBS.map(j =>
        j.id === 28 ? { ...j, permutations: [{ annotations: { 'screwdriver.cd/manualStartEnabled': false } }] } : j
      );
      const r = decorateGraph({ graph: STAGES_GRAPH, stages: STAGES, collapsedStages: new Set(), jobs });

      expect(r.stages[0]).toMatchObject({ name: 'integration', manualStartDisabled: true });
    });

    it('creates hidden stage edges', () => {
      const r = decorateGraph({ graph: STAGES_GRAPH, stages: STAGES, collapsedStages: new Set(), jobs: STAGE_JOBS });

      expect(r.stageEdges).toEqual([
        { src: 'publish', dest: 'stage@integration:setup', destStageName: 'integration', hidden: true },
        {
          src: 'stage@integration:teardown',
          dest: 'stage@production:setup',
          destStageName: 'production',
          srcStageName: 'integration',
          hidden: true
        }
      ]);
    });

    it('takes stage status from stage builds', () => {
      const r = decorateGraph({
        graph: STAGES_GRAPH,
        stages: STAGES,
        stageBuilds: [{ id: 99, stageId: 7, status: 'SUCCESS' }],
        collapsedStages: new Set(),
        jobs: STAGE_JOBS
      });

      expect(r.stages[0]).toMatchObject({ status: 'SUCCESS', stageBuildId: 99 });
      expect(r.stageEdges[1]!.status).toBe('SUCCESS');
    });

    it('collapses a stage into a JOB_GROUP node', () => {
      const r = decorateGraph({ graph: STAGES_GRAPH, stages: STAGES, collapsedStages: new Set(['production']), jobs: STAGE_JOBS });
      const group = r.nodes.find(n => n.type === 'JOB_GROUP');

      expect(group).toMatchObject({
        name: 'stage@production jobs (3)',
        stageName: 'production',
        description: 'This job group includes the following jobs: prod-deploy, prod-test, prod-certify'
      });
      expect(r.nodes.some(n => n.name === 'prod-test')).toBe(false);
      expect(r.edges).toContainEqual({ src: 'ci-certify', dest: 'stage@production jobs (3)', hidden: true });
      expect(r.stageEdges).toContainEqual({
        src: 'stage@integration:teardown',
        dest: 'stage@production jobs (3)',
        destStageName: 'production',
        srcStageName: 'integration',
        hidden: true
      });
      expect(r.stages[1]!.isCollapsed).toBe(true);
    });

    it('gives a collapsed group the stage status', () => {
      const r = decorateGraph({
        graph: STAGES_GRAPH,
        stages: STAGES,
        stageBuilds: [{ id: 5, stageId: 8, status: 'FAILURE' }],
        collapsedStages: new Set(['production']),
        jobs: STAGE_JOBS
      });

      expect(r.nodes.find(n => n.type === 'JOB_GROUP')?.status).toBe('FAILURE');
    });

    it('uses PR-prefixed stage metadata in PR events', () => {
      const graph = {
        nodes: [
          { name: '~pr' },
          { name: 'stage@integration:setup', id: 14, stageName: 'integration', virtual: true },
          { name: 'ci-deploy', id: 11, stageName: 'integration' },
          { name: 'stage@integration:teardown', id: 15, stageName: 'integration', virtual: true }
        ],
        edges: [
          { src: '~pr', dest: 'stage@integration:setup' },
          { src: 'stage@integration:setup', dest: 'ci-deploy' },
          { src: 'ci-deploy', dest: 'stage@integration:teardown' }
        ]
      };
      const stages = [
        { id: 5, name: 'integration', description: 'original description' },
        { id: 10, name: 'PR-123:integration', description: 'PR description' }
      ];
      const r = decorateGraph({ graph, stages, collapsedStages: new Set(), prNum: 123, jobs: [{ id: 11, name: 'ci-deploy' }] });

      expect(r.stages[0]).toMatchObject({ id: 10, description: 'PR description' });
      expect(r.edges).toContainEqual({ src: '~pr', dest: 'ci-deploy', hidden: true });
    });

    it('treats stage nodes as regular nodes without stage metadata', () => {
      const r = decorateGraph({ graph: STAGES_GRAPH });

      expect(r.stages).toEqual([]);
      expect(r.stageEdges).toEqual([]);
      // virtual setup/teardown nodes are still bypassed
      expect(r.nodes).toHaveLength(STAGES_GRAPH.nodes.length - 2);
      expect(r.edges.some(e => e.hidden)).toBe(false);
    });
  });
});

describe('graph helpers', () => {
  it('determines graph depth', () => {
    expect(graphDepth('meow' as never, '~commit')).toBe(Number.MAX_VALUE);
    expect(graphDepth(SIMPLE_GRAPH.edges, '~commit')).toBe(1);
    expect(graphDepth(COMPLEX_GRAPH.edges, '~commit')).toBe(5);
    expect(graphDepth(MORE_COMPLEX_GRAPH.edges, '~commit')).toBe(4);
    expect(graphDepth(MORE_COMPLEX_GRAPH.edges, '~sd@241:main')).toBe(4);
    expect(graphDepth(MORE_COMPLEX_GRAPH.edges, 'detached_main')).toBe(2);
    expect(graphDepth(MORE_COMPLEX_GRAPH.edges, 'detached_solo')).toBe(1);
    expect(graphDepth(MORE_COMPLEX_GRAPH.edges, 'publish')).toBe(1);
  });

  it('graphDepth terminates on cycles', () => {
    const edges = [
      { src: 'a', dest: 'b' },
      { src: 'b', dest: 'a' }
    ];

    expect(graphDepth(edges, 'a')).toBe(2);
  });

  it('detects roots', () => {
    expect(isRoot(MORE_COMPLEX_GRAPH.edges, 'detached_main')).toBe(true);
    expect(isRoot(MORE_COMPLEX_GRAPH.edges, '~commit')).toBe(true);
    expect(isRoot(MORE_COMPLEX_GRAPH.edges, 'no_main')).toBe(false);
  });

  it('detects trigger nodes', () => {
    expect(isTrigger('~commit', '~commit')).toBe(true);
    expect(isTrigger('~commit:/^detached_main$/', '~commit:detached_main')).toBe(true);
    expect(isTrigger('~commit:/^detached_main.*$/', '~commit:detached_main1')).toBe(true);
    expect(isTrigger('~pr:/^detached_main$/', '~commit:detached_main')).toBe(false);
    expect(isTrigger('~commit:/^detached_main$/', '~commit:detached_main1')).toBe(false);
    expect(isTrigger('~commit:detached_main', 'no_main')).toBe(false);
    expect(isTrigger('~commit:/(/', '~commit:x')).toBe(false);
  });

  it('reduces to a subgraph from a starting point', () => {
    expect(subgraphFilter(SIMPLE_GRAPH, 'main')).toEqual({ nodes: [{ name: 'main' }], edges: [] });
    expect(subgraphFilter(SIMPLE_GRAPH)).toEqual(SIMPLE_GRAPH);
    expect(subgraphFilter(COMPLEX_GRAPH, 'A')).toEqual({
      nodes: [
        { name: 'A', id: 2 },
        { name: 'C', id: 4 },
        { name: 'D', id: 5 }
      ],
      edges: [
        { src: 'A', dest: 'C' },
        { src: 'C', dest: 'D' }
      ]
    });
    expect(subgraphFilter(MORE_COMPLEX_GRAPH, 'wow_new_main')).toEqual({
      nodes: [{ name: 'other_publish' }, { name: 'wow_new_main' }],
      edges: [{ src: 'wow_new_main', dest: 'other_publish' }]
    });
    expect(subgraphFilter(COMPLEX_GRAPH, 'PR-3:A').nodes.map(n => n.name)).toEqual(['A', 'C', 'D']);
  });

  it('reverses a graph without mutating', () => {
    const rev = reverseGraph(COMPLEX_GRAPH);

    expect(rev.nodes).toEqual(COMPLEX_GRAPH.nodes);
    rev.edges.forEach((e, i) => {
      expect(e.src).toBe(COMPLEX_GRAPH.edges[i]!.dest);
      expect(e.dest).toBe(COMPLEX_GRAPH.edges[i]!.src);
    });
    expect(COMPLEX_GRAPH.edges[0]!.src).toBe('~pr');
  });
});
