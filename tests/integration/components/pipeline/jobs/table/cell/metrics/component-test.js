import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/metrics',
  function (hooks) {
    setupRenderingTest(hooks);

    const job = { id: 123, name: 'main' };

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          job
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Metrics
            @record={{this.record}}
        />`
      );

      assert.dom('a').doesNotExist();
    });

    test('it renders metrics link', async function (assert) {
      this.setProperties({
        record: {
          job,
          build: { id: 999 }
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Metrics
            @record={{this.record}}
        />`
      );

      assert.dom('a').exists({ count: 1 });
    });
  }
);
