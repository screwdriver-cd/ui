import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/settings/cache/table/cell/action',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          id: 123,
          name: 'test',
          included: true,
          onCacheActionComplete: () => {}
        }
      });
      await render(
        hbs`<Pipeline::Settings::Cache::Table::Cell::Action
            @record={{this.record}}
        />`
      );

      assert.dom('.action-cell').exists();
      assert.dom('button').exists();
    });
  }
);
