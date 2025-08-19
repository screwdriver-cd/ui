import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/settings/jobs/table/cell/toggle',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          id: 123
        }
      });

      await render(
        hbs`<Pipeline::Settings::Jobs::Table::Cell::Toggle
            @record={{this.record}}
        />`
      );

      assert.dom('#toggle-job-123').exists();
    });
  }
);
