import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Controller | v2/pipeline/events/show', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:v2/pipeline/events/show');

    assert.ok(controller);
  });

  test('it gets workflow graph-tooltip', function (assert) {
    const controller = this.owner.lookup('controller:v2/pipeline/events/show');
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };

    controller.model = { event: { workflowGraph } };

    assert.deepEqual(controller.workflowGraph, workflowGraph);
  });

  test('it gets workflow graph-tooltip with external triggers', function (assert) {
    const controller = this.owner.lookup('controller:v2/pipeline/events/show');
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const triggers = [{ jobName: 'main', triggers: ['~sd@123:main'] }];

    controller.model = { event: { workflowGraph }, triggers };

    const graph = controller.workflowGraphWithDownstreamTriggers;

    assert.equal(graph.nodes.length, workflowGraph.nodes.length + 1);
    assert.equal(graph.edges.length, workflowGraph.edges.length + 1);
  });

  test('it gets display job name length', function (assert) {
    const controller = this.owner.lookup('controller:v2/pipeline/events/show');

    controller.model = { userSettings: { displayJobNameLength: 32 } };

    assert.equal(controller.displayJobNameLength, 32);
  });

  test('it gets default display job name length', function (assert) {
    const controller = this.owner.lookup('controller:v2/pipeline/events/show');

    controller.model = { userSettings: {} };

    assert.equal(controller.displayJobNameLength, 20);
  });
});
