import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/stage',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const job = { id: 123, name: 'main' };

      this.setProperties({
        record: {
          job
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Stage
            @record={{this.record}}
        />`
      );

      assert.dom('.stage-cell').hasText('N/A');
    });
  }
);
