import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/stage',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          job: { id: 123, name: 'main' }
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Stage
            @record={{this.record}}
        />`
      );

      assert.dom('.stage-cell').hasText('');
    });

    test('it renders stage name', async function (assert) {
      this.setProperties({
        record: {
          job: { id: 123, name: 'main' },
          stageName: 'test'
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Stage
            @record={{this.record}}
        />`
      );

      assert.dom('.stage-cell').hasText('test');
    });
  }
);
