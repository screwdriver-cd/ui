import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | info message scm', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{info-message-scm message="batman" scmContext="github:github.com"}}`);

    assert.dom('.alert > span').hasText('batman');
    assert.dom('.alert > a').hasText('github:github.com');
  });
});
