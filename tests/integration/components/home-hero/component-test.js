import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('home-hero', 'Integration | Component | home hero', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{home-hero}}`);

  assert.equal($('h1').text().trim(), 'Introducing Screwdriver');
  assert.equal($('h2').text().trim(), 'Getting started, by the numbers...');
});
