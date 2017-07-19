import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('info-message', 'Integration | Component | info message', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{info-message message="batman"}}`);

  assert.equal($('.alert > span').text().trim(), 'batman');
});
