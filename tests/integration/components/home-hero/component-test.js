import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | home hero', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`{{home-hero}}`);

    assert.dom('h1').hasText('Introducing Screwdriver');
    assert.dom('h2').hasText('Getting started, by the numbers...');
  });
});
