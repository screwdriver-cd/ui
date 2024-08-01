import {
  canJobStart,
  canStageStart
} from 'screwdriver-ui/utils/pipeline-workflow';
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
      { name: 'pd2' },
      // stage triggered by ~pr
      { name: 'stage@alpha:setup', stageName: 'alpha' },
      { name: 'alpha-deploy', stageName: 'alpha' },
      { name: 'alpha-test', stageName: 'alpha' },
      { name: 'alpha-deploy', stageName: 'alpha' },
      { name: 'stage@alpha:teardown', stageName: 'alpha' },
      // stage triggered by ~commit
      { name: 'stage@beta:setup', stageName: 'beta' },
      { name: 'beta-deploy', stageName: 'beta' },
      { name: 'beta-test', stageName: 'beta' },
      { name: 'beta-deploy', stageName: 'beta' },
      { name: 'stage@beta:teardown', stageName: 'beta' },
      // detached stage
      { name: 'stage@gamma:setup', stageName: 'gamma' },
      { name: 'gamma-deploy', stageName: 'gamma' },
      { name: 'gamma-test', stageName: 'gamma' },
      { name: 'gamma-deploy', stageName: 'gamma' },
      { name: 'stage@gamma:teardown', stageName: 'gamma' }
    ],
    edges: [
      { src: '~pr', dest: 'p1' },
      { src: '~pr', dest: 'pc1' },
      { src: '~pr', dest: 'pd1' },
      { src: '~pr', dest: 'stage@alpha:setup' },
      { src: 'p1', dest: 'p2' },
      { src: '~commit', dest: 'c1' },
      { src: '~commit', dest: 'pc1' },
      { src: '~commit', dest: 'stage@beta:setup' },
      { src: 'c1', dest: 'c2' },
      { src: 'd1', dest: 'd2' },
      { src: 'd1', dest: 'pd1' },
      { src: 'pc1', dest: 'pc2' },
      { src: 'pd1', dest: 'pd2' },
      // stage alpha
      { src: 'stage@alpha:setup', dest: 'alpha-deploy' },
      { src: 'alpha-deploy', dest: 'alpha-test' },
      { src: 'alpha-test', dest: 'alpha-certify' },
      { src: 'alpha-certify', dest: 'stage@alpha:teardown' },
      // stage beta
      { src: 'stage@beta:setup', dest: 'beta-deploy' },
      { src: 'beta-deploy', dest: 'beta-test' },
      { src: 'beta-test', dest: 'beta-certify' },
      { src: 'beta-certify', dest: 'stage@beta:teardown' },
      // stage gamma
      { src: 'stage@gamma:setup', dest: 'gamma-deploy' },
      { src: 'gamma-deploy', dest: 'gamma-test' },
      { src: 'gamma-test', dest: 'gamma-certify' },
      { src: 'gamma-certify', dest: 'stage@gamma:teardown' }
    ]
  };

  const stageAlpha = {
    name: 'alpha',
    jobs: [
      { name: 'alpha-deploy' },
      { name: 'alpha-test' },
      { name: 'alpha-certify' }
    ],
    setup: { name: 'stage@alpha:setup' },
    teardown: { name: 'stage@alpha:teardown' }
  };

  const stageBeta = {
    name: 'beta',
    jobs: [
      { name: 'beta-deploy' },
      { name: 'beta-test' },
      { name: 'beta-certify' }
    ],
    setup: { name: 'stage@beta:setup' },
    teardown: { name: 'stage@beta:teardown' }
  };

  const stageGamma = {
    name: 'gamma',
    jobs: [
      { name: 'gamma-deploy' },
      { name: 'gamma-test' },
      { name: 'gamma-certify' }
    ],
    setup: { name: 'stage@gamma:setup' },
    teardown: { name: 'stage@gamma:teardown' }
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

  test('cannot start any stage from pr view', assert => {
    [stageAlpha, stageBeta, stageGamma].forEach(stage => {
      assert.equal(canStageStart('pulls', workflowGraph, stage), false);
    });
  });

  test('can start non ~pr triggered stages from events view', assert => {
    [stageBeta, stageGamma].forEach(stage => {
      assert.equal(canStageStart('events', workflowGraph, stage), true);
    });
  });

  test('cannot start ~pr triggered stages from events view', assert => {
    [stageAlpha].forEach(stage => {
      assert.equal(canStageStart('events', workflowGraph, stage), false);
    });
  });
});
