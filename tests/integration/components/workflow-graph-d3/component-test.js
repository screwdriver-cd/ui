import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | workflow graph d3', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders empty when no graph supplied', async function (assert) {
    await render(hbs`{{workflow-graph-d3}}`);

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
    await render(hbs`{{workflow-graph-d3 workflowGraph=workflowGraph}}`);

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
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph completeWorkflowGraph=completeWorkflowGraph showDownstreamTriggers=showDownstreamTriggers}}`
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
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph builds=builds startFrom=startFrom}}`
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
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph builds=builds startFrom=startFrom}}`
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
    await render(hbs`{{workflow-graph-d3
          workflowGraph=workflowGraph
          builds=builds
          startFrom=startFrom
          minified=true}}`);

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

  test('it renders stages when stages are supplied', async function (assert) {
    const STAGE_INT_DESC =
      'This stage will deploy the latest application to CI environment and certifies it after the tests are passed.';
    const STAGE_PROD_DESC =
      'This stage will deploy the CI certified application to production environment and certifies it after the tests are passed.';

    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'component', id: 1 },
        { name: 'publish', id: 2 },
        { name: 'ci-deploy', id: 21 },
        { name: 'ci-test', id: 22 },
        { name: 'ci-certify', id: 23 },
        { name: 'prod-deploy', id: 31 },
        { name: 'prod-test', id: 32 },
        { name: 'prod-certify', id: 33 }
      ],
      edges: [
        { src: '~pr', dest: 'component' },
        { src: '~commit', dest: 'component' },
        { src: 'component', dest: 'publish' },
        { src: 'publish', dest: 'ci-deploy' },
        { src: 'ci-deploy', dest: 'ci-test' },
        { src: 'ci-test', dest: 'ci-certify' },
        { src: 'ci-certify', dest: 'prod-deploy' },
        { src: 'prod-deploy', dest: 'prod-test' },
        { src: 'prod-test', dest: 'prod-certify' }
      ]
    });

    this.set('stages', [
      {
        id: 7,
        name: 'integration',
        jobs: [{ id: 21 }, { id: 22 }, { id: 23 }],
        description: STAGE_INT_DESC
      },
      {
        id: 8,
        name: 'production',
        jobs: [{ id: 31 }, { id: 32 }, { id: 33 }],
        description: STAGE_PROD_DESC
      }
    ]);

    await render(
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph stages=stages}}`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(
      this.element.querySelectorAll('svg > g.graph-node').length,
      10
    );
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      9
    );

    assert.equal(
      this.element.querySelectorAll('svg > .stage-container').length,
      2
    );

    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-header .stage-name'
      ).length,
      2
    );
    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-header .stage-job-count'
      ).length,
      2
    );
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(1) .stage-info .stage-header')
      .hasText('integration(3)');
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(2) .stage-info .stage-header')
      .hasText('production(3)');

    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-description'
      ).length,
      2
    );
    assert
      .dom(
        'svg > .stage-info-wrapper:nth-of-type(1) .stage-info .stage-description'
      )
      .hasText(STAGE_INT_DESC);
    assert
      .dom(
        'svg > .stage-info-wrapper:nth-of-type(2) .stage-info .stage-description'
      )
      .hasText(STAGE_PROD_DESC);
  });

  test('it renders stages when stages are supplied along with build details', async function (assert) {
    const STAGE_INT_DESC =
      'This stage will deploy the latest application to CI environment and certifies it after the tests are passed.';
    const STAGE_PROD_BLUE_DESC =
      'This stage will deploy the CI certified application to production blue environment and certifies it after the tests are passed.';
    const STAGE_PROD_GREEN_DESC =
      'This stage will deploy the CI certified application to production green environment and certifies it after the tests are passed.';

    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'component', id: 1 },
        { name: 'publish', id: 2 },
        { name: 'ci-deploy', id: 21 },
        { name: 'ci-test', id: 22 },
        { name: 'ci-certify', id: 23 },
        { name: 'prod-blue-deploy', id: 31 },
        { name: 'prod-blue-test', id: 32 },
        { name: 'prod-blue-certify', id: 33 },
        { name: 'prod-green-deploy', id: 34 },
        { name: 'prod-green-test', id: 35 }
      ],
      edges: [
        { src: '~pr', dest: 'component' },
        { src: '~commit', dest: 'component' },
        { src: 'component', dest: 'publish' },
        { src: 'publish', dest: 'ci-deploy' },
        { src: 'ci-deploy', dest: 'ci-test' },
        { src: 'ci-test', dest: 'ci-certify' },
        { src: 'ci-certify', dest: 'prod-blue-deploy' },
        { src: 'prod-blue-deploy', dest: 'prod-blue-test' },
        { src: 'prod-blue-test', dest: 'prod-blue-certify' },
        { src: 'prod-blue-certify', dest: 'prod-green-deploy' },
        { src: 'prod-green-deploy', dest: 'prod-green-test' }
      ]
    });

    this.set('stages', [
      {
        id: 7,
        name: 'integration',
        jobs: [{ id: 21 }, { id: 22 }, { id: 23 }],
        description: STAGE_INT_DESC
      },
      {
        id: 8,
        name: 'production-blue',
        jobs: [{ id: 31 }, { id: 32 }, { id: 33 }],
        description: STAGE_PROD_BLUE_DESC
      },
      {
        id: 8,
        name: 'production-green',
        jobs: [{ id: 34 }, { id: 35 }],
        description: STAGE_PROD_GREEN_DESC
      }
    ]);

    // this.set('startFrom', '~commit');
    this.set('builds', [
      { jobId: 1, id: 81, status: 'SUCCESS' },
      { jobId: 1, id: 82, status: 'SUCCESS' },
      { jobId: 21, id: 83, status: 'SUCCESS' },
      { jobId: 22, id: 84, status: 'SUCCESS' },
      { jobId: 23, id: 85, status: 'SUCCESS' },
      { jobId: 31, id: 86, status: 'SUCCESS' },
      { jobId: 32, id: 87, status: 'FAILURE' }
    ]);

    await render(
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph stages=stages}}`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(
      this.element.querySelectorAll('svg > g.graph-node').length,
      12
    );
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      11
    );

    assert.equal(
      this.element.querySelectorAll('svg > .stage-container').length,
      3
    );
    assert.equal(
      this.element.querySelectorAll('svg > .stage-container.stage-success')
        .length,
      1
    );
    assert.equal(
      this.element.querySelectorAll('svg > .stage-container.stage-failure')
        .length,
      1
    );
    assert.equal(
      this.element.querySelectorAll('svg > .stage-container.stage-not_complete')
        .length,
      1
    );

    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-header .stage-name'
      ).length,
      3
    );
    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-header .stage-job-count'
      ).length,
      3
    );
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(1) .stage-info .stage-header')
      .hasText('integration(3)');
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(2) .stage-info .stage-header')
      .hasText('production-blue(3)');
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(3) .stage-info .stage-header')
      .hasText('production-green(2)');

    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-description'
      ).length,
      3
    );
    assert
      .dom(
        'svg > .stage-info-wrapper:nth-of-type(1) .stage-info .stage-description'
      )
      .hasText(STAGE_INT_DESC);
    assert
      .dom(
        'svg > .stage-info-wrapper:nth-of-type(2) .stage-info .stage-description'
      )
      .hasText(STAGE_PROD_BLUE_DESC);
    assert
      .dom(
        'svg > .stage-info-wrapper:nth-of-type(3) .stage-info .stage-description'
      )
      .hasText(STAGE_PROD_GREEN_DESC);
  });

  test('it does not render stages for minified case', async function (assert) {
    const STAGE_INT_DESC =
      'This stage will deploy the latest application to CI environment and certifies it after the tests are passed.';
    const STAGE_PROD_DESC =
      'This stage will deploy the CI certified application to production environment and certifies it after the tests are passed.';

    this.set('workflowGraph', {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'component', id: 1 },
        { name: 'publish', id: 2 },
        { name: 'ci-deploy', id: 21 },
        { name: 'ci-test', id: 22 },
        { name: 'ci-certify', id: 23 },
        { name: 'prod-deploy', id: 31 },
        { name: 'prod-test', id: 32 },
        { name: 'prod-certify', id: 33 }
      ],
      edges: [
        { src: '~pr', dest: 'component' },
        { src: '~commit', dest: 'component' },
        { src: 'component', dest: 'publish' },
        { src: 'publish', dest: 'ci-deploy' },
        { src: 'ci-deploy', dest: 'ci-test' },
        { src: 'ci-test', dest: 'ci-certify' },
        { src: 'ci-certify', dest: 'prod-deploy' },
        { src: 'prod-deploy', dest: 'prod-test' },
        { src: 'prod-test', dest: 'prod-certify' }
      ]
    });

    this.set('stages', [
      {
        id: 7,
        name: 'integration',
        jobs: [{ id: 21 }, { id: 22 }, { id: 23 }],
        description: STAGE_INT_DESC
      },
      {
        id: 8,
        name: 'production',
        jobs: [{ id: 31 }, { id: 32 }, { id: 33 }],
        description: STAGE_PROD_DESC
      }
    ]);

    await render(
      hbs`{{workflow-graph-d3 workflowGraph=workflowGraph stages=stages minified=true}}`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(
      this.element.querySelectorAll('svg > g.graph-node').length,
      10
    );
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      9
    );

    assert.equal(
      this.element.querySelectorAll('svg > .stage-container').length,
      0
    );

    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-name'
      ).length,
      0
    );

    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-description'
      ).length,
      0
    );
  });
});
