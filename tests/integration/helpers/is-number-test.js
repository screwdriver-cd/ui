import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | is-number', function (hooks) {
  setupRenderingTest(hooks);

  test('undefined is not a number', async function (assert) {
    this.set('inputValue', undefined);

    await render(hbs`{{is-number this.inputValue}}`);

    assert.dom(this.element).hasText('false');
  });

  test('N/A is not a number', async function (assert) {
    this.set('inputValue', 'N/A');

    await render(hbs`{{is-number this.inputValue}}`);

    assert.dom(this.element).hasText('false');
  });

  test('71 is a number', async function (assert) {
    this.set('inputValue', '71');

    await render(hbs`{{is-number this.inputValue}}`);

    assert.dom(this.element).hasText('true');
  });
});
