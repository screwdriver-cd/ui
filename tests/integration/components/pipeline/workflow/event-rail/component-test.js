import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/workflow/event-rail',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(pipelinePageState, 'getIsPr').returns(false);

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#search-for-event-button').isDisabled();
      assert.dom('#start-event-button').exists({ count: 1 });
      assert.dom('#event-cards-container').exists({ count: 1 });
    });

    test('it renders for pull requests', async function (assert) {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(pipelinePageState, 'getIsPr').returns(true);

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#search-for-event-button').isDisabled();
      assert.dom('#start-event-button').doesNotExist();
      assert.dom('#event-cards-container').exists({ count: 1 });
    });
  }
);
