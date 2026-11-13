import type { WorkflowGraphData } from '../types';

export const SIMPLE_GRAPH: WorkflowGraphData = {
  nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' }
  ]
};

export const COMPLEX_GRAPH: WorkflowGraphData = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'main', id: 1 },
    { name: 'A', id: 2 },
    { name: 'B', id: 3 },
    { name: 'C', id: 4 },
    { name: 'D', id: 5 }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'A' },
    { src: 'main', dest: 'B' },
    { src: 'A', dest: 'C' },
    { src: 'B', dest: 'D' },
    { src: 'C', dest: 'D' }
  ]
};

export const MORE_COMPLEX_GRAPH: WorkflowGraphData = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'no_main' },
    { name: '~sd@241:main' },
    { name: 'publish' },
    { name: 'other_publish' },
    { name: 'wow_new_main' },
    { name: 'detached_main' },
    { name: 'after_detached_main' },
    { name: 'detached_solo' }
  ],
  edges: [
    { src: '~commit', dest: 'no_main' },
    { src: '~pr', dest: 'no_main' },
    { src: '~sd@241:main', dest: 'no_main' },
    { src: 'no_main', dest: 'publish' },
    { src: 'wow_new_main', dest: 'other_publish' },
    { src: '~commit', dest: 'wow_new_main' },
    { src: '~pr', dest: 'wow_new_main' },
    { src: '~sd@241:main', dest: 'wow_new_main' },
    { src: 'detached_main', dest: 'after_detached_main' }
  ]
};

export const STAGES_GRAPH: WorkflowGraphData = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'component', id: 1 },
    { name: 'publish', id: 2 },
    { name: 'stage@integration:setup', id: 28, stageName: 'integration', virtual: true },
    { name: 'ci-deploy', id: 21, stageName: 'integration' },
    { name: 'ci-test', id: 22, stageName: 'integration' },
    { name: 'ci-certify', id: 23, stageName: 'integration' },
    { name: 'stage@integration:teardown', id: 29, stageName: 'integration', virtual: true },
    { name: 'stage@production:setup', id: 38, stageName: 'production' },
    { name: 'prod-deploy', id: 31, stageName: 'production' },
    { name: 'prod-test', id: 32, stageName: 'production' },
    { name: 'prod-certify', id: 33, stageName: 'production' },
    { name: 'stage@production:teardown', id: 39, stageName: 'production' }
  ],
  edges: [
    { src: '~pr', dest: 'component' },
    { src: '~commit', dest: 'component' },
    { src: 'component', dest: 'publish' },
    { src: 'publish', dest: 'stage@integration:setup' },
    { src: 'stage@integration:setup', dest: 'ci-deploy' },
    { src: 'ci-deploy', dest: 'ci-test' },
    { src: 'ci-test', dest: 'ci-certify' },
    { src: 'ci-certify', dest: 'stage@integration:teardown' },
    { src: 'stage@integration:teardown', dest: 'stage@production:setup' },
    { src: 'stage@production:setup', dest: 'prod-deploy' },
    { src: 'prod-deploy', dest: 'prod-test' },
    { src: 'prod-test', dest: 'prod-certify' },
    { src: 'prod-certify', dest: 'stage@production:teardown' }
  ]
};

export const STAGES = [
  { id: 7, name: 'integration', setup: 28, teardown: 29 },
  { id: 8, name: 'production', setup: 38, teardown: 39, annotations: { 'screwdriver.cd/manualStartEnabled': false } },
  { id: 9, name: 'canary', setup: 48, teardown: 49 }
];

export const STAGE_JOBS = [
  { id: 1, name: 'component' },
  { id: 2, name: 'publish' },
  { id: 21, name: 'ci-deploy' },
  { id: 22, name: 'ci-test' },
  { id: 23, name: 'ci-certify' },
  { id: 28, name: 'stage@integration:setup' },
  { id: 29, name: 'stage@integration:teardown' },
  { id: 31, name: 'prod-deploy' },
  { id: 32, name: 'prod-test' },
  { id: 33, name: 'prod-certify' },
  { id: 38, name: 'stage@production:setup' },
  { id: 39, name: 'stage@production:teardown' }
];

/** Graph with a cycle and a rootless component, for robustness tests. */
export const CYCLE_GRAPH: WorkflowGraphData = {
  nodes: [{ name: '~commit' }, { name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'x' }, { name: 'y' }],
  edges: [
    { src: '~commit', dest: 'a' },
    { src: 'a', dest: 'b' },
    { src: 'b', dest: 'c' },
    { src: 'c', dest: 'a' },
    { src: 'x', dest: 'y' },
    { src: 'y', dest: 'x' }
  ]
};

export const JOIN_GRAPH: WorkflowGraphData = {
  nodes: [{ name: '~commit' }, { name: 'build', id: 1 }, { name: 't1', id: 2 }, { name: 't2', id: 3 }, { name: 't3', id: 4 }, { name: 'deploy', id: 5 }, { name: 'notify', id: 6 }, { name: 'sd@5:ext' }],
  edges: [
    { src: '~commit', dest: 'build' },
    { src: 'build', dest: 't1' },
    { src: 'build', dest: 't2' },
    { src: 'build', dest: 't3' },
    { src: 't1', dest: 'deploy', join: true },
    { src: 't2', dest: 'deploy', join: true },
    { src: 't3', dest: 'deploy', join: true },
    { src: 't1', dest: 'notify' },
    { src: 't2', dest: 'notify' },
    { src: 'deploy', dest: 'sd@5:ext' }
  ]
};

/**
 * Release-like pipeline: triggers, an integration stage, a production stage with two parallel
 * 3-job chains joining into the teardown (AND), a downstream job, and a detached stage that has
 * no incoming trigger (so it shares the first layer with the triggers).
 */
export const RELEASE_GRAPH: WorkflowGraphData = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'main', id: 1 },
    { name: 'publish', id: 2 },
    { name: 'stage@integration:setup', id: 28, stageName: 'integration', virtual: true },
    { name: 'ci-deploy', id: 21, stageName: 'integration' },
    { name: 'ci-test', id: 22, stageName: 'integration' },
    { name: 'ci-certify', id: 23, stageName: 'integration' },
    { name: 'stage@integration:teardown', id: 29, stageName: 'integration', virtual: true },
    { name: 'stage@production:setup', id: 38, stageName: 'production' },
    { name: 'prod-green-deploy', id: 31, stageName: 'production' },
    { name: 'prod-green-test', id: 32, stageName: 'production' },
    { name: 'prod-green-certify', id: 33, stageName: 'production' },
    { name: 'prod-blue-deploy', id: 34, stageName: 'production' },
    { name: 'prod-blue-test', id: 35, stageName: 'production' },
    { name: 'prod-blue-certify', id: 36, stageName: 'production' },
    { name: 'stage@production:teardown', id: 39, stageName: 'production' },
    { name: 'post-release', id: 3 },
    { name: 'stage@detached:setup', id: 58, stageName: 'detached', virtual: true },
    { name: 'd1', id: 51, stageName: 'detached' },
    { name: 'd2', id: 52, stageName: 'detached' },
    { name: 'd3', id: 53, stageName: 'detached' },
    { name: 'stage@detached:teardown', id: 59, stageName: 'detached', virtual: true }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'publish' },
    { src: 'publish', dest: 'stage@integration:setup' },
    { src: 'stage@integration:setup', dest: 'ci-deploy' },
    { src: 'ci-deploy', dest: 'ci-test' },
    { src: 'ci-test', dest: 'ci-certify' },
    { src: 'ci-certify', dest: 'stage@integration:teardown' },
    { src: 'stage@integration:teardown', dest: 'stage@production:setup' },
    { src: 'stage@production:setup', dest: 'prod-green-deploy' },
    { src: 'stage@production:setup', dest: 'prod-blue-deploy' },
    { src: 'prod-green-deploy', dest: 'prod-green-test' },
    { src: 'prod-green-test', dest: 'prod-green-certify' },
    { src: 'prod-blue-deploy', dest: 'prod-blue-test' },
    { src: 'prod-blue-test', dest: 'prod-blue-certify' },
    { src: 'prod-green-certify', dest: 'stage@production:teardown', join: true },
    { src: 'prod-blue-certify', dest: 'stage@production:teardown', join: true },
    { src: 'stage@production:teardown', dest: 'post-release' },
    { src: 'stage@detached:setup', dest: 'd1' },
    { src: 'd1', dest: 'd2' },
    { src: 'd2', dest: 'd3' },
    { src: 'd3', dest: 'stage@detached:teardown' }
  ]
};

export const RELEASE_STAGES = [
  { id: 7, name: 'integration', setup: 28, teardown: 29 },
  { id: 8, name: 'production', setup: 38, teardown: 39 },
  { id: 9, name: 'detached', setup: 58, teardown: 59 }
];

export const RELEASE_JOBS = RELEASE_GRAPH.nodes.filter(n => n.id !== undefined).map(n => ({ id: n.id as number, name: n.name }));

/** ~pr -> pull, ~commit, and three independent detached jobs, listed in a scrambled order. */
export const ONLY_DETACHED_GRAPH: WorkflowGraphData = {
  nodes: [{ name: 'd1', id: 1 }, { name: '~commit' }, { name: 'd2', id: 2 }, { name: 'pull', id: 4 }, { name: '~pr' }, { name: 'd3', id: 3 }],
  edges: [{ src: '~pr', dest: 'pull' }]
};

/** Triggers (~pr, ~commit, ~tag, remote), a detached job and a detached stage, listed detached-first. */
export const MIXED_ROOTS_GRAPH: WorkflowGraphData = {
  nodes: [
    { name: 'stage@solo:setup', id: 78, stageName: 'solo', virtual: true },
    { name: 'solo-a', id: 71, stageName: 'solo' },
    { name: 'stage@solo:teardown', id: 79, stageName: 'solo', virtual: true },
    { name: 'detached-job', id: 5 },
    { name: '~tag' },
    { name: '~sd@456:up' },
    { name: '~commit' },
    { name: '~pr' },
    { name: 'build', id: 1 },
    { name: 'tagged', id: 2 },
    { name: 'remote-job', id: 3 }
  ],
  edges: [
    { src: '~pr', dest: 'build' },
    { src: '~commit', dest: 'build' },
    { src: '~tag', dest: 'tagged' },
    { src: '~sd@456:up', dest: 'remote-job' },
    { src: 'stage@solo:setup', dest: 'solo-a' },
    { src: 'solo-a', dest: 'stage@solo:teardown' }
  ]
};

export const MIXED_ROOTS_STAGES = [{ id: 11, name: 'solo', setup: 78, teardown: 79 }];
export const MIXED_ROOTS_JOBS = MIXED_ROOTS_GRAPH.nodes.filter(n => n.id !== undefined).map(n => ({ id: n.id as number, name: n.name }));
