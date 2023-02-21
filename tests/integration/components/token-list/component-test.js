import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | token list', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
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

    await render(hbs`<TokenList @tokens={{this.tokens}} />`);

    assert.dom('td.name input').hasValue('baz');
    assert.dom('td.description input').hasValue('qux');
    assert.dom('tr:nth-child(2) td.name input').hasValue('foo');
    assert.dom('tr:nth-child(2) td.description input').hasValue('bar');
  });
});
