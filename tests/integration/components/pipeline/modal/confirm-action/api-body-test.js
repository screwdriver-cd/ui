import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/confirm-action api body',
  function (hooks) {
    setupRenderingTest(hooks);

    const username = 'test-user';
    const pipelineId = 123;
    const latestCommitSha = 'deadbeef9876543210';
    const pipeline = {
      id: pipelineId,
      workflowGraph: {
        nodes: [],
        edges: []
      }
    };
    const parameters = { param: 'abc' };
    const pipelineWithParameters = {
      ...pipeline,
      parameters
    };
    const job = { name: 'main', permutations: [{}] };
    const prNum = 3;
    const closeModal = () => {};

    let shuttleStub;

    let getPipelineStub;

    let getIsPrStub;

    let event;

    let eventWithParameters;

    hooks.beforeEach(async function () {
      await authenticateSession({ username });
      const workflowDataReload = this.owner.lookup(
        'service:workflow-data-reload'
      );
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );
      const shuttle = this.owner.lookup('service:shuttle');

      sinon
        .stub(workflowDataReload, 'getLatestCommitEvent')
        .returns({ sha: latestCommitSha });

      sinon.stub(pipelinePageState, 'getJobs').returns([job]);

      getPipelineStub = sinon.stub(pipelinePageState, 'getPipeline');
      getIsPrStub = sinon.stub(pipelinePageState, 'getIsPr');
      shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();

      event = {
        id: 555,
        groupEventId: 444,
        commit: { message: 'commit message', url: 'http://foo.com' },
        sha: 'deadbeef0123456789'
      };
      eventWithParameters = {
        ...event,
        meta: {
          parameters: {
            param: {
              default: 'abc',
              value: 'abc'
            }
          }
        }
      };
    });

    test('it sets correct body for start event', async function (assert) {
      getIsPrStub.returns(false);
      getPipelineStub.returns(pipeline);

      this.setProperties({
        action: 'start',
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: '~commit'
        })
      );
    });

    test('it sets correct body for start event with parameters', async function (assert) {
      getIsPrStub.returns(false);
      getPipelineStub.returns(pipelineWithParameters);

      this.setProperties({
        action: 'start',
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: '~commit',
          meta: { parameters }
        })
      );
    });

    test('it sets correct body for start event from job', async function (assert) {
      getIsPrStub.returns(false);
      getPipelineStub.returns(pipeline);

      this.setProperties({
        action: 'start',
        event,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: job.name,
          sha: event.sha
        })
      );
    });

    test('it sets correct body for start event from job with parameters', async function (assert) {
      getIsPrStub.returns(false);
      getPipelineStub.returns(pipelineWithParameters);

      this.setProperties({
        action: 'start',
        event: eventWithParameters,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: job.name,
          sha: event.sha,
          meta: { parameters }
        })
      );
    });

    test('it sets correct body for restart event from job', async function (assert) {
      getIsPrStub.returns(false);
      getPipelineStub.returns(pipeline);

      this.setProperties({
        action: 'restart',
        event,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: job.name,
          parentEventId: event.id,
          groupEventId: event.groupEventId
        })
      );
    });

    test('it sets correct body for restart event from job with parameters', async function (assert) {
      getIsPrStub.returns(false);
      getPipelineStub.returns(pipelineWithParameters);

      this.setProperties({
        action: 'restart',
        event: eventWithParameters,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: job.name,
          parentEventId: event.id,
          groupEventId: event.groupEventId,
          meta: { parameters }
        })
      );
    });

    test('it sets correct body for start event for PR', async function (assert) {
      getIsPrStub.returns(true);
      event.prNum = prNum;

      getPipelineStub.returns(pipeline);

      this.setProperties({
        action: 'start',
        event,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: '~pr',
          prNum,
          parentEventId: event.id,
          groupEventId: event.groupEventId
        })
      );
    });

    test('it sets correct body for start event for PR with parameters', async function (assert) {
      getIsPrStub.returns(true);
      eventWithParameters.prNum = prNum;

      getPipelineStub.returns(pipelineWithParameters);

      this.setProperties({
        action: 'start',
        event: eventWithParameters,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: '~pr',
          prNum,
          parentEventId: event.id,
          groupEventId: event.groupEventId,
          meta: { parameters }
        })
      );
    });

    test('it sets correct body for start event for PR job', async function (assert) {
      getIsPrStub.returns(true);
      event.prNum = prNum;

      getPipelineStub.returns(pipeline);

      this.setProperties({
        action: 'start',
        event,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: `PR-${prNum}:${job.name}`,
          prNum,
          parentEventId: event.id,
          groupEventId: event.groupEventId
        })
      );
    });

    test('it sets correct body for start event for PR job with parameters', async function (assert) {
      getIsPrStub.returns(true);
      eventWithParameters.prNum = prNum;

      getPipelineStub.returns(pipelineWithParameters);

      this.setProperties({
        action: 'start',
        event: eventWithParameters,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: `PR-${prNum}:${job.name}`,
          prNum,
          parentEventId: event.id,
          groupEventId: event.groupEventId,
          meta: { parameters }
        })
      );
    });

    test('it sets correct body for restart event for PR job', async function (assert) {
      getIsPrStub.returns(true);
      event.prNum = prNum;

      getPipelineStub.returns(pipeline);

      this.setProperties({
        action: 'restart',
        event,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: `PR-${prNum}:${job.name}`,
          prNum,
          parentEventId: event.id,
          groupEventId: event.groupEventId
        })
      );
    });

    test('it sets correct body for restart event for PR job with parameters', async function (assert) {
      getIsPrStub.returns(true);
      eventWithParameters.prNum = prNum;

      getPipelineStub.returns(pipelineWithParameters);

      this.setProperties({
        action: 'restart',
        event: eventWithParameters,
        job,
        closeModal
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: `Manually started by ${username}`,
          startFrom: `PR-${prNum}:${job.name}`,
          prNum,
          parentEventId: event.id,
          groupEventId: event.groupEventId,
          meta: { parameters }
        })
      );
    });
  }
);
