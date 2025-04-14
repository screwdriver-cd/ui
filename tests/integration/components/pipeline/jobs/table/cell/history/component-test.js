import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/history',
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
        hbs`<Pipeline::Jobs::Table::Cell::History
            @record={{this.record}}
        />`
      );

      assert.dom('a').doesNotExist();
    });

    test('it renders build history', async function (assert) {
      this.setProperties({
        record: {
          job,
          builds: [
            {
              id: 111,
              status: 'CREATED'
            },
            {
              id: 999,
              status: 'SUCCESS',
              startTime: '2024-07-14T17:25:57.671Z',
              endTime: '2024-07-14T17:26:55.202Z',
              meta: {
                build: {
                  sha: 'abcdefgh0123456789'
                }
              }
            }
          ]
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::History
            @record={{this.record}}
        />`
      );

      assert.dom('svg.CREATED').exists({ count: 1 });
      assert.dom('.build-history-container a').exists({ count: 1 });
    });
  }
);
