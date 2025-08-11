import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/cache/modal/clear',
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

    test('it renders for clear pipeline cache', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Cache::Modal::Clear
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists();
      assert.dom('#error-message').doesNotExist();
      assert.dom('#submit-action').exists();
      assert.dom('#submit-action').isEnabled();
    });

    test('it renders for clear jobs cache', async function (assert) {
      this.setProperties({
        jobs: new Set([
          { id: 1, name: 'job1' },
          { id: 2, name: 'job2' }
        ]),
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Cache::Modal::Clear
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists();
      assert.dom('#error-message').doesNotExist();
      assert.dom('.clear-jobs-cache-list').exists();
      assert.dom('#submit-action').exists();
      assert.dom('#submit-action').isEnabled();
    });

    test('it renders error message on API failure', async function (assert) {
      const errorMessage = 'An error occurred while clearing the cache.';

      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: errorMessage });

      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Cache::Modal::Clear
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.dom('#error-message').exists();
      assert.dom('#error-message').hasText(errorMessage);
      assert.dom('#submit-action').isEnabled();
    });

    test('it renders error message on API failures clearing jobs', async function (assert) {
      const errorMessage = 'An error occurred while clearing the cache.';

      sinon
        .stub(shuttle, 'fetchFromApi')
        .onCall(0)
        .resolves()
        .onCall(1)
        .rejects({ message: errorMessage })
        .onCall(2)
        .rejects({ message: errorMessage });

      this.setProperties({
        jobs: new Set([
          { id: 1, name: 'job1' },
          { id: 2, name: 'retry' },
          { id: 3, name: 'retry2' }
        ]),
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Cache::Modal::Clear
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.dom('#error-message').exists();
      assert.dom('.clear-jobs-cache-list').exists();
      assert.dom('#submit-action').isEnabled();
    });

    test('it handles API success', async function (assert) {
      const closeModalSpy = sinon.spy();

      sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Cache::Modal::Clear
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.equal(closeModalSpy.calledOnceWith(true), true);
    });

    test('it handles API success for job clear', async function (assert) {
      const closeModalSpy = sinon.spy();

      sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        jobs: new Set([{ id: 1, name: 'job1' }]),
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Cache::Modal::Clear
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.equal(closeModalSpy.calledOnceWith(true, [1]), true);
    });
  }
);
