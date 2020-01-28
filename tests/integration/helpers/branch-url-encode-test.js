import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('helper:branch-url-encode', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders a duration given two parsable times in HH:mm:ss format', async function(assert) {
    this.set('url', 'https://github/org/repo/tree/branch#hash');

    await render(hbs`{{branch-url-encode url}}`);

    assert.dom(this.element).hasText('https://github/org/repo/tree/branch%23hash');

    this.set('url', null);

    await render(hbs`{{branch-url-encode url}}`);

    assert.dom(this.element).hasText('');
  });
});
