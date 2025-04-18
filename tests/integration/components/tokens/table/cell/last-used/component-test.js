import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | tokens/table/cell/last-used',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {}
      });
      await render(
        hbs`<Tokens::Table::Cell::LastUsed
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('Never used');
    });
  }
);
