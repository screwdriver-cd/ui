import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | token list', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const { $ } = this;

    this.set('tokens', [
      EmberObject.create({
        id: 1,
        name: 'foo',
        description: 'bar'
      }),
      EmberObject.create({
        id: 2,
        name: 'baz',
        description: 'qux'
      })
    ]);

    await render(hbs`{{token-list tokens=tokens}}`);

    assert.equal(
      $($('td.name input').get(0))
        .val()
        .trim(),
      'baz'
    );
    assert.equal(
      $($('td.description input').get(0))
        .val()
        .trim(),
      'qux'
    );
    assert.equal(
      $($('td.name input').get(1))
        .val()
        .trim(),
      'foo'
    );
    assert.equal(
      $($('td.description input').get(1))
        .val()
        .trim(),
      'bar'
    );
  });
});
