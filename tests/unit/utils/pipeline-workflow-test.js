import canJobStart from 'screwdriver-ui/utils/pipeline-workflow';
import { module, test } from 'qunit';

module('Unit | Components | pipeline-workflow', function () {
  const workflowGraph = {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { name: 'p1' },
      { name: 'p2' },
      { name: 'c1' },
      { name: 'c2' },
      { name: 'd1' },
      { name: 'd2' },
      { name: 'pc1' },
      { name: 'pc2' },
      { name: 'pd1' },
      { name: 'pd2' }
    ],
    edges: [
      { src: '~pr', dest: 'p1' },
      { src: '~pr', dest: 'pc1' },
      { src: '~pr', dest: 'pd1' },
      { src: 'p1', dest: 'p2' },
      { src: '~commit', dest: 'c1' },
      { src: '~commit', dest: 'pc1' },
      { src: 'c1', dest: 'c2' },
      { src: 'd1', dest: 'd2' },
      { src: 'd1', dest: 'pd1' },
      { src: 'pc1', dest: 'pc2' },
      { src: 'pd1', dest: 'pd2' }
    ]
  };

  test('can start a ~pr triggered job from pr view', assert => {
    assert.equal(canJobStart('pulls', workflowGraph, 'p1'), true);
    assert.equal(canJobStart('pulls', workflowGraph, 'p2'), true);
    assert.equal(canJobStart('pulls', workflowGraph, 'pc1'), true);
    assert.equal(canJobStart('pulls', workflowGraph, 'pc2'), true);
    assert.equal(canJobStart('pulls', workflowGraph, 'pd1'), true);
    assert.equal(canJobStart('pulls', workflowGraph, 'pd2'), true);

    assert.equal(canJobStart('pulls', workflowGraph, 'c1'), false);
    assert.equal(canJobStart('pulls', workflowGraph, 'c2'), false);
    assert.equal(canJobStart('pulls', workflowGraph, 'd1'), false);
    assert.equal(canJobStart('pulls', workflowGraph, 'd2'), false);
  });

  test('can start jobs not triggered by ~pr from events view', assert => {
    assert.equal(canJobStart('events', workflowGraph, 'c1'), true);
    assert.equal(canJobStart('events', workflowGraph, 'c2'), true);
    assert.equal(canJobStart('events', workflowGraph, 'd1'), true);
    assert.equal(canJobStart('events', workflowGraph, 'd2'), true);
    assert.equal(canJobStart('events', workflowGraph, 'pc1'), true);
    assert.equal(canJobStart('events', workflowGraph, 'pc2'), true);
    assert.equal(canJobStart('events', workflowGraph, 'pd1'), true);
    assert.equal(canJobStart('events', workflowGraph, 'pd2'), true);

    assert.equal(canJobStart('events', workflowGraph, 'p1'), false);
    assert.equal(canJobStart('events', workflowGraph, 'p2'), false);
  });
});
