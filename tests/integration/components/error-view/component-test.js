import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | error view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('sc', 400);
    this.set('sm', 'they are dead, dave');
    await render(hbs`{{error-view errorMessage="bananas" statusCode=sc statusMessage=sm}}`);

    assert.dom('h1').hasText('400');
    assert.dom('h2').hasText('they are dead, dave');
    assert.dom('h4').hasText('bananas');
  });
});
