import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, settled } from '@ember/test-helpers';
import sinon from 'sinon';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | pipeline/jobs/table', function (hooks) {
  setupRenderingTest(hooks);
  let pipeline;

  let shuttle;

  let pipelinePageState;

  let workflowDataReload;

  hooks.beforeEach(function () {
    pipeline = {
      id: 1,
      workflowGraph: {
        nodes: [{ name: 'main', id: 123 }],
        edges: []
      }
    };

    shuttle = this.owner.lookup('service:shuttle');
    pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    workflowDataReload = this.owner.lookup('service:workflow-data-reload');

    sinon.stub(pipelinePageState, 'getIsPr').returns(false);
    sinon.stub(pipelinePageState, 'getPipeline').returns(pipeline);
    sinon.stub(workflowDataReload, 'getBuildsForEvent').returns([]);
    sinon.stub(workflowDataReload, 'removeBuildsCallback').callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((_queueName, _eventId, callback) => {
        callback([]);
      });
  });

  test('it renders', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').resolves([
      {
        jobId: 123,
        builds: [{ id: 111, jobId: 123, status: 'SUCCESS' }]
      }
    ]);
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        id: 123,
        name: 'main'
      }
    ]);

    this.setProperties({
      pipelineId: 1
    });

    await render(hbs`
        <Pipeline::Jobs::Table
          @pipelineId={{this.pipelineId}}
        />
      `);

    assert.dom('.job-name').exists({ count: 1 });
    assert.dom('.job-name').hasText('main');
  });

  test('it displays jobs from event workflow graph', async function (assert) {
    const latestJobs = [
      {
        id: 1,
        name: 'foo',
        pipelineId: 1,
        state: 'DISABLED'
      },
      {
        id: 3,
        name: 'latest-only-job',
        pipelineId: 1
      }
    ];

    sinon.stub(pipelinePageState, 'getJobs').returns(latestJobs);

    this.setProperties({
      pipelineId: 1,
      event: {
        id: 100,
        workflowGraph: {
          nodes: [
            {
              id: 1,
              name: 'foo',
              pipelineId: 1
            },
            {
              id: 2,
              name: 'bar',
              pipelineId: 1
            },
            {
              name: 'sd@123:external'
            }
          ],
          edges: []
        }
      }
    });

    await render(hbs`
        <Pipeline::Jobs::Table
          @pipelineId={{this.pipelineId}}
          @event={{this.event}}
        />
      `);

    assert.dom('.job-name').exists({ count: 2 });
    assert.dom('tbody tr:nth-child(1) .job-name').hasText('bar');
    assert.dom('tbody tr:nth-child(2) .job-name').hasText('foo');
    assert.dom('tbody tr:nth-child(2) .actions-cell button').isDisabled();
  });

  test('it updates jobs when event changes', async function (assert) {
    sinon.stub(pipelinePageState, 'getJobs').returns([]);

    const event1 = {
      id: 100,
      workflowGraph: {
        nodes: [
          {
            id: 1,
            name: 'event-1-job',
            pipelineId: 1
          }
        ],
        edges: []
      }
    };

    const event2 = {
      id: 101,
      workflowGraph: {
        nodes: [
          {
            id: 2,
            name: 'event-2-job',
            pipelineId: 1
          }
        ],
        edges: []
      }
    };

    this.setProperties({
      pipelineId: 1,
      event: event1
    });

    await render(hbs`
        <Pipeline::Jobs::Table
          @pipelineId={{this.pipelineId}}
          @event={{this.event}}
        />
      `);

    assert.dom('.job-name').hasText('event-1-job');
    assert.dom('.job-name').doesNotIncludeText('event-2-job');

    this.set('event', event2);
    await settled();

    assert.dom('.job-name').hasText('event-2-job');
    assert.dom('.job-name').doesNotIncludeText('event-1-job');
  });
});
