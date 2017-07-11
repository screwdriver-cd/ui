import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('token-list', 'Integration | Component | token list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const $ = this.$;

  this.set('tokens', [
    Ember.Object.create({
      id: 1,
      name: 'foo',
      description: 'bar'
    }),
    Ember.Object.create({
      id: 2,
      name: 'baz',
      description: 'qux'
    })
  ]);

  this.render(hbs`{{token-list tokens=tokens}}`);

  assert.equal($($('td.name input').get(0)).val().trim(), 'baz');
  assert.equal($($('td.description input').get(0)).val().trim(), 'qux');
  assert.equal($($('td.name input').get(1)).val().trim(), 'foo');
  assert.equal($($('td.description input').get(1)).val().trim(), 'bar');
});
