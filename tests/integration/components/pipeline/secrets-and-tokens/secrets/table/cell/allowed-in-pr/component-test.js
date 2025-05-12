import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/secrets-and-tokens/secrets/table/cell/allowed-in-pr',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          allowInPr: true
        }
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::AllowedInPr
            @record={{this.record}}
        />`
      );

      assert.dom('.allowed-in-pr-container').exists();
    });

    test('it does not render when allowedInPr is not set', async function (assert) {
      this.setProperties({
        record: {}
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Table::Cell::AllowedInPr
            @record={{this.record}}
        />`
      );

      assert.dom('.allowed-in-pr-container').doesNotExist();
    });
  }
);
