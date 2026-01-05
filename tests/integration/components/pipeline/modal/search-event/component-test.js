import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import {
  fillIn,
  render,
  triggerKeyEvent,
  waitUntil
} from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { selectChoose } from 'ember-power-select/test-support';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/search-event',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );
      const settings = this.owner.lookup('service:settings');

      sinon.stub(pipelinePageState, 'getPipelineId').returns(123);
      sinon.stub(pipelinePageState, 'getIsPr').returns(false);
      sinon.stub(settings, 'getSettings').returns({});
    });

    test('it renders', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#search-description').exists({ count: 1 });
      assert.dom('#search-input').exists({ count: 1 });
      assert.dom('#search-input #search-field-select').exists({ count: 1 });
      assert.dom('#search-input input').exists({ count: 1 });
      assert.dom('.invalid-sha').doesNotExist();
      assert.dom('#search-results').doesNotExist();
      assert.dom('.no-results').exists({ count: 1 });
    });

    test('it makes API call for valid input with default searchField', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').resolves([]);

      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('input', 'this is a message');
      assert.dom('#search-field-select').hasText('message');
      assert.dom('#search-input input').hasValue('this is a message');

      await waitUntil(() => shuttle.fetchFromApi.callCount === 1);
      assert.equal(shuttle.fetchFromApi.callCount, 1);
    });

    test('it makes API call for valid input with selected searchField', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon
        .stub(shuttle, 'fetchFromApi')
        .onCall(0)
        .resolves([])
        .onCall(1)
        .resolves([]);

      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @closeModal={{this.closeModal}}
        />`
      );

      await selectChoose('#search-field-select', 'sha');
      assert.dom('#search-field-select').hasText('sha');
      assert.equal(shuttle.fetchFromApi.callCount, 0);

      await fillIn('input', 'fe155eb');
      assert.dom('#search-input input').hasValue('fe155eb');
      await waitUntil(() => shuttle.fetchFromApi.callCount === 1);
      assert.equal(shuttle.fetchFromApi.callCount, 1);

      await selectChoose('#search-field-select', 'creator');
      assert.dom('#search-field-select').hasText('creator');
      assert.dom('#search-input input').hasValue('fe155eb');
      await waitUntil(() => shuttle.fetchFromApi.callCount === 2);
      assert.equal(shuttle.fetchFromApi.callCount, 2);
    });

    test('it handles invalid sha input', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const spyShuttle = sinon.spy(shuttle, 'fetchFromApi');

      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @closeModal={{this.closeModal}}
        />`
      );

      await selectChoose('#search-field-select', 'sha');
      assert.dom('#search-field-select').hasText('sha');
      assert.dom('#search-input input').hasValue('');
      assert.equal(spyShuttle.notCalled, true);

      await fillIn('input', ';');
      assert.dom('#search-field-select').hasText('sha');
      assert.dom('#search-input input').hasValue(';');
      assert.dom('.invalid-sha').exists({ count: 1 });
      assert.equal(spyShuttle.notCalled, true);
    });

    test('it clears input and search results when escape key is pressed', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').resolves([]);

      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('input', 'abc123');
      assert.dom('#search-input input').hasValue('abc123');
      await waitUntil(() => shuttle.fetchFromApi.callCount === 1);
      assert.equal(shuttle.fetchFromApi.callCount, 1);

      await triggerKeyEvent('input', 'keydown', 'Escape');
      assert.dom('#search-input input').hasNoValue();
      assert.equal(shuttle.fetchFromApi.callCount, 1);
    });
  }
);
