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
  assert.equal($($('h2')[0]).text().trim(), 'Secure Continuous Delivery');
  assert.equal($($('h2')[1]).text().trim(), 'Integrates with Daily Habits');
  assert.equal($($('h2')[2]).text().trim(), 'Pipeline as Code');
  assert.equal($($('h2')[3]).text().trim(), 'Runs Anywhere');
  assert.equal($('footer').length, 1);
});
