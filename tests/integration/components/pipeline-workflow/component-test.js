import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import rsvp from 'rsvp';
import frozenBuild from 'screwdriver-ui/tests/mock/frozenBuild';

const GRAPH = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'main' },
    { name: 'batman' },
    { name: 'robin' },
    { name: 'sd@123:main' },
    { name: 'deploy' },
    { name: 'foo01job' },
    { name: 'foo1job' }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'batman' },
    { src: 'batman', dest: 'robin' },
    { src: 'robin', dest: 'sd@123:main' },
    { src: 'main', dest: 'foo01job' },
    { src: 'main', dest: 'foo1job' }
  ]
};

const JOBS = [
  { id: 1, name: 'main' },
  { id: 2, name: 'batman' },
  { id: 3, name: 'robin' },
  { id: 4, name: 'sd@123:main' },
  { id: 5, name: 'deploy' },
  { id: 6, name: 'foo01job' },
  { id: 7, name: 'foo1job' }
];

const BUILDS = [
  { jobId: 1, id: 4, status: 'SUCCESS' },
  { jobId: 2, id: 5, status: 'SUCCESS' },
  { jobId: 3, id: 6, status: 'SUCCESS' },
  { jobId: 5, id: 8, status: 'FAILURE' }
];

module('Integration | Component | pipeline workflow', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders an event', async function (assert) {
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test'
      })
    );
    this.set('workflowGraph', GRAPH);
    this.set('jobs', JOBS);
    await render(
      hbs`<PipelineWorkflow @selectedEventObj={{this.obj}} @workflowGraph={{this.workflowGraph}} @jobs={{this.jobs}} @showPRJobs={{true}} />`
    );

    assert.dom('.graph-node').exists({ count: 8 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
    assert.dom('.workflow-stage-actions-menu').exists({ count: 1 });
  });

  test('it renders an event without pr job', async function (assert) {
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test'
      })
    );
    this.set('workflowGraph', GRAPH);
    this.set('jobs', JOBS);
    await render(
      hbs`<PipelineWorkflow @selectedEventObj={{this.obj}} @workflowGraph={{this.workflowGraph}} @jobs={{this.jobs}} @showPRJobs={{false}} />`
    );

    assert.dom('.graph-node').exists({ count: 7 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
    assert.dom('.workflow-stage-actions-menu').exists({ count: 1 });
  });

  test('it renders with frozen window', async function (assert) {
    this.setProperties({
      obj: frozenBuild,
      builds: [],
      canRestartPipeline: true,
      jobs: [
        {
          id: 6,
          pipelineId: 1,
          name: 'main',
          state: 'ENABLED',
          builds: [
            {
              status: 'SUCCESS'
            }
          ],
          status: 'SUCCESS'
        },
        {
          id: 7,
          pipelineId: 1,
          name: 'mainFreeze',
          state: 'ENABLED',
          builds: [
            {
              status: 'FROZEN'
            }
          ],
          status: 'FROZEN'
        }
      ],
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            id: 6,
            name: 'main'
          },
          {
            id: 7,
            name: 'mainFreeze'
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: 'main',
            dest: 'mainFreeze'
          }
        ]
      }
    });

    await render(
      hbs`<PipelineWorkflow @selectedEventObj={{this.obj}} @workflowGraph={{this.workflowGraph}} @jobs={{this.jobs}} />`
    );
    assert
      .dom('.pipelineWorkflow [data-job="mainFreeze"]')
      .exists({ count: 1 });
    assert.dom('.graph-node.build-frozen').exists({ count: 1 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
    assert.dom('.workflow-stage-actions-menu').exists({ count: 1 });
  });

  test('it renders with latest-commit', async function (assert) {
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test',
        sha: 'abc123'
      })
    );
    this.set(
      'latestCommit',
      EmberObject.create({
        sha: 'abc123'
      })
    );
    this.set('workflowGraph', GRAPH);
    this.set('jobs', JOBS);
    await render(
      hbs`<PipelineWorkflow @selectedEventObj={{this.obj}} @latestCommit={{this.latestCommit}} @workflowGraph={{this.workflowGraph}} @jobs={{this.jobs}} @showPRJobs={{true}} @isShowingModal={{true}} />`
    );

    assert.dom('.latest-commit').exists({ count: 1 });
    assert.dom('.fa-triangle-exclamation').doesNotExist({ count: 1 });
  });

  test('it renders without latest-commit', async function (assert) {
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test',
        sha: 'abc123'
      })
    );
    this.set(
      'latestCommit',
      EmberObject.create({
        sha: 'efg456'
      })
    );
    this.set('workflowGraph', GRAPH);
    this.set('jobs', JOBS);

    await render(
      hbs`<PipelineWorkflow @selectedEventObj={{this.obj}} @latestCommit={{this.latestCommit}} @workflowGraph={{this.workflowGraph}} @jobs={{this.jobs}} @showPRJobs={{true}} @isShowingModal={{true}} />`
    );

    assert.dom('.latest-commit').doesNotExist();
    assert.dom('.fa-triangle-exclamation').exists({ count: 1 });
  });

  test('it renders with warning build', async function (assert) {
    const graphMock = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { name: 'main', status: 'SUCCESS' },
        { name: 'batman', status: 'WARNING' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'batman' }
      ]
    };

    const jobsMock = [
      { id: 1, name: 'main' },
      { id: 2, name: 'batman' }
    ];

    this.set(
      'obj',
      EmberObject.create({
        builds: [],
        workflowGraph: graphMock,
        startFrom: '~commit',
        causeMessage: 'test'
      })
    );
    this.set('workflowGraph', graphMock);
    this.set('jobs', jobsMock);
    await render(
      hbs`<PipelineWorkflow @selectedEventObj={{this.obj}} @workflowGraph={{this.workflowGraph}} @jobs={{this.jobs}} @showPRJobs={{true}} />`
    );

    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
    assert.dom('.workflow-stage-actions-menu').exists({ count: 1 });
    assert.dom('.pipelineWorkflow g:nth-of-type(1)').hasClass('graph-node');
    assert
      .dom('.pipelineWorkflow g:nth-of-type(2)')
      .hasClass('build-started_from');
    assert.dom('.pipelineWorkflow g:nth-of-type(3)').hasClass('build-success');
    assert.dom('.pipelineWorkflow g:nth-of-type(4)').hasClass('build-warning');
  });
});
