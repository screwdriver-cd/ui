import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('validator-input', 'Integration | Component | validator input', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{validator-input}}`);

  assert.equal(this.$('h3').text().trim(), 'Validate Screwdriver Configuration');
});
