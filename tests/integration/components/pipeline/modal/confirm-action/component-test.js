import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/confirm-action',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      const workflowDataReload = this.owner.lookup(
        'service:workflow-data-reload'
      );

      sinon
        .stub(workflowDataReload, 'getLatestCommitEvent')
        .returns({ sha: 'deadbeef0123456789' });
    });

    test('it renders start action', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
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
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main', status: 'SUCCESS' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });

    test('it renders stage name if set', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main' },
        stage: { name: 'stage' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
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
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: '0123456789deadbeef'
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.alert').hasText('This is NOT the latest commit.');
    });

    test('it does not render warning message for pr commit event', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789',
          type: 'pr'
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-body .alert').doesNotExist();

      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'abc123',
          type: 'pr'
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-body .alert').doesNotExist();
    });

    test('it renders reason input for frozen job', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.frozen-reason').exists({ count: 1 });
      assert.dom('.frozen-reason label').exists({ count: 1 });
      assert.dom('.frozen-reason input').exists({ count: 1 });
    });

    test('it renders parameter input for parameterized job', async function (assert) {
      this.setProperties({
        pipeline: { parameters: { param1: 'abc' } },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789',
          meta: {
            parameters: {
              param1: { value: 'abc' }
            }
          }
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.pipeline-parameters').exists({ count: 1 });
    });

    test('it disables submit button when no reason is provided for frozen job', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-action').isDisabled();
    });

    test('it enables submit button when reason is provided for frozen job', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('.frozen-reason input', 'Some reason');

      assert.dom('#submit-action').isEnabled();
    });

    test('it display success message', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.alert').doesNotExist();

      await click('#submit-action');

      assert.equal(shuttleStub.calledOnce, true);
      assert.dom('#submit-action').isDisabled();
      assert.dom('.alert').exists({ count: 1 });
      assert.dom('.alert > span').hasText('Started successfully');
    });

    test('it displays error message when API call fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const errorMessage = 'Failed to trigger build';

      const shuttleStub = sinon
        .stub(shuttle, 'fetchFromApi')
        .rejects({ message: errorMessage });

      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        job: { name: 'main' },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
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
