import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import rsvp from 'rsvp';
import frozenBuild from 'screwdriver-ui/tests/mock/frozenBuild';

const GRAPH = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { id: 1, name: 'main' },
    { id: 2, name: 'batman' },
    { id: 3, name: 'robin' },
    { id: 4, name: 'sd@123:main' },
    { id: 5, name: 'deploy' },
    { id: 6, name: 'foo01job' },
    { id: 7, name: 'foo1job' }
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

const BUILDS = [
  { jobId: 1, id: 4, status: 'SUCCESS' },
  { jobId: 2, id: 5, status: 'SUCCESS' },
  { jobId: 3, id: 6, status: 'SUCCESS' },
  { jobId: 5, id: 8, status: 'FAILURE' }
];

module('Integration | Component | pipeline workflow', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders an event', async function(assert) {
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test'
      }),
      'graph',
      EmberObject.create(GRAPH)
    );

    await render(hbs`{{pipeline-workflow selectedEventObj=obj graph=graph showPRJobs=true}}`);

    assert.dom('.graph-node').exists({ count: 8 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
  });

  test('it renders an event without pr job', async function(assert) {
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test'
      }),
      'graph',
      EmberObject.create(GRAPH)
    );

    await render(hbs`{{pipeline-workflow selectedEventObj=obj graph=graph showPRJobs=false}}`);

    assert.dom('.graph-node').exists({ count: 7 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
  });

  test('it renders with frozen window', async function(assert) {
    this.setProperties({
      obj: frozenBuild,
      builds: [],
      displayRestartButton: true,
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

    await render(hbs`{{pipeline-workflow selectedEventObj=obj jobs=jobs graph=workflowGraph}}`);
    assert.dom('.pipelineWorkflow [data-job="mainFreeze"]').exists({ count: 1 });
    assert.dom('.graph-node.build-frozen').exists({ count: 1 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
  });
});
