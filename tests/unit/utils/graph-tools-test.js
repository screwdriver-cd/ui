import {
  node,
  decorateGraph,
  subgraphFilter,
  graphDepth,
  isRoot,
  isTrigger,
  reverseGraph
} from 'screwdriver-ui/utils/graph-tools';
import { module, test } from 'qunit';

const SIMPLE_GRAPH = {
  nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' }
  ]
};

const SIMPLE_GRAPH_WITH_DISPLAY_NAME = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'main', displayName: 'abc' },
    { name: 'detached', displayName: 123 }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' }
  ]
};

const COMPLEX_GRAPH = {
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

const MORE_COMPLEX_GRAPH = {
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

module('Unit | Utility | graph tools', function () {
  test('it gets an element from a list', function (assert) {
    const list = [{ name: 'foo' }, { name: 'bar' }];
    const result = node(list, 'bar');

    assert.deepEqual(result, { name: 'bar' });
  });

  test('it processes a simple graph without builds', function (assert) {
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'main', pos: { x: 1, y: 0 } }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 2,
        width: 2
      }
    };
    const result = decorateGraph({ inputGraph: SIMPLE_GRAPH });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a simple graph with displayName', function (assert) {
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'main', displayName: 'abc', pos: { x: 1, y: 0 } },
        { name: 'detached', displayName: '123', pos: { x: 0, y: 2 } }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 3,
        width: 2
      }
    };
    const result = decorateGraph({
      inputGraph: SIMPLE_GRAPH_WITH_DISPLAY_NAME
    });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a more complex graph without builds', function (assert) {
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'main', id: 1, pos: { x: 1, y: 0 } },
        { name: 'A', id: 2, pos: { x: 2, y: 0 } },
        { name: 'B', id: 3, pos: { x: 2, y: 1 } },
        { name: 'C', id: 4, pos: { x: 3, y: 0 } },
        { name: 'D', id: 5, pos: { x: 4, y: 0 } }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        },
        { src: 'main', dest: 'A', from: { x: 1, y: 0 }, to: { x: 2, y: 0 } },
        { src: 'main', dest: 'B', from: { x: 1, y: 0 }, to: { x: 2, y: 1 } },
        { src: 'A', dest: 'C', from: { x: 2, y: 0 }, to: { x: 3, y: 0 } },
        { src: 'B', dest: 'D', from: { x: 2, y: 1 }, to: { x: 4, y: 0 } },
        { src: 'C', dest: 'D', from: { x: 3, y: 0 }, to: { x: 4, y: 0 } }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 2,
        width: 5
      }
    };
    const result = decorateGraph({ inputGraph: COMPLEX_GRAPH });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a complex graph with builds', function (assert) {
    const builds = [
      { jobId: 1, status: 'SUCCESS', id: 6 },
      { jobId: 2, status: 'SUCCESS', id: 7 },
      { jobId: 3, status: 'SUCCESS', id: 8 },
      { jobId: 4, status: 'SUCCESS', id: 9 },
      { jobId: 5, status: 'FAILURE', id: 10 }
    ];
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', status: 'STARTED_FROM', pos: { x: 0, y: 1 } },
        {
          name: 'main',
          id: 1,
          buildId: 6,
          status: 'SUCCESS',
          pos: { x: 1, y: 0 }
        },
        {
          name: 'A',
          id: 2,
          buildId: 7,
          status: 'SUCCESS',
          pos: { x: 2, y: 0 }
        },
        {
          name: 'B',
          id: 3,
          buildId: 8,
          status: 'SUCCESS',
          pos: { x: 2, y: 1 }
        },
        {
          name: 'C',
          id: 4,
          buildId: 9,
          status: 'SUCCESS',
          pos: { x: 3, y: 0 }
        },
        {
          name: 'D',
          id: 5,
          buildId: 10,
          status: 'FAILURE',
          pos: { x: 4, y: 0 }
        }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 },
          status: 'STARTED_FROM'
        },
        {
          src: 'main',
          dest: 'A',
          from: { x: 1, y: 0 },
          to: { x: 2, y: 0 },
          status: 'SUCCESS'
        },
        {
          src: 'main',
          dest: 'B',
          from: { x: 1, y: 0 },
          to: { x: 2, y: 1 },
          status: 'SUCCESS'
        },
        {
          src: 'A',
          dest: 'C',
          from: { x: 2, y: 0 },
          to: { x: 3, y: 0 },
          status: 'SUCCESS'
        },
        {
          src: 'B',
          dest: 'D',
          from: { x: 2, y: 1 },
          to: { x: 4, y: 0 },
          status: 'SUCCESS'
        },
        {
          src: 'C',
          dest: 'D',
          from: { x: 3, y: 0 },
          to: { x: 4, y: 0 },
          status: 'SUCCESS'
        }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 2,
        width: 5
      }
    };
    const result = decorateGraph({
      inputGraph: COMPLEX_GRAPH,
      builds,
      start: '~commit'
    });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a complex graph with jobs', function (assert) {
    const jobs = [
      { id: 1 },
      {
        id: 2,
        isDisabled: true,
        state: 'DISABLED',
        permutations: [
          { annotations: { 'screwdriver.cd/manualStartEnabled': true } }
        ]
      },
      {
        id: 3,
        permutations: [
          { annotations: { 'screwdriver.cd/manualStartEnabled': false } }
        ]
      },
      {
        id: 4,
        state: ['message'],
        permutations: [{ annotations: {} }]
      }
    ];
    const expectedOutput = {
      nodes: [
        {
          name: '~pr',
          isDisabled: false,
          pos: { x: 0, y: 0 }
        },
        {
          name: '~commit',
          isDisabled: false,
          pos: { x: 0, y: 1 }
        },
        {
          name: 'main',
          id: 1,
          isDisabled: false,
          pos: { x: 1, y: 0 }
        },
        {
          name: 'A',
          id: 2,
          isDisabled: true,
          manualStartDisabled: false,
          stateChangeMessage: 'Disabled',
          status: 'DISABLED',
          pos: { x: 2, y: 0 }
        },
        {
          name: 'B',
          id: 3,
          isDisabled: false,
          manualStartDisabled: true,
          pos: { x: 2, y: 1 }
        },
        {
          name: 'C',
          id: 4,
          isDisabled: false,
          manualStartDisabled: false,
          pos: { x: 3, y: 0 }
        },
        {
          name: 'D',
          id: 5,
          isDisabled: false,
          pos: { x: 4, y: 0 }
        }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        },
        { src: 'main', dest: 'A', from: { x: 1, y: 0 }, to: { x: 2, y: 0 } },
        { src: 'main', dest: 'B', from: { x: 1, y: 0 }, to: { x: 2, y: 1 } },
        {
          src: 'A',
          dest: 'C',
          status: 'DISABLED',
          from: { x: 2, y: 0 },
          to: { x: 3, y: 0 }
        },
        { src: 'B', dest: 'D', from: { x: 2, y: 1 }, to: { x: 4, y: 0 } },
        { src: 'C', dest: 'D', from: { x: 3, y: 0 }, to: { x: 4, y: 0 } }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 2,
        width: 5
      }
    };
    const result = decorateGraph({ inputGraph: COMPLEX_GRAPH, jobs });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a non-chained pr pipeline with a join from a pr trigger', function (assert) {
    const inputGraph = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'downstream' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'downstream' }
      ]
    };
    const jobs = [
      {
        id: 1,
        group: 2,
        name: 'pr-2:main'
      }
    ];
    const builds = [
      {
        id: 3,
        jobId: 1,
        status: 'SUCCESS'
      }
    ];
    const expectedOutput = {
      nodes: [
        {
          name: '~pr',
          isDisabled: false,
          status: 'STARTED_FROM',
          pos: { x: 0, y: 0 }
        },
        {
          name: '~commit',
          isDisabled: false,
          pos: { x: 0, y: 1 }
        },
        {
          name: 'main',
          buildId: 3,
          isDisabled: false,
          status: 'SUCCESS',
          pos: { x: 1, y: 0 }
        },
        {
          name: 'downstream',
          isDisabled: false,
          pos: { x: 2, y: 0 }
        }
      ],
      edges: [
        {
          src: '~pr',
          dest: 'main',
          status: 'STARTED_FROM',
          from: { x: 0, y: 0 },
          to: { x: 1, y: 0 }
        },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        },
        {
          src: 'main',
          dest: 'downstream',
          from: { x: 1, y: 0 },
          to: { x: 2, y: 0 }
        }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 2,
        width: 3
      }
    };

    const result = decorateGraph({
      inputGraph,
      builds,
      jobs,
      start: '~pr',
      prNum: 2
    });

    assert.deepEqual(result, expectedOutput);
  });

  test('it handles detached jobs', function (assert) {
    const inputGraph = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'foo' },
        { name: 'bar' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' }
      ]
    };
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'main', pos: { x: 1, y: 0 } },
        { name: 'foo', pos: { x: 0, y: 2 } },
        { name: 'bar', pos: { x: 0, y: 3 } }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        {
          src: '~commit',
          dest: 'main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        height: 4,
        width: 2
      }
    };
    const result = decorateGraph({ inputGraph });

    assert.deepEqual(result, expectedOutput);
  });

  test('it handles complex misordered pipeline with multiple commit/pr/remote triggers', function (assert) {
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'no_main', pos: { x: 1, y: 0 } },
        { name: '~sd@241:main', pos: { x: 0, y: 2 } },
        { name: 'publish', pos: { x: 2, y: 0 } },
        { name: 'other_publish', pos: { x: 2, y: 1 } },
        { name: 'wow_new_main', pos: { x: 1, y: 1 } },
        { name: 'detached_main', pos: { x: 0, y: 3 } },
        { name: 'after_detached_main', pos: { x: 1, y: 3 } },
        { name: 'detached_solo', pos: { x: 0, y: 4 } }
      ],
      edges: [
        {
          src: '~commit',
          dest: 'no_main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 0 }
        },
        {
          src: '~pr',
          dest: 'no_main',
          from: { x: 0, y: 0 },
          to: { x: 1, y: 0 }
        },
        {
          src: '~sd@241:main',
          dest: 'no_main',
          from: { x: 0, y: 2 },
          to: { x: 1, y: 0 }
        },
        {
          src: 'no_main',
          dest: 'publish',
          from: { x: 1, y: 0 },
          to: { x: 2, y: 0 }
        },
        {
          src: 'wow_new_main',
          dest: 'other_publish',
          from: { x: 1, y: 1 },
          to: { x: 2, y: 1 }
        },
        {
          src: '~commit',
          dest: 'wow_new_main',
          from: { x: 0, y: 1 },
          to: { x: 1, y: 1 }
        },
        {
          src: '~pr',
          dest: 'wow_new_main',
          from: { x: 0, y: 0 },
          to: { x: 1, y: 1 }
        },
        {
          src: '~sd@241:main',
          dest: 'wow_new_main',
          from: { x: 0, y: 2 },
          to: { x: 1, y: 1 }
        },
        {
          src: 'detached_main',
          dest: 'after_detached_main',
          from: { x: 0, y: 3 },
          to: { x: 1, y: 3 }
        }
      ],
      stages: [],
      stageEdges: [],
      meta: {
        width: 3,
        height: 5
      }
    };
    const result = decorateGraph({ inputGraph: MORE_COMPLEX_GRAPH });

    assert.deepEqual(result, expectedOutput);
  });

  /**
   * 1. Should exclude nodes corresponding to implicit stage setup/teardown jobs
   * 2. Should bypass edges associated with implicit stage setup/teardown jobs
   * 3. Should derive event stages from the workflow graph and enrich it with latest stage definition (Ex: description)
   * 4. Should generate sub workflow graph for each stage
   */
  test('it processes graph with stages', function (assert) {
    const GRAPH = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'component', id: 1 },
        { name: 'publish', id: 2 },
        {
          name: 'stage@integration:setup',
          id: 28,
          stageName: 'integration',
          virtual: true
        },
        { name: 'ci-deploy', id: 21, stageName: 'integration' },
        { name: 'ci-test', id: 22, stageName: 'integration' },
        { name: 'ci-certify', id: 23, stageName: 'integration' },
        {
          name: 'stage@integration:teardown',
          id: 29,
          stageName: 'integration',
          virtual: true
        },
        { name: 'stage@production:setup', id: 38, stageName: 'production' },
        { name: 'prod-deploy', id: 31, stageName: 'production' },
        { name: 'prod-test', id: 32, stageName: 'production' },
        { name: 'prod-certify', id: 33, stageName: 'production' },
        {
          name: 'stage@production:teardown',
          id: 39,
          stageName: 'production'
        }
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

    const STAGES = [
      {
        id: 7,
        name: 'integration',
        jobIds: [21, 22, 23, 24],
        setup: 28,
        teardown: 29
      },
      {
        id: 8,
        name: 'production',
        jobs: [31, 32],
        setup: 38,
        teardown: 39
      },
      {
        id: 9,
        name: 'canary',
        jobs: [41, 42],
        setup: 48,
        teardown: 49
      }
    ];

    const COLLAPSED_STAGES = new Set([]);

    const JOBS = [
      { id: 1, name: 'component', virtualJob: false },
      { id: 2, name: 'publish', virtualJob: false },
      { id: 21, name: 'ci-deploy', virtualJob: false },
      { id: 22, name: 'ci-test', virtualJob: false },
      { id: 23, name: 'ci-certify', virtualJob: false },
      { id: 28, name: 'stage@integration:setup', virtualJob: true },
      { id: 29, name: 'stage@integration:teardown', virtualJob: true },
      { id: 31, name: 'prod-deploy', virtualJob: false },
      { id: 32, name: 'prod-test', virtualJob: false },
      { id: 33, name: 'prod-certify', virtualJob: false },
      { id: 38, name: 'stage@production:setup', virtualJob: false },
      { id: 39, name: 'stage@production:teardown', virtualJob: false }
    ];

    const expectedOutput = {
      edges: [
        {
          dest: 'component',
          from: {
            x: 0,
            y: 0
          },
          src: '~pr',
          to: {
            x: 1,
            y: 0
          }
        },
        {
          dest: 'component',
          from: {
            x: 0,
            y: 1
          },
          src: '~commit',
          to: {
            x: 1,
            y: 0
          }
        },
        {
          dest: 'publish',
          from: {
            x: 1,
            y: 0
          },
          src: 'component',
          to: {
            x: 2,
            y: 0
          }
        },
        {
          dest: 'ci-test',
          from: {
            x: 3,
            y: 0
          },
          src: 'ci-deploy',
          to: {
            x: 4,
            y: 0
          }
        },
        {
          dest: 'ci-certify',
          from: {
            x: 4,
            y: 0
          },
          src: 'ci-test',
          to: {
            x: 5,
            y: 0
          }
        },
        {
          dest: 'prod-deploy',
          from: {
            x: 6,
            y: 0
          },
          src: 'stage@production:setup',
          to: {
            x: 7,
            y: 0
          }
        },
        {
          dest: 'prod-test',
          from: {
            x: 7,
            y: 0
          },
          src: 'prod-deploy',
          to: {
            x: 8,
            y: 0
          }
        },
        {
          dest: 'prod-certify',
          from: {
            x: 8,
            y: 0
          },
          src: 'prod-test',
          to: {
            x: 9,
            y: 0
          }
        },
        {
          dest: 'stage@production:teardown',
          from: {
            x: 9,
            y: 0
          },
          src: 'prod-certify',
          to: {
            x: 10,
            y: 0
          }
        },
        {
          dest: 'ci-deploy',
          from: {
            x: 2,
            y: 0
          },
          hidden: true,
          src: 'publish',
          to: {
            x: 3,
            y: 0
          }
        },
        {
          dest: 'stage@production:setup',
          from: {
            x: 5,
            y: 0
          },
          hidden: true,
          src: 'ci-certify',
          to: {
            x: 6,
            y: 0
          }
        }
      ],
      meta: {
        height: 2,
        width: 11
      },
      nodes: [
        {
          isDisabled: false,
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        },
        {
          isDisabled: false,
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        },
        {
          id: 1,
          isDisabled: false,
          name: 'component',
          pos: {
            x: 1,
            y: 0
          }
        },
        {
          id: 2,
          isDisabled: false,
          name: 'publish',
          pos: {
            x: 2,
            y: 0
          }
        },
        {
          id: 21,
          isDisabled: false,
          name: 'ci-deploy',
          pos: {
            x: 3,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 22,
          isDisabled: false,
          name: 'ci-test',
          pos: {
            x: 4,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 23,
          isDisabled: false,
          name: 'ci-certify',
          pos: {
            x: 5,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 38,
          isDisabled: false,
          name: 'stage@production:setup',
          pos: {
            x: 6,
            y: 0
          },
          stageName: 'production'
        },
        {
          id: 31,
          isDisabled: false,
          name: 'prod-deploy',
          pos: {
            x: 7,
            y: 0
          },
          stageName: 'production'
        },
        {
          id: 32,
          isDisabled: false,
          name: 'prod-test',
          pos: {
            x: 8,
            y: 0
          },
          stageName: 'production'
        },
        {
          id: 33,
          isDisabled: false,
          name: 'prod-certify',
          pos: {
            x: 9,
            y: 0
          },
          stageName: 'production'
        },
        {
          id: 39,
          isDisabled: false,
          name: 'stage@production:teardown',
          pos: {
            x: 10,
            y: 0
          },
          stageName: 'production'
        }
      ]
    };

    expectedOutput.stages = [
      {
        description: undefined,
        graph: {
          edges: [expectedOutput.edges[3], expectedOutput.edges[4]],
          meta: {
            height: 1,
            width: 3
          },
          nodes: [
            expectedOutput.nodes[4],
            expectedOutput.nodes[5],
            expectedOutput.nodes[6]
          ]
        },
        id: 7,
        jobs: [
          { id: 21, name: 'ci-deploy', stageName: 'integration' },
          { id: 22, name: 'ci-test', stageName: 'integration' },
          { id: 23, name: 'ci-certify', stageName: 'integration' }
        ],
        name: 'integration',
        pos: {
          x: 3,
          y: 0
        },
        setup: {
          id: 28,
          name: 'stage@integration:setup',
          stageName: 'integration',
          virtual: true
        },
        teardown: {
          id: 29,
          name: 'stage@integration:teardown',
          stageName: 'integration',
          virtual: true
        },
        isCollapsed: false
      },
      {
        description: undefined,
        graph: {
          edges: [
            expectedOutput.edges[5],
            expectedOutput.edges[6],
            expectedOutput.edges[7],
            expectedOutput.edges[8]
          ],
          meta: {
            height: 1,
            width: 5
          },
          nodes: [
            expectedOutput.nodes[7],
            expectedOutput.nodes[8],
            expectedOutput.nodes[9],
            expectedOutput.nodes[10],
            expectedOutput.nodes[11]
          ]
        },
        id: 8,
        jobs: [
          { id: 31, name: 'prod-deploy', stageName: 'production' },
          { id: 32, name: 'prod-test', stageName: 'production' },
          { id: 33, name: 'prod-certify', stageName: 'production' }
        ],
        name: 'production',
        pos: {
          x: 6,
          y: 0
        },
        setup: {
          id: 38,
          name: 'stage@production:setup',
          stageName: 'production'
        },
        teardown: {
          id: 39,
          name: 'stage@production:teardown',
          stageName: 'production'
        },
        isCollapsed: false
      }
    ];

    expectedOutput.stageEdges = [
      {
        dest: 'stage@integration:setup',
        destStageName: 'integration',
        from: expectedOutput.nodes[3],
        hidden: true,
        src: 'publish',
        to: expectedOutput.stages[0]
      },
      {
        dest: 'stage@production:setup',
        destStageName: 'production',
        from: expectedOutput.stages[0],
        hidden: true,
        src: 'stage@integration:teardown',
        srcStageName: 'integration',
        to: expectedOutput.stages[1]
      }
    ];

    const result = decorateGraph({
      inputGraph: GRAPH,
      stages: STAGES,
      collapsedStages: COLLAPSED_STAGES,
      jobs: JOBS
    });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes graph with collapsed stages', function (assert) {
    const GRAPH = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'component', id: 1 },
        { name: 'publish', id: 2 },
        {
          name: 'stage@integration:setup',
          id: 28,
          stageName: 'integration',
          virtual: true
        },
        { name: 'ci-deploy', id: 21, stageName: 'integration' },
        { name: 'ci-test', id: 22, stageName: 'integration' },
        { name: 'ci-certify', id: 23, stageName: 'integration' },
        {
          name: 'stage@integration:teardown',
          id: 29,
          stageName: 'integration',
          virtual: true
        },
        { name: 'stage@production:setup', id: 38, stageName: 'production' },
        { name: 'prod-deploy', id: 31, stageName: 'production' },
        { name: 'prod-test', id: 32, stageName: 'production' },
        { name: 'prod-certify', id: 33, stageName: 'production' },
        {
          name: 'stage@production:teardown',
          id: 39,
          stageName: 'production'
        }
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

    const STAGES = [
      {
        id: 7,
        name: 'integration',
        jobIds: [21, 22, 23, 24],
        setup: 28,
        teardown: 29
      },
      {
        id: 8,
        name: 'production',
        jobs: [31, 32],
        setup: 38,
        teardown: 39
      },
      {
        id: 9,
        name: 'canary',
        jobs: [41, 42],
        setup: 48,
        teardown: 49
      }
    ];

    const COLLAPSED_STAGES = new Set(['production']);

    const JOBS = [
      { id: 1, name: 'component', virtualJob: false },
      { id: 2, name: 'publish', virtualJob: false },
      { id: 21, name: 'ci-deploy', virtualJob: false },
      { id: 22, name: 'ci-test', virtualJob: false },
      { id: 23, name: 'ci-certify', virtualJob: false },
      { id: 28, name: 'stage@integration:setup', virtualJob: true },
      { id: 29, name: 'stage@integration:teardown', virtualJob: true },
      { id: 31, name: 'prod-deploy', virtualJob: false },
      { id: 32, name: 'prod-test', virtualJob: false },
      { id: 33, name: 'prod-certify', virtualJob: false },
      { id: 38, name: 'stage@production:setup', virtualJob: false },
      { id: 39, name: 'stage@production:teardown', virtualJob: false }
    ];

    const expectedOutput = {
      edges: [
        {
          dest: 'component',
          from: {
            x: 0,
            y: 0
          },
          src: '~pr',
          to: {
            x: 1,
            y: 0
          }
        },
        {
          dest: 'component',
          from: {
            x: 0,
            y: 1
          },
          src: '~commit',
          to: {
            x: 1,
            y: 0
          }
        },
        {
          dest: 'publish',
          from: {
            x: 1,
            y: 0
          },
          src: 'component',
          to: {
            x: 2,
            y: 0
          }
        },
        {
          dest: 'ci-test',
          from: {
            x: 3,
            y: 0
          },
          src: 'ci-deploy',
          to: {
            x: 4,
            y: 0
          }
        },
        {
          dest: 'ci-certify',
          from: {
            x: 4,
            y: 0
          },
          src: 'ci-test',
          to: {
            x: 5,
            y: 0
          }
        },
        {
          dest: 'ci-deploy',
          from: {
            x: 2,
            y: 0
          },
          hidden: true,
          src: 'publish',
          to: {
            x: 3,
            y: 0
          }
        },
        {
          dest: 'stage@production jobs (3)',
          from: {
            x: 5,
            y: 0
          },
          hidden: true,
          src: 'ci-certify',
          to: {
            x: 6,
            y: 0
          }
        }
      ],
      meta: {
        height: 2,
        width: 7
      },
      nodes: [
        {
          isDisabled: false,
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        },
        {
          isDisabled: false,
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        },
        {
          id: 1,
          isDisabled: false,
          name: 'component',
          pos: {
            x: 1,
            y: 0
          }
        },
        {
          id: 2,
          isDisabled: false,
          name: 'publish',
          pos: {
            x: 2,
            y: 0
          }
        },
        {
          id: 21,
          isDisabled: false,
          name: 'ci-deploy',
          pos: {
            x: 3,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 22,
          isDisabled: false,
          name: 'ci-test',
          pos: {
            x: 4,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 23,
          isDisabled: false,
          name: 'ci-certify',
          pos: {
            x: 5,
            y: 0
          },
          stageName: 'integration'
        },
        {
          description:
            'This job group includes the following jobs: prod-deploy, prod-test, prod-certify',
          isDisabled: false,
          name: 'stage@production jobs (3)',
          pos: {
            x: 6,
            y: 0
          },
          stageName: 'production',
          type: 'JOB_GROUP'
        }
      ]
    };

    expectedOutput.stages = [
      {
        description: undefined,
        graph: {
          edges: [expectedOutput.edges[3], expectedOutput.edges[4]],
          meta: {
            height: 1,
            width: 3
          },
          nodes: [
            expectedOutput.nodes[4],
            expectedOutput.nodes[5],
            expectedOutput.nodes[6]
          ]
        },
        id: 7,
        jobs: [
          { id: 21, name: 'ci-deploy', stageName: 'integration' },
          { id: 22, name: 'ci-test', stageName: 'integration' },
          { id: 23, name: 'ci-certify', stageName: 'integration' }
        ],
        name: 'integration',
        pos: {
          x: 3,
          y: 0
        },
        setup: {
          id: 28,
          name: 'stage@integration:setup',
          stageName: 'integration',
          virtual: true
        },
        teardown: {
          id: 29,
          name: 'stage@integration:teardown',
          stageName: 'integration',
          virtual: true
        },
        isCollapsed: false
      },
      {
        description: undefined,
        graph: {
          edges: [],
          meta: {
            height: 1,
            width: 1
          },
          nodes: [expectedOutput.nodes[7]]
        },
        id: 8,
        jobs: [expectedOutput.nodes[7]],
        name: 'production',
        pos: {
          x: 6,
          y: 0
        },
        isCollapsed: true
      }
    ];

    expectedOutput.stageEdges = [
      {
        dest: 'stage@integration:setup',
        destStageName: 'integration',
        from: expectedOutput.nodes[3],
        hidden: true,
        src: 'publish',
        to: expectedOutput.stages[0]
      },
      {
        dest: 'stage@production jobs (3)',
        destStageName: 'production',
        from: expectedOutput.stages[0],
        hidden: true,
        src: 'stage@integration:teardown',
        srcStageName: 'integration',
        to: expectedOutput.stages[1]
      }
    ];

    const result = decorateGraph({
      inputGraph: GRAPH,
      stages: STAGES,
      collapsedStages: COLLAPSED_STAGES,
      jobs: JOBS
    });

    assert.deepEqual(result, expectedOutput);
  });

  /**
   * 1. Should not derive event stages from the workflow graph
   * 2. Should not include stages in the resulting decorated graph
   */
  test('it processes graph with stages nodes as regular workflow graph when stage metadata is not provided', function (assert) {
    const GRAPH = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'component', id: 1 },
        { name: 'publish', id: 2 },
        {
          name: 'stage@integration:setup',
          id: 28,
          stageName: 'integration',
          virtual: true
        },
        { name: 'ci-deploy', id: 21, stageName: 'integration' },
        { name: 'ci-test', id: 22, stageName: 'integration' },
        { name: 'ci-certify', id: 23, stageName: 'integration' },
        {
          name: 'stage@integration:teardown',
          id: 29,
          stageName: 'integration',
          virtual: true
        }
      ],
      edges: [
        { src: '~pr', dest: 'component' },
        { src: '~commit', dest: 'component' },
        { src: 'component', dest: 'publish' },
        { src: 'publish', dest: 'stage@integration:setup' },
        { src: 'stage@integration:setup', dest: 'ci-deploy' },
        { src: 'ci-deploy', dest: 'ci-test' },
        { src: 'ci-test', dest: 'ci-certify' },
        { src: 'ci-certify', dest: 'stage@integration:teardown' }
      ]
    };

    const JOBS = [
      { id: 1, name: 'component', virtualJob: false },
      { id: 2, name: 'publish', virtualJob: false },
      { id: 21, name: 'ci-deploy', virtualJob: false },
      { id: 22, name: 'ci-test', virtualJob: false },
      { id: 23, name: 'ci-certify', virtualJob: false },
      { id: 28, name: 'stage@integration:setup', virtualJob: true },
      { id: 29, name: 'stage@integration:teardown', virtualJob: true }
    ];

    const expectedOutput = {
      edges: [
        {
          dest: 'component',
          from: {
            x: 0,
            y: 0
          },
          src: '~pr',
          to: {
            x: 1,
            y: 0
          }
        },
        {
          dest: 'component',
          from: {
            x: 0,
            y: 1
          },
          src: '~commit',
          to: {
            x: 1,
            y: 0
          }
        },
        {
          dest: 'publish',
          from: {
            x: 1,
            y: 0
          },
          src: 'component',
          to: {
            x: 2,
            y: 0
          }
        },
        {
          dest: 'ci-test',
          from: {
            x: 3,
            y: 0
          },
          src: 'ci-deploy',
          to: {
            x: 4,
            y: 0
          }
        },
        {
          dest: 'ci-certify',
          from: {
            x: 4,
            y: 0
          },
          src: 'ci-test',
          to: {
            x: 5,
            y: 0
          }
        },
        {
          dest: 'ci-deploy',
          from: {
            x: 2,
            y: 0
          },
          src: 'publish',
          to: {
            x: 3,
            y: 0
          }
        }
      ],
      meta: {
        height: 2,
        width: 6
      },
      nodes: [
        {
          isDisabled: false,
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        },
        {
          isDisabled: false,
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        },
        {
          id: 1,
          isDisabled: false,
          name: 'component',
          pos: {
            x: 1,
            y: 0
          }
        },
        {
          id: 2,
          isDisabled: false,
          name: 'publish',
          pos: {
            x: 2,
            y: 0
          }
        },
        {
          id: 21,
          isDisabled: false,
          name: 'ci-deploy',
          pos: {
            x: 3,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 22,
          isDisabled: false,
          name: 'ci-test',
          pos: {
            x: 4,
            y: 0
          },
          stageName: 'integration'
        },
        {
          id: 23,
          isDisabled: false,
          name: 'ci-certify',
          pos: {
            x: 5,
            y: 0
          },
          stageName: 'integration'
        }
      ]
    };

    expectedOutput.stages = [];
    expectedOutput.stageEdges = [];

    const result = decorateGraph({
      inputGraph: GRAPH,
      stages: [],
      jobs: JOBS
    });

    assert.deepEqual(result, expectedOutput);
  });

  test('Non stage jobs should not be positioned inside stages', function (assert) {
    const GRAPH = {
      nodes: [
        {
          name: '~pr'
        },
        {
          name: '~commit'
        },
        {
          name: 'triggering-stage',
          id: 1
        },
        {
          name: 'overlapping-non-stage-job-at-start-1',
          id: 2
        },
        {
          name: 'overlapping-non-stage-job-at-start-2a',
          id: 3
        },
        {
          name: 'overlapping-non-stage-job-at-start-2b',
          id: 4
        },
        {
          name: 'ci-deploy',
          stageName: 'integration',
          id: 52
        },
        {
          name: 'stage@integration:setup',
          virtual: true,
          stageName: 'integration',
          id: 51
        },
        {
          name: 'ci-test-batch-1',
          stageName: 'integration',
          id: 53
        },
        {
          name: 'ci-test-batch-2',
          stageName: 'integration',
          id: 54
        },
        {
          name: 'ci-certify',
          stageName: 'integration',
          id: 55
        },
        {
          name: 'overlapping-non-stage-job-at-end-1',
          id: 6
        },
        {
          name: 'overlapping-non-stage-job-at-end-2',
          id: 7
        },
        {
          name: 'triggered-by-stage',
          id: 8
        },
        {
          name: 'stage@integration:teardown',
          virtual: true,
          stageName: 'integration',
          id: 56
        }
      ],
      edges: [
        {
          src: '~pr',
          dest: 'triggering-stage'
        },
        {
          src: '~commit',
          dest: 'triggering-stage'
        },
        {
          src: 'triggering-stage',
          dest: 'overlapping-non-stage-job-at-start-1',
          join: true
        },
        {
          src: 'overlapping-non-stage-job-at-start-1',
          dest: 'overlapping-non-stage-job-at-start-2a',
          join: true
        },
        {
          src: 'overlapping-non-stage-job-at-start-1',
          dest: 'overlapping-non-stage-job-at-start-2b',
          join: true
        },
        {
          src: 'stage@integration:setup',
          dest: 'ci-deploy'
        },
        {
          src: 'ci-deploy',
          dest: 'ci-test-batch-1',
          join: true
        },
        {
          src: 'ci-deploy',
          dest: 'ci-test-batch-2',
          join: true
        },
        {
          src: 'ci-test-batch-1',
          dest: 'ci-certify',
          join: true
        },
        {
          src: 'ci-test-batch-2',
          dest: 'ci-certify',
          join: true
        },
        {
          src: 'ci-test-batch-1',
          dest: 'overlapping-non-stage-job-at-end-1',
          join: true
        },
        {
          src: 'ci-test-batch-2',
          dest: 'overlapping-non-stage-job-at-end-2',
          join: true
        },
        {
          src: 'stage@integration:teardown',
          dest: 'triggered-by-stage'
        },
        {
          src: 'triggering-stage',
          dest: 'stage@integration:setup',
          join: true
        },
        {
          src: 'ci-certify',
          dest: 'stage@integration:teardown',
          join: true
        }
      ]
    };

    const STAGES = [
      {
        id: 1,
        name: 'integration',
        jobIds: [52, 53, 54, 55],
        setup: 51,
        teardown: 56
      }
    ];

    const COLLAPSED_STAGES = new Set([]);

    const JOBS = [
      { id: 1, name: 'triggering-stage', virtualJob: false },
      {
        id: 2,
        name: 'overlapping-non-stage-job-at-start-1',
        virtualJob: false
      },
      {
        id: 3,
        name: 'overlapping-non-stage-job-at-start-2a',
        virtualJob: false
      },
      {
        id: 4,
        name: 'overlapping-non-stage-job-at-start-2a',
        virtualJob: false
      },
      { id: 51, name: 'stage@integration:setup', virtualJob: true },
      { id: 52, name: 'stage@integration:setup', virtualJob: true },
      { id: 53, name: 'stage@integration:setup', virtualJob: true },
      { id: 54, name: 'stage@integration:setup', virtualJob: true },
      { id: 55, name: 'stage@integration:setup', virtualJob: true },
      { id: 56, name: 'stage@integration:teardown', virtualJob: true },
      { id: 6, name: 'overlapping-non-stage-job-at-end-1', virtualJob: false },
      { id: 7, name: 'overlapping-non-stage-job-at-end-2', virtualJob: false },
      { id: 8, name: 'triggered-by-stage', virtualJob: false }
    ];

    const result = decorateGraph({
      inputGraph: GRAPH,
      stages: STAGES,
      collapsedStages: COLLAPSED_STAGES,
      jobs: JOBS
    });

    const {
      nodes: decoratedNodes,
      edges: decoratedEdges,
      stages: decoratedStages
    } = result;

    // nodes and edges associated with stage setup/teardown are excluded
    assert.equal(13, decoratedNodes.length);
    assert.equal(13, decoratedEdges.length);

    assert.equal(1, decoratedStages.length);

    const decoratedIntegrationStage = decoratedStages[0];
    const { x: stageStartX, y: stageStartY } = decoratedIntegrationStage.pos;
    const stageEndX =
      stageStartX + decoratedIntegrationStage.graph.meta.width - 1;
    const stageEndY =
      stageStartY + decoratedIntegrationStage.graph.meta.height - 1;

    decoratedNodes.forEach(n => {
      const isInsideStageMatrix =
        n.pos.x >= stageStartX &&
        n.pos.x <= stageEndX &&
        n.pos.y >= stageStartY &&
        n.pos.y <= stageEndY;

      if (n.stageName) {
        assert.ok(isInsideStageMatrix);
      } else {
        assert.notOk(isInsideStageMatrix);
      }
    });
  });

  test('it determines the depth of a graph from various starting points', function (assert) {
    // edges not array
    assert.equal(graphDepth('meow', '~commit'), Number.MAX_VALUE, 'not array');
    // simple graph, commit
    assert.equal(graphDepth(SIMPLE_GRAPH.edges, '~commit'), 1, 'simple commit');
    // simple graph, pr
    assert.equal(graphDepth(SIMPLE_GRAPH.edges, '~pr'), 1, 'simple pr');
    // complex graph, commit
    assert.equal(
      graphDepth(COMPLEX_GRAPH.edges, '~commit'),
      5,
      'complex commit'
    );
    // more complex graph, commit
    assert.equal(
      graphDepth(MORE_COMPLEX_GRAPH.edges, '~commit'),
      4,
      'very complex commit'
    );
    // more complex graph, reverse trigger
    assert.equal(
      graphDepth(MORE_COMPLEX_GRAPH.edges, '~sd@241:main'),
      4,
      'very complex trigger'
    );
    // more complex graph, detached workflow
    assert.equal(
      graphDepth(MORE_COMPLEX_GRAPH.edges, 'detached_main'),
      2,
      'very complex detached'
    );
    // more complex graph, detached job
    assert.equal(
      graphDepth(MORE_COMPLEX_GRAPH.edges, 'detached_solo'),
      1,
      'very complex detached 2'
    );
    // more complex graph, partial pipeline
    assert.equal(
      graphDepth(MORE_COMPLEX_GRAPH.edges, 'publish'),
      1,
      'very complex partial'
    );
  });

  test('it determines if a job name is a root node', function (assert) {
    assert.ok(isRoot(MORE_COMPLEX_GRAPH.edges, 'detached_main'));
    assert.ok(isRoot(MORE_COMPLEX_GRAPH.edges, '~commit'));
    assert.notOk(isRoot(MORE_COMPLEX_GRAPH.edges, 'no_main'));
  });

  test('it determines if a node name is a trigger node', function (assert) {
    assert.ok(isTrigger('~commit', '~commit'));
    assert.ok(isTrigger('~commit:/^detached_main$/', '~commit:detached_main'));
    assert.ok(
      isTrigger('~commit:/^detached_main.*$/', '~commit:detached_main1')
    );
    assert.notOk(isTrigger('~pr:/^detached_main$/', '~commit:detached_main'));
    assert.notOk(
      isTrigger('~commit:/^detached_main$/', '~commit:detached_main1')
    );
    assert.notOk(isTrigger('~commit:detached_main', 'no_main'));
  });

  test('it reduce to subgraph given a starting point', function (assert) {
    assert.deepEqual(subgraphFilter(SIMPLE_GRAPH, 'main'), {
      nodes: [{ name: 'main' }],
      edges: []
    });
    assert.deepEqual(subgraphFilter(SIMPLE_GRAPH), SIMPLE_GRAPH);
    assert.deepEqual(subgraphFilter(COMPLEX_GRAPH, 'A'), {
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
    assert.deepEqual(subgraphFilter(MORE_COMPLEX_GRAPH, 'wow_new_main'), {
      nodes: [{ name: 'other_publish' }, { name: 'wow_new_main' }],
      edges: [{ src: 'wow_new_main', dest: 'other_publish' }]
    });
  });

  test('it reverses a graph', function (assert) {
    const reversedGraph = reverseGraph(COMPLEX_GRAPH);

    assert.deepEqual(reversedGraph.nodes, COMPLEX_GRAPH.nodes);
    assert.equal(reversedGraph.edges.length, COMPLEX_GRAPH.edges.length);
    reversedGraph.edges.forEach((edge, index) => {
      assert.equal(edge.src, COMPLEX_GRAPH.edges[index].dest);
      assert.equal(edge.dest, COMPLEX_GRAPH.edges[index].src);
    });
  });
});
