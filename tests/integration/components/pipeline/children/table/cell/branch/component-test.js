import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/children/table/cell/branch',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          scmRepo: { url: 'http://test.com' },
          branchName: 'main'
        }
      });

      await render(hbs`<Pipeline::Children::Table::Cell::Branch />`);

      assert.dom('a').exists({ count: 1 });
    });
  }
);
