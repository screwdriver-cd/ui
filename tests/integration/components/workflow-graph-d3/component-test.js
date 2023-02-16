import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | workflow graph d3', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders empty when no graph supplied', async function (assert) {
    await render(hbs`<WorkflowGraphD3 />`);

    assert.dom('svg').exists({ count: 1 });
    this.element
      .querySelectorAll('svg')
      .forEach(el => assert.equal(el.children.length, 0));
  });

  test('it renders nodes and edges when a graph is supplied', async function (assert) {
    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'foo', displayName: 'bar' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'foo' }
      ]
    });
    await render(
      hbs`<WorkflowGraphD3 @workflowGraph={{this.workflowGraph}} />`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(this.element.querySelectorAll('svg > g.graph-node').length, 4);
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      3
    );
    assert.dom('svg text.graph-label:nth-of-type(3)').includesText('main');
    assert.dom('svg text.graph-label:nth-of-type(4)').includesText('bar');
  });

  test('it renders a complete graph with triggers when showDownstreamTriggers is true', async function (assert) {
    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'foo', displayName: 'bar' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'foo' }
      ]
    });
    this.set('completeWorkflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' },
        { name: 'foo', displayName: 'bar' },
        { name: '~sd-main-trigger' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'foo' },
        { src: 'foo', dest: '~sd-main-trigger' }
      ]
    });
    this.set('showDownstreamTriggers', true);
    await render(
      hbs`<WorkflowGraphD3 @workflowGraph={{this.workflowGraph}} @completeWorkflowGraph={{this.completeWorkflowGraph}} @showDownstreamTriggers={{this.showDownstreamTriggers}} />`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(this.element.querySelectorAll('svg > g.graph-node').length, 5);
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      4
    );
    assert.dom('svg text.graph-label:nth-of-type(3)').includesText('main');
    assert.dom('svg text.graph-label:nth-of-type(4)').includesText('bar');
  });

  test('it renders statuses when build data is available', async function (assert) {
    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { id: 1, name: 'main' },
        { id: 2, name: 'A' },
        { id: 3, name: 'B' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'A' },
        { src: 'A', dest: 'B' }
      ]
    });
    this.set('startFrom', '~commit');
    this.set('builds', [
      { jobId: 1, id: 4, status: 'SUCCESS' },
      { jobId: 2, id: 5, status: 'SUCCESS' },
      { jobId: 3, id: 6, status: 'FAILURE' }
    ]);
    await render(
      hbs`<WorkflowGraphD3 @workflowGraph={{this.workflowGraph}} @builds={{this.builds}} @startFrom={{this.startFrom}} />`
    );

    const el = this.element;

    assert.equal(el.querySelectorAll('svg').length, 1);
    assert.equal(el.querySelectorAll('svg > g.graph-node').length, 5);
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-success').length,
      2
    );
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-failure').length,
      1
    );
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-started_from').length,
      1
    );
    assert.equal(el.querySelectorAll('svg > path.graph-edge').length, 4);
    assert.equal(
      el.querySelectorAll('svg > path.graph-edge.build-started_from').length,
      1
    );
    assert.equal(
      el.querySelectorAll('svg > path.graph-edge.build-success').length,
      2
    );
  });

  test('it does not render startFrom icon when starting in the middle of the graph', async function (assert) {
    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { id: 1, name: 'main' },
        { id: 2, name: 'A' },
        { id: 3, name: 'B' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'A' },
        { src: 'A', dest: 'B' }
      ]
    });
    this.set('startFrom', 'A');
    this.set('builds', [
      { jobId: 2, id: 5, status: 'SUCCESS' },
      { jobId: 3, id: 6, status: 'FAILURE' }
    ]);
    await render(
      hbs`<WorkflowGraphD3 @workflowGraph={{this.workflowGraph}} @builds={{this.builds}} @startFrom={{this.startFrom}} />`
    );

    const el = this.element;

    assert.equal(el.querySelectorAll('svg').length, 1);
    assert.equal(el.querySelectorAll('svg > g.graph-node').length, 5);
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-success').length,
      1
    );
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-failure').length,
      1
    );
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-started_from').length,
      0
    );
    assert.equal(el.querySelectorAll('svg > path.graph-edge').length, 4);
    assert.equal(
      el.querySelectorAll('svg > path.graph-edge.build-started_from').length,
      0
    );
    assert.equal(
      el.querySelectorAll('svg > path.graph-edge.build-success').length,
      1
    );
  });

  test('it can renders subgraph for minified case', async function (assert) {
    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { id: 1, name: 'main' },
        { id: 2, name: 'A' },
        { id: 3, name: 'B' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'A' },
        { src: 'A', dest: 'B' }
      ]
    });
    this.set('startFrom', 'A');
    this.set('builds', [
      { jobId: 2, id: 5, status: 'SUCCESS' },
      { jobId: 3, id: 6, status: 'FAILURE' }
    ]);
    await render(hbs`<WorkflowGraphD3
          @workflowGraph={{this.workflowGraph}}
          @builds={{this.builds}}
          @startFrom={{this.startFrom}}
          @minified={{true}}
        />`);

    const el = this.element;

    assert.equal(el.querySelectorAll('svg').length, 1);
    assert.equal(el.querySelectorAll('svg > g.graph-node').length, 2);
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-success').length,
      1
    );
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-failure').length,
      1
    );
    assert.equal(
      el.querySelectorAll('svg > g.graph-node.build-started_from').length,
      0
    );
    assert.equal(el.querySelectorAll('svg > path.graph-edge').length, 1);
    assert.equal(
      el.querySelectorAll('svg > path.graph-edge.build-started_from').length,
      0
    );
    assert.equal(
      el.querySelectorAll('svg > path.graph-edge.build-success').length,
      1
    );
  });
});
