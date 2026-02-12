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
        record: {
          state: 'INACTIVE'
        }
      });

      await render(
        hbs`<Pipeline::Children::Table::Cell::Actions @record={{this.record}}/>`
      );

      assert.dom('svg').exists({ count: 1 });
    });

    test('it does not render', async function (assert) {
      this.setProperties({
        record: {
          state: 'ACTIVE'
        }
      });

      await render(
        hbs`<Pipeline::Children::Table::Cell::Actions @record={{this.record}}/>`
      );

      assert.dom('svg').doesNotExist({ count: 1 });
    });
  }
);
