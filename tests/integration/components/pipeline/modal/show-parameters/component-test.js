import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/show-parameters',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(pipelinePageState, 'getPipeline').returns({
        parameters: { foo: { value: 'foofoo' } }
      });
      sinon.stub(pipelinePageState, 'getJobs').returns([]);

      this.setProperties({
        event: { meta: { parameters: { foo: { value: 'bar' } } } },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ShowParameters
            @event={{this.event}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Configured parameters for event');
    });
  }
);
