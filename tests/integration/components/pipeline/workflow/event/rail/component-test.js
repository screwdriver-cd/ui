import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/workflow/event/rail',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const router = this.owner.lookup('service:router');

      sinon.stub(router, 'currentRouteName').value('events');

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#search-for-event-button').isDisabled();
      assert.dom('#start-event-button').exists({ count: 1 });
      assert.dom('#event-cards-container').exists({ count: 1 });
    });

    test('it renders for pull requests', async function (assert) {
      const router = this.owner.lookup('service:router');

      sinon.stub(router, 'currentRouteName').value('pulls');

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#search-for-event-button').isDisabled();
      assert.dom('#start-event-button').doesNotExist();
      assert.dom('#event-cards-container').exists({ count: 1 });
    });
  }
);
