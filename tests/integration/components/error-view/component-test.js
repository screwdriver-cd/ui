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

    assert.equal(find('h1').textContent.trim(), '400');
    assert.equal(find('h2').textContent.trim(), 'they are dead, dave');
    assert.equal(find('h4').textContent.trim(), 'bananas');
  });
});
