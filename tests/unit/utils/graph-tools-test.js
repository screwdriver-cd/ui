import graphTools from 'screwdriver-ui/utils/graph-tools';
import { module, test } from 'qunit';
const { icon, node, decorateGraph } = graphTools;

module('Unit | Utility | graph tools');

test('it gets the right icons', function (assert) {
  assert.equal(icon('SUCCESS'), '\ue903');
  assert.equal(icon('banana'), '\ue901');
});

test('it gets an element from a list', function (assert) {
  const list = [{ name: 'foo' }, { name: 'bar' }];
  const result = node(list, 'bar');

  assert.deepEqual(result, { name: 'bar' });
});

test('it processes a simple graph without builds', function (assert) {
  const inputGraph = {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { name: 'main' }
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
  const result = decorateGraph(inputGraph);

  assert.deepEqual(result, expectedOutput);
});

test('it processes a more complex graph without builds', function (assert) {
  const inputGraph = {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { name: 'main' },
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' }
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
  const expectedOutput = {
    nodes: [
      { name: '~pr', pos: { x: 0, y: 0 } },
      { name: '~commit', pos: { x: 0, y: 1 } },
      { name: 'main', pos: { x: 1, y: 0 } },
      { name: 'A', pos: { x: 2, y: 0 } },
      { name: 'B', pos: { x: 2, y: 1 } },
      { name: 'C', pos: { x: 3, y: 0 } },
      { name: 'D', pos: { x: 4, y: 0 } }
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
  const result = decorateGraph(inputGraph);

  assert.deepEqual(result, expectedOutput);
});

test('it processes a complex graph with builds', function (assert) {
  const inputGraph = {
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
  const result = decorateGraph(inputGraph, builds, '~commit');

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
      { src: '~commit', dest: 'main', from: { x: 0, y: 1 }, to: { x: 1, y: 0 } }
    ],
    meta: {
      height: 4,
      width: 2
    }
  };
  const result = decorateGraph(inputGraph);

  assert.deepEqual(result, expectedOutput);
});
