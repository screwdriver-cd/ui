import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/modal/show-parameters',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        event: { meta: { parameters: { foo: { value: 'bar' } } } },
        pipeline: { parameters: { foo: { value: 'foofoo' } } },
        jobs: [],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ShowParameters
            @event={{this.event}}
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Configured parameters for event');
    });
  }
);
