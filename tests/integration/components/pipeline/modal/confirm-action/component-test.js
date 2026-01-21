import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/confirm-action',
  function (hooks) {
    setupRenderingTest(hooks);

    let event;

    let job;

    let isPr;

    hooks.beforeEach(function () {
      const workflowDataReload = this.owner.lookup(
        'service:workflow-data-reload'
      );
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon
        .stub(workflowDataReload, 'getLatestCommitEvent')
        .returns({ sha: 'deadbeef0123456789' });

      sinon.stub(pipelinePageState, 'getPipeline').returns({
        id: 987,
        workflowGraph: {
          nodes: [],
          edges: []
        }
      });
      sinon.stub(pipelinePageState, 'getJobs').returns([]);
      sinon.stub(pipelinePageState, 'getIsPr').returns(isPr);

      event = {
        commit: { message: 'commit message', url: 'http://foo.com' },
        sha: 'deadbeef0123456789'
      };
      job = { name: 'main' };
      isPr = false;
    });

    test('it renders start action', async function (assert) {
      this.setProperties({
        action: 'start',
        event,
        job,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Are you sure you want to start?');
      assert.dom('#confirm-action-job').hasText('Job: main');
      assert
        .dom('#confirm-action-commit')
        .hasText('Commit: commit message #deadbee');
      assert
        .dom('#confirm-action-commit-link')
        .hasAttribute('href', 'http://foo.com');
    });

    test('it renders restart action', async function (assert) {
      job.status = 'SUCCESS';

      this.setProperties({
        action: 'restart',
        event,
        job,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });

    test('it renders stage name if set', async function (assert) {
      this.setProperties({
        action: 'start',
        event,
        job,
        stage: { name: 'stage' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @stage={{this.stage}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#confirm-action-stage').exists({ count: 1 });
      assert.dom('#confirm-action-stage').hasText('Stage: stage');
      assert.dom('#confirm-action-job').doesNotExist();
    });

    test('it renders warning message for non-latest commit event', async function (assert) {
      event.sha = '0123456789deadbeef';
      this.setProperties({
        action: 'start',
        event,
        job,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert
        .dom('#user-notice')
        .hasText(
          'This is NOT the latest commit. Make sure this job (main) and any downstream jobs can be successfully completed without rerunning any upstream jobs (i.e., does this job depend on any metadata that was previously set?)'
        );
    });

    test('it does not render warning message for pr commit event', async function (assert) {
      isPr = true;

      this.setProperties({
        action: 'start',
        event,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-body #user-notice').doesNotExist();
    });

    test('it renders reason input for frozen job', async function (assert) {
      job.status = 'FROZEN';

      this.setProperties({
        action: 'start',
        event,
        job,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.frozen-reason').exists({ count: 1 });
      assert.dom('.frozen-reason label').exists({ count: 1 });
      assert.dom('.frozen-reason input').exists({ count: 1 });
    });

    test('it renders parameter input for parameterized job', async function (assert) {
      event.meta = {
        parameters: {
          param1: { value: 'abc' }
        }
      };

      this.setProperties({
        action: 'restart',
        event,
        job,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.pipeline-parameters').exists({ count: 1 });
    });

    test('it disables submit button when no reason is provided for frozen job', async function (assert) {
      this.setProperties({
        action: 'restart',
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-action').isDisabled();
    });

    test('it enables submit button when reason is provided for frozen job', async function (assert) {
      job.status = 'FROZEN';

      this.setProperties({
        action: 'restart',
        event,
        job,
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @action={{this.action}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('.frozen-reason input', 'Some reason');

      assert.dom('#submit-action').isEnabled();
    });

    test('it closes modal on success', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();
      const closeModalSpy = sinon.spy();

      this.setProperties({
        action: 'start',
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#confirm-action-error').doesNotExist();

      await click('#submit-action');

      assert.equal(shuttleStub.calledOnce, true);
      assert.equal(closeModalSpy.calledOnce, true);
    });

    test('it displays error message when API call fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const errorMessage = 'Failed to trigger build';

      const shuttleStub = sinon
        .stub(shuttle, 'fetchFromApi')
        .rejects({ message: errorMessage });

      this.setProperties({
        action: 'start',
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#confirm-action-error').doesNotExist();

      await click('#submit-action');

      assert.equal(shuttleStub.calledOnce, true);
      assert.dom('#confirm-action-error').exists({ count: 1 });
      assert.dom('#confirm-action-error .alert > span').hasText(errorMessage);
    });

    test('it switches Yes to Close on 404 and closes modal', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const errorMessage = 'Not found';
      const shuttleStub = sinon
        .stub(shuttle, 'fetchFromApi')
        .rejects({ payload: { statusCode: 404, message: errorMessage } });
      const closeModalSpy = sinon.spy();

      this.setProperties({
        action: 'start',
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @action={{this.action}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-action').hasText('Yes');

      await click('#submit-action');

      assert.equal(shuttleStub.calledOnce, true);
      assert.dom('#confirm-action-error').exists({ count: 1 });
      assert.dom('#confirm-action-error .alert > span').hasText(errorMessage);
      assert.dom('#submit-action').hasText('Close');

      await click('#submit-action');

      assert.equal(closeModalSpy.calledOnce, true);
      assert.equal(shuttleStub.calledOnce, true, 'no additional API call');
    });
  }
);
