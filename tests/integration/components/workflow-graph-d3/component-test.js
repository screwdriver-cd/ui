import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
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
        { name: 'stage@integration:setup', id: 28, stageName: 'integration' },
        { name: 'ci-deploy', id: 21, stageName: 'integration' },
        { name: 'ci-test', id: 22, stageName: 'integration' },
        { name: 'ci-certify', id: 23, stageName: 'integration' },
        {
          name: 'stage@integration:teardown',
          id: 29,
          stageName: 'integration'
        },
        { name: 'stage@production:setup', id: 38, stageName: 'production' },
        { name: 'prod-deploy', id: 31, stageName: 'production' },
        { name: 'prod-test', id: 32, stageName: 'production' },
        { name: 'prod-certify', id: 33, stageName: 'production' },
        { name: 'stage@production:teardown', id: 39, stageName: 'production' }
      ],
      edges: [
        { src: '~pr', dest: 'component' },
        { src: '~commit', dest: 'component' },
        { src: 'component', dest: 'publish' },
        { src: 'publish', dest: 'stage@integration:setup' },
        { src: 'stage@integration:setup', dest: 'ci-deploy' },
        { src: 'ci-deploy', dest: 'ci-test' },
        { src: 'ci-test', dest: 'ci-certify' },
        { src: 'ci-certify', dest: 'stage@integration:teardown' },
        { src: 'stage@integration:teardown', dest: 'stage@production:setup' },
        { src: 'stage@production:setup', dest: 'prod-deploy' },
        { src: 'prod-deploy', dest: 'prod-test' },
        { src: 'prod-test', dest: 'prod-certify' },
        { src: 'prod-certify', dest: 'stage@production:teardown' }
      ]
    });

    this.set('stages', [
      {
        id: 7,
        name: 'integration',
        jobs: [{ id: 21 }, { id: 22 }, { id: 23 }],
        description: STAGE_INT_DESC,
        setup: 28,
        teardown: 29
      },
      {
        id: 8,
        name: 'production',
        jobs: [{ id: 31 }, { id: 32 }, { id: 33 }],
        description: STAGE_PROD_DESC,
        setup: 38,
        teardown: 39
      }
    ]);

    await render(
      hbs`<WorkflowGraphD3 @workflowGraph={{this.workflowGraph}} @stages={{this.stages}} @displayStageMenuHandle={{true}}/>`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(
      this.element.querySelectorAll('svg > g.graph-node').length,
      14
    );
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      13
    );

    assert.equal(
      this.element.querySelectorAll('svg > .stage-container').length,
      2
    );

    // stage name
    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-name'
      ).length,
      2
    );
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(1) .stage-info .stage-name')
      .hasText('integration');
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(2) .stage-info .stage-name')
      .hasText('production');

    // stage actions menu handle
    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-actions .stage-menu-handle'
      ).length,
      2
    );

    // stage description
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
        { name: 'stage@integration:setup', id: 28, stageName: 'integration' },
        { name: 'ci-deploy', id: 21, stageName: 'integration' },
        { name: 'ci-test', id: 22, stageName: 'integration' },
        { name: 'ci-certify', id: 23, stageName: 'integration' },
        {
          name: 'stage@integration:teardown',
          id: 29,
          stageName: 'integration'
        },
        { name: 'stage@production:setup', id: 38, stageName: 'production' },
        { name: 'prod-deploy', id: 31, stageName: 'production' },
        { name: 'prod-test', id: 32, stageName: 'production' },
        { name: 'prod-certify', id: 33, stageName: 'production' },
        { name: 'stage@production:teardown', id: 39, stageName: 'production' }
      ],
      edges: [
        { src: '~pr', dest: 'component' },
        { src: '~commit', dest: 'component' },
        { src: 'component', dest: 'publish' },
        { src: 'publish', dest: 'stage@integration:setup' },
        { src: 'stage@integration:setup', dest: 'ci-deploy' },
        { src: 'ci-deploy', dest: 'ci-test' },
        { src: 'ci-test', dest: 'ci-certify' },
        { src: 'ci-certify', dest: 'stage@integration:teardown' },
        { src: 'stage@integration:teardown', dest: 'stage@production:setup' },
        { src: 'stage@production:setup', dest: 'prod-deploy' },
        { src: 'prod-deploy', dest: 'prod-test' },
        { src: 'prod-test', dest: 'prod-certify' },
        { src: 'prod-certify', dest: 'stage@production:teardown' }
      ]
    });

    this.set('stages', [
      {
        id: 7,
        name: 'integration',
        jobs: [{ id: 21 }, { id: 22 }, { id: 23 }],
        description: STAGE_INT_DESC,
        setup: 28,
        teardown: 29
      },
      {
        id: 8,
        name: 'production',
        jobs: [{ id: 31 }, { id: 32 }, { id: 33 }],
        description: STAGE_PROD_DESC,
        setup: 38,
        teardown: 39
      }
    ]);

    await render(
      hbs`<WorkflowGraphD3 @workflowGraph={{this.workflowGraph}} @stages={{this.stages}} @minified={{true}}/>`
    );

    assert.equal(this.element.querySelectorAll('svg').length, 1);
    assert.equal(
      this.element.querySelectorAll('svg > g.graph-node').length,
      14
    );
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      13
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
