import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/modal/confirm-action',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders start action', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
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
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main', status: 'SUCCESS' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });

    test('it renders warning message for non-latest commit event', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: '0123456789deadbeef'
        },
        jobs: [],
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
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
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
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
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
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
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
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
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
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
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-footer button.confirm').isDisabled();
    });

    test('it enables submit button when reason is provided for frozen job', async function (assert) {
      this.setProperties({
        pipeline: { parameters: {} },
        event: {
          commit: { message: 'commit message', url: 'http://foo.com' },
          sha: 'deadbeef0123456789'
        },
        jobs: [],
        latestCommitEvent: { sha: 'deadbeef0123456789' },
        job: { name: 'main', status: 'FROZEN' },
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::ConfirmAction
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @latestCommitEvent={{this.latestCommitEvent}}
            @job={{this.job}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('.frozen-reason input', 'Some reason');

      assert.dom('.modal-footer button.confirm').isEnabled();
    });
  }
);
