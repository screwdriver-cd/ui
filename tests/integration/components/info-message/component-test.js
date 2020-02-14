import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | info message', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{info-message message="batman"}}`);

    assert.dom('.alert > span').hasText('batman');
  });

  test('it renders an scm error', async function(assert) {
    await render(
      hbs`{{info-message message="This checkoutUrl is not supported for your current login host." scmContext="github:github.com"}}`
    );

    assert
      .dom('.alert > span')
      .hasText('This checkoutUrl is not supported for your current login host.');
    assert.dom('.alert > a').hasText('github:github.com');
  });
});
