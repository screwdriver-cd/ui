import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/workflow/event-rail',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    let pipelinePageState;

    const pipelineId = 1;

    hooks.beforeEach(function () {
      shuttle = this.owner.lookup('service:shuttle');
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');

      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ id: pipelineId, state: 'ACTIVE' });
      sinon.stub(pipelinePageState, 'getPipelineId').returns(pipelineId);
      sinon.stub(shuttle, 'fetchFromApi').resolves({ id: 123 });
    });

    test('it renders', async function (assert) {
      sinon.stub(pipelinePageState, 'getIsPr').returns(false);

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#search-for-event-button').isDisabled();
      assert.dom('#start-event-button').exists({ count: 1 });
      assert.dom('#event-cards-container').exists({ count: 1 });
    });

    test('it renders for pull requests', async function (assert) {
      sinon.stub(pipelinePageState, 'getIsPr').returns(true);

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#search-for-event-button').isDisabled();
      assert.dom('#start-event-button').doesNotExist();
      assert.dom('#event-cards-container').exists({ count: 1 });
    });

    test('it renders disable event start button', async function (assert) {
      pipelinePageState.getPipeline.returns({
        id: pipelineId,
        state: 'INACTIVE'
      });
      sinon.stub(pipelinePageState, 'getIsPr').returns(false);

      await render(hbs`<Pipeline::Workflow::EventRail/>`);

      assert.dom('#event-rail-actions').exists({ count: 1 });
      assert.dom('#search-for-event-button').exists({ count: 1 });
      assert.dom('#start-event-button').exists({ count: 1 });
      assert.dom('#start-event-button').isDisabled();
      assert.dom('#event-cards-container').exists({ count: 1 });
    });
  }
);
