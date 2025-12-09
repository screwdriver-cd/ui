import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/modal/change-visibility',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders core components', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ChangeVisibility
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#change-visibility-message').exists({ count: 1 });
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#change-visibility-action').exists({ count: 1 });
    });
  }
);
