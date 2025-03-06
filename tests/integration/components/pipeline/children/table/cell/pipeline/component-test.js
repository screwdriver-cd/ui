import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/children/table/cell/pipeline',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          id: 123,
          name: 'myPipeline'
        }
      });

      await render(hbs`<Pipeline::Children::Table::Cell::Pipeline />`);

      assert.dom('a').exists({ count: 1 });
    });
  }
);
