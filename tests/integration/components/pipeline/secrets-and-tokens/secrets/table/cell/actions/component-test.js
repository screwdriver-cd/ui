import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/secrets-and-tokens/table/cell/actions',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {}
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      assert.dom('button').exists({ count: 2 });
      assert.dom('button svg.fa-trash').exists();
    });

    test('it renders for inherited secrets', async function (assert) {
      this.setProperties({
        record: {
          inherited: true,
          overridden: false
        }
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      assert.dom('button').exists({ count: 1 });
    });

    test('it renders for overridden secrets', async function (assert) {
      this.setProperties({
        record: {
          inherited: true,
          overridden: true
        }
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      assert.dom('button').exists({ count: 2 });
      assert.dom('button svg.fa-rotate-left').exists();
    });
  }
);
