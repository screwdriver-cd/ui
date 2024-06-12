import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | is-array', function (hooks) {
  setupRenderingTest(hooks);

  test('it is array', async function (assert) {
    this.set('inputValue', [1, 2, 3, 4]);

    await render(hbs`{{is-array this.inputValue}}`);

    assert.dom(this.element).hasText('true');
  });

  test('it is not array', async function (assert) {
    this.set('inputValue', 'hello world');

    await render(hbs`{{is-array this.inputValue}}`);

    assert.dom(this.element).hasText('false');
  });
});
