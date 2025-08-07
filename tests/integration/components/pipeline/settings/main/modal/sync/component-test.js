import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/main/modal/sync',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    hooks.beforeEach(function () {
      const pipelinePageStateService = this.owner.lookup(
        'service:pipelinePageState'
      );

      shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(pipelinePageStateService, 'getPipelineId').returns(1);
    });

    test('it renders', async function (assert) {
      this.setProperties({
        syncType: 'webhooks',
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::Sync
            @syncType={{this.syncType}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').hasText('Sync Webhooks ×');
      assert.dom('#error-message').doesNotExist();
      assert.dom('#submit-sync-button').exists();
      assert.dom('#submit-sync-button').isEnabled();
    });

    test('it handles API error correctly', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

      this.setProperties({
        syncType: 'webhooks',
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::Sync
            @syncType={{this.syncType}}
            @closeModal={{this.closeModal}}
        />`
      );

      await click('#submit-sync-button');

      assert.dom('#error-message').exists();
      assert.dom('#submit-sync-button').isNotDisabled();
    });

    test('it handles API success correctly', async function (assert) {
      const closeModalSpy = sinon.spy();

      sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        syncType: 'webhooks',
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::Sync
            @syncType={{this.syncType}}
            @closeModal={{this.closeModal}}
        />`
      );

      await click('#submit-sync-button');

      assert.dom('#submit-sync-button').isDisabled();
      assert.dom('#error-message').doesNotExist();
      assert.true(closeModalSpy.calledOnce);
    });
  }
);
