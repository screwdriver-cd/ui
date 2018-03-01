import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('workflow-graph-d3', 'Integration | Component | workflow graph d3', {
  integration: true
});

test('it renders empty when no graph supplied', function (assert) {
  this.render(hbs`{{workflow-graph-d3}}`);

  assert.equal(this.$('svg').length, 1);
  assert.equal(this.$('svg').children().length, 0);
});

test('it renders nodes and edges when a graph is supplied', function (assert) {
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
  this.render(hbs`{{workflow-graph-d3 workflowGraph=workflowGraph}}`);

  const svg = this.$('svg');

  assert.equal(svg.length, 1);
  assert.equal(svg.children('g.graph-node').length, 3);
  assert.equal(svg.children('path.graph-edge').length, 2);
});

test('it renders statuses when build data is available', function (assert) {
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
  this.render(
    hbs`{{workflow-graph-d3 workflowGraph=workflowGraph builds=builds startFrom=startFrom}}`
  );

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
  function (assert) {
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
    this.render(
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph builds=builds startFrom=startFrom}}`
    );

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
