import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | workflow graph d3', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders empty when no graph supplied', async function(assert) {
    await render(hbs`{{workflow-graph-d3}}`);

    assert.dom('svg').exists({ count: 1 });
    assert.equal(this.$('svg').children().length, 0);
  });

  test('it renders nodes and edges when a graph is supplied', async function(assert) {
    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' }
      ]
    });
    await render(hbs`{{workflow-graph-d3 workflowGraph=workflowGraph}}`);

    const svg = this.$('svg');

    assert.equal(svg.length, 1);
    assert.equal(svg.children('g.graph-node').length, 3);
    assert.equal(svg.children('path.graph-edge').length, 2);
  });

  test('it renders statuses when build data is available', async function(assert) {
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
    await render(hbs`{{workflow-graph-d3 workflowGraph=workflowGraph builds=builds startFrom=startFrom}}`);

    const svg = this.$('svg');

    assert.equal(svg.length, 1);
    assert.equal(svg.children('g.graph-node').length, 5);
    assert.equal(svg.children('g.graph-node.build-success').length, 2);
    assert.equal(svg.children('g.graph-node.build-failure').length, 1);
    assert.equal(svg.children('g.graph-node.build-started_from').length, 1);
    assert.equal(svg.children('path.graph-edge').length, 4);
    assert.equal(svg.children('path.graph-edge.build-started_from').length, 1);
    assert.equal(svg.children('path.graph-edge.build-success').length, 2);
  });

  test('it does not render startFrom icon when starting in the middle of the graph',
    async function(assert) {
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
      await render(hbs`{{workflow-graph-d3 workflowGraph=workflowGraph builds=builds startFrom=startFrom}}`);

      const svg = this.$('svg');

      assert.equal(svg.length, 1);
      assert.equal(svg.children('g.graph-node').length, 5);
      assert.equal(svg.children('g.graph-node.build-success').length, 1);
      assert.equal(svg.children('g.graph-node.build-failure').length, 1);
      assert.equal(svg.children('g.graph-node.build-started_from').length, 0);
      assert.equal(svg.children('path.graph-edge').length, 4);
      assert.equal(svg.children('path.graph-edge.build-started_from').length, 0);
      assert.equal(svg.children('path.graph-edge.build-success').length, 1);
    });

  test('it can renders subgraph for minified case', async function(assert) {
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
    await render(hbs`{{workflow-graph-d3
          workflowGraph=workflowGraph
          builds=builds
          startFrom=startFrom
          minified=true}}`);

    const svg = this.$('svg');

    assert.equal(svg.length, 1);
    assert.equal(svg.children('g.graph-node').length, 2);
    assert.equal(svg.children('g.graph-node.build-success').length, 1);
    assert.equal(svg.children('g.graph-node.build-failure').length, 1);
    assert.equal(svg.children('g.graph-node.build-started_from').length, 0);
    assert.equal(svg.children('path.graph-edge').length, 1);
    assert.equal(svg.children('path.graph-edge.build-started_from').length, 0);
    assert.equal(svg.children('path.graph-edge.build-success').length, 1);
  });
});
