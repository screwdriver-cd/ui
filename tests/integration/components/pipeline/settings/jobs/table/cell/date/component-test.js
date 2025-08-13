import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/settings/jobs/table/cell/date',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {}
      });

      await render(
        hbs`<Pipeline::Settings::Jobs::Table::Cell::Date
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('');
    });

    test('it renders date', async function (assert) {
      this.setProperties({
        record: {
          date: new Date(Date.now() - 1000 * 60 * 4).toISOString()
        }
      });

      await render(
        hbs`<Pipeline::Settings::Jobs::Table::Cell::Date
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('4 minutes ago');
    });
  }
);
