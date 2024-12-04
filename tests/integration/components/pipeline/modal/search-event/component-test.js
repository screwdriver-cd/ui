import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { fillIn, render, triggerKeyEvent, select } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/search-event',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const router = this.owner.lookup('service:router');

      sinon.stub(router, 'currentRouteName').value('pipeline');

      this.setProperties({
        pipeline: {},
        jobs: [],
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @userSettings={{this.userSettings}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#search-description').exists({ count: 1 });
      assert.dom('#search-select').exists({ count: 1 });
      assert.dom('#search-select select').exists({ count: 1 });
      assert.dom('#search-select option').exists({ count: 5 });
      assert.dom('#search-input').exists({ count: 1 });
      assert.dom('#search-input input').exists({ count: 1 });
      assert.dom('.invalid-sha').doesNotExist();
      assert.dom('#search-results').doesNotExist();
      assert.dom('.no-results').exists({ count: 1 });
    });

    test('it makes API call for valid input', async function (assert) {
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(router, 'currentRouteName').value('pipeline');
      sinon.stub(shuttle, 'fetchFromApi').resolves([]);

      this.setProperties({
        pipeline: {},
        jobs: [],
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @userSettings={{this.userSettings}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('input', 'this is a message');

      assert.equal(shuttle.fetchFromApi.callCount, 1);
    });

    test('it makes API call with search filter for valid input', async function (assert) {
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(router, 'currentRouteName').value('pipeline');
      sinon.stub(shuttle, 'fetchFromApi').resolves([]);

      this.setProperties({
        pipeline: {},
        jobs: [],
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @userSettings={{this.userSettings}}
            @closeModal={{this.closeModal}}
        />`
      );

      await select('#search-field-options', 'sha');
      assert.dom('#search-field-options').hasValue('sha');
      await fillIn('input', 'abc123');

      assert.equal(shuttle.fetchFromApi.callCount, 1);

      // Should make another call if search field changes
      await select('#search-field-options', 'creator');
      assert.dom('#search-field-options').hasValue('creator');

      assert.equal(shuttle.fetchFromApi.callCount, 2);
    });

    test('it handles invalid sha input', async function (assert) {
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(router, 'currentRouteName').value('pipeline');
      sinon.spy(shuttle);

      this.setProperties({
        pipeline: {},
        jobs: [],
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @userSettings={{this.userSettings}}
            @closeModal={{this.closeModal}}
        />`
      );

      await select('#search-field-options', 'sha');
      assert.dom('#search-field-options').hasValue('sha');
      await fillIn('input', ';');

      assert.equal(shuttle.fetchFromApi.callCount, 0);
      assert.dom('.invalid-sha').exists({ count: 1 });
    });

    test('it clears input and search results when escape key is pressed', async function (assert) {
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(router, 'currentRouteName').value('pipeline');
      sinon.stub(shuttle, 'fetchFromApi').resolves([]);

      this.setProperties({
        pipeline: {},
        jobs: [],
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::SearchEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @userSettings={{this.userSettings}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('input', 'abc123');
      assert.dom('#search-input input').hasValue('abc123');
      assert.equal(shuttle.fetchFromApi.callCount, 1);

      await triggerKeyEvent('input', 'keydown', 'Escape');
      assert.dom('#search-input input').hasNoValue();
      assert.equal(shuttle.fetchFromApi.callCount, 1);
    });
  }
);
