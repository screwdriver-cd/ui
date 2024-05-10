import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | startsWith', function (hooks) {
  setupRenderingTest(hooks);

  // Replace this with your real tests.
  test('it renders', async function (assert) {
    this.set('str', 'PR-123');

    await render(hbs`{{starts-with this.str 'PR-'}}`);

    assert.dom(this.element).hasText('true');
  });

  test('it does not render', async function (assert) {
    this.set('str', '1234');

    await render(hbs`{{starts-with this.str 'PR-'}}`);

    assert.dom(this.element).hasText('false');
  });
});
