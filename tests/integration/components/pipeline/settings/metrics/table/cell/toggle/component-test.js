import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/settings/metrics/table/cell/toggle',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          id: 123,
          name: 'test',
          included: true
        }
      });

      await render(
        hbs`<Pipeline::Settings::Metrics::Table::Cell::Toggle
          @record={{this.record}}
          @onJobUpdated={{this.onJobUpdated}}
        />`
      );

      assert.dom('#toggle-job-123').exists();
    });
  }
);
