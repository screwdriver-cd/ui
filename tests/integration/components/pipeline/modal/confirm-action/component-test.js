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

      sinon.stub(pipelinePageState, 'getPipeline').returns({ id: 987 });
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
        event,
        job,
        closeModal: () => {},
        newEventMode: 'start'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
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
        event,
        job,
        closeModal: () => {},
        newEventMode: 'restart'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });

    test('it renders stage name if set', async function (assert) {
      this.setProperties({
        event,
        job,
        stage: { name: 'stage' },
        closeModal: () => {},
        newEventMode: 'start'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @stage={{this.stage}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('#confirm-action-stage').exists({ count: 1 });
      assert.dom('#confirm-action-stage').hasText('Stage: stage');
      assert.dom('#confirm-action-job').doesNotExist();
    });

    test('it renders warning message for non-latest commit event', async function (assert) {
      event.sha = '0123456789deadbeef';
      this.setProperties({
        event,
        job,
        closeModal: () => {},
        newEventMode: 'start'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('.alert').hasText('This is NOT the latest commit.');
    });

    test('it does not render warning message for pr commit event', async function (assert) {
      isPr = true;

      this.setProperties({
        event,
        job,
        closeModal: () => {},
        newEventMode: 'start'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('.modal-body .alert').doesNotExist();
    });

    test('it renders reason input for frozen job', async function (assert) {
      job.status = 'FROZEN';

      this.setProperties({
        event,
        job,
        closeModal: () => {},
        newEventMode: 'start'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
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
        event,
        job,
        closeModal: () => {},
        newEventMode: 'restart'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('.pipeline-parameters').exists({ count: 1 });
    });

    test('it disables submit button when no reason is provided for frozen job', async function (assert) {
      this.setProperties({
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {},
        newEventMode: 'restart'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('#submit-action').isDisabled();
    });

    test('it enables submit button when reason is provided for frozen job', async function (assert) {
      job.status = 'FROZEN';

      this.setProperties({
        event,
        job,
        closeModal: () => {},
        newEventMode: 'restart'
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
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
        event,
        job,
        closeModal: closeModalSpy,
        newEventMode: 'start'
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('.alert').doesNotExist();

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
        event,
        job,
        closeModal: () => {},
        newEventMode: 'start'
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @event={{this.event}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
            @newEventMode={{this.newEventMode}}
        />`
      );

      assert.dom('.alert').doesNotExist();

      await click('#submit-action');

      assert.equal(shuttleStub.calledOnce, true);
      assert.dom('.alert').exists({ count: 1 });
      assert.dom('.alert > span').hasText(errorMessage);
    });
  }
);
