import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/modal/toggle-job', function (hooks) {
  setupRenderingTest(hooks);

  let shuttle;

  let pipelinePageState;

  let mockJob;

  hooks.beforeEach(function () {
    shuttle = this.owner.lookup('service:shuttle');
    pipelinePageState = this.owner.lookup('service:pipelinePageState');

    mockJob = { id: 1, name: 'main' };
    sinon.stub(pipelinePageState, 'getJobs').returns([mockJob]);
  });

  test('it renders', async function (assert) {
    this.setProperties({
      jobs: [mockJob],
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobs={{this.jobs}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-title').exists();
    assert.dom('#toggle-job-modal-error').doesNotExist();
    assert.dom('.modal-body label').hasText('Reason');
    assert.dom('.modal-body label input').exists();
    assert.dom('#submit-action').exists();
  });

  test('it displays error message when update fails', async function (assert) {
    const errorMessage = 'Failed to update job';

    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: errorMessage });

    this.setProperties({
      jobs: [mockJob],
      toggleAction: 'Disable',
      closeModal: () => {}
    });
    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobs={{this.jobs}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#submit-action');

    assert.dom('#toggle-job-modal-error').exists();
    assert.dom('#toggle-job-modal-error').hasText(errorMessage);
  });

  test('it handles update success', async function (assert) {
    const closeModalSpy = sinon.spy();

    sinon.stub(shuttle, 'fetchFromApi').resolves(mockJob);

    this.setProperties({
      jobs: [mockJob],
      toggleAction: 'Disable',
      closeModal: closeModalSpy
    });

    await render(
      hbs`<Pipeline::Modal::ToggleJob
        @jobs={{this.jobs}}
        @toggleAction={{this.toggleAction}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('#submit-action').isNotDisabled();
    await click('#submit-action');
    assert.equal(closeModalSpy.calledOnceWith(true), true);
  });
});
