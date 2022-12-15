import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | branch url encode', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders a encoded url of branch name including #', async function (assert) {
    this.set('url', 'https://github/org/repo/tree/branch#hash');

    await render(hbs`{{branch-url-encode this.url}}`);

    assert
      .dom(this.element)
      .hasText('https://github/org/repo/tree/branch%23hash');

    this.set('url', null);

    await render(hbs`{{branch-url-encode this.url}}`);

    assert.dom(this.element).hasText('');
  });
});
