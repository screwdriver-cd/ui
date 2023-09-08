import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | truncated-table-cell-with-hover-tooltip',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const admins = [
        {
          admin: true,
          admin2: false,
          admin3: false,
          admin4: false,
          admin5: false,
          admin6: false,
          admin7: false,
          admin8: false,
          admin9: false,
          admin10: false,
          admin11: false,
          admin12: false,
          admin13: false
        },
        {
          admin: true,
          admin2: false,
          admin3: false
        }
      ];

      const column = { title: 'ADMINS' };
      const record = {
        truncatedCellConfig: {
          ADMINS: {
            maxColumnWidth: 40,
            delimiter: ', ',
            ellipsis: ', ...',
            data: Object.keys(admins[0])
          }
        }
      };

      this.set('record', record);
      this.set('column', column);

      await render(
        hbs`<TruncatedTableCellWithHoverTooltip @record={{this.record}} @column={{this.column}}/>`
      );

      assert.ok(
        this.element.textContent.includes('admin, admin2, admin3, admin4, ...'),
        'Expected text to be truncated'
      );

      record.truncatedCellConfig.ADMINS.data = Object.keys(admins[1]);

      await render(
        hbs`<TruncatedTableCellWithHoverTooltip @record={{this.record}} @column={{this.column}}/>`
      );

      assert.equal(
        this.element.textContent.trim(),
        'admin, admin2, admin3',
        'Expected text to not be truncated'
      );
    });
  }
);
