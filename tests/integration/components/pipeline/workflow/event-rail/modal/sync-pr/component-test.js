import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/workflow/event-rail/modal/sync-pr',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(pipelinePageState, 'getPipelineId').returns(123);

      this.setProperties({
        closeModal: () => {}
      });
    });

    test('it renders', async function (assert) {
      await render(
        hbs`<Pipeline::Workflow::EventRail::Modal::SyncPr
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('.modal-body').exists();
      assert.dom('#sync-pr-button').exists();
    });

    test('it displays error message when API request fails', async function (assert) {
      const errorMessage = 'Failed to sync PR';

      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: errorMessage });

      await render(
        hbs`<Pipeline::Workflow::EventRail::Modal::SyncPr
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#sync-pr-button');

      assert.dom('.modal-body .alert.alert-warning').exists({ count: 1 });
      assert
        .dom('.modal-body .alert.alert-warning > span')
        .hasText(errorMessage);
      assert.dom('#sync-pr-button').isEnabled();
    });

    test('it closes modal when API request succeeds', async function (assert) {
      const closeModalSpy = sinon.spy();

      sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Workflow::EventRail::Modal::SyncPr
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#sync-pr-button');

      assert.true(closeModalSpy.calledOnce);
    });
  }
);
