import {
  icon,
  node,
  decorateGraph,
  subgraphFilter,
  graphDepth,
  isRoot,
  isTrigger
} from 'screwdriver-ui/utils/graph-tools';
import { module, test } from 'qunit';

const SIMPLE_GRAPH = {
  nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
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

module('Unit | Utility | graph tools', function() {
  test('it gets the right icons', function(assert) {
    assert.equal(icon('SUCCESS'), '\ue903');
    assert.equal(icon('banana'), '\ue901');
  });

  test('it gets an element from a list', function(assert) {
    const list = [{ name: 'foo' }, { name: 'bar' }];
    const result = node(list, 'bar');

    assert.deepEqual(result, { name: 'bar' });
  });

  test('it processes a simple graph without builds', function(assert) {
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'main', pos: { x: 1, y: 0 } }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        { src: '~commit', dest: 'main', from: { x: 0, y: 1 }, to: { x: 1, y: 0 } }
      ],
      meta: {
        height: 2,
        width: 2
      }
    };
    const result = decorateGraph({ inputGraph: SIMPLE_GRAPH });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a more complex graph without builds', function(assert) {
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
        { src: '~commit', dest: 'main', from: { x: 0, y: 1 }, to: { x: 1, y: 0 } },
        { src: 'main', dest: 'A', from: { x: 1, y: 0 }, to: { x: 2, y: 0 } },
        { src: 'main', dest: 'B', from: { x: 1, y: 0 }, to: { x: 2, y: 1 } },
        { src: 'A', dest: 'C', from: { x: 2, y: 0 }, to: { x: 3, y: 0 } },
        { src: 'B', dest: 'D', from: { x: 2, y: 1 }, to: { x: 4, y: 0 } },
        { src: 'C', dest: 'D', from: { x: 3, y: 0 }, to: { x: 4, y: 0 } }
      ],
      meta: {
        height: 2,
        width: 5
      }
    };
    const result = decorateGraph({ inputGraph: COMPLEX_GRAPH });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a complex graph with builds', function(assert) {
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
        { name: 'main', id: 1, buildId: 6, status: 'SUCCESS', pos: { x: 1, y: 0 } },
        { name: 'A', id: 2, buildId: 7, status: 'SUCCESS', pos: { x: 2, y: 0 } },
        { name: 'B', id: 3, buildId: 8, status: 'SUCCESS', pos: { x: 2, y: 1 } },
        { name: 'C', id: 4, buildId: 9, status: 'SUCCESS', pos: { x: 3, y: 0 } },
        { name: 'D', id: 5, buildId: 10, status: 'FAILURE', pos: { x: 4, y: 0 } }
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
        { src: 'main', dest: 'A', from: { x: 1, y: 0 }, to: { x: 2, y: 0 }, status: 'SUCCESS' },
        { src: 'main', dest: 'B', from: { x: 1, y: 0 }, to: { x: 2, y: 1 }, status: 'SUCCESS' },
        { src: 'A', dest: 'C', from: { x: 2, y: 0 }, to: { x: 3, y: 0 }, status: 'SUCCESS' },
        { src: 'B', dest: 'D', from: { x: 2, y: 1 }, to: { x: 4, y: 0 }, status: 'SUCCESS' },
        { src: 'C', dest: 'D', from: { x: 3, y: 0 }, to: { x: 4, y: 0 }, status: 'SUCCESS' }
      ],
      meta: {
        height: 2,
        width: 5
      }
    };
    const result = decorateGraph({ inputGraph: COMPLEX_GRAPH, builds, start: '~commit' });

    assert.deepEqual(result, expectedOutput);
  });

  test('it processes a complex graph with jobs', function(assert) {
    const jobs = [
      { id: 1 },
      {
        id: 2,
        permutations: [{ annotations: { 'screwdriver.cd/manualStartEnabled': true } }]
      },
      {
        id: 3,
        permutations: [{ annotations: { 'screwdriver.cd/manualStartEnabled': false } }]
      },
      {
        id: 4,
        state: ['message'],
        permutations: [{ annotations: {} }]
      }
    ];
    const expectedOutput = {
      nodes: [
        { name: '~pr', pos: { x: 0, y: 0 } },
        { name: '~commit', pos: { x: 0, y: 1 } },
        { name: 'main', id: 1, pos: { x: 1, y: 0 } },
        {
          name: 'A',
          id: 2,
          pos: { x: 2, y: 0 },
          manualStartDisabled: false
        },
        { name: 'B', id: 3, pos: { x: 2, y: 1 }, manualStartDisabled: true },
        {
          name: 'C',
          id: 4,
          pos: { x: 3, y: 0 },
          manualStartDisabled: false
        },
        { name: 'D', id: 5, pos: { x: 4, y: 0 } }
      ],
      edges: [
        { src: '~pr', dest: 'main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        { src: '~commit', dest: 'main', from: { x: 0, y: 1 }, to: { x: 1, y: 0 } },
        { src: 'main', dest: 'A', from: { x: 1, y: 0 }, to: { x: 2, y: 0 } },
        { src: 'main', dest: 'B', from: { x: 1, y: 0 }, to: { x: 2, y: 1 } },
        { src: 'A', dest: 'C', from: { x: 2, y: 0 }, to: { x: 3, y: 0 } },
        { src: 'B', dest: 'D', from: { x: 2, y: 1 }, to: { x: 4, y: 0 } },
        { src: 'C', dest: 'D', from: { x: 3, y: 0 }, to: { x: 4, y: 0 } }
      ],
      meta: {
        height: 2,
        width: 5
      }
    };
    const result = decorateGraph({ inputGraph: COMPLEX_GRAPH, jobs });

    assert.deepEqual(result, expectedOutput);
  });

  test('it handles detached jobs', function(assert) {
    const inputGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }, { name: 'foo' }, { name: 'bar' }],
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
        { src: '~commit', dest: 'main', from: { x: 0, y: 1 }, to: { x: 1, y: 0 } }
      ],
      meta: {
        height: 4,
        width: 2
      }
    };
    const result = decorateGraph({ inputGraph });

    assert.deepEqual(result, expectedOutput);
  });

  test('it handles complex misordered pipeline with multiple commit/pr/remote triggers', function(assert) {
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
        { src: '~commit', dest: 'no_main', from: { x: 0, y: 1 }, to: { x: 1, y: 0 } },
        { src: '~pr', dest: 'no_main', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        { src: '~sd@241:main', dest: 'no_main', from: { x: 0, y: 2 }, to: { x: 1, y: 0 } },
        { src: 'no_main', dest: 'publish', from: { x: 1, y: 0 }, to: { x: 2, y: 0 } },
        { src: 'wow_new_main', dest: 'other_publish', from: { x: 1, y: 1 }, to: { x: 2, y: 1 } },
        { src: '~commit', dest: 'wow_new_main', from: { x: 0, y: 1 }, to: { x: 1, y: 1 } },
        { src: '~pr', dest: 'wow_new_main', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        { src: '~sd@241:main', dest: 'wow_new_main', from: { x: 0, y: 2 }, to: { x: 1, y: 1 } },
        {
          src: 'detached_main',
          dest: 'after_detached_main',
          from: { x: 0, y: 3 },
          to: { x: 1, y: 3 }
        }
      ],
      meta: {
        width: 3,
        height: 5
      }
    };
    const result = decorateGraph({ inputGraph: MORE_COMPLEX_GRAPH });

    assert.deepEqual(result, expectedOutput);
  });

  test('it determines the depth of a graph from various starting points', function(assert) {
    // edges not array
    assert.equal(graphDepth('meow', '~commit'), Number.MAX_VALUE, 'not array');
    // simple graph, commit
    assert.equal(graphDepth(SIMPLE_GRAPH.edges, '~commit'), 1, 'simple commit');
    // simple graph, pr
    assert.equal(graphDepth(SIMPLE_GRAPH.edges, '~pr'), 1, 'simple pr');
    // complex graph, commit
    assert.equal(graphDepth(COMPLEX_GRAPH.edges, '~commit'), 5, 'complex commit');
    // more complex graph, commit
    assert.equal(graphDepth(MORE_COMPLEX_GRAPH.edges, '~commit'), 4, 'very complex commit');
    // more complex graph, reverse trigger
    assert.equal(graphDepth(MORE_COMPLEX_GRAPH.edges, '~sd@241:main'), 4, 'very complex trigger');
    // more complex graph, detached workflow
    assert.equal(graphDepth(MORE_COMPLEX_GRAPH.edges, 'detached_main'), 2, 'very complex detached');
    // more complex graph, detached job
    assert.equal(graphDepth(MORE_COMPLEX_GRAPH.edges, 'detached_solo'), 1, 'very complex detached 2');
    // more complex graph, partial pipeline
    assert.equal(graphDepth(MORE_COMPLEX_GRAPH.edges, 'publish'), 1, 'very complex partial');
  });

  test('it determines if a job name is a root node', function(assert) {
    assert.ok(isRoot(MORE_COMPLEX_GRAPH.edges, 'detached_main'));
    assert.ok(isRoot(MORE_COMPLEX_GRAPH.edges, '~commit'));
    assert.notOk(isRoot(MORE_COMPLEX_GRAPH.edges, 'no_main'));
  });

  test('it determines if a node name is a trigger node', function(assert) {
    assert.ok(isTrigger('~commit', '~commit'));
    assert.ok(isTrigger('~commit:/^detached_main$/', '~commit:detached_main'));
    assert.ok(isTrigger('~commit:/^detached_main.*$/', '~commit:detached_main1'));
    assert.notOk(isTrigger('~pr:/^detached_main$/', '~commit:detached_main'));
    assert.notOk(isTrigger('~commit:/^detached_main$/', '~commit:detached_main1'));
    assert.notOk(isTrigger('~commit:detached_main', 'no_main'));
  });

  test('it reduce to subgraph given a starting point', function(assert) {
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
});
