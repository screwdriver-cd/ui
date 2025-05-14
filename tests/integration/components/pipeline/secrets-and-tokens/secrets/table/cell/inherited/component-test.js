import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/secrets-and-tokens/secrets/table/cell/inherited',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          inherited: true
        }
      });
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::Inherited
            @record={{this.record}}
        />`
      );

      assert.dom('.inherited-container').exists();
    });

    test('it does not render when inherited is not set', async function (assert) {
      this.setProperties({
        record: {}
      });
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::Inherited
            @record={{this.record}}
        />`
      );

      assert.dom('.inherited-container').doesNotExist();
    });
  }
);
