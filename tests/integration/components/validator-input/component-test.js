import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator input', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`<ValidatorInput />`);

    assert.dom('h4').hasText('Validate Screwdriver Configuration');
    assert
      .dom('h5')
      .hasText(
        'Paste a screwdriver.yaml, a template yaml or a command yaml below to verify.'
      );
    assert
      .dom('h6')
      .hasText(
        'Template yamls must contain the "name" field. Command yamls must conatin the "format" field.'
      );
  });
});
