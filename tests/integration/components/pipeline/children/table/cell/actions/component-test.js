import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/children/table/cell/actions',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {}
      });

      await render(hbs`<Pipeline::Children::Table::Cell::Actions />`);

      assert.dom('svg').exists({ count: 1 });
    });
  }
);
