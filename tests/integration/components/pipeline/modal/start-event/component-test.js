import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/modal/start-event',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders when pipeline has no parameters', async function (assert) {
      this.setProperties({
        pipeline: {},
        jobs: [],
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::StartEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.no-parameters-title').exists({ count: 1 });
    });

    test('it renders when pipeline has parameters', async function (assert) {
      this.setProperties({
        pipeline: { parameters: { p1: ['abc', '123'] } },
        jobs: [
          {
            name: 'main',
            permutations: [{ parameters: { j1: ['yes', 'no'] } }]
          }
        ],
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::StartEvent
            @pipeline={{this.pipeline}}
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.no-parameters-title').doesNotExist();
      assert.dom('.parameter-group').exists({ count: 2 });
    });
  }
);
