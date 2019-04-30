import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | home hero', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const { $ } = this;

    await render(hbs`{{home-hero}}`);

    assert.equal(
      $('h1')
        .text()
        .trim(),
      'Introducing Screwdriver'
    );
    assert.equal(
      $('h2')
        .text()
        .trim(),
      'Getting started, by the numbers...'
    );
  });
});
