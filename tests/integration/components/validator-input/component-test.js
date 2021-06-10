import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator input', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{validator-input}}`);

    assert.dom('h4').hasText('Validate Screwdriver Configuration');
    assert
      .dom('h5')
      .hasText(
        'Paste a screwdriver.yaml or a template yaml below to verify.Template yamls must contain the "name" field.'
      );
  });
});
