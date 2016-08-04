import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('sd-header', 'Integration | Component | sd header', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{sd-header}}`);

  assert.ok(this.$('img').attr('src').match(/assets\/screwdriver\.png$/));
});
