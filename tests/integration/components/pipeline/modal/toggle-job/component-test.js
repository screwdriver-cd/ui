import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/modal/toggle-job', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.setProperties({
      jobId: 1,
      name: 'main',
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobId={{this.jobId}}
        @name={{this.name}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-title').hasText('Disable the "main" job?');
    assert.dom('.modal-body label').hasText('Reason');
    assert.dom('.modal-body label input').exists({ count: 1 });
    assert.dom('.modal-footer button').exists({ count: 1 });
  });

  test('it truncates long job name', async function (assert) {
    this.setProperties({
      jobId: 1,
      name: 'abcdefghijklmnopqrstuvwxyz123456790',
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobId={{this.jobId}}
        @name={{this.name}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert
      .dom('.modal-title')
      .hasText('Disable the "abcdefghijklmnopqrstuvwxyz1234..." job?');
  });

  test('it displays error message when update fails', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');
    const errorMessage = 'Failed to update job';

    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: errorMessage });

    this.setProperties({
      jobId: 1,
      name: 'main',
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobId={{this.jobId}}
        @name={{this.name}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#submit-action');

    assert.dom('.modal-body .alert.alert-warning').exists({ count: 1 });
    assert.dom('.modal-body .alert.alert-warning > span').hasText(errorMessage);
  });

  test('it displays success message when update succeeds', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves();

    this.setProperties({
      jobId: 1,
      name: 'main',
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobId={{this.jobId}}
        @name={{this.name}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#submit-action');

    assert.dom('.modal-body .alert.alert-success').exists({ count: 1 });
    assert
      .dom('.modal-body .alert.alert-success > span')
      .hasText('Job disabled successfully');
  });

  test('it disables save button when update succeeds', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves();

    this.setProperties({
      jobId: 1,
      name: 'main',
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobId={{this.jobId}}
        @name={{this.name}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('#submit-action').isNotDisabled();

    await click('#submit-action');

    assert.dom('#submit-action').isDisabled();
  });
});
