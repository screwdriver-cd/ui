import { module, test } from 'qunit';
import {
  getDisplayJobNameLength,
  getFilteredGraph,
  getWorkflowGraph
} from 'screwdriver-ui/components/pipeline/workflow/util';
import ENV from 'screwdriver-ui/config/environment';

module('Unit | Component | pipeline/workflow/util', function () {
  test('getDisplayJobNameLength returns correct value', function (assert) {
    assert.equal(getDisplayJobNameLength(), ENV.APP.MINIMUM_JOBNAME_LENGTH);
    assert.equal(getDisplayJobNameLength(null), ENV.APP.MINIMUM_JOBNAME_LENGTH);
    assert.equal(getDisplayJobNameLength({}), ENV.APP.MINIMUM_JOBNAME_LENGTH);

    const displayJobNameLength = 17;

    assert.equal(
      getDisplayJobNameLength({ displayJobNameLength }),
      displayJobNameLength
    );
  });

  test('getFilteredGraph removes nodes that trigger external pipelines', function (assert) {
    assert.deepEqual(
      getFilteredGraph({
        nodes: [{ name: 'sd@123' }, { name: 'main' }, { name: 'build' }],
        edges: [
          { src: 'main', dest: 'build' },
          { src: 'build', dest: 'sd@123' }
        ]
      }),
      {
        nodes: [{ name: 'main' }, { name: 'build' }],
        edges: [{ src: 'main', dest: 'build' }]
      }
    );
  });

  test('getWorkflowGraph returns filtered workflow graph', function (assert) {
    const workflowGraph = {
      nodes: [{ name: 'sd@123' }, { name: 'main' }, { name: 'build' }],
      edges: [{ src: 'main', dest: 'build' }]
    };
    const expectedGraph = {
      nodes: [{ name: 'main' }, { name: 'build' }],
      edges: [{ src: 'main', dest: 'build' }]
    };

    assert.deepEqual(getWorkflowGraph(workflowGraph), expectedGraph);
    assert.deepEqual(getWorkflowGraph(workflowGraph, null), expectedGraph);
    assert.deepEqual(getWorkflowGraph(workflowGraph, []), expectedGraph);
  });

  test('getWorkflowGraph returns workflow graph with downstream triggers', function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const triggers = [{ jobName: 'main', triggers: ['~sd@123:main'] }];

    const graph = getWorkflowGraph(workflowGraph, triggers);

    assert.equal(graph.nodes.length, workflowGraph.nodes.length + 1);
    assert.equal(graph.edges.length, workflowGraph.edges.length + 1);
  });
});
