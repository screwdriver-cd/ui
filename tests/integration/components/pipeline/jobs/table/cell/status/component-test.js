import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/status',
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
        hbs`<Pipeline::Jobs::Table::Cell::Status
            @record={{this.record}}
        />`
      );

      assert.dom('a').doesNotExist();
    });

    test('it renders build status', async function (assert) {
      const build = {
        id: 999,
        status: 'SUCCESS',
        startTime: '2024-07-14T17:25:57.671Z',
        endTime: '2024-07-14T17:26:55.202Z'
      };

      this.setProperties({
        record: {
          job,
          build
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Status
            @record={{this.record}}
        />`
      );

      assert.dom('svg.SUCCESS').exists({ count: 1 });
      assert.dom('.build-status-container a').exists({ count: 1 });
    });
  }
);
