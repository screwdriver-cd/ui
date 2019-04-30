import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | info message', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const { $ } = this;

    await render(hbs`{{info-message message="batman"}}`);

    assert.equal(
      $('.alert > span')
        .text()
        .trim(),
      'batman'
    );
  });
});
