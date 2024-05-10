import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | truncate', function (hooks) {
  setupRenderingTest(hooks);

  test('short text is unchanged', async function (assert) {
    this.set('inputValue', 'Short text');
    this.set('maxLength', 50);

    await render(hbs`{{truncate this.inputValue this.maxLength}}`);

    assert.dom(this.element).hasText('Short text');
  });

  test('text equal to max length is unchanged', async function (assert) {
    this.set('inputValue', 'Exactly fifty characters long text right?');
    this.set('maxLength', 50);

    await render(hbs`{{truncate this.inputValue this.maxLength}}`);

    assert
      .dom(this.element)
      .hasText('Exactly fifty characters long text right?');
  });

  test('long text is truncated', async function (assert) {
    this.set(
      'inputValue',
      'This text is significantly longer than the specified maximum length of 50 characters.'
    );
    this.set('maxLength', 50);

    await render(hbs`{{truncate this.inputValue this.maxLength}}`);

    assert
      .dom(this.element)
      .hasText('This text is significantly longer than the specifi...');
  });
});
