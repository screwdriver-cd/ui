import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | getLength', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders with object', async function (assert) {
    this.set('inputValue', { a: 1, b: 2, c: 3 });

    await render(hbs`{{get-length inputValue}}`);

    assert.dom(this.element).hasText('3');
  });

  test('it renders with array', async function (assert) {
    this.set('inputValue', [1, 2, 3, 4]);

    await render(hbs`{{get-length inputValue}}`);

    assert.dom(this.element).hasText('4');
  });

  test('it renders with string', async function (assert) {
    this.set('inputValue', '12');

    await render(hbs`{{get-length inputValue}}`);

    assert.dom(this.element).hasText('2');
  });

  test('it renders with number format', async function (assert) {
    this.set('inputValue', 1991);

    await render(hbs`{{get-length inputValue}}`);

    assert.dom(this.element).hasText('0');
  });
});
